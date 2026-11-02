import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[StreamHealth Live Error Boundary]:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0B1020] text-slate-100 flex items-center justify-center p-6">
          <div className="max-w-lg w-full bg-[#121A30] border border-[#1E294B] rounded-2xl p-6 sm:p-8 shadow-2xl text-center space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mx-auto">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-bold text-white tracking-tight">
                Stream Simulation Interrupted
              </h2>
              <p className="text-sm text-slate-400 leading-relaxed">
                An unexpected application error occurred during live transmission. Your audience session is safe and can be resumed immediately.
              </p>
            </div>

            {this.state.error && (
              <div className="bg-[#0B1020] border border-slate-800 p-3 rounded-lg text-left overflow-x-auto text-xs font-mono text-rose-300">
                {this.state.error.message || 'Unknown runtime error'}
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                onClick={this.handleReset}
                className="w-full sm:w-auto px-5 py-2.5 bg-[#2DD4BF] text-slate-950 font-bold text-sm rounded-xl hover:bg-[#2DD4BF]/90 transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-[#2DD4BF]/20"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Resume Simulation</span>
              </button>
              <button
                onClick={this.handleReload}
                className="w-full sm:w-auto px-5 py-2.5 bg-slate-800 text-slate-200 font-semibold text-sm rounded-xl hover:bg-slate-700 transition-colors cursor-pointer"
              >
                Refresh Stream View
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
