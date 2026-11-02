import { useState, useEffect, useCallback, useRef } from 'react';
import {
  castVote,
  getVoteTally,
  getAllUserVotes,
  resetVotes,
  simulateChat,
  subscribeToVotes,
  VoteOption,
  VoteTally,
} from '../voting';

export interface TwitchStatus {
  channel: string;
  connected: boolean;
  message?: string;
}

export interface LatestVote {
  user: string;
  option: VoteOption;
  rawMessage?: string;
  timestamp: number;
}

export function useVoting() {
  const [tally, setTally] = useState<VoteTally>(getVoteTally());
  const [userVotes, setUserVotes] = useState<Record<string, VoteOption>>(getAllUserVotes());
  const [twitchStatus, setTwitchStatus] = useState<TwitchStatus>({
    channel: '',
    connected: false,
    message: 'Connecting to server...',
  });
  const [latestVote, setLatestVote] = useState<LatestVote | null>(null);

  const socketRef = useRef<WebSocket | null>(null);

  // Subscribe to in-memory vote state
  useEffect(() => {
    const unsubscribe = subscribeToVotes(() => {
      setTally(getVoteTally());
      setUserVotes(getAllUserVotes());
    });
    return unsubscribe;
  }, []);

  // Connect to WebSocket server for real Twitch chat voting (!1, !2, !3)
  useEffect(() => {
    let isMounted = true;
    let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;

    function connect() {
      try {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}`;
        const ws = new WebSocket(wsUrl);
        socketRef.current = ws;

        ws.onopen = () => {
          if (!isMounted) return;
          console.log('[WebSocket] Connected to StreamHealth Live server');
        };

        ws.onmessage = (event) => {
          if (!isMounted) return;
          try {
            const data = JSON.parse(event.data);

            if (data.type === 'TWITCH_STATUS') {
              setTwitchStatus({
                channel: data.channel || '',
                connected: !!data.connected,
                message: data.message,
              });
            } else if (data.type === 'TWITCH_VOTE') {
              if (data.user && (data.option === 1 || data.option === 2 || data.option === 3)) {
                // Forward real Twitch chat vote to castVote(user, option)
                castVote(data.user, data.option as VoteOption);

                setLatestVote({
                  user: data.user,
                  option: data.option as VoteOption,
                  rawMessage: data.rawMessage,
                  timestamp: data.timestamp || Date.now(),
                });
              }
            }
          } catch (e) {
            console.error('Error parsing WebSocket message:', e);
          }
        };

        ws.onclose = () => {
          if (!isMounted) return;
          setTwitchStatus((prev) => ({
            ...prev,
            connected: false,
            message: 'Server connection closed. Retrying...',
          }));
          reconnectTimeout = setTimeout(connect, 3000);
        };

        ws.onerror = (err) => {
          console.warn('[WebSocket] Connection error:', err);
        };
      } catch (err) {
        console.error('[WebSocket] Failed to initialize:', err);
        reconnectTimeout = setTimeout(connect, 5000);
      }
    }

    connect();

    return () => {
      isMounted = false;
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, []);

  const handleCastVote = useCallback((user: string, option: VoteOption) => {
    castVote(user, option);
  }, []);

  // Simulate Chat fallback button
  const handleSimulateChat = useCallback((count = 50) => {
    simulateChat(count, true);
  }, []);

  const handleResetVotes = useCallback(() => {
    resetVotes();
    setLatestVote(null);
  }, []);

  // Switch or configure Twitch channel
  const handleChangeTwitchChannel = useCallback((channel: string) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(
        JSON.stringify({
          type: 'SET_CHANNEL',
          channel: channel.trim(),
        })
      );
    } else {
      // Fallback to REST endpoint
      fetch('/api/twitch/channel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channel: channel.trim() }),
      }).catch((e) => console.error('Failed to change channel via REST:', e));
    }
  }, []);

  return {
    tally,
    userVotes,
    twitchStatus,
    latestVote,
    castVote: handleCastVote,
    simulateChat: handleSimulateChat,
    resetVotes: handleResetVotes,
    changeTwitchChannel: handleChangeTwitchChannel,
  };
}
