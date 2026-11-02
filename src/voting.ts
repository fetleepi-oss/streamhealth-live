/**
 * Live Voting Module for StreamHealth Live
 *
 * Requirements:
 * - castVote(user, option) where option is 1, 2 or 3
 * - One vote per user, and the last vote counts
 * - Vote tallying with counts and percentages
 * - 50 fake viewers chat simulation
 */

export type VoteOption = 1 | 2 | 3;

export interface VoteTally {
  counts: { 1: number; 2: number; 3: number };
  percentages: { 1: number; 2: number; 3: number };
  total: number;
}

// In-memory browser state for user votes: user -> option
const userVotes: Map<string, VoteOption> = new Map();
const listeners: Set<() => void> = new Set();

/**
 * Cast a vote for a user. One vote per user; the last vote replaces previous votes.
 * @param user Unique username or identifier
 * @param option 1, 2, or 3
 */
export function castVote(user: string, option: 1 | 2 | 3): void {
  if (!user || (option !== 1 && option !== 2 && option !== 3)) {
    return;
  }
  userVotes.set(user.trim(), option);
  notifyListeners();
}

/**
 * Get current tally with raw counts and integer percentages for options 1, 2, and 3.
 */
export function getVoteTally(): VoteTally {
  const counts = { 1: 0, 2: 0, 3: 0 };

  for (const option of userVotes.values()) {
    if (option === 1 || option === 2 || option === 3) {
      counts[option]++;
    }
  }

  const total = counts[1] + counts[2] + counts[3];

  const percentages = {
    1: total > 0 ? Math.round((counts[1] / total) * 100) : 0,
    2: total > 0 ? Math.round((counts[2] / total) * 100) : 0,
    3: total > 0 ? Math.round((counts[3] / total) * 100) : 0,
  };

  return { counts, percentages, total };
}

/**
 * Returns a copy of all user votes.
 */
export function getAllUserVotes(): Record<string, VoteOption> {
  const result: Record<string, VoteOption> = {};
  userVotes.forEach((opt, user) => {
    result[user] = opt;
  });
  return result;
}

/**
 * Reset all user votes to empty.
 */
export function resetVotes(): void {
  userVotes.clear();
  notifyListeners();
}

/**
 * Subscribe to vote updates (useful for React hooks / external observers).
 */
export function subscribeToVotes(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function notifyListeners(): void {
  listeners.forEach((fn) => {
    try {
      fn();
    } catch (e) {
      console.error('Error notifying vote listener:', e);
    }
  });
}

const CHAT_USERNAMES = [
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

/**
 * Adds 50 fake viewers voting randomly using castVote(user, option).
 * Supports staggered bursts so animated bars visually shift in real-time.
 */
export function simulateChat(count = 50, staggered = true): void {
  const total = Math.min(count, CHAT_USERNAMES.length * 3);

  // Generate 50 unique or re-voting viewer sessions
  for (let i = 0; i < total; i++) {
    const baseName = CHAT_USERNAMES[i % CHAT_USERNAMES.length];
    const username = i >= CHAT_USERNAMES.length ? `${baseName}_${Math.floor(i / CHAT_USERNAMES.length) + 1}` : baseName;
    
    // Choose an option with realistic distribution: 1 (50%), 2 (25%), 3 (25%)
    const rand = Math.random();
    const option: VoteOption = rand < 0.52 ? 1 : rand < 0.77 ? 2 : 3;

    if (staggered) {
      setTimeout(() => {
        castVote(username, option);
      }, i * 25); // fast 25ms stagger across 1.25s
    } else {
      castVote(username, option);
    }
  }
}
