import { parseChatVote } from '../engine/gameEngine';
import { VoteOption } from '../engine/types';

export type TwitchConnectionStatus = 'disconnected' | 'connecting' | 'live';

export interface TwitchChatMessage {
  user: string;
  message: string;
  voteOption: VoteOption | null;
  timestamp: number;
}

export type VoteCallback = (user: string, option: VoteOption) => void;
export type StatusCallback = (status: TwitchConnectionStatus, channel: string, message?: string) => void;
export type MessageCallback = (msg: TwitchChatMessage) => void;

const STORAGE_KEY = 'streamhealth_twitch_channel';
const DEFAULT_CHANNEL = 'streamhealth';

export function isValidTwitchChannel(name: string): boolean {
  if (!name || typeof name !== 'string') return false;
  const clean = name.trim().toLowerCase().replace(/^#/, '');
  return /^[a-zA-Z0-9_]{3,25}$/.test(clean);
}

export class TwitchBrowserChatClient {
  private ws: WebSocket | null = null;
  private channel = '';
  private status: TwitchConnectionStatus = 'disconnected';
  private onVoteCallback: VoteCallback | null = null;
  private onStatusCallback: StatusCallback | null = null;
  private onMessageCallback: MessageCallback | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectAttempts = 0;
  private isExplicitlyClosed = false;

  constructor() {
    // Load persisted channel or fallback to default
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY);
      this.channel = (saved || DEFAULT_CHANNEL).trim().toLowerCase().replace(/^#/, '');
    }
  }

  public getChannel(): string {
    return this.channel;
  }

  public getStatus(): TwitchConnectionStatus {
    return this.status;
  }

  public setCallbacks(options: {
    onVote?: VoteCallback;
    onStatus?: StatusCallback;
    onMessage?: MessageCallback;
  }) {
    if (options.onVote) this.onVoteCallback = options.onVote;
    if (options.onStatus) this.onStatusCallback = options.onStatus;
    if (options.onMessage) this.onMessageCallback = options.onMessage;
  }

  public setChannel(newChannel: string) {
    const clean = newChannel.trim().toLowerCase().replace(/^#/, '');
    if (!clean) {
      this.updateStatus('disconnected', 'Channel name cannot be empty');
      return;
    }

    if (!isValidTwitchChannel(clean)) {
      this.channel = clean;
      this.cleanupSocket();
      this.updateStatus('disconnected', `Invalid channel name "${clean}". Twitch channel names must be 3-25 alphanumeric characters.`);
      return;
    }

    this.channel = clean;
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, clean);
    }

    // Reconnect to new channel
    this.reconnectAttempts = 0;
    this.connect();
  }

  public connect() {
    this.isExplicitlyClosed = false;
    this.cleanupSocket();

    if (!this.channel) {
      this.updateStatus('disconnected', 'No channel specified');
      return;
    }

    if (!isValidTwitchChannel(this.channel)) {
      this.updateStatus('disconnected', `Invalid channel name "${this.channel}". Twitch names must be 3-25 alphanumeric characters.`);
      return;
    }

    this.updateStatus('connecting', `Connecting to #${this.channel}...`);

    try {
      // Connect to Twitch's official anonymous IRC WebSocket
      const socket = new WebSocket('wss://irc-ws.chat.twitch.tv:443');
      this.ws = socket;

      socket.onopen = () => {
        const anonNick = `justinfan${Math.floor(10000 + Math.random() * 90000)}`;
        socket.send('CAP REQ :twitch.tv/tags twitch.tv/commands');
        socket.send('PASS SCHMOOPIE');
        socket.send(`NICK ${anonNick}`);
        socket.send(`JOIN #${this.channel}`);

        this.reconnectAttempts = 0;
        this.updateStatus('live', `Live in #${this.channel}`);
      };

      socket.onmessage = (event) => {
        const raw = event.data as string;
        this.handleRawIrc(raw);
      };

      socket.onclose = () => {
        this.cleanupSocket();
        if (!this.isExplicitlyClosed) {
          this.scheduleReconnect();
        } else {
          this.updateStatus('disconnected', 'Disconnected');
        }
      };

      socket.onerror = (err) => {
        console.warn('[Twitch Chat] WebSocket error:', err);
        // Error will trigger onclose which schedules reconnect
      };
    } catch (err) {
      console.error('[Twitch Chat] Connection initialization error:', err);
      this.scheduleReconnect();
    }
  }

  public disconnect() {
    this.isExplicitlyClosed = true;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.cleanupSocket();
    this.updateStatus('disconnected', 'Offline');
  }

  private handleRawIrc(raw: string) {
    const lines = raw.split('\r\n');

    for (const line of lines) {
      if (!line) continue;

      // Handle Twitch PING/PONG keep-alive
      if (line.startsWith('PING')) {
        this.ws?.send('PONG :tmi.twitch.tv');
        continue;
      }

      // Handle Twitch NOTICE (e.g., channel suspended, banned, login fail)
      if (line.includes('NOTICE')) {
        const noticeMatch = line.match(/^:tmi\.twitch\.tv NOTICE [^:]*:(.+)$/);
        if (noticeMatch) {
          const noticeText = noticeMatch[1].trim();
          this.updateStatus('disconnected', `Notice: ${noticeText}`);
        }
      }

      // Match PRIVMSG chat line:
      // :username!username@username.tmi.twitch.tv PRIVMSG #channel :message content
      const privmsgMatch = line.match(/^:([a-zA-Z0-9_]+)![^ ]* PRIVMSG #[a-zA-Z0-9_]+ :(.+)$/);
      if (privmsgMatch) {
        const user = privmsgMatch[1];
        const message = privmsgMatch[2].trim();

        // Parse vote with strict anti-spam rules
        const voteOption = parseChatVote(message);

        const chatMsg: TwitchChatMessage = {
          user,
          message,
          voteOption,
          timestamp: Date.now(),
        };

        if (this.onMessageCallback) {
          this.onMessageCallback(chatMsg);
        }

        if (voteOption !== null && this.onVoteCallback) {
          this.onVoteCallback(user, voteOption);
        }
      }
    }
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.reconnectAttempts++;
    // Exponential backoff capped at 15s: 1s, 2s, 4s, 8s, 15s
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts - 1), 15000);
    const delaySeconds = Math.max(1, Math.round(delay / 1000));
    this.updateStatus(
      'disconnected',
      `Disconnected from #${this.channel}. Reconnecting in ${delaySeconds}s (attempt ${this.reconnectAttempts})...`
    );

    this.reconnectTimer = setTimeout(() => {
      if (!this.isExplicitlyClosed) {
        this.connect();
      }
    }, delay);
  }

  private cleanupSocket() {
    if (this.ws) {
      this.ws.onopen = null;
      this.ws.onmessage = null;
      this.ws.onclose = null;
      this.ws.onerror = null;
      if (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING) {
        try {
          this.ws.close();
        } catch (_) {}
      }
      this.ws = null;
    }
  }

  private updateStatus(status: TwitchConnectionStatus, message?: string) {
    this.status = status;
    if (this.onStatusCallback) {
      this.onStatusCallback(status, this.channel, message);
    }
  }
}

// Singleton browser Twitch chat instance
export const twitchClient = new TwitchBrowserChatClient();
