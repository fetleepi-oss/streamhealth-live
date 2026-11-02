import React from 'react';
import {
  RotateCcw,
  Maximize,
  Minimize,
  Volume2,
  VolumeX,
  Languages,
  Tv,
  Layers,
  BookOpen,
  Radio,
  ShieldCheck,
} from 'lucide-react';
import { Language, TRANSLATIONS } from '../data/translations';

interface HeaderProps {
  currentScenarioIndex: number;
  totalScenarios: number;
  fontSizeMode: 'standard' | 'large' | 'massive';
  setFontSizeMode: (mode: 'standard' | 'large' | 'massive') => void;
  showPollPanel: boolean;
  setShowPollPanel: (show: boolean | ((prev: boolean) => boolean)) => void;
  showFieldGuide: boolean;
  setShowFieldGuide: (show: boolean) => void;
  onReset: () => void;
  onOpenSelfTest?: () => void;
  isFullscreen: boolean;
  toggleFullscreen: () => void;
  twitchStatus?: { channel: string; connected: boolean };
  language: Language;
  setLanguage: (lang: Language) => void;
  isMuted: boolean;
  toggleMute: () => void;
  isOverlayMode: boolean;
  toggleOverlayMode: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentScenarioIndex,
  totalScenarios,
  fontSizeMode,
  setFontSizeMode,
  showPollPanel,
  setShowPollPanel,
  showFieldGuide,
  setShowFieldGuide,
  onReset,
  onOpenSelfTest,
  isFullscreen,
  toggleFullscreen,
  twitchStatus,
  language,
  setLanguage,
  isMuted,
  toggleMute,
  isOverlayMode,
  toggleOverlayMode,
}) => {
  const t = TRANSLATIONS[language];

  return (
    <header className="sticky top-0 z-40 bg-[#0B1020]/95 backdrop-blur-md border-b border-[#1E294B]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-4">
        {/* Zone 1: Wordmark & Twitch Status */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-[#2DD4BF]/10 border border-[#2DD4BF]/30 flex items-center justify-center text-[#2DD4BF] font-black text-sm">
            SH
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg sm:text-xl font-extrabold tracking-tight text-white whitespace-nowrap">
                {t.appName}
              </span>
              <span className="hidden sm:inline text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                LIVE
              </span>
            </div>
            <div className="text-[11px] text-slate-400 flex items-center gap-2">
              <span>{t.scenarioNumber} {currentScenarioIndex + 1} {t.ofTotal} {totalScenarios}</span>
              <span aria-hidden="true">·</span>
              <div className="flex items-center gap-1.5">
                <span
                  className={`w-2 h-2 rounded-full ${
                    twitchStatus?.connected
                      ? 'bg-emerald-400'
                      : twitchStatus?.channel
                      ? 'bg-amber-400 animate-pulse'
                      : 'bg-slate-500'
                  }`}
                />
                <span className="text-[#a970ff] font-semibold">Twitch:</span>
                <span className="font-mono text-slate-300">
                  {twitchStatus?.channel ? `#${twitchStatus.channel}` : 'Auto-Read'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Zone 2: Navigation & Broadcast Toggles */}
        <div className="hidden lg:flex items-center gap-4 text-xs font-medium text-slate-300">
          {/* Trilingual Language Selector */}
          <div className="flex items-center gap-1 bg-[#121A30] border border-[#1E294B] rounded-lg p-1">
            <Languages className="w-3.5 h-3.5 text-slate-400 ml-1.5 mr-0.5" />
            {(['en', 'am', 'sw'] as const).map((lang) => (
              <button
                key={lang}
                onClick={() => setLanguage(lang)}
                className={`px-2 py-1 rounded text-xs font-semibold transition-colors cursor-pointer ${
                  language === lang
                    ? 'bg-[#2DD4BF]/20 text-[#2DD4BF] border border-[#2DD4BF]/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {lang === 'en' ? 'EN' : lang === 'am' ? 'አማ' : 'SW'}
              </button>
            ))}
          </div>

          {/* Sound FX Toggle */}
          <button
            onClick={toggleMute}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border transition-colors cursor-pointer ${
              !isMuted
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : 'bg-[#121A30] border-[#1E294B] text-slate-400 hover:text-slate-200'
            }`}
            title={isMuted ? 'Unmute Sound FX' : 'Mute Sound FX'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
            <span className="font-mono">{isMuted ? t.muted : t.unmuted}</span>
          </button>

          {/* OBS Overlay Switcher */}
          <button
            onClick={toggleOverlayMode}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border transition-colors cursor-pointer ${
              isOverlayMode
                ? 'bg-[#8B5CF6]/20 border-[#8B5CF6] text-violet-300'
                : 'bg-[#121A30] border-[#1E294B] text-slate-300 hover:text-white'
            }`}
            title="OBS 1920x1080 Transparent Overlay Mode"
          >
            <Tv className="w-4 h-4 text-[#8B5CF6]" />
            <span>OBS HUD</span>
          </button>

          {/* Field Protocol Guide */}
          <button
            onClick={() => setShowFieldGuide(!showFieldGuide)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border transition-colors cursor-pointer ${
              showFieldGuide
                ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300'
                : 'bg-[#121A30] border-[#1E294B] text-slate-300 hover:text-white'
            }`}
          >
            <BookOpen className="w-4 h-4 text-cyan-400" />
            <span>Field Guide</span>
          </button>

          {/* Font Size Scaling */}
          <div className="flex items-center gap-1 bg-[#121A30] border border-[#1E294B] rounded-lg p-1">
            <span className="text-[11px] text-slate-400 px-1.5 select-none">Scale:</span>
            <button
              onClick={() => setFontSizeMode('standard')}
              className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-colors cursor-pointer ${
                fontSizeMode === 'standard'
                  ? 'bg-[#2DD4BF]/20 text-[#2DD4BF] border border-[#2DD4BF]/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              100%
            </button>
            <button
              onClick={() => setFontSizeMode('large')}
              className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-colors cursor-pointer ${
                fontSizeMode === 'large'
                  ? 'bg-[#2DD4BF]/20 text-[#2DD4BF] border border-[#2DD4BF]/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              120%
            </button>
            <button
              onClick={() => setFontSizeMode('massive')}
              className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-colors cursor-pointer ${
                fontSizeMode === 'massive'
                  ? 'bg-[#2DD4BF]/20 text-[#2DD4BF] border border-[#2DD4BF]/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              XL
            </button>
          </div>
        </div>

        {/* Zone 3: Actions (Poll Toggle, Self-Test, Fullscreen, Reset) */}
        <div className="flex items-center gap-2 shrink-0">
          {onOpenSelfTest && (
            <button
              onClick={onOpenSelfTest}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold transition-all bg-cyan-950/70 border-cyan-500/40 text-cyan-300 hover:bg-cyan-900/80 hover:border-cyan-400 cursor-pointer shadow-sm active:scale-95"
              title="Run Automated 10-Point Self-Test Checklist"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
              <span>Run Self-Test</span>
            </button>
          )}

          <button
            onClick={() => setShowPollPanel((prev) => !prev)}
            className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors cursor-pointer ${
              showPollPanel
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : 'bg-[#121A30] border-[#1E294B] text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Poll Panel</span>
          </button>

          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-lg bg-[#121A30] border border-[#1E294B] text-slate-300 hover:text-white transition-colors cursor-pointer"
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          </button>

          <button
            onClick={onReset}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-200 bg-[#121A30] border border-[#1E294B] rounded-lg hover:bg-slate-800 hover:text-white transition-colors cursor-pointer shadow-sm"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline">Reset</span>
          </button>
        </div>
      </div>
    </header>
  );
};
