import { GameEngineState, VoteOption, VoteTally, UserScore, OutbreakMetrics } from './types';

export const INITIAL_OUTBREAK_METRICS: OutbreakMetrics = {
  activeCases: 70,
  deathsAverted: 0,
  communityTrust: 65, // Base community trust 65%
};

export const INITIAL_TALLY: VoteTally = {
  counts: { 1: 0, 2: 0, 3: 0 },
  percentages: { 1: 0, 2: 0, 3: 0 },
  total: 0,
};

export const INITIAL_GAME_STATE: GameEngineState = {
  phase: 'idle',
  currentScenarioIndex: 0,
  userVotes: {},
  userRateLimits: {},
  tally: INITIAL_TALLY,
  leaderboard: {},
  metrics: INITIAL_OUTBREAK_METRICS,
  outcomes: {},
  timerSeconds: 30,
  autoAdvanceCountdown: null,
};

/**
 * Anti-spam chat message parser.
 * Rules:
 * - Reject messages longer than 12 characters.
 * - Accept only: !1, !2, !3, 1, 2, 3, !vote 1, !vote 2, !vote 3, !a, !b, !c, or !vote a/b/c.
 */
export function parseChatVote(rawMessage: string): VoteOption | null {
  if (!rawMessage || typeof rawMessage !== 'string') return null;

  const trimmed = rawMessage.trim();
  if (trimmed.length > 12) return null; // Ignore spam / long chat text

  const lower = trimmed.toLowerCase();

  // Direct numbers or commands
  if (lower === '!1' || lower === '1' || lower === '!a' || lower === 'a' || lower === '!vote 1' || lower === '!vote a') {
    return 1;
  }
  if (lower === '!2' || lower === '2' || lower === '!b' || lower === 'b' || lower === '!vote 2' || lower === '!vote b') {
    return 2;
  }
  if (lower === '!3' || lower === '3' || lower === '!c' || lower === 'c' || lower === '!vote 3' || lower === '!vote c') {
    return 3;
  }

  // Regex fallback for whitespace variations e.g. "!vote  2"
  const voteCmdMatch = lower.match(/^!(?:vote\s*)?([1-3]|[abc])$/);
  if (voteCmdMatch) {
    const char = voteCmdMatch[1];
    if (char === '1' || char === 'a') return 1;
    if (char === '2' || char === 'b') return 2;
    if (char === '3' || char === 'c') return 3;
  }

  return null;
}

/**
 * Pure, tested function: castVote(user, option, state, timestamp)
 * Enforces:
 * - One vote per user (last vote replaces prior choice)
 * - Rate limit: ignores rapid spam from same user within 400ms
 * - Purely returns updated state with fresh counts & percentages
 */
export function castVote(
  user: string,
  option: VoteOption,
  state: GameEngineState,
  timestamp = Date.now()
): GameEngineState {
  if (!user || typeof user !== 'string') return state;
  const username = user.trim().toLowerCase();
  if (!username) return state;

  if (option !== 1 && option !== 2 && option !== 3) return state;

  // Rate limit check: max 1 vote per 400ms per user
  const lastTime = state.userRateLimits[username] || 0;
  if (timestamp - lastTime < 400) {
    return state;
  }

  const previousVote = state.userVotes[username];

  // If already voted same option, just touch rate limit
  if (previousVote === option) {
    return {
      ...state,
      userRateLimits: {
        ...state.userRateLimits,
        [username]: timestamp,
      },
    };
  }

  const updatedUserVotes = {
    ...state.userVotes,
    [username]: option,
  };

  // Recompute tallies
  const counts = { 1: 0, 2: 0, 3: 0 };
  for (const opt of Object.values(updatedUserVotes)) {
    if (opt === 1 || opt === 2 || opt === 3) {
      counts[opt]++;
    }
  }

  const total = counts[1] + counts[2] + counts[3];
  const percentages = {
    1: total > 0 ? Math.round((counts[1] / total) * 100) : 0,
    2: total > 0 ? Math.round((counts[2] / total) * 100) : 0,
    3: total > 0 ? Math.round((counts[3] / total) * 100) : 0,
  };

  return {
    ...state,
    userVotes: updatedUserVotes,
    userRateLimits: {
      ...state.userRateLimits,
      [username]: timestamp,
    },
    tally: { counts, percentages, total },
  };
}

export interface WinnerResult {
  winner: VoteOption;
  isTie: boolean;
  tiedOptions: VoteOption[];
  winningVotes: number;
}

/**
 * Pure calculation of the winning option based on vote counts.
 * Handles ties deterministically by selecting the lowest option number among tied options.
 */
export function calculateWinner(counts: Record<VoteOption, number>): WinnerResult {
  const options: VoteOption[] = [1, 2, 3];
  let maxCount = -1;

  for (const opt of options) {
    const c = counts[opt] ?? 0;
    if (c > maxCount) {
      maxCount = c;
    }
  }

  const tiedOptions = options.filter((opt) => (counts[opt] ?? 0) === maxCount);
  const isTie = tiedOptions.length > 1;
  const winner = tiedOptions.length > 0 ? tiedOptions[0] : 1;

  return {
    winner,
    isTie,
    tiedOptions,
    winningVotes: Math.max(0, maxCount),
  };
}

/**
 * Updates viewer participation scores and streaks when round closes.
 * Viewers who voted for the winning, best-outcome choice get +100 points and streak increment.
 * Viewers who participated get +25 points.
 */
export function awardParticipationPoints(
  state: GameEngineState,
  winningOptionNum: VoteOption,
  isOptimal: boolean
): Record<string, UserScore> {
  const updatedLeaderboard = { ...state.leaderboard };

  for (const [user, opt] of Object.entries(state.userVotes)) {
    const existing = updatedLeaderboard[user] || {
      username: user,
      points: 0,
      streak: 0,
      totalVotes: 0,
      correctVotes: 0,
    };

    const isMatch = opt === winningOptionNum && isOptimal;
    const streakBonus = isMatch ? Math.min(existing.streak + 1, 5) : 0;
    const pointsAwarded = isMatch ? 100 + streakBonus * 25 : 25;

    updatedLeaderboard[user] = {
      ...existing,
      points: existing.points + pointsAwarded,
      streak: isMatch ? existing.streak + 1 : 0,
      totalVotes: existing.totalVotes + 1,
      correctVotes: existing.correctVotes + (isMatch ? 1 : 0),
    };
  }

  return updatedLeaderboard;
}

/**
 * Computes top 5 viewers from leaderboard
 */
export function getTop5Leaderboard(leaderboard: Record<string, UserScore>): UserScore[] {
  return Object.values(leaderboard)
    .sort((a, b) => b.points - a.points || b.streak - a.streak)
    .slice(0, 5);
}
