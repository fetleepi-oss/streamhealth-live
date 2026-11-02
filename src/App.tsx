import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { SCENARIOS } from './data/scenarios';
import { TRANSLATIONS } from './data/translations';
import { Header } from './components/Header';
import { StreamerControlPanel } from './components/StreamerControlPanel';
import { AudiencePollBar } from './components/AudiencePollBar';
import { ScenarioCard } from './components/ScenarioCard';
import { SummaryCard } from './components/SummaryCard';
import { FieldProtocolGuide } from './components/FieldProtocolGuide';
import { ParticipationLeaderboard } from './components/ParticipationLeaderboard';
import { ConfettiCanvas } from './components/ConfettiCanvas';
import { ObsOverlayView } from './components/ObsOverlayView';
import { ErrorBoundary } from './components/ErrorBoundary';
import { SelfTestModal } from './components/SelfTestModal';
import { useGameEngine } from './hooks/useGameEngine';
import { VoteOption } from './engine/types';

function StreamHealthApp() {
  const {
    engineState,
    currentScenario,
    currentScenarioIndex,
    totalScenarios,
    isCurrentVotingClosed,
    currentWinningOption,
    currentOutcome,
    twitchStatus,
    latestVote,
    topLeaderboard,
    aiState,
    showConfetti,
    autoAdvanceSeconds,
    isAutoAdvancePaused,
    setIsAutoAdvancePaused,
    sounds,
    language,
    setLanguage,
    actions,
  } = useGameEngine();

  // Selected option for current scenario by streamer or local fallback
  const [localSelectedOption, setLocalSelectedOption] = useState<'A' | 'B' | 'C' | null>(null);

  // Reset selected option when switching scenarios
  useEffect(() => {
    setLocalSelectedOption(null);
  }, [currentScenarioIndex]);

  // Overlay mode state: check URL param ?overlay=1 or user toggle
  const [isOverlayMode, setIsOverlayMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('overlay') === '1';
    }
    return false;
  });

  const toggleOverlayMode = useCallback(() => {
    setIsOverlayMode((prev) => {
      const next = !prev;
      if (typeof window !== 'undefined') {
        const url = new URL(window.location.href);
        if (next) {
          url.searchParams.set('overlay', '1');
        } else {
          url.searchParams.delete('overlay');
        }
        window.history.replaceState({}, '', url.toString());
      }
      return next;
    });
  }, []);

  // UI display modes
  const [fontSizeMode, setFontSizeMode] = useState<'standard' | 'large' | 'massive'>('large');
  const [showPollPanel, setShowPollPanel] = useState(true);
  const [showFieldGuide, setShowFieldGuide] = useState(false);
  const [showSelfTest, setShowSelfTest] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('test') === '1';
    }
    return false;
  });
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Fullscreen helper
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
        setIsFullscreen(false);
      }
    }
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      const key = e.key.toLowerCase();

      if (key === 'a' || key === '1') {
        if (!isCurrentVotingClosed) {
          setLocalSelectedOption('A');
          actions.castVote('streamer_host', 1);
        }
      } else if (key === 'b' || key === '2') {
        if (!isCurrentVotingClosed) {
          setLocalSelectedOption('B');
          actions.castVote('streamer_host', 2);
        }
      } else if (key === 'c' || key === '3') {
        if (!isCurrentVotingClosed) {
          setLocalSelectedOption('C');
          actions.castVote('streamer_host', 3);
        }
      } else if (e.key === ' ' || e.key === 'Enter') {
        if (engineState.phase !== 'completed') {
          e.preventDefault();
          if (!isCurrentVotingClosed) {
            actions.closeVoting();
          } else {
            actions.nextScenario();
          }
        }
      } else if (key === 'n' || e.key === 'ArrowRight') {
        if (currentScenarioIndex < totalScenarios - 1) {
          actions.nextScenario();
        }
      } else if (e.key === 'ArrowLeft') {
        if (currentScenarioIndex > 0) {
          actions.previousScenario();
        }
      } else if (key === 'f') {
        toggleFullscreen();
      } else if (key === 'm') {
        sounds.toggleMute();
      } else if (key === 'o') {
        toggleOverlayMode();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    isCurrentVotingClosed,
    engineState.phase,
    currentScenarioIndex,
    totalScenarios,
    actions,
    sounds,
    toggleFullscreen,
    toggleOverlayMode,
  ]);

  // Convert scenario outcomes for EpidemicCurveCanvas
  const canvasOutcomes = useMemo(() => {
    const res: Record<string, { scenarioId: string; winningOption: any; votes: any; totalVotes: number }> = {};
    for (const [id, outcome] of Object.entries(engineState.outcomes)) {
      const scen = SCENARIOS.find((s) => s.id === id);
      const opt = scen?.options.find((o) => o.optionNumber === outcome.winningOptionNumber) || scen?.options[0];
      if (opt) {
        res[id] = {
          scenarioId: id,
          winningOption: opt,
          votes: outcome.votes,
          totalVotes: outcome.totalVotes,
        };
      }
    }
    return res;
  }, [engineState.outcomes]);

  const t = TRANSLATIONS[language];

  // OBS Overlay Mode: Transparent 1920x1080 canvas without host controls
  if (isOverlayMode) {
    return (
      <div className="w-full h-full min-h-screen bg-transparent">
        <ObsOverlayView
          scenario={currentScenario}
          currentScenarioIndex={currentScenarioIndex}
          totalScenarios={totalScenarios}
          tally={engineState.tally}
          isVotingClosed={isCurrentVotingClosed}
          winningOption={currentWinningOption}
          timerSeconds={engineState.timerSeconds}
          timerActive={engineState.phase === 'voting'}
          metrics={engineState.metrics}
          outcomes={canvasOutcomes}
          scenarios={SCENARIOS}
          channelName={twitchStatus.channel}
          language={language}
        />
        {/* Quick exit overlay helper tooltip on bottom right */}
        <button
          onClick={toggleOverlayMode}
          className="fixed bottom-3 right-3 bg-black/70 hover:bg-black text-slate-400 hover:text-white text-[11px] font-mono px-3 py-1.5 rounded-lg border border-slate-700/80 cursor-pointer shadow-lg z-50 backdrop-blur-sm"
          title="Exit OBS Overlay Mode"
        >
          Exit Overlay Mode (Press O)
        </button>
      </div>
    );
  }

  // Option labels for audience poll bar (hide outcome effects until voting is closed to avoid spoiling)
  const optionLabels: { 1: string; 2: string; 3: string } = {
    1: isCurrentVotingClosed
      ? `[${currentScenario.options[0]?.infectionEffectLabel}] ${currentScenario.options[0]?.text || 'Option 1'}`
      : (currentScenario.options[0]?.text || 'Option 1'),
    2: isCurrentVotingClosed
      ? `[${currentScenario.options[1]?.infectionEffectLabel}] ${currentScenario.options[1]?.text || 'Option 2'}`
      : (currentScenario.options[1]?.text || 'Option 2'),
    3: isCurrentVotingClosed
      ? `[${currentScenario.options[2]?.infectionEffectLabel}] ${currentScenario.options[2]?.text || 'Option 3'}`
      : (currentScenario.options[2]?.text || 'Option 3'),
  };

  const isCompleted = engineState.phase === 'completed';

  return (
    <div className="min-h-screen bg-[#0B1020] text-slate-100 flex flex-col selection:bg-[#2DD4BF] selection:text-slate-950 font-sans">
      {/* Confetti celebration for optimal outbreak decisions */}
      <ConfettiCanvas trigger={showConfetti} />

      {/* Broadcast Header Bar */}
      <Header
        currentScenarioIndex={currentScenarioIndex}
        totalScenarios={totalScenarios}
        fontSizeMode={fontSizeMode}
        setFontSizeMode={setFontSizeMode}
        showPollPanel={showPollPanel}
        setShowPollPanel={setShowPollPanel}
        showFieldGuide={showFieldGuide}
        setShowFieldGuide={setShowFieldGuide}
        onReset={actions.resetSimulation}
        onOpenSelfTest={() => setShowSelfTest(true)}
        isFullscreen={isFullscreen}
        toggleFullscreen={toggleFullscreen}
        twitchStatus={{
          channel: twitchStatus.channel,
          connected: twitchStatus.status === 'live',
        }}
        language={language}
        setLanguage={setLanguage}
        isMuted={sounds.isMuted}
        toggleMute={sounds.toggleMute}
        isOverlayMode={isOverlayMode}
        toggleOverlayMode={toggleOverlayMode}
      />

      {/* Main Broadcast Stage Container */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Streamer Host Control Panel */}
        {!isCompleted && (
          <StreamerControlPanel
            currentScenarioNumber={currentScenarioIndex + 1}
            totalScenarios={totalScenarios}
            isVotingClosed={isCurrentVotingClosed}
            showExplanation={engineState.phase === 'explanation'}
            isLastScenario={currentScenarioIndex === totalScenarios - 1}
            timerSeconds={engineState.timerSeconds}
            timerActive={engineState.phase === 'voting'}
            isAiLoading={aiState?.loading}
            hasAiExplanation={!!aiState?.text}
            autoAdvanceSeconds={autoAdvanceSeconds}
            isAutoAdvancePaused={isAutoAdvancePaused}
            onToggleAutoAdvancePause={() => setIsAutoAdvancePaused((prev) => !prev)}
            onStartRound={actions.startRound}
            onCloseVoting={actions.closeVoting}
            onToggleExplanation={actions.toggleExplanation}
            onAiExplain={actions.aiExplain}
            onNextScenario={actions.nextScenario}
            language={language}
          />
        )}

        {/* Outbreak Scenario Stepper Tabs (Zero-Pill styling) */}
        {!isCompleted && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-3 bg-[#121A30] border border-[#1E294B] rounded-xl">
            <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
              {SCENARIOS.map((s, idx) => {
                const isActive = idx === currentScenarioIndex;
                const isOutcomeLocked = !!engineState.outcomes[s.id];
                const isOptimal = engineState.outcomes[s.id]?.isOptimal;

                return (
                  <button
                    key={s.id}
                    onClick={() => {
                      if (idx > currentScenarioIndex && !engineState.outcomes[currentScenario.id]) {
                        return; // Prevent skipping ahead without resolving current
                      }
                      // Inspect scenario
                    }}
                    className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                      isActive
                        ? 'bg-slate-800 text-white shadow-sm border border-slate-700'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-[#0B1020]'
                    }`}
                  >
                    <span>{t.scenarioNumber} {idx + 1}</span>
                    {isOutcomeLocked && (
                      <span
                        className={`w-2 h-2 rounded-full ${
                          isOptimal ? 'bg-emerald-400' : 'bg-rose-400'
                        }`}
                        title={isOptimal ? 'Optimal response selected' : 'Suboptimal response'}
                      />
                    )}
                  </button>
                );
              })}
            </div>

            <div className="text-xs text-slate-400 flex items-center gap-2 shrink-0">
              <span>Shortcuts:</span>
              <span className="font-mono bg-[#0B1020] px-1.5 py-0.5 rounded border border-[#1E294B] text-slate-300">
                1 / 2 / 3
              </span>
              <span>or</span>
              <span className="font-mono bg-[#0B1020] px-1.5 py-0.5 rounded border border-[#1E294B] text-slate-300">
                Space
              </span>
              <span>to {isCurrentVotingClosed ? 'proceed' : 'close voting'}</span>
            </div>
          </div>
        )}

        {/* Live Audience Voting Bar with 3 Animated Bars & Simulate Chat Fallback */}
        {showPollPanel && !isCompleted && (
          <AudiencePollBar
            tally={engineState.tally}
            userVotes={engineState.userVotes}
            onCastVote={(user, opt) => actions.castVote(user, opt as VoteOption)}
            onSimulateChat={(count) => actions.simulateChat(count)}
            onResetVotes={actions.resetVotes}
            isVotingClosed={isCurrentVotingClosed}
            onCloseVoting={actions.closeVoting}
            onReopenVoting={actions.startRound}
            optionLabels={optionLabels}
            winningOptionNum={currentWinningOption.optionNumber}
            timerSeconds={engineState.timerSeconds}
            timerActive={engineState.phase === 'voting'}
            onToggleTimer={() => {
              if (engineState.phase === 'voting') {
                actions.closeVoting();
              } else {
                actions.startRound();
              }
            }}
            onResetTimer={() => actions.startRound()}
            twitchStatus={{
              channel: twitchStatus.channel,
              connected: twitchStatus.status === 'live',
              message: twitchStatus.message,
            }}
            latestVote={latestVote}
            onChangeTwitchChannel={actions.changeTwitchChannel}
          />
        )}

        {/* Live Participation Leaderboard (Top 5 Responders & Streaks) */}
        {!isCompleted && (
          <ParticipationLeaderboard
            topScores={topLeaderboard}
            language={language}
            totalParticipants={Object.keys(engineState.userVotes).length}
          />
        )}

        {/* Active Outbreak Scenario or Final Mission Debrief */}
        {!isCompleted ? (
          <ScenarioCard
            scenario={currentScenario}
            allScenarios={SCENARIOS}
            currentScenarioIndex={currentScenarioIndex}
            outcomes={canvasOutcomes}
            selectedOptionId={localSelectedOption}
            onSelectOption={(optId) => {
              setLocalSelectedOption(optId);
              const num = optId === 'A' ? 1 : optId === 'B' ? 2 : 3;
              actions.castVote('streamer_host', num);
            }}
            isVotingClosed={isCurrentVotingClosed}
            onCloseVoting={actions.closeVoting}
            winningOption={isCurrentVotingClosed ? currentWinningOption : null}
            showExplanation={engineState.phase === 'explanation' || isCurrentVotingClosed}
            onAiExplain={actions.aiExplain}
            aiState={aiState}
            onNext={actions.nextScenario}
            onPrevious={actions.previousScenario}
            isLastScenario={currentScenarioIndex === totalScenarios - 1}
            isFirstScenario={currentScenarioIndex === 0}
            fontSizeMode={fontSizeMode}
            pollTally={engineState.tally}
            language={language}
          />
        ) : (
          <SummaryCard
            scenarios={SCENARIOS}
            outcomes={canvasOutcomes}
            userAnswers={{}}
            onRestart={actions.resetSimulation}
            onJumpToScenario={(idx) => {
              actions.jumpToScenario(idx);
            }}
            fontSizeMode={fontSizeMode}
          />
        )}
      </main>

      {/* Field Protocol Guide Reference Modal */}
      <FieldProtocolGuide
        isOpen={showFieldGuide}
        onClose={() => setShowFieldGuide(false)}
      />

      {/* System Self-Test Modal */}
      <SelfTestModal
        isOpen={showSelfTest}
        onClose={() => setShowSelfTest(false)}
      />

      {/* Required Streamer Footer */}
      <footer className="border-t border-[#1E294B] py-6 mt-12 bg-[#0B1020] text-xs text-slate-400">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-300">StreamHealth Live</span>
            <span aria-hidden="true">·</span>
            <span>Educational simulation, not medical advice.</span>
          </div>
          <div className="text-slate-500 text-center sm:text-right">
            Educational simulation, not medical advice.
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <StreamHealthApp />
    </ErrorBoundary>
  );
}
