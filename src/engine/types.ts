export type GamePhase =
  | 'idle'         // Pre-round / waiting for streamer to start
  | 'voting'       // Live chat voting active (30s timer running)
  | 'closed'       // Voting closed, winning choice locked, curve bending
  | 'explanation'  // Detailed public health debrief & AI grade-6 explanation shown
  | 'next'         // Transitioning to next scenario
  | 'completed';   // All scenarios finished, final debrief & community score

export type VoteOption = 1 | 2 | 3;

export interface VoteTally {
  counts: { 1: number; 2: number; 3: number };
  percentages: { 1: number; 2: number; 3: number };
  total: number;
}

export interface UserScore {
  username: string;
  points: number;
  streak: number;
  totalVotes: number;
  correctVotes: number;
}

export interface OutbreakMetrics {
  activeCases: number;
  deathsAverted: number;
  communityTrust: number; // 0 to 100%
}

export interface RoundOutcome {
  scenarioId: string;
  winningOptionNumber: VoteOption;
  isOptimal: boolean;
  infectionDeltaPct: number;
  deathsAvertedDelta: number;
  trustDelta: number;
  votes: { 1: number; 2: number; 3: number };
  totalVotes: number;
  winningExplanation: string;
}

export interface GameEngineState {
  phase: GamePhase;
  currentScenarioIndex: number;
  userVotes: Record<string, VoteOption>;
  userRateLimits: Record<string, number>; // username -> last vote timestamp
  tally: VoteTally;
  leaderboard: Record<string, UserScore>;
  metrics: OutbreakMetrics;
  outcomes: Record<string, RoundOutcome>;
  timerSeconds: number;
  autoAdvanceCountdown: number | null; // null if inactive, 10..0 if auto-advancing
}
