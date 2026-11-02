import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  XCircle,
  Loader2,
  RefreshCw,
  X,
  Play,
  ShieldCheck,
  ChevronDown,
  ChevronRight,
  Terminal,
} from 'lucide-react';
import { runStreamHealthSelfTests, SelfTestSuiteSummary, TestResult } from '../testing/selfTestRunner';

interface SelfTestModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SelfTestModal: React.FC<SelfTestModalProps> = ({ isOpen, onClose }) => {
  const [isRunning, setIsRunning] = useState(false);
  const [summary, setSummary] = useState<SelfTestSuiteSummary | null>(null);
  const [expandedTests, setExpandedTests] = useState<Record<number, boolean>>({});

  const executeTests = async () => {
    setIsRunning(true);
    try {
      const res = await runStreamHealthSelfTests();
      setSummary(res);
    } catch (err) {
      console.error('Self test run failed:', err);
    } finally {
      setIsRunning(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      executeTests();
    }
  }, [isOpen]);

  const toggleExpand = (id: number) => {
    setExpandedTests((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="self-test-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-3xl max-h-[90vh] bg-[#0E1526] border border-[#1E294B] rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1E294B] bg-[#0B1020]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 id="self-test-title" className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                <span>System Self-Test Suite</span>
                {summary && (
                  <span
                    className={`text-xs px-2.5 py-0.5 rounded-full font-mono font-bold ${
                      summary.allPassed
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    }`}
                  >
                    {summary.passed}/{summary.total} PASSED
                  </span>
                )}
              </h2>
              <p className="text-xs text-slate-400">
                10-point automated integrity verification for hackathon submission
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={executeTests}
              disabled={isRunning}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                isRunning
                  ? 'bg-slate-800 border-slate-700 text-slate-500 cursor-not-allowed'
                  : 'bg-cyan-950/70 border-cyan-600/50 text-cyan-300 hover:bg-cyan-900'
              }`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRunning ? 'animate-spin' : ''}`} />
              <span>{isRunning ? 'Running...' : 'Rerun Tests'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              aria-label="Close Self-Test Modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {isRunning && !summary && (
            <div className="py-12 flex flex-col items-center justify-center gap-3 text-slate-400">
              <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
              <p className="text-sm font-medium">Running automated checklist...</p>
            </div>
          )}

          {summary &&
            summary.results.map((test) => {
              const isExpanded = !!expandedTests[test.id];

              return (
                <div
                  key={test.id}
                  className={`rounded-xl border transition-all ${
                    test.passed
                      ? 'bg-[#121A30]/80 border-slate-800 hover:border-slate-700'
                      : 'bg-rose-950/20 border-rose-500/40'
                  }`}
                >
                  <div
                    onClick={() => toggleExpand(test.id)}
                    className="p-4 flex items-start justify-between gap-3 cursor-pointer select-none"
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 shrink-0">
                        {test.passed ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                        ) : (
                          <XCircle className="w-5 h-5 text-rose-400" />
                        )}
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs font-bold text-slate-400">
                            #{test.id}
                          </span>
                          <span className="text-sm font-bold text-white">
                            {test.name}
                          </span>
                          <span className="font-mono text-[11px] text-slate-500">
                            ({test.durationMs}ms)
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed">
                          {test.message}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded ${
                          test.passed
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : 'bg-rose-500/20 text-rose-300'
                        }`}
                      >
                        {test.passed ? 'PASS' : 'FAIL'}
                      </span>
                      {test.details && test.details.length > 0 && (
                        <span className="text-slate-400 hover:text-white">
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4" />
                          ) : (
                            <ChevronRight className="w-4 h-4" />
                          )}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Expanded assertion logs */}
                  {isExpanded && test.details && test.details.length > 0 && (
                    <div className="px-4 pb-4 pt-1 border-t border-slate-800/80 bg-slate-950/50 rounded-b-xl">
                      <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-400 mb-2">
                        <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Assertion Verification Trace:</span>
                      </div>
                      <ul className="space-y-1 font-mono text-xs text-slate-300 pl-4 list-disc">
                        {test.details.map((detail, idx) => (
                          <li key={idx} className="leading-relaxed">
                            {detail}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              );
            })}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-[#1E294B] bg-[#0B1020] flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span>Route shortcut:</span>
            <code className="bg-[#121A30] px-2 py-0.5 rounded text-cyan-300 font-mono">
              /?test=1
            </code>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
