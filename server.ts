import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import http from 'http';
import path from 'path';
import fs from 'fs';
import { WebSocketServer, WebSocket } from 'ws';
import { ChatClient } from '@twurple/chat';
import { GoogleGenAI } from '@google/genai';

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Dist static path resolution
const distDir = path.join(process.cwd(), 'dist');
const distIndex = path.join(distDir, 'index.html');

// Log Gemini key status cleanly
let hasLoggedGeminiKeyNotice = false;
function checkGeminiKey(): boolean {
  if (!process.env.GEMINI_API_KEY) {
    if (!hasLoggedGeminiKeyNotice) {
      console.log('GEMINI_API_KEY is not set. Using fallback explanations.');
      hasLoggedGeminiKeyNotice = true;
    }
    return false;
  }
  return true;
}
checkGeminiKey();

// WebSocket Server for broadcasting Twitch chat votes and status
const wss = new WebSocketServer({ server });

function broadcast(data: any) {
  try {
    const payload = JSON.stringify(data);
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(payload);
      }
    });
  } catch (err) {
    console.error('Error broadcasting WebSocket message:', err);
  }
}

// Twitch Channel Validation
export function isValidTwitchChannel(name: string): boolean {
  if (!name || typeof name !== 'string') return false;
  const clean = name.trim().toLowerCase().replace(/^#/, '');
  return /^[a-zA-Z0-9_]{3,25}$/.test(clean);
}

// Twitch Chat State & Client
let activeChannel = process.env.TWITCH_CHANNEL?.trim().toLowerCase().replace(/^#/, '') || '';
let chatClient: ChatClient | null = null;
let isChatConnected = false;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

async function connectTwitchChat(channelName: string) {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }

  const channel = channelName.trim().toLowerCase().replace(/^#/, '');
  activeChannel = channel;

  if (!channel) {
    if (chatClient) {
      try {
        await chatClient.quit();
      } catch (err) {
        console.warn('Error quitting chat client:', err);
      }
      chatClient = null;
    }
    isChatConnected = false;
    broadcast({
      type: 'TWITCH_STATUS',
      channel: '',
      connected: false,
      message: 'No Twitch channel set. Set TWITCH_CHANNEL in .env or in the UI.',
    });
    return;
  }

  if (!isValidTwitchChannel(channel)) {
    if (chatClient) {
      try {
        await chatClient.quit();
      } catch (err) {
        console.warn('Error quitting chat client:', err);
      }
      chatClient = null;
    }
    isChatConnected = false;
    broadcast({
      type: 'TWITCH_STATUS',
      channel: channel,
      connected: false,
      message: `Invalid Twitch channel "${channel}". Channel names must be 3-25 alphanumeric characters.`,
    });
    return;
  }

  // Tear down existing connection if any
  if (chatClient) {
    try {
      await chatClient.quit();
    } catch (e) {
      console.warn('Error closing prior chat client:', e);
    }
    chatClient = null;
    isChatConnected = false;
  }

  try {
    console.log(`Connecting anonymously to Twitch chat for channel: #${channel}...`);

    // Twurple anonymous read-only client
    chatClient = new ChatClient({
      channels: [channel],
    });

    chatClient.onConnect(() => {
      isChatConnected = true;
      console.log(`[Twitch] Successfully connected to #${channel}`);
      broadcast({
        type: 'TWITCH_STATUS',
        channel: channel,
        connected: true,
        message: `Connected to Twitch channel #${channel}`,
      });
    });

    chatClient.onDisconnect((manually, reason) => {
      isChatConnected = false;
      console.log(`[Twitch] Disconnected from #${channel}:`, reason?.message || reason || 'closed');
      broadcast({
        type: 'TWITCH_STATUS',
        channel: channel,
        connected: false,
        message: `Disconnected: ${reason?.message || 'closed'}. Reconnecting...`,
      });

      // Auto-reconnect if disconnected unexpectedly
      if (!manually && activeChannel === channel) {
        if (reconnectTimer) clearTimeout(reconnectTimer);
        reconnectTimer = setTimeout(() => {
          if (activeChannel === channel && !isChatConnected) {
            console.log(`[Twitch] Attempting auto-reconnect to #${channel}...`);
            connectTwitchChat(channel).catch(() => {});
          }
        }, 5000);
      }
    });

    // Parse messages for !1, !2, !3, !a, !b, !c, 1, 2, 3, !vote N
    chatClient.onMessage((chan, user, message) => {
      try {
        const text = message.trim().toLowerCase();
        if (text.length > 12) return; // Ignore messages longer than 12 characters

        let option: 1 | 2 | 3 | null = null;
        if (text === '!1' || text === '1' || text === '!vote 1' || text === '!a' || text === 'a') {
          option = 1;
        } else if (text === '!2' || text === '2' || text === '!vote 2' || text === '!b' || text === 'b') {
          option = 2;
        } else if (text === '!3' || text === '3' || text === '!vote 3' || text === '!c' || text === 'c') {
          option = 3;
        }

        if (option !== null) {
          console.log(`[Twitch Vote] User "${user}" voted Option ${option} in #${chan}`);
          broadcast({
            type: 'TWITCH_VOTE',
            user: user,
            option: option,
            rawMessage: message,
            channel: chan,
            timestamp: Date.now(),
          });
        }
      } catch (err) {
        console.error('Error handling Twitch message:', err);
      }
    });

    await chatClient.connect();
  } catch (error: any) {
    console.error(`Error connecting to Twitch channel #${channel}:`, error);
    isChatConnected = false;
    broadcast({
      type: 'TWITCH_STATUS',
      channel: channel,
      connected: false,
      message: `Failed to join #${channel}: ${error?.message || 'error'}`,
    });
  }
}

// WebSocket connection lifecycle
wss.on('connection', (ws) => {
  try {
    ws.send(
      JSON.stringify({
        type: 'TWITCH_STATUS',
        channel: activeChannel,
        connected: isChatConnected,
        message: activeChannel
          ? (isChatConnected ? `Connected to #${activeChannel}` : `Connecting to #${activeChannel}...`)
          : 'No Twitch channel set. Enter a channel name in the UI or set TWITCH_CHANNEL.',
      })
    );
  } catch (err) {
    console.error('Error sending initial WS message:', err);
  }

  ws.on('message', async (data) => {
    try {
      const msg = JSON.parse(data.toString());
      if (msg.type === 'SET_CHANNEL' && typeof msg.channel === 'string') {
        await connectTwitchChat(msg.channel);
      }
    } catch (err) {
      console.error('Error handling incoming WS message:', err);
    }
  });
});

// REST API Route: GET /health
app.get('/health', (_req: Request, res: Response) => {
  try {
    res.json({ status: 'ok' });
  } catch (error: any) {
    res.status(500).json({ error: error?.message || 'Health check failed' });
  }
});

app.get('/api/health', (_req: Request, res: Response) => {
  try {
    res.json({ status: 'ok' });
  } catch (error: any) {
    res.status(500).json({ error: error?.message || 'Health check failed' });
  }
});

// REST API Route: GET /api/twitch/status
app.get('/api/twitch/status', (_req: Request, res: Response) => {
  try {
    res.json({
      channel: activeChannel,
      connected: isChatConnected,
    });
  } catch (error: any) {
    res.status(500).json({ error: error?.message || 'Failed to retrieve Twitch status' });
  }
});

// REST API Route: POST /api/twitch/channel
app.post('/api/twitch/channel', async (req: Request, res: Response): Promise<void> => {
  try {
    const { channel } = req.body || {};
    if (typeof channel !== 'string') {
      res.status(400).json({ error: 'channel must be a string' });
      return;
    }
    await connectTwitchChat(channel);
    res.json({
      channel: activeChannel,
      connected: isChatConnected,
    });
  } catch (error: any) {
    res.status(500).json({ error: error?.message || 'Failed to set Twitch channel' });
  }
});

// Handler for AI explanation
async function handleExplain(req: Request, res: Response, _next: NextFunction): Promise<void> {
  try {
    const {
      scenarioTitle,
      pathogen,
      scenarioSetting,
      winningOptionText,
      isOptimal,
      infectionEffect,
      prewrittenExplanation,
      scenario,
      winningOption,
      fallbackExplanation,
    } = req.body || {};

    const effectiveTitle = scenarioTitle || scenario?.title || 'Outbreak Incident';
    const effectivePathogen = pathogen || scenario?.pathogen || 'Infectious Pathogen';
    const effectiveSetting = scenarioSetting || scenario?.setting || 'Community';
    const effectiveOptionText = winningOptionText || winningOption?.text || 'Intervention Strategy';
    const effectiveIsOptimal = isOptimal !== undefined ? Boolean(isOptimal) : Boolean(winningOption?.isOptimal);
    const effectiveEffect = infectionEffect || winningOption?.infectionEffectLabel || '';
    const fallbackText =
      prewrittenExplanation ||
      winningOption?.oneSentenceExplanation ||
      fallbackExplanation ||
      'Standard public health containment and contact tracing measures applied.';

    if (!checkGeminiKey()) {
      res.json({
        explanation: fallbackText,
        source: 'fallback',
      });
      return;
    }

    // Call Gemini with strict 4-second timeout
    const aiPromise = (async () => {
      const prompt = `You are a friendly, expert public health teacher explaining an epidemic outbreak decision to a 6th-grade student (about 11 to 12 years old).

Outbreak Scenario: ${effectiveTitle} (${effectivePathogen})
Setting: ${effectiveSetting}
Incident Command Action: "${effectiveOptionText}"
Resulting Impact: ${effectiveEffect} (${effectiveIsOptimal ? 'helped reduce the outbreak' : 'hurt and caused cases to surge'})
Key Epidemiological Context: ${fallbackText}

Task:
Write a clear, memorable 3-sentence explanation in plain 6th-grade language of why this winning choice ${effectiveIsOptimal ? 'helped stop the outbreak' : 'hurt and made the outbreak worse'}.
Constraints:
- Exactly 3 sentences.
- Grade-6 reading level.
- Highly engaging and easy to understand for young students and livestream viewers.
- No medical jargon without explaining it.`;

      const ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY!,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
      });

      return response.text?.trim() || null;
    })();

    const timeoutPromise = new Promise<null>((resolve) =>
      setTimeout(() => resolve(null), 4000)
    );

    const result = await Promise.race([aiPromise, timeoutPromise]);

    if (result) {
      res.json({
        explanation: result,
        source: 'ai',
      });
    } else {
      res.json({
        explanation: fallbackText,
        source: 'fallback',
      });
    }
  } catch (error) {
    const fallbackText =
      req.body?.prewrittenExplanation ||
      req.body?.winningOption?.oneSentenceExplanation ||
      req.body?.fallbackExplanation ||
      'Standard public health containment and contact tracing measures applied.';
    res.json({
      explanation: fallbackText,
      source: 'fallback',
    });
  }
}

// REST API Route: POST /api/explain & POST /api/ai-explain
app.post('/api/explain', handleExplain);
app.post('/api/ai-explain', handleExplain);

// Mount Vite in dev mode or serve static files in production
async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production' || !!process.env.RENDER;

  // If dist/index.html is missing on startup, attempt an automatic build
  if (!fs.existsSync(distIndex)) {
    try {
      console.log('[Server] dist/index.html not found on startup. Triggering build...');
      const { build: viteBuild } = await import('vite');
      await viteBuild();
      console.log('[Server] Automatic build completed successfully.');
    } catch (buildErr) {
      console.warn('[Server] Automatic build attempt failed:', buildErr);
    }
  }

  if (!isProduction && !fs.existsSync(distIndex)) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true, port: Number(PORT), host: '0.0.0.0' },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(distDir));
  }

  // Catch-all route returning dist/index.html for any non-/api route
  app.get('*', (req: Request, res: Response, next: NextFunction) => {
    if (req.path.startsWith('/api')) {
      return next();
    }
    if (fs.existsSync(distIndex)) {
      res.sendFile(distIndex);
    } else {
      res.status(503).send('Frontend not built. Run npm run build');
    }
  });

  // Global Express Error Handler
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    console.error('[Global Error Handler]', err);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Internal server error', message: err?.message || 'Unknown error' });
    }
  });

  // Connect to default Twitch channel if configured in env
  if (activeChannel) {
    connectTwitchChat(activeChannel).catch((err) => {
      console.error('Initial Twitch connection error:', err);
    });
  }

  server.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`StreamHealth Live server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal error starting server:', err);
  process.exit(1);
});
