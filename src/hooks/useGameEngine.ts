import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { SCENARIOS, Scenario, QuizOption } from '../data/scenarios';
import {
  GameEngineState,
  GamePhase,
  VoteOption,
  VoteTally,
  UserScore,
  OutbreakMetrics,
  RoundOutcome,
} from '../engine/types';
import {
  INITIAL_GAME_STATE,
  INITIAL_TALLY,
  INITIAL_OUTBREAK_METRICS,
  castVote as pureCastVote,
  parseChatVote,
  awardParticipationPoints,
  getTop5Leaderboard,
  calculateWinner,
} from '../engine/gameEngine';
import { twitchClient, TwitchConnectionStatus } from '../twitch/twitchChat';
import { useSoundEffects } from './useSoundEffects';
import { Language } from '../data/translations';

const CHAT_BOT_NAMES = [
  'pixel_medic', 'dr_stream', 'epi_detective', 'biotech_andy', 'twitch_nurse',
  'lab_sam', 'global_health_zoe', 'monsoon_rider', 'vector_hunter', 'aerosol_al',
  'wash_commander', 'who_liaison', 'camp_medic_9', 'fever_tracker', 'rapid_tester',
  'quarantine_dan', 'vaccine_val', 'rural_rx', 'public_health_pro', 'vital_signs',
  'cdc_watcher', 'microbe_mike', 'immunity_ivy', 'pathogen_pat', 'health_hero_42',
  'chart_reader', 'triage_tina', 'water_purifier', 'bednet_bob', 'act_distributor',
  'stream_dr', 'dr_chatter', 'delta_medic', 'outbreak_leo', 'clara_epi',
  'bio_ben', 'sarah_stats', 'dr_frost', 'echo_health', 'marcus_morbilli',
  'mona_malaria', 'chad_cholera', 'quinn_quarantine', 'lucas_lab', 'riley_r0',
  'taylor_titer', 'case_investigator', 'contact_tracer', 'ors_hero', 'clinician_kai'
];

export function useGameEngine() {
  const [engineState, setEngineState] = useState<GameEngineState>(INITIAL_GAME_STATE);
  const [twitchStatus, setTwitchStatus] = useState<{
    status: TwitchConnectionStatus;
    channel: string;
    message?: string;
  }>({
    status: twitchClient.getStatus(),
    channel: twitchClient.getChannel(),
    message: 'Initializing Twitch connection...',
  });
  const [latestVote, setLatestVote] = useState<{
    user: string;
    option: VoteOption;
    timestamp: number;
  } | null>(null);

  // Sound effects controller
  const sounds = useSoundEffects();

  // AI explanation state per scenario: { loading, text, error }
  const [aiExplanations, setAiExplanations] = useState<
    Record<string, { loading: boolean; text: string | null; error: boolean }>
  >({});

  // Confetti celebration state
  const [showConfetti, setShowConfetti] = useState(false);

  // Auto-advance state (10s countdown after closing voting)
  const [autoAdvanceSeconds, setAutoAdvanceSeconds] = useState<number | null>(null);
  const [isAutoAdvancePaused, setIsAutoAdvancePaused] = useState(false);

  // Language state
  const [language, setLanguage] = useState<Language>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('streamhealth_lang');
      if (saved === 'en' || saved === 'am' || saved === 'sw') return saved;
    }
    return 'en';
  });

  const handleSetLanguage = useCallback((lang: Language) => {
    setLanguage(lang);
    if (typeof window !== 'undefined') {
      localStorage.setItem('streamhealth_lang', lang);
    }
  }, []);

  const currentScenarioIndex = engineState.currentScenarioIndex;
  const currentScenario = SCENARIOS[currentScenarioIndex] || SCENARIOS[0];
  const currentScenarioId = currentScenario.id;
  const isCurrentVotingClosed = engineState.phase === 'closed' || engineState.phase === 'explanation' || !!engineState.outcomes[currentScenarioId];
  const currentOutcome = engineState.outcomes[currentScenarioId] || null;

  // Determine current leading or winning option
  const currentWinningOption = useMemo<QuizOption>(() => {
    if (currentOutcome) {
      return (
        currentScenario.options.find((o) => o.optionNumber === currentOutcome.winningOptionNumber) ||
        currentScenario.options[0]
      );
    }

    if (engineState.tally.total > 0) {
      const { winner } = calculateWinner(engineState.tally.counts);
      return (
        currentScenario.options.find((o) => o.optionNumber === winner) ||
        currentScenario.options[0]
      );
    }

    return currentScenario.options[0];
  }, [currentOutcome, engineState.tally, currentScenario]);

  // Pure cast vote handler
  const handleCastVote = useCallback((user: string, option: VoteOption) => {
    setEngineState((prevState) => {
      // Don't accept votes if round is closed or completed
      if (prevState.phase === 'closed' || prevState.phase === 'explanation' || prevState.phase === 'completed') {
        return prevState;
      }
      const nextState = pureCastVote(user, option, prevState);
      return nextState;
    });

    setLatestVote({
      user,
      option,
      timestamp: Date.now(),
    });
  }, []);

  // Connect to Twitch Browser Client (Direct anonymous IRC connection)
  useEffect(() => {
    twitchClient.setCallbacks({
      onVote: (user, option) => {
        handleCastVote(user, option);
      },
      onStatus: (status, channel, message) => {
        setTwitchStatus({ status, channel, message });
      },
    });

    twitchClient.connect();

    return () => {
      twitchClient.disconnect();
    };
  }, [handleCastVote]);

  // Connect to optional local backend WebSocket server as fallback/supplement
  useEffect(() => {
    let ws: WebSocket | null = null;
    let timer: ReturnType<typeof setTimeout> | null = null;
    let isMounted = true;

    function connectWs() {
      try {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        ws = new WebSocket(`${protocol}//${window.location.host}`);

        ws.onmessage = (event) => {
          if (!isMounted) return;
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'TWITCH_VOTE' && data.user && (data.option === 1 || data.option === 2 || data.option === 3)) {
              handleCastVote(data.user, data.option as VoteOption);
            }
          } catch (_) {}
        };

        ws.onclose = () => {
          if (isMounted) timer = setTimeout(connectWs, 5000);
        };
      } catch (_) {
        if (isMounted) timer = setTimeout(connectWs, 5000);
      }
    }

    connectWs();

    return () => {
      isMounted = false;
      if (timer) clearTimeout(timer);
      if (ws) ws.close();
    };
  }, [handleCastVote]);

  // Change Twitch Channel
  const changeTwitchChannel = useCallback((newChannel: string) => {
    twitchClient.setChannel(newChannel);
    // Also notify backend if available
    fetch('/api/twitch/channel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ channel: newChannel }),
    }).catch(() => {});
  }, []);

  // Close voting and lock in decision
  const handleCloseVoting = useCallback(() => {
    const winner = currentWinningOption;
    sounds.playCloseVoting();

    // Sound and celebration
    if (winner.isOptimal) {
      setTimeout(() => sounds.playOptimalFanfare(), 250);
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3500);
    } else {
      setTimeout(() => sounds.playSuboptimalBuzz(), 250);
    }

    setEngineState((prev) => {
      // Award leaderboard points
      const updatedLeaderboard = awardParticipationPoints(
        prev,
        winner.optionNumber,
        winner.isOptimal
      );

      // Compute outbreak metrics delta
      const casesMultiplier = 1 + winner.infectionEffect / 100;
      const nextCases = Math.max(15, Math.round(prev.metrics.activeCases * casesMultiplier));
      const deathsDelta = winner.isOptimal ? (winner.optionNumber === 1 ? 42 : 35) : 0;
      const trustDelta = winner.isOptimal ? 15 : -10;
      const nextTrust = Math.min(100, Math.max(10, prev.metrics.communityTrust + trustDelta));

      const outcome: RoundOutcome = {
        scenarioId: currentScenario.id,
        winningOptionNumber: winner.optionNumber,
        isOptimal: winner.isOptimal,
        infectionDeltaPct: winner.infectionEffect,
        deathsAvertedDelta: deathsDelta,
        trustDelta: trustDelta,
        votes: { ...prev.tally.counts },
        totalVotes: prev.tally.total,
        winningExplanation: winner.oneSentenceExplanation,
      };

      return {
        ...prev,
        phase: 'closed',
        timerSeconds: 0,
        outcomes: {
          ...prev.outcomes,
          [currentScenario.id]: outcome,
        },
        leaderboard: updatedLeaderboard,
        metrics: {
          activeCases: nextCases,
          deathsAverted: prev.metrics.deathsAverted + deathsDelta,
          communityTrust: nextTrust,
        },
      };
    });

    // Start 10s auto-advance countdown to eliminate dead air
    setAutoAdvanceSeconds(10);
    setIsAutoAdvancePaused(false);
  }, [currentWinningOption, currentScenario, sounds]);

  // Start round (30s timer)
  const handleStartRound = useCallback(() => {
    setAutoAdvanceSeconds(null);
    setEngineState((prev) => ({
      ...prev,
      phase: 'voting',
      timerSeconds: 30,
    }));
  }, []);

  // Toggle explanation view
  const handleToggleExplanation = useCallback(() => {
    setEngineState((prev) => ({
      ...prev,
      phase: prev.phase === 'explanation' ? 'closed' : 'explanation',
    }));
  }, []);

  // Next Scenario
  const handleNext = useCallback(() => {
    setAutoAdvanceSeconds(null);
    setEngineState((prev) => {
      if (prev.currentScenarioIndex < SCENARIOS.length - 1) {
        return {
          ...prev,
          phase: 'idle',
          currentScenarioIndex: prev.currentScenarioIndex + 1,
          userVotes: {},
          tally: INITIAL_TALLY,
          timerSeconds: 30,
        };
      } else {
        return {
          ...prev,
          phase: 'completed',
        };
      }
    });
  }, []);

  // Previous Scenario
  const handlePrevious = useCallback(() => {
    setAutoAdvanceSeconds(null);
    setEngineState((prev) => {
      if (prev.currentScenarioIndex > 0) {
        return {
          ...prev,
          phase: 'closed',
          currentScenarioIndex: prev.currentScenarioIndex - 1,
        };
      }
      return prev;
    });
  }, []);

  // Jump to specific scenario (from summary or history)
  const handleJumpToScenario = useCallback((index: number) => {
    if (index >= 0 && index < SCENARIOS.length) {
      setAutoAdvanceSeconds(null);
      setEngineState((prev) => ({
        ...prev,
        currentScenarioIndex: index,
        phase: prev.outcomes[SCENARIOS[index].id] ? 'closed' : 'idle',
      }));
    }
  }, []);

  // Reset entire simulation
  const handleReset = useCallback(() => {
    setAutoAdvanceSeconds(null);
    setAiExplanations({});
    setEngineState(INITIAL_GAME_STATE);
  }, []);

  // Simulate 50 chat votes fallback
  const handleSimulateChat = useCallback((count = 50) => {
    const total = Math.min(count, CHAT_BOT_NAMES.length);
    for (let i = 0; i < total; i++) {
      const username = CHAT_BOT_NAMES[i % CHAT_BOT_NAMES.length];
      const rand = Math.random();
      const option: VoteOption = rand < 0.52 ? 1 : rand < 0.77 ? 2 : 3;

      setTimeout(() => {
        handleCastVote(username, option);
      }, i * 25);
    }
  }, [handleCastVote]);

  // 30s Countdown timer tick loop
  useEffect(() => {
    if (engineState.phase !== 'voting' || engineState.timerSeconds <= 0) {
      return;
    }

    const timer = setInterval(() => {
      setEngineState((prev) => {
        if (prev.phase !== 'voting') return prev;
        const nextSec = prev.timerSeconds - 1;

        if (nextSec <= 5 && nextSec > 0) {
          sounds.playAlert();
        } else if (nextSec > 5) {
          sounds.playTick();
        }

        if (nextSec <= 0) {
          clearInterval(timer);
          setTimeout(() => handleCloseVoting(), 50);
          return { ...prev, timerSeconds: 0 };
        }

        return { ...prev, timerSeconds: nextSec };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [engineState.phase, engineState.timerSeconds, sounds, handleCloseVoting]);

  // 10s Auto-Advance timer countdown after round close
  useEffect(() => {
    if (autoAdvanceSeconds === null || isAutoAdvancePaused) return;

    if (autoAdvanceSeconds <= 0) {
      handleNext();
      return;
    }

    const timer = setInterval(() => {
      setAutoAdvanceSeconds((sec) => (sec !== null ? sec - 1 : null));
    }, 1000);

    return () => clearInterval(timer);
  }, [autoAdvanceSeconds, isAutoAdvancePaused, handleNext]);

  // AI Explain with strict 4-second AbortController timeout & fallback
  const handleAiExplain = useCallback(async () => {
    if (!currentWinningOption) return;

    // Ensure voting is closed so explanation is in context
    if (engineState.phase === 'voting' || engineState.phase === 'idle') {
      handleCloseVoting();
    }

    setEngineState((prev) => ({ ...prev, phase: 'explanation' }));

    setAiExplanations((prev) => ({
      ...prev,
      [currentScenarioId]: { loading: true, text: null, error: false },
    }));

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000); // 4-second strict timeout

    try {
      const response = await fetch('/api/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          scenarioTitle: currentScenario.title,
          pathogen: currentScenario.pathogen,
          scenarioSetting: currentScenario.setting,
          winningOptionText: currentWinningOption.text,
          isOptimal: currentWinningOption.isOptimal,
          infectionEffect: currentWinningOption.infectionEffectLabel,
          prewrittenExplanation: currentWinningOption.oneSentenceExplanation,
        }),
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      if (!data.explanation) {
        throw new Error('No explanation returned');
      }

      setAiExplanations((prev) => ({
        ...prev,
        [currentScenarioId]: { loading: false, text: data.explanation, error: false },
      }));
    } catch (err) {
      clearTimeout(timeoutId);
      console.warn('[AI Explain] Call failed or timed out (4s), falling back to prewritten explanation:', err);
      setAiExplanations((prev) => ({
        ...prev,
        [currentScenarioId]: {
          loading: false,
          text: null,
          error: true,
        },
      }));
    }
  }, [currentWinningOption, engineState.phase, handleCloseVoting, currentScenarioId, currentScenario]);

  const handleResetVotes = useCallback(() => {
    setEngineState((prev) => ({
      ...prev,
      userVotes: {},
      userRateLimits: {},
      tally: INITIAL_TALLY,
    }));
  }, []);

  const topLeaderboard = useMemo(
    () => getTop5Leaderboard(engineState.leaderboard),
    [engineState.leaderboard]
  );

  return {
    engineState,
    currentScenario,
    currentScenarioIndex,
    totalScenarios: SCENARIOS.length,
    isCurrentVotingClosed,
    currentWinningOption,
    currentOutcome,
    twitchStatus,
    latestVote,
    topLeaderboard,
    aiState: aiExplanations[currentScenarioId],
    showConfetti,
    autoAdvanceSeconds,
    isAutoAdvancePaused,
    setIsAutoAdvancePaused,
    sounds,
    language,
    setLanguage: handleSetLanguage,
    actions: {
      castVote: handleCastVote,
      startRound: handleStartRound,
      closeVoting: handleCloseVoting,
      toggleExplanation: handleToggleExplanation,
      aiExplain: handleAiExplain,
      nextScenario: handleNext,
      previousScenario: handlePrevious,
      jumpToScenario: handleJumpToScenario,
      resetSimulation: handleReset,
      resetVotes: handleResetVotes,
      simulateChat: handleSimulateChat,
      changeTwitchChannel,
    },
  };
}
