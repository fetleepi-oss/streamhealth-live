import React, { useState } from 'react';
import { Scenario, QuizOption } from '../data/scenarios';
import {
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  BookOpen,
  ShieldAlert,
  Trophy,
  TrendingDown,
  TrendingUp,
  Activity,
  Sparkles,
  Loader2,
  Lock,
} from 'lucide-react';
import { VoteTally, VoteOption } from '../voting';
import { EpidemicCurveCanvas, ScenarioOutcome } from './EpidemicCurveCanvas';

import { Language, TRANSLATIONS } from '../data/translations';

interface ScenarioCardProps {
  scenario: Scenario;
  allScenarios: Scenario[];
  currentScenarioIndex: number;
  outcomes: Record<string, ScenarioOutcome>;
  selectedOptionId: 'A' | 'B' | 'C' | null;
  onSelectOption: (optionId: 'A' | 'B' | 'C') => void;
  isVotingClosed: boolean;
  onCloseVoting: () => void;
  winningOption: QuizOption | null;
  showExplanation: boolean;
  onAiExplain?: () => void;
  aiState?: { loading: boolean; text: string | null; error: boolean };
  onNext: () => void;
  onPrevious: () => void;
  isLastScenario: boolean;
  isFirstScenario: boolean;
  fontSizeMode: 'standard' | 'large' | 'massive';
  pollTally?: VoteTally;
  language?: Language;
}

const OPTION_TO_NUM: Record<'A' | 'B' | 'C', VoteOption> = {
  A: 1,
  B: 2,
  C: 3,
};

export const ScenarioCard: React.FC<ScenarioCardProps> = ({
  scenario,
  allScenarios,
  currentScenarioIndex,
  outcomes,
  selectedOptionId,
  onSelectOption,
  isVotingClosed,
  onCloseVoting,
  winningOption,
  showExplanation,
  onAiExplain,
  aiState,
  onNext,
  onPrevious,
  isLastScenario,
  isFirstScenario,
  fontSizeMode,
  pollTally,
  language = 'en',
}) => {
  const t = TRANSLATIONS[language];
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const totalVotes = pollTally ? pollTally.total : 0;

  // Typography scale classes according to broadcast mode
  const titleClass =
    fontSizeMode === 'massive'
      ? 'text-3xl sm:text-5xl font-black leading-tight'
      : fontSizeMode === 'large'
      ? 'text-2xl sm:text-4xl font-extrabold leading-tight'
      : 'text-2xl sm:text-3xl font-extrabold leading-snug';

  const narrativeClass =
    fontSizeMode === 'massive'
      ? 'text-xl sm:text-2xl leading-relaxed text-slate-100 font-normal'
      : fontSizeMode === 'large'
      ? 'text-lg sm:text-xl leading-relaxed text-slate-200 font-normal'
      : 'text-base sm:text-lg leading-relaxed text-slate-300 font-normal';

  const optionTextClass =
    fontSizeMode === 'massive'
      ? 'text-lg sm:text-xl font-medium'
      : fontSizeMode === 'large'
      ? 'text-base sm:text-lg font-medium'
      : 'text-sm sm:text-base font-medium';

  return (
    <article className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
      {/* Top Banner Image with Scrim */}
      <div className="relative w-full h-52 sm:h-64 md:h-72 bg-slate-950 overflow-hidden border-b border-slate-800">
        {!imageError ? (
          <img
            src={scenario.image}
            alt={scenario.title}
            referrerPolicy="no-referrer"
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageError(true)}
            className={`w-full h-full object-cover transition-opacity duration-700 ${
              imageLoaded ? 'opacity-90' : 'opacity-0'
            }`}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900 text-slate-400 p-6 text-center">
            <ShieldAlert className="w-12 h-12 text-slate-500 mb-2" />
            <span className="font-semibold">{scenario.title}</span>
            <span className="text-xs text-slate-500 mt-1">{scenario.pathogen}</span>
          </div>
        )}

        {/* Cinematic gradient scrim ensuring high contrast text read */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent" />

        {/* Clean unboxed metadata overlay complying with zero-pill rule */}
        <div className="absolute bottom-4 left-4 right-4 sm:left-6 sm:right-6">
          <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm font-medium text-emerald-400 mb-2">
            <span>Scenario {scenario.number} of 3</span>
            <span aria-hidden="true">·</span>
            <span>{scenario.category}</span>
            <span aria-hidden="true">·</span>
            <span className="italic">{scenario.pathogen}</span>
          </div>
          <h1 className={`${titleClass} text-white tracking-tight`}>
            {scenario.title}
          </h1>
        </div>
      </div>

      <div className="p-5 sm:p-8 space-y-6">
        {/* Scenario Setting and Narrative */}
        <div className="space-y-3">
          <div className="text-xs uppercase tracking-wider text-slate-400 font-semibold">
            Field Setting: {scenario.setting}
          </div>
          <p className={narrativeClass}>
            {scenario.narrative}
          </p>
        </div>

        {/* Decision Prompt & 3 Response Options with Infection Count Effects */}
        <div className="pt-2 border-t border-slate-800/80">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm sm:text-base font-bold text-white tracking-wide uppercase">
              Incident Commander Response Options:
            </h2>
            <span className="text-xs text-slate-400">
              Keys: <kbd className="px-1.5 py-0.5 bg-slate-800 rounded font-mono text-slate-300">1</kbd> (A),{' '}
              <kbd className="px-1.5 py-0.5 bg-slate-800 rounded font-mono text-slate-300">2</kbd> (B),{' '}
              <kbd className="px-1.5 py-0.5 bg-slate-800 rounded font-mono text-slate-300">3</kbd> (C)
            </span>
          </div>

          {/* 3 Response Options */}
          <div className="grid grid-cols-1 gap-3.5 sm:gap-4">
            {scenario.options.map((option) => {
              const optionNum = OPTION_TO_NUM[option.id];
              const isSelected = selectedOptionId === option.id;
              const isWinner = isVotingClosed && winningOption?.id === option.id;
              const voteCount = pollTally ? pollTally.counts[optionNum] : 0;
              const pollPct = pollTally ? pollTally.percentages[optionNum] : 0;
              const isPositiveImpact = option.infectionEffect < 0; // Negative cases = reduction/positive impact

              let cardBorder = 'border-slate-800 hover:border-slate-700 bg-slate-950/60';
              let badgeColor = 'bg-slate-800 text-slate-300 border-slate-700';

              if (isWinner) {
                cardBorder = 'border-emerald-500 bg-emerald-950/25 ring-2 ring-emerald-500/50 shadow-xl';
                badgeColor = 'bg-emerald-500 text-slate-950 font-bold border-emerald-400';
              } else if (isVotingClosed) {
                cardBorder = 'border-slate-800/60 opacity-65 bg-slate-950/40';
                badgeColor = 'bg-slate-800 text-slate-400 border-slate-700';
              } else if (isSelected) {
                cardBorder = 'border-cyan-500 bg-cyan-950/20 ring-1 ring-cyan-500';
                badgeColor = 'bg-cyan-500 text-slate-950 font-bold border-cyan-400';
              }

              return (
                <div
                  key={option.id}
                  onClick={() => !isVotingClosed && onSelectOption(option.id)}
                  className={`relative p-4 sm:p-5 rounded-xl border transition-all duration-200 cursor-pointer ${cardBorder} ${
                    !isVotingClosed ? 'hover:translate-x-1' : ''
                  }`}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (!isVotingClosed && (e.key === 'Enter' || e.key === ' ')) {
                      onSelectOption(option.id);
                    }
                  }}
                >
                  <div className="flex items-start gap-3 sm:gap-4">
                    <div className="flex flex-col items-center gap-1 shrink-0">
                      <span
                        className={`w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center font-mono font-bold text-base sm:text-lg border transition-colors ${badgeColor}`}
                      >
                        {optionNum}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400 font-semibold uppercase">
                        [{option.id}]
                      </span>
                    </div>

                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
                        <p className={`${optionTextClass} text-slate-100 break-words leading-relaxed`}>
                          {option.text}
                        </p>

                        {/* Infection Count Effect Badge - Hidden until voting closes */}
                        {isVotingClosed ? (
                          <div
                            className={`shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-mono font-bold self-start animate-in fade-in duration-300 ${
                              isPositiveImpact
                                ? 'bg-emerald-950/70 border border-emerald-500/40 text-emerald-300'
                                : 'bg-rose-950/70 border border-rose-500/40 text-rose-300'
                            }`}
                          >
                            {isPositiveImpact ? (
                              <TrendingDown className="w-3.5 h-3.5" />
                            ) : (
                              <TrendingUp className="w-3.5 h-3.5" />
                            )}
                            <span>{option.infectionEffectLabel} Infections</span>
                          </div>
                        ) : (
                          <div
                            className="shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-mono font-medium self-start bg-slate-900/80 border border-slate-700/50 text-slate-400 select-none"
                            title="Outcome impact hidden until voting closes"
                          >
                            <Lock className="w-3 h-3 text-slate-500" />
                            <span>Impact Hidden</span>
                          </div>
                        )}
                      </div>

                      {/* One-sentence explanation - Hidden until voting closes */}
                      {isVotingClosed && (
                        <p className="text-xs sm:text-sm text-slate-300/90 leading-relaxed bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/80 animate-in fade-in duration-300">
                          <strong className="text-slate-200 font-semibold">Epidemiological Impact: </strong>
                          {option.oneSentenceExplanation}
                        </p>
                      )}

                      {/* Animated Vote Bar for this option */}
                      {totalVotes > 0 && (
                        <div className="pt-2 border-t border-slate-800/60 space-y-1.5">
                          <div className="flex items-center justify-between text-xs gap-2">
                            <span className="text-slate-400 whitespace-nowrap">
                              Audience Vote: <strong className="font-mono text-cyan-300 tabular-nums">{pollPct}%</strong>
                            </span>
                            <span className="text-slate-400 font-mono text-[11px] tabular-nums whitespace-nowrap shrink-0">
                              {voteCount} {voteCount === 1 ? 'vote' : 'votes'}
                            </span>
                          </div>
                          <div className="w-full bg-slate-900 border border-slate-800/80 rounded-full h-2 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ease-out ${
                                isWinner ? 'bg-emerald-400' : 'bg-cyan-500'
                              }`}
                              style={{ width: `${pollPct}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Close Voting / Lock In Decision Button (before voting closed) */}
        {!isVotingClosed && (
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <button
                onClick={onPrevious}
                disabled={isFirstScenario}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                  isFirstScenario
                    ? 'border-slate-800 text-slate-600 cursor-not-allowed'
                    : 'border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Previous</span>
              </button>
            </div>

            <button
              onClick={onCloseVoting}
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl font-bold text-sm tracking-wide transition-all shadow-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20 active:scale-98 cursor-pointer"
            >
              Close Voting & Bend Epidemic Curve
            </button>
          </div>
        )}

        {/* Revealed Outcome Section: Winning Option, Explanation, and Canvas Epidemic Curve */}
        {isVotingClosed && winningOption && (
          <div className="pt-4 space-y-6 animate-in fade-in duration-300">
            {/* Winning Option Banner */}
            <div
              className={`p-5 sm:p-6 rounded-xl border ${
                winningOption.infectionEffect < 0
                  ? 'bg-emerald-950/30 border-emerald-500/50'
                  : 'bg-rose-950/30 border-rose-500/50'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                    <Trophy className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Winning Livestream Decision
                    </span>
                    <h3 className="text-lg font-bold text-white">
                      Option {winningOption.optionNumber} ({winningOption.id}) — {winningOption.verdict}
                    </h3>
                  </div>
                </div>

                {/* Effect Badge */}
                <div
                  className={`px-3 py-1.5 rounded-lg border flex items-center gap-2 self-start sm:self-auto font-mono text-sm font-bold ${
                    winningOption.infectionEffect < 0
                      ? 'bg-emerald-900/60 border-emerald-400 text-emerald-300'
                      : 'bg-rose-900/60 border-rose-400 text-rose-300'
                  }`}
                >
                  {winningOption.infectionEffect < 0 ? (
                    <TrendingDown className="w-4 h-4" />
                  ) : (
                    <TrendingUp className="w-4 h-4" />
                  )}
                  <span>Infection Trajectory: {winningOption.infectionEffectLabel}</span>
                </div>
              </div>

              {/* Highlighted Explanation (AI Grade-6 or Prewritten Fallback) */}
              {showExplanation ? (
                <div className="mt-3 p-4 sm:p-5 bg-slate-950/80 border border-slate-800 rounded-lg space-y-2.5 animate-in fade-in duration-200">
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-1 border-b border-slate-800/60">
                    <div className="flex items-center gap-2 text-xs uppercase tracking-wider font-semibold text-slate-400">
                      {aiState?.text ? (
                        <>
                          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                          <span className="text-cyan-300 font-bold">Gemini Grade-6 Explanation (3 Sentences):</span>
                        </>
                      ) : (
                        <span>Winning Intervention Explanation:</span>
                      )}
                    </div>

                    {onAiExplain && (
                      <button
                        onClick={onAiExplain}
                        disabled={aiState?.loading}
                        className="flex items-center gap-1.5 px-3 py-1 text-xs font-bold text-cyan-200 bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-700/60 rounded-lg transition-all cursor-pointer shadow-sm active:scale-95 disabled:cursor-not-allowed"
                        title="Calls Gemini to write a 3-sentence, grade-6 explanation"
                      >
                        {aiState?.loading ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                        ) : (
                          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                        )}
                        <span>{aiState?.loading ? 'Asking Gemini...' : 'AI Explain'}</span>
                      </button>
                    )}
                  </div>

                  {aiState?.loading ? (
                    <div className="p-3 bg-slate-900/50 rounded-lg border border-slate-800/80 space-y-2 animate-pulse">
                      <div className="flex items-center gap-2 text-xs text-cyan-400 font-medium">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Calling Gemini to write a 3-sentence, grade-6 explanation...</span>
                      </div>
                      <div className="h-2.5 bg-slate-800 rounded w-full" />
                      <div className="h-2.5 bg-slate-800 rounded w-5/6" />
                      <div className="h-2.5 bg-slate-800 rounded w-4/6" />
                    </div>
                  ) : aiState?.text ? (
                    <div className="space-y-2">
                      <p className="text-sm sm:text-base font-medium text-slate-100 leading-relaxed bg-cyan-950/20 p-3 rounded-lg border border-cyan-500/30">
                        {aiState.text}
                      </p>
                      <div className="text-[11px] text-slate-400 flex items-center justify-between">
                        <span className="italic text-cyan-300/80">Grade-6 Reading Level · Generated by Gemini 3.8 Flash</span>
                        <span className="text-slate-500">Standard summary: "{winningOption.oneSentenceExplanation}"</span>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <p className="text-sm sm:text-base font-medium text-slate-100 leading-relaxed">
                        "{winningOption.oneSentenceExplanation}"
                      </p>
                      {aiState?.error && (
                        <div className="text-[11px] text-amber-400/90 italic">
                          (Showing prewritten explanation — Gemini call failed or unavailable)
                        </div>
                      )}
                    </div>
                  )}

                  <div className="text-xs text-slate-400 pt-1 border-t border-slate-800/60">
                    <strong>Epidemic Consequence:</strong> {winningOption.consequence}
                  </div>
                </div>
              ) : (
                <div className="mt-3 p-3 bg-slate-950/60 border border-slate-800/80 rounded-lg flex items-center justify-between text-xs text-slate-400">
                  <span>Epidemiological explanation is hidden.</span>
                  <span className="font-semibold text-cyan-400">Click "Show Explanation" or "AI Explain" to reveal</span>
                </div>
              )}
            </div>

            {/* Canvas Epidemic Curve Line Chart */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-bold text-white">
                <Activity className="w-4 h-4 text-cyan-400" />
                <span>Outbreak Epi-Curve Response (Bends to Option {winningOption.optionNumber})</span>
              </div>
              <EpidemicCurveCanvas
                scenarios={allScenarios}
                currentScenarioIndex={currentScenarioIndex}
                outcomes={outcomes}
                isVotingClosedForCurrent={isVotingClosed}
                currentWinningOption={winningOption}
              />
            </div>

            {/* Epidemiological Field Debrief Box */}
            {showExplanation && (
              <div className="p-5 bg-slate-950 border border-slate-800 rounded-xl space-y-4 animate-in fade-in duration-200">
                <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-800">
                  <div className="flex items-center gap-2 text-cyan-400 text-sm font-bold">
                    <BookOpen className="w-4 h-4" />
                    <span>Field Epidemiological Debrief & Reference</span>
                  </div>
                  <div className="px-2.5 py-1 rounded bg-[#121A30] border border-cyan-500/30 text-cyan-300 font-mono text-[11px] font-semibold">
                    {t.sourcesTag}
                  </div>
                </div>

                {/* What Real Health Workers Do Callout */}
                <div className="p-3.5 bg-emerald-950/25 border border-emerald-500/30 rounded-xl space-y-1.5">
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wide">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{t.realHealthWorkers}:</span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                    {scenario.fieldTakeaway}
                  </p>
                </div>

                <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                  {winningOption.epidemiologyDebrief}
                </p>

                <div className="pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-400 gap-2">
                  <span className="font-medium text-slate-300">
                    Clinical Consequence: {winningOption.consequence}
                  </span>
                  <span className="text-cyan-400/90 font-mono text-[11px] shrink-0 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                    Sources: WHO / CDC ({scenario.whoReference})
                  </span>
                </div>
              </div>
            )}

            {/* Navigation to next scenario or final report */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
              <button
                onClick={onPrevious}
                disabled={isFirstScenario}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                  isFirstScenario
                    ? 'border-slate-800 text-slate-600 cursor-not-allowed'
                    : 'border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Previous Scenario</span>
              </button>

              <button
                onClick={onNext}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-sm transition-all shadow-lg shadow-emerald-500/20 active:scale-98 cursor-pointer"
              >
                <span>
                  {isLastScenario
                    ? 'View Final Outbreak Report'
                    : 'Carry Curve to Next Outbreak Scenario'}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </article>
  );
};
