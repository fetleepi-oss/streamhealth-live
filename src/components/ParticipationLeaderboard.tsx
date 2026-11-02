import React from 'react';
import { Trophy, Flame, Award, Users } from 'lucide-react';
import { UserScore } from '../engine/types';
import { Language, TRANSLATIONS } from '../data/translations';

interface ParticipationLeaderboardProps {
  topScores: UserScore[];
  language: Language;
  totalParticipants: number;
}

export const ParticipationLeaderboard: React.FC<ParticipationLeaderboardProps> = ({
  topScores,
  language,
  totalParticipants,
}) => {
  const t = TRANSLATIONS[language];

  return (
    <div className="bg-[#121A30] border border-[#1E294B] rounded-2xl p-4 sm:p-5 shadow-xl space-y-3">
      <div className="flex items-center justify-between border-b border-[#1E294B] pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Trophy className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white tracking-tight">
              {t.leaderboardTitle}
            </h4>
            <p className="text-[11px] text-slate-400">
              {t.topRespondents} · {totalParticipants} viewers active
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 px-2 py-1 bg-[#0B1020] border border-[#1E294B] rounded-md text-[11px] font-mono text-slate-300">
          <Users className="w-3.5 h-3.5 text-[#2DD4BF]" />
          <span>Top 5</span>
        </div>
      </div>

      {topScores.length === 0 ? (
        <div className="text-center py-4 text-xs text-slate-400 italic">
          No votes recorded yet. Type <span className="font-mono text-teal-300 font-semibold">1</span>, <span className="font-mono text-teal-300 font-semibold">2</span>, or <span className="font-mono text-teal-300 font-semibold">3</span> in chat!
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 pt-1">
          {topScores.map((score, idx) => {
            const isFirst = idx === 0;
            const isSecond = idx === 1;
            const isThird = idx === 2;

            return (
              <div
                key={score.username}
                className={`relative p-2.5 rounded-xl border flex flex-col justify-between transition-all ${
                  isFirst
                    ? 'bg-amber-950/20 border-amber-500/40 shadow-sm shadow-amber-500/10'
                    : isSecond
                    ? 'bg-slate-900/60 border-slate-700/60'
                    : isThird
                    ? 'bg-slate-900/40 border-amber-800/30'
                    : 'bg-[#0B1020]/80 border-[#1E294B]'
                }`}
              >
                <div className="flex items-center justify-between gap-1 mb-1.5">
                  <span
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${
                      isFirst
                        ? 'bg-amber-400 text-slate-950 shadow-sm'
                        : isSecond
                        ? 'bg-slate-300 text-slate-950'
                        : isThird
                        ? 'bg-amber-700 text-white'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {idx + 1}
                  </span>

                  {score.streak > 1 && (
                    <span className="flex items-center gap-0.5 text-[10px] font-mono font-bold text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                      <Flame className="w-3 h-3 text-amber-400 fill-amber-400" />
                      {score.streak}x
                    </span>
                  )}
                </div>

                <div className="truncate font-semibold text-xs text-slate-200 mb-1" title={score.username}>
                  {score.username}
                </div>

                <div className="flex items-baseline justify-between text-[11px] font-mono">
                  <span className="text-[#2DD4BF] font-bold">
                    {score.points} <span className="text-[9px] font-normal text-slate-400">{t.pts}</span>
                  </span>
                  <span className="text-slate-400 text-[10px]">
                    {score.correctVotes}/{score.totalVotes}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
