import React from 'react';
import { Scenario } from '../data/scenarios';
import { Award, CheckCircle2, AlertTriangle, RotateCcw, ArrowRight, TrendingDown, TrendingUp, Activity } from 'lucide-react';
import { EpidemicCurveCanvas, ScenarioOutcome } from './EpidemicCurveCanvas';

interface SummaryCardProps {
  scenarios: Scenario[];
  outcomes: Record<string, ScenarioOutcome>;
  userAnswers: Record<string, 'A' | 'B' | 'C'>;
  onRestart: () => void;
  onJumpToScenario: (index: number) => void;
  fontSizeMode: 'standard' | 'large' | 'massive';
}

export const SummaryCard: React.FC<SummaryCardProps> = ({
  scenarios,
  outcomes,
  userAnswers,
  onRestart,
  onJumpToScenario,
  fontSizeMode,
}) => {
  // Calculate score based on winning options
  let optimalInterventions = 0;
  let cumulativeReductionPct = 0;

  scenarios.forEach((s) => {
    const outcome = outcomes[s.id];
    const winning = outcome?.winningOption || s.options.find((o) => o.id === userAnswers[s.id]);
    if (winning?.isOptimal) {
      optimalInterventions += 1;
    }
    if (winning) {
      cumulativeReductionPct += winning.infectionEffect;
    }
  });

  const getRank = (score: number) => {
    if (score === 3) {
      return {
        title: 'Chief Outbreak Incident Commander',
        description: 'Flawless evidence-based interventions! The community transmission chains were decisively crushed across all 3 scenarios.',
        badgeColor: 'text-emerald-400 bg-emerald-950/60 border-emerald-500/40',
      };
    } else if (score === 2) {
      return {
        title: 'Senior Field Epidemiologist',
        description: 'Strong clinical intuition with minor containment lapses in secondary transmission.',
        badgeColor: 'text-cyan-400 bg-cyan-950/60 border-cyan-500/40',
      };
    } else {
      return {
        title: 'Outbreak Response Officer',
        description: 'Suboptimal interventions allowed pathogen reservoirs to persist. Review the WHO debrief protocols below.',
        badgeColor: 'text-amber-400 bg-amber-950/60 border-amber-500/40',
      };
    }
  };

  const rank = getRank(optimalInterventions);

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl p-6 sm:p-10 space-y-8">
      {/* Header Evaluation Banner */}
      <div className="text-center space-y-4 max-w-2xl mx-auto">
        <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400">
          <Award className="w-8 h-8" />
        </div>

        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
            Outbreak Debrief Summary
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            StreamHealth Live Mission Debrief
          </h1>
        </div>

        {/* Score & Cumulative Infection Impact display */}
        <div className="flex flex-wrap items-center justify-center gap-3">
          <div className="py-3 px-5 bg-slate-950 border border-slate-800 rounded-xl flex items-center gap-3">
            <span className="text-3xl sm:text-4xl font-mono font-black text-emerald-400 tabular-nums">
              {optimalInterventions}
            </span>
            <span className="text-xl text-slate-500 font-mono">/</span>
            <span className="text-2xl sm:text-3xl font-mono font-bold text-slate-400 tabular-nums">
              {scenarios.length}
            </span>
            <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold ml-1">
              Optimal Interventions
            </span>
          </div>

          <div
            className={`py-3 px-5 rounded-xl border flex items-center gap-2 font-mono ${
              cumulativeReductionPct <= 0
                ? 'bg-emerald-950/50 border-emerald-500/40 text-emerald-300'
                : 'bg-rose-950/50 border-rose-500/40 text-rose-300'
            }`}
          >
            {cumulativeReductionPct <= 0 ? (
              <TrendingDown className="w-5 h-5" />
            ) : (
              <TrendingUp className="w-5 h-5" />
            )}
            <span className="text-2xl font-black tabular-nums">
              {cumulativeReductionPct > 0 ? `+${cumulativeReductionPct}%` : `${cumulativeReductionPct}%`}
            </span>
            <span className="text-xs font-sans font-medium">
              Net Caseload Delta
            </span>
          </div>
        </div>

        <div className={`p-4 rounded-xl border ${rank.badgeColor} text-left sm:text-center`}>
          <div className="font-bold text-lg text-white mb-1">{rank.title}</div>
          <p className="text-sm text-slate-300">{rank.description}</p>
        </div>
      </div>

      {/* Complete 30-Day Multi-Scenario Epidemic Curve Canvas */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center gap-2 text-base font-bold text-white">
          <Activity className="w-5 h-5 text-cyan-400" />
          <span>Full Multi-Scenario Epidemic Curve (30-Day Trajectory)</span>
        </div>
        <EpidemicCurveCanvas
          scenarios={scenarios}
          currentScenarioIndex={scenarios.length - 1}
          outcomes={outcomes}
          isVotingClosedForCurrent={true}
          currentWinningOption={outcomes[scenarios[scenarios.length - 1].id]?.winningOption}
        />
      </div>

      {/* Breakdown per scenario */}
      <div className="space-y-4 pt-4 border-t border-slate-800">
        <h2 className="text-lg font-bold text-white tracking-wide">
          Epidemiological Intervention Log
        </h2>

        <div className="grid grid-cols-1 gap-4">
          {scenarios.map((scenario, idx) => {
            const outcome = outcomes[scenario.id];
            const winningOption =
              outcome?.winningOption ||
              scenario.options.find((o) => o.id === userAnswers[scenario.id]) ||
              scenario.options[0];
            const isOptimal = winningOption.isOptimal;

            return (
              <div
                key={scenario.id}
                className="bg-slate-950 border border-slate-800 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <span className="font-semibold text-slate-300">Scenario {idx + 1}</span>
                    <span aria-hidden="true">·</span>
                    <span>{scenario.category}</span>
                    <span aria-hidden="true">·</span>
                    <span className="italic">{scenario.pathogen}</span>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <h3 className="text-base sm:text-lg font-bold text-white">
                      {scenario.title}
                    </h3>

                    {/* Effect Badge */}
                    <div
                      className={`shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono font-bold self-start ${
                        winningOption.infectionEffect < 0
                          ? 'bg-emerald-950/70 border border-emerald-500/40 text-emerald-300'
                          : 'bg-rose-950/70 border border-rose-500/40 text-rose-300'
                      }`}
                    >
                      {winningOption.infectionEffect < 0 ? (
                        <TrendingDown className="w-3.5 h-3.5" />
                      ) : (
                        <TrendingUp className="w-3.5 h-3.5" />
                      )}
                      <span>{winningOption.infectionEffectLabel} Infections</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 pt-1">
                    {isOptimal ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                    )}
                    <div className="text-sm text-slate-300 space-y-1">
                      <div>
                        <span className="font-semibold text-white">
                          Winning Decision (Option {winningOption.optionNumber} - {winningOption.id}):{' '}
                        </span>
                        {winningOption.text}
                      </div>

                      <div className="text-xs text-slate-400 italic bg-slate-900/60 p-2 rounded border border-slate-800">
                        "{winningOption.oneSentenceExplanation}"
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                  <button
                    onClick={() => onJumpToScenario(idx)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg transition-colors cursor-pointer"
                  >
                    <span>Inspect</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Restart CTA */}
      <div className="pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-center gap-4">
        <button
          onClick={onRestart}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-sm transition-all shadow-lg shadow-emerald-500/20 active:scale-98 cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Start New Outbreak Run</span>
        </button>
      </div>
    </div>
  );
};
