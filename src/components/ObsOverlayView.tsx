import React from 'react';
import { Activity, Clock, ShieldCheck, Heart, Users, Radio } from 'lucide-react';
import { Scenario, QuizOption } from '../data/scenarios';
import { VoteTally, VoteOption, OutbreakMetrics } from '../engine/types';
import { EpidemicCurveCanvas, ScenarioOutcome } from './EpidemicCurveCanvas';
import { Language, TRANSLATIONS } from '../data/translations';

interface ObsOverlayViewProps {
  scenario: Scenario;
  currentScenarioIndex: number;
  totalScenarios: number;
  tally: VoteTally;
  isVotingClosed: boolean;
  winningOption: QuizOption | null;
  timerSeconds: number;
  timerActive: boolean;
  metrics: OutbreakMetrics;
  outcomes: Record<string, ScenarioOutcome>;
  scenarios: Scenario[];
  channelName: string;
  language: Language;
}

export const ObsOverlayView: React.FC<ObsOverlayViewProps> = ({
  scenario,
  currentScenarioIndex,
  totalScenarios,
  tally,
  isVotingClosed,
  winningOption,
  timerSeconds,
  timerActive,
  metrics,
  outcomes,
  scenarios,
  channelName,
  language,
}) => {
  const t = TRANSLATIONS[language];

  return (
    <div className="w-[1920px] h-[1080px] overflow-hidden bg-transparent p-8 flex flex-col justify-between select-none text-white font-sans">
      {/* Top Broadcast HUD Banner */}
      <div className="flex items-center justify-between bg-[#0B1020]/90 border border-[#1E294B] backdrop-blur-md rounded-2xl px-8 py-5 shadow-2xl">
        <div className="flex items-center gap-5">
          <div className="flex items-center gap-2.5 px-4 py-2 bg-rose-500/20 border border-rose-500/40 rounded-xl text-rose-400 font-bold text-sm tracking-wide uppercase animate-pulse">
            <Radio className="w-4 h-4" />
            <span>LIVE INCIDENT COMMAND</span>
          </div>

          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-black tracking-tight text-white">
                StreamHealth Live
              </h1>
              <span className="text-slate-400 text-lg font-medium">·</span>
              <span className="text-teal-400 font-mono font-bold text-lg">
                {t.scenarioNumber} {currentScenarioIndex + 1}/{totalScenarios}: {scenario.title}
              </span>
            </div>
            <p className="text-sm text-slate-300 font-medium">
              Pathogen: <span className="text-amber-300 font-mono">{scenario.pathogen}</span> · {scenario.setting}
            </p>
          </div>
        </div>

        {/* Live Outbreak Stats */}
        <div className="flex items-center gap-6">
          <div className="bg-[#121A30] border border-[#1E294B] px-5 py-2.5 rounded-xl flex items-center gap-3">
            <Activity className="w-5 h-5 text-cyan-400" />
            <div>
              <div className="text-[11px] font-mono uppercase text-slate-400">{t.activeCases}</div>
              <div className="text-xl font-black font-mono text-cyan-300 tabular-nums">
                {metrics.activeCases}
              </div>
            </div>
          </div>

          <div className="bg-[#121A30] border border-[#1E294B] px-5 py-2.5 rounded-xl flex items-center gap-3">
            <Heart className="w-5 h-5 text-emerald-400" />
            <div>
              <div className="text-[11px] font-mono uppercase text-slate-400">{t.deathsAverted}</div>
              <div className="text-xl font-black font-mono text-emerald-300 tabular-nums">
                +{metrics.deathsAverted}
              </div>
            </div>
          </div>

          <div className="bg-[#121A30] border border-[#1E294B] px-5 py-2.5 rounded-xl flex items-center gap-3">
            <ShieldCheck className="w-5 h-5 text-amber-400" />
            <div>
              <div className="text-[11px] font-mono uppercase text-slate-400">{t.communityTrust}</div>
              <div className="text-xl font-black font-mono text-amber-300 tabular-nums">
                {metrics.communityTrust}%
              </div>
            </div>
          </div>

          {/* Countdown Clock */}
          <div
            className={`px-6 py-2.5 rounded-xl border flex items-center gap-3 transition-colors ${
              timerSeconds <= 5 && timerActive
                ? 'bg-rose-500/20 border-rose-500 text-rose-300 animate-bounce'
                : 'bg-[#121A30] border-[#1E294B] text-slate-200'
            }`}
          >
            <Clock className="w-6 h-6 text-amber-400" />
            <div>
              <div className="text-[11px] font-mono uppercase text-slate-400">VOTING WINDOW</div>
              <div className="text-2xl font-black font-mono tabular-nums">
                {isVotingClosed ? 'CLOSED' : `${timerSeconds}s`}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Middle Stage: Options on Left, Epi-Curve on Right */}
      <div className="grid grid-cols-12 gap-8 my-auto">
        {/* Left Column (7 cols): Question Narrative + 3 Massive Animated Vote Bars */}
        <div className="col-span-7 space-y-6">
          <div className="bg-[#0B1020]/90 border border-[#1E294B] rounded-2xl p-6 backdrop-blur-md shadow-2xl">
            <p className="text-xl text-slate-200 font-medium leading-relaxed">
              {scenario.narrative}
            </p>
          </div>

          {/* 3 Massive Options with Vote Progress Bars */}
          <div className="space-y-4">
            {scenario.options.map((opt) => {
              const num = opt.optionNumber as 1 | 2 | 3;
              const votes = tally.counts[num] || 0;
              const pct = tally.percentages[num] || 0;
              const isWinner = isVotingClosed && winningOption?.optionNumber === num;

              const colors = [
                { bg: 'bg-[#2DD4BF]', text: 'text-[#2DD4BF]', border: 'border-[#2DD4BF]/40' },
                { bg: 'bg-[#F59E0B]', text: 'text-[#F59E0B]', border: 'border-[#F59E0B]/40' },
                { bg: 'bg-[#FB7185]', text: 'text-[#FB7185]', border: 'border-[#FB7185]/40' },
              ][num - 1];

              return (
                <div
                  key={opt.id}
                  className={`relative overflow-hidden rounded-2xl border transition-all ${
                    isWinner
                      ? 'bg-[#121A30] border-emerald-400 ring-4 ring-emerald-400/30 shadow-2xl'
                      : 'bg-[#0B1020]/90 border-[#1E294B]'
                  }`}
                >
                  {/* Dynamic Animated Vote Fill */}
                  <div
                    className={`absolute inset-y-0 left-0 ${colors.bg} opacity-20 transition-all duration-500 ease-out`}
                    style={{ width: `${pct}%` }}
                  />

                  <div className="relative p-5 flex items-center justify-between gap-6">
                    <div className="flex items-center gap-5">
                      <div
                        className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-2xl border ${
                          isWinner
                            ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                            : 'bg-[#121A30] text-white ' + colors.border
                        }`}
                      >
                        {num}
                      </div>

                      <div>
                        <div className="text-xl font-bold text-white tracking-tight leading-snug">
                          {opt.text}
                        </div>
                        {isVotingClosed && (
                          <div
                            className={`text-sm font-semibold mt-1 ${
                              opt.isOptimal ? 'text-emerald-400' : 'text-rose-400'
                            }`}
                          >
                            [{opt.infectionEffectLabel}] {opt.oneSentenceExplanation}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Percentage & Vote Counter */}
                    <div className="text-right flex-shrink-0">
                      <div className="text-3xl font-black font-mono text-white tabular-nums">
                        {pct}%
                      </div>
                      <div className="text-xs font-mono text-slate-400 uppercase">
                        {votes} votes
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column (5 cols): Live Epidemic Curve Canvas */}
        <div className="col-span-5 flex flex-col justify-center">
          <div className="bg-[#0B1020]/90 border border-[#1E294B] rounded-2xl p-6 backdrop-blur-md shadow-2xl space-y-4">
            <EpidemicCurveCanvas
              scenarios={scenarios}
              currentScenarioIndex={currentScenarioIndex}
              outcomes={outcomes}
              isVotingClosedForCurrent={isVotingClosed}
              currentWinningOption={winningOption}
            />
          </div>
        </div>
      </div>

      {/* Bottom Ticker: Twitch Chat Voting Call to Action */}
      <div className="bg-[#0B1020]/95 border border-[#1E294B] backdrop-blur-md rounded-2xl px-8 py-4 flex items-center justify-between shadow-2xl">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 text-teal-400 font-bold text-lg font-mono">
            <span className="w-3 h-3 rounded-full bg-teal-400 animate-ping" />
            <span>TYPE 1, 2, OR 3 IN CHAT TO VOTE</span>
          </div>

          <div className="text-slate-400 text-sm">
            Twitch Channel: <span className="text-white font-mono font-bold">#{channelName || 'streamhealth'}</span>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono text-slate-400">
          <span>Total Votes: <strong className="text-white">{tally.total}</strong></span>
          <span>·</span>
          <span>1 vote per user (last vote counts)</span>
          <span>·</span>
          <span>{t.educationalDisclaimer}</span>
        </div>
      </div>
    </div>
  );
};
