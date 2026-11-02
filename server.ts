import 'dotenv/config';
import express, { Request, Response } from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { WebSocketServer, WebSocket } from 'ws';
import { ChatClient } from '@twurple/chat';
import { GoogleGenAI } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Initialize Gemini SDK with telemetry header
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// WebSocket Server for broadcasting Twitch chat votes and status
const wss = new WebSocketServer({ server });

function broadcast(data: any) {
  const payload = JSON.stringify(data);
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  });
}

// Twitch Chat State & Client
let activeChannel = process.env.TWITCH_CHANNEL?.trim().toLowerCase().replace(/^#/, '') || '';
let chatClient: ChatClient | null = null;
let isChatConnected = false;

async function connectTwitchChat(channelName: string) {
  const channel = channelName.trim().toLowerCase().replace(/^#/, '');
  activeChannel = channel;

  if (!channel) {
    console.log('No Twitch channel provided. Waiting for configuration.');
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
    console.log(`Connecting to Twitch chat for channel: #${channel}...`);

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

    chatClient.onDisconnect((_manually, reason) => {
      isChatConnected = false;
      console.log(`[Twitch] Disconnected from #${channel}:`, reason);
      broadcast({
        type: 'TWITCH_STATUS',
        channel: channel,
        connected: false,
        message: `Disconnected: ${reason?.message || 'closed'}`,
      });
    });

    // Parse messages for !1, !2, !3 or !a, !b, !c
    chatClient.onMessage((chan, user, message) => {
      const text = message.trim().toLowerCase();
      let option: 1 | 2 | 3 | null = null;

      if (text === '!1' || text === '!a' || text.startsWith('!1 ') || text.startsWith('!a ')) {
        option = 1;
      } else if (text === '!2' || text === '!b' || text.startsWith('!2 ') || text.startsWith('!b ')) {
        option = 2;
      } else if (text === '!3' || text === '!c' || text.startsWith('!3 ') || text.startsWith('!c ')) {
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
  // Immediately inform client of current Twitch channel & connection state
  ws.send(
    JSON.stringify({
      type: 'TWITCH_STATUS',
      channel: activeChannel,
      connected: isChatConnected,
      message: activeChannel
        ? (isChatConnected ? `Connected to #${activeChannel}` : `Connecting to #${activeChannel}...`)
        : 'No Twitch channel set. Enter a channel name in the UI or set TWITCH_CHANNEL in .env.',
    })
  );

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

// REST API Routes
app.get('/api/twitch/status', (_req: Request, res: Response) => {
  res.json({
    channel: activeChannel,
    connected: isChatConnected,
  });
});

app.post('/api/twitch/channel', async (req: Request, res: Response): Promise<void> => {
  const { channel } = req.body;
  if (typeof channel !== 'string') {
    res.status(400).json({ error: 'channel must be a string' });
    return;
  }
  await connectTwitchChat(channel);
  res.json({
    channel: activeChannel,
    connected: isChatConnected,
  });
});

// API Route: AI Explain winning outbreak choice in 3 grade-6 sentences
app.post('/api/ai-explain', async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      scenarioTitle,
      pathogen,
      scenarioSetting,
      winningOptionText,
      isOptimal,
      infectionEffect,
      prewrittenExplanation,
    } = req.body;

    if (!scenarioTitle || !winningOptionText) {
      res.status(400).json({ error: 'Missing required scenario details' });
      return;
    }

    if (!process.env.GEMINI_API_KEY) {
      res.status(503).json({ error: 'GEMINI_API_KEY is not configured on server' });
      return;
    }

    const prompt = `You are a friendly, expert public health teacher explaining an epidemic outbreak decision to a 6th-grade student (about 11 to 12 years old).

Outbreak Scenario: ${scenarioTitle} (${pathogen || 'Outbreak'})
Setting: ${scenarioSetting || 'Community'}
Incident Command Action: "${winningOptionText}"
Resulting Impact: ${infectionEffect || 'changed'} infections (${isOptimal ? 'helped reduce the outbreak' : 'hurt and caused cases to surge'})
Key Epidemiological Context: ${prewrittenExplanation || ''}

Task:
Write a clear, memorable 3-sentence explanation in plain 6th-grade language of why this winning choice ${isOptimal ? 'helped stop the outbreak' : 'hurt and made the outbreak worse'}.
Constraints:
- Exactly 3 sentences.
- Grade-6 reading level.
- Highly engaging and easy to understand for young students and livestream viewers.
- No medical jargon without explaining it.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
    });

    const explanation = response.text?.trim();

    if (!explanation) {
      res.status(500).json({ error: 'Empty response generated by model' });
      return;
    }

    res.json({ explanation });
  } catch (error: any) {
    console.error('Error generating AI explanation with Gemini:', error);
    res.status(500).json({
      error: error?.message || 'Failed to generate AI explanation',
    });
  }
});

// Mount Vite in dev mode or serve static files in production
async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true, port: Number(PORT), host: '0.0.0.0' },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  // Connect to default Twitch channel if configured in env
  if (activeChannel) {
    connectTwitchChat(activeChannel).catch((err) => {
      console.error('Initial Twitch connection error:', err);
    });
  }

  server.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`StreamHealth Live server with WebSocket & Twurple running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
