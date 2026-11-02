import React from 'react';
import { Play, Lock, BookOpen, ArrowRight, Radio, Sparkles, Loader2, Pause, FastForward } from 'lucide-react';
import { Language, TRANSLATIONS } from '../data/translations';

interface StreamerControlPanelProps {
  currentScenarioNumber: number;
  totalScenarios: number;
  isVotingClosed: boolean;
  showExplanation: boolean;
  isLastScenario: boolean;
  timerSeconds: number;
  timerActive: boolean;
  isAiLoading?: boolean;
  hasAiExplanation?: boolean;
  autoAdvanceSeconds?: number | null;
  isAutoAdvancePaused?: boolean;
  onToggleAutoAdvancePause?: () => void;
  onStartRound: () => void;
  onCloseVoting: () => void;
  onToggleExplanation: () => void;
  onAiExplain: () => void;
  onNextScenario: () => void;
  language?: Language;
}

export const StreamerControlPanel: React.FC<StreamerControlPanelProps> = ({
  currentScenarioNumber,
  totalScenarios,
  isVotingClosed,
  showExplanation,
  isLastScenario,
  timerSeconds,
  timerActive,
  isAiLoading = false,
  hasAiExplanation = false,
  autoAdvanceSeconds = null,
  isAutoAdvancePaused = false,
  onToggleAutoAdvancePause,
  onStartRound,
  onCloseVoting,
  onToggleExplanation,
  onAiExplain,
  onNextScenario,
  language = 'en',
}) => {
  const t = TRANSLATIONS[language];

  return (
    <section
      aria-label="Streamer Control Panel"
      className="bg-[#121A30]/95 border border-[#1E294B] rounded-2xl p-4 sm:p-5 shadow-2xl backdrop-blur-md space-y-3"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#1E294B]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#2DD4BF]/10 border border-[#2DD4BF]/30 flex items-center justify-center text-[#2DD4BF]">
            <Radio className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white tracking-wide uppercase flex items-center gap-2">
              Streamer Host Control Panel
              <span className="text-[11px] font-mono font-normal text-slate-400 lowercase">
                · {t.scenarioNumber} {currentScenarioNumber}/{totalScenarios}
              </span>
            </h2>
          </div>
        </div>

        {/* Status Indicator & Auto-advance ticker */}
        <div className="flex items-center gap-3 text-xs">
          {autoAdvanceSeconds !== null && isVotingClosed && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 font-mono">
              <FastForward className="w-3.5 h-3.5" />
              <span>
                {t.autoAdvanceIn} {autoAdvanceSeconds}s
                {isAutoAdvancePaused && ` (${t.paused})`}
              </span>
              {onToggleAutoAdvancePause && (
                <button
                  onClick={onToggleAutoAdvancePause}
                  className="ml-1 text-[10px] underline hover:text-white cursor-pointer"
                >
                  {isAutoAdvancePaused ? 'Resume' : 'Pause'}
                </button>
              )}
            </div>
          )}

          <div className="flex items-center gap-1.5 font-bold">
            {!isVotingClosed ? (
              <span className="flex items-center gap-1.5 text-emerald-400 font-mono">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span>Voting Open ({timerSeconds}s)</span>
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-amber-400 font-mono">
                <Lock className="w-3.5 h-3.5" />
                <span>Decision Locked</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Broadcaster Host Controls Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 sm:gap-3">
        {/* 1. Start Round */}
        <button
          onClick={onStartRound}
          className={`flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all shadow-md cursor-pointer active:scale-95 ${
            !isVotingClosed && timerActive
              ? 'bg-emerald-600/80 text-white border border-emerald-400 ring-2 ring-emerald-500/30'
              : 'bg-[#2DD4BF] hover:bg-[#2DD4BF]/90 text-slate-950 shadow-[#2DD4BF]/20'
          }`}
          title="Start 30s countdown and open live voting"
        >
          <Play className="w-4 h-4 fill-current shrink-0" />
          <span className="whitespace-nowrap">{t.startRound}</span>
        </button>

        {/* 2. Close Voting */}
        <button
          onClick={onCloseVoting}
          disabled={isVotingClosed}
          className={`flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all shadow-md ${
            isVotingClosed
              ? 'bg-[#0B1020] border border-slate-800 text-slate-600 cursor-not-allowed'
              : 'bg-[#F59E0B] hover:bg-[#F59E0B]/90 text-slate-950 shadow-amber-500/20 cursor-pointer active:scale-95'
          }`}
          title="Lock voting and trigger the epidemic curve bend"
        >
          <Lock className="w-4 h-4 shrink-0" />
          <span className="whitespace-nowrap">{t.closeVoting}</span>
        </button>

        {/* 3. AI Explain Button */}
        <button
          onClick={onAiExplain}
          disabled={isAiLoading}
          className={`flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all shadow-md border cursor-pointer active:scale-95 ${
            hasAiExplanation
              ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-cyan-500/25'
              : 'bg-cyan-950/80 hover:bg-cyan-900 text-cyan-200 border-cyan-600/60 shadow-cyan-950/30'
          }`}
          title="Call Gemini for a 3-sentence, grade-6 explanation"
        >
          {isAiLoading ? (
            <Loader2 className="w-4 h-4 animate-spin text-cyan-400 shrink-0" />
          ) : (
            <Sparkles className="w-4 h-4 text-cyan-300 shrink-0" />
          )}
          <span className="whitespace-nowrap">
            {isAiLoading ? 'Asking Gemini...' : 'AI Explain'}
          </span>
        </button>

        {/* 4. Show Explanation */}
        <button
          onClick={onToggleExplanation}
          className={`flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all border shadow-md cursor-pointer active:scale-95 ${
            showExplanation
              ? 'bg-slate-800 text-white border-slate-600'
              : 'bg-[#0B1020] hover:bg-slate-800 text-slate-300 border-[#1E294B]'
          }`}
          title="Toggle visibility of the explanation and field debrief"
        >
          <BookOpen className="w-4 h-4 shrink-0" />
          <span className="whitespace-nowrap">
            {showExplanation ? t.hideExplanation : t.showExplanation}
          </span>
        </button>

        {/* 5. Next Scenario */}
        <button
          onClick={onNextScenario}
          className="col-span-2 sm:col-span-1 flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl font-bold text-xs sm:text-sm bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 hover:border-slate-600 transition-all shadow-md cursor-pointer active:scale-95"
          title={isLastScenario ? 'Proceed to final mission debrief' : 'Advance to next outbreak scenario'}
        >
          <span className="whitespace-nowrap">
            {isLastScenario ? 'Outbreak Report' : t.nextScenario}
          </span>
          <ArrowRight className="w-4 h-4 shrink-0" />
        </button>
      </div>
    </section>
  );
};
