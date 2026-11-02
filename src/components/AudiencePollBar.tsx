import React, { useState } from 'react';
import {
  Users,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Send,
  UserCheck,
  Flame,
  Lock,
  Unlock,
  Radio,
  Tv,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { VoteTally, VoteOption } from '../voting';
import { TwitchStatus, LatestVote } from '../hooks/useVoting';

interface AudiencePollBarProps {
  tally: VoteTally;
  userVotes: Record<string, VoteOption>;
  onCastVote: (user: string, option: VoteOption) => void;
  onSimulateChat: (count?: number) => void;
  onResetVotes: () => void;
  isVotingClosed: boolean;
  onCloseVoting: () => void;
  onReopenVoting: () => void;
  optionLabels?: { 1: string; 2: string; 3: string };
  winningOptionNum?: 1 | 2 | 3;
  timerSeconds?: number;
  timerActive?: boolean;
  onToggleTimer?: () => void;
  onResetTimer?: () => void;
  twitchStatus?: TwitchStatus;
  latestVote?: LatestVote | null;
  onChangeTwitchChannel?: (channel: string) => void;
}

export const AudiencePollBar: React.FC<AudiencePollBarProps> = ({
  tally,
  userVotes,
  onCastVote,
  onSimulateChat,
  onResetVotes,
  isVotingClosed,
  onCloseVoting,
  onReopenVoting,
  optionLabels = {
    1: 'Option 1 (A)',
    2: 'Option 2 (B)',
    3: 'Option 3 (C)',
  },
  winningOptionNum,
  timerSeconds: externalTimerSeconds,
  timerActive: externalTimerActive,
  onToggleTimer: externalToggleTimer,
  onResetTimer: externalResetTimer,
  twitchStatus,
  latestVote,
  onChangeTwitchChannel,
}) => {
  // 30-second stream countdown timer
  const [internalTimerSeconds, setInternalTimerSeconds] = useState(30);
  const [internalTimerActive, setInternalTimerActive] = useState(false);

  const timerSeconds = externalTimerSeconds !== undefined ? externalTimerSeconds : internalTimerSeconds;
  const timerActive = externalTimerActive !== undefined ? externalTimerActive : internalTimerActive;

  const toggleTimer = externalToggleTimer || (() => setInternalTimerActive((prev) => !prev));
  const resetTimer = externalResetTimer || (() => {
    setInternalTimerActive(false);
    setInternalTimerSeconds(30);
  });

  // Channel edit input state
  const [editingChannel, setEditingChannel] = useState(false);
  const [inputChannel, setInputChannel] = useState(twitchStatus?.channel || '');

  // Manual viewer vote test input
  const [manualUser, setManualUser] = useState('StreamViewer_1');
  const [lastActionNotice, setLastActionNotice] = useState<string | null>(null);

  const handleManualVote = (option: VoteOption) => {
    if (isVotingClosed) return;
    const user = manualUser.trim() || 'AnonymousViewer';
    const previousVote = userVotes[user];
    onCastVote(user, option);

    if (previousVote !== undefined) {
      setLastActionNotice(`Updated ${user}'s vote from Option ${previousVote} to Option ${option}`);
    } else {
      setLastActionNotice(`Recorded ${user}'s vote for Option ${option}`);
    }

    setTimeout(() => {
      setLastActionNotice(null);
    }, 3000);
  };

  const handleSaveChannel = (e: React.FormEvent) => {
    e.preventDefault();
    if (onChangeTwitchChannel) {
      onChangeTwitchChannel(inputChannel.trim());
    }
    setEditingChannel(false);
  };

  // Find leader option
  const maxVotes = Math.max(tally.counts[1], tally.counts[2], tally.counts[3]);
  const hasLeader = tally.total > 0 && maxVotes > 0;

  const barThemes: Record<VoteOption, { barColor: string; bgBorder: string; textAccent: string }> = {
    1: {
      barColor: 'bg-emerald-500',
      bgBorder: 'border-emerald-500/40',
      textAccent: 'text-emerald-400',
    },
    2: {
      barColor: 'bg-cyan-500',
      bgBorder: 'border-cyan-500/40',
      textAccent: 'text-cyan-400',
    },
    3: {
      barColor: 'bg-amber-500',
      bgBorder: 'border-amber-500/40',
      textAccent: 'text-amber-400',
    },
  };

  return (
    <section
      aria-label="Live Voting and Twitch Chat Poll"
      className={`border rounded-2xl p-4 sm:p-6 shadow-xl backdrop-blur-md space-y-4 transition-all ${
        isVotingClosed
          ? 'bg-slate-950/95 border-emerald-500/30 ring-1 ring-emerald-500/20'
          : 'bg-slate-900/95 border-slate-800'
      }`}
    >
      {/* Top Header: Title, Total Viewers, Countdown Timer & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
              isVotingClosed
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400'
            }`}
          >
            {isVotingClosed ? <Lock className="w-5 h-5" /> : <Users className="w-5 h-5" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                Live Chat Voting
              </h2>
              <span className="text-xs font-semibold text-slate-400">
                · {tally.total} {tally.total === 1 ? 'total vote' : 'total votes'}
              </span>
              {isVotingClosed && (
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Voting Closed
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400">
              {isVotingClosed
                ? 'Poll closed. The winning option has been locked and the epidemic curve has bent accordingly.'
                : 'Viewers vote in Twitch chat with !1, !2, or !3. One vote per viewer (last vote counts).'}
            </p>
          </div>
        </div>

        {/* 30-Second Countdown Timer and Action Buttons */}
        <div className="flex flex-wrap items-center gap-3">
          {/* 30-Second Countdown Timer */}
          <div className="flex items-center gap-2 px-3.5 py-1.5 bg-slate-950 border border-slate-800 rounded-xl shadow-inner">
            <span className="text-xs font-medium text-slate-400">Timer:</span>
            <span
              className={`font-mono text-base font-bold tabular-nums ${
                timerSeconds === 0
                  ? 'text-rose-500 font-extrabold'
                  : timerSeconds <= 5 && timerActive
                  ? 'text-rose-400 animate-pulse font-extrabold'
                  : 'text-white'
              }`}
            >
              00:{timerSeconds.toString().padStart(2, '0')}
            </span>
            <button
              onClick={toggleTimer}
              disabled={isVotingClosed}
              className={`p-1 rounded transition-colors ${
                isVotingClosed
                  ? 'text-slate-600 cursor-not-allowed'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800 cursor-pointer'
              }`}
              title={timerActive ? 'Pause Countdown' : 'Start 30s Countdown'}
              aria-label={timerActive ? 'Pause Countdown' : 'Start 30s Countdown'}
            >
              {timerActive ? <Pause className="w-4 h-4 text-amber-400" /> : <Play className="w-4 h-4 text-emerald-400" />}
            </button>
            <button
              onClick={resetTimer}
              className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title="Reset to 30 Seconds"
              aria-label="Reset to 30 Seconds"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Close / Reopen Voting Action Button */}
          {!isVotingClosed ? (
            <button
              onClick={onCloseVoting}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-emerald-950 bg-emerald-400 hover:bg-emerald-300 rounded-xl transition-all cursor-pointer shadow-md shadow-emerald-500/20 active:scale-95"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Close Voting</span>
            </button>
          ) : (
            <button
              onClick={onReopenVoting}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-300 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-xl transition-all cursor-pointer"
            >
              <Unlock className="w-3.5 h-3.5 text-slate-400" />
              <span>Reopen Poll</span>
            </button>
          )}

          {/* Simulate Chat Fallback Button */}
          {!isVotingClosed && (
            <button
              onClick={() => onSimulateChat(50)}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-cyan-200 bg-cyan-950/80 border border-cyan-700/60 rounded-xl hover:bg-cyan-900 hover:border-cyan-500 transition-all cursor-pointer shadow-sm active:scale-95"
              title="Simulate 50 fake viewers voting randomly (fallback)"
            >
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span>Simulate Chat (Fallback)</span>
            </button>
          )}

          {/* Clear / Reset Votes */}
          <button
            onClick={onResetVotes}
            className="px-2.5 py-2 text-xs font-medium text-slate-400 hover:text-white bg-slate-950 border border-slate-800 rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
            title="Clear all votes"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Real Twitch Chat Status & Live Feed Strip */}
      <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Twitch Brand Tag */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#9146FF]/15 border border-[#9146FF]/40 text-[#a970ff] font-bold text-xs">
            <Tv className="w-3.5 h-3.5" />
            <span>Twitch Chat</span>
          </div>

          {/* Channel Name & Connection Indicator */}
          <div className="flex items-center gap-1.5">
            <span
              className={`w-2 h-2 rounded-full ${
                twitchStatus?.connected
                  ? 'bg-emerald-400 animate-pulse'
                  : twitchStatus?.channel
                  ? 'bg-amber-400'
                  : 'bg-slate-500'
              }`}
            />
            <span className="font-mono text-slate-200 font-semibold">
              {twitchStatus?.channel ? `#${twitchStatus.channel}` : 'No channel configured'}
            </span>
            <span className="text-slate-400">
              ({twitchStatus?.connected ? 'Connected · Listening for !1, !2, !3' : 'Waiting for connection'})
            </span>
          </div>

          {/* Channel Switcher */}
          {!editingChannel ? (
            <button
              onClick={() => {
                setInputChannel(twitchStatus?.channel || '');
                setEditingChannel(true);
              }}
              className="text-[11px] text-cyan-400 hover:underline cursor-pointer ml-1"
            >
              Change Channel
            </button>
          ) : (
            <form onSubmit={handleSaveChannel} className="flex items-center gap-1.5 ml-1">
              <input
                type="text"
                value={inputChannel}
                onChange={(e) => setInputChannel(e.target.value)}
                placeholder="Twitch channel..."
                className="px-2 py-0.5 bg-slate-900 border border-slate-700 rounded text-white text-xs font-mono w-28 focus:outline-none focus:border-cyan-500"
                autoFocus
              />
              <button
                type="submit"
                className="px-2 py-0.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded text-[11px] font-bold cursor-pointer"
              >
                Join
              </button>
              <button
                type="button"
                onClick={() => setEditingChannel(false)}
                className="text-[11px] text-slate-400 hover:text-white cursor-pointer"
              >
                Cancel
              </button>
            </form>
          )}
        </div>

        {/* Live Incoming Twitch Vote Ticker */}
        {latestVote ? (
          <div className="flex items-center gap-2 text-cyan-300 font-mono text-[11px] bg-cyan-950/40 border border-cyan-800/40 px-2.5 py-1 rounded-md animate-in fade-in duration-150">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
            <span>
              Live vote: <strong>@{latestVote.user}</strong> voted{' '}
              <span className="font-bold text-white bg-cyan-900 px-1 py-0.2 rounded">
                Option {latestVote.option}
              </span>
            </span>
          </div>
        ) : (
          <span className="text-slate-500 text-[11px] font-mono">
            Type !1, !2, or !3 in Twitch chat to vote
          </span>
        )}
      </div>

      {/* 3 Animated Vote Bars with Counts and Percentages */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {([1, 2, 3] as const).map((optionNum) => {
          const count = tally.counts[optionNum];
          const percent = tally.percentages[optionNum];
          const isLeader = hasLeader && count === maxVotes;
          const isWinner = isVotingClosed && winningOptionNum === optionNum;
          const theme = barThemes[optionNum];

          return (
            <div
              key={optionNum}
              className={`relative bg-slate-950/90 border rounded-xl p-4 transition-all duration-300 flex flex-col justify-between ${
                isWinner
                  ? 'border-emerald-500 bg-emerald-950/20 ring-2 ring-emerald-500/50 shadow-lg'
                  : isLeader && tally.total > 0
                  ? `${theme.bgBorder} ring-1 ring-cyan-500/30 shadow-md`
                  : 'border-slate-800/80'
              }`}
            >
              {/* Option Title & Live Percentage Header */}
              <div>
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-7 h-7 rounded-lg border font-mono font-bold text-xs flex items-center justify-center ${
                        isWinner
                          ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                          : 'bg-slate-900 border-slate-700 text-white'
                      }`}
                    >
                      {optionNum}
                    </span>
                    <span className="text-sm font-bold text-slate-200 truncate">
                      Option {optionNum}
                    </span>
                    <span className="text-[10px] font-mono text-cyan-400/80 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                      !{optionNum}
                    </span>
                  </div>

                  {isWinner ? (
                    <span className="flex items-center gap-1 text-[11px] font-black px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      WINNER
                    </span>
                  ) : isLeader && tally.total > 0 ? (
                    <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-400">
                      <Flame className="w-3.5 h-3.5" />
                      <span>Leading</span>
                    </span>
                  ) : null}
                </div>

                <div className="flex items-baseline justify-between gap-3 mb-2">
                  <span className="text-xs text-slate-300 font-medium break-words leading-snug min-w-0" title={optionLabels[optionNum]}>
                    {optionLabels[optionNum]}
                  </span>
                  <div className="flex items-baseline gap-1.5 whitespace-nowrap shrink-0 text-right">
                    <span className="font-mono text-2xl font-black text-white tabular-nums tracking-tight">
                      {percent}%
                    </span>
                    <span className="text-xs text-slate-400 font-mono tabular-nums">
                      ({count} {count === 1 ? 'vote' : 'votes'})
                    </span>
                  </div>
                </div>

                {/* Animated Vote Bar */}
                <div className="w-full bg-slate-900 border border-slate-800 rounded-full h-3.5 p-0.5 overflow-hidden mb-3">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ease-out ${
                      isWinner ? 'bg-emerald-400' : theme.barColor
                    }`}
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </div>

              {/* Quick vote cast trigger */}
              <div className="pt-2 border-t border-slate-900 flex items-center justify-between">
                <span className="text-[11px] text-slate-500">
                  {isVotingClosed ? 'Locked' : 'Chat command: !' + optionNum}
                </span>
                <button
                  onClick={() => handleManualVote(optionNum)}
                  disabled={isVotingClosed}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition-colors ${
                    isVotingClosed
                      ? 'border-slate-800 text-slate-600 cursor-not-allowed bg-slate-950'
                      : 'bg-slate-900 hover:bg-slate-800 text-slate-200 hover:text-white border-slate-700/60 cursor-pointer active:scale-95'
                  }`}
                >
                  Vote {optionNum}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Manual User Voting Tester (Demonstrates castVote(user, option) & last vote rule) */}
      {!isVotingClosed && (
        <div className="p-3 bg-slate-950/70 border border-slate-800/80 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-slate-400 shrink-0" />
            <span className="text-slate-400">Test viewer vote:</span>
            <input
              type="text"
              value={manualUser}
              onChange={(e) => setManualUser(e.target.value)}
              placeholder="Username..."
              className="px-2.5 py-1 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono text-xs w-36 focus:outline-none focus:border-cyan-500"
            />
            {userVotes[manualUser.trim()] && (
              <span className="text-cyan-400 text-[11px]">
                (Currently voted: Option {userVotes[manualUser.trim()]})
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-500">castVote(user, opt):</span>
            {([1, 2, 3] as const).map((opt) => (
              <button
                key={opt}
                onClick={() => handleManualVote(opt)}
                className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-md text-slate-300 hover:text-white font-mono text-xs font-bold transition-colors cursor-pointer"
              >
                !{opt}
              </button>
            ))}
          </div>
        </div>
      )}

      {lastActionNotice && (
        <div className="text-xs text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 px-3 py-1.5 rounded-lg animate-in fade-in duration-200">
          {lastActionNotice}
        </div>
      )}
    </section>
  );
};
