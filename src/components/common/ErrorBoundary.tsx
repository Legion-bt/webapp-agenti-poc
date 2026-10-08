import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, RotateCcw } from 'lucide-react';

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
    console.error('ErrorBoundary caught an unhandled error:', error, errorInfo);
  }

  private handleReset = () => {
    try {
      localStorage.removeItem('agentego_erp_database_v1');
      localStorage.removeItem('agentego_theme');
    } catch (e) {
      console.error(e);
    }
    window.location.reload();
  };

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-2xl text-center">
            <div className="w-14 h-14 bg-rose-500/10 text-rose-400 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-rose-500/20">
              <AlertTriangle className="w-7 h-7" />
            </div>
            
            <h1 className="text-xl font-bold text-white mb-2">
              Si è verificato un problema
            </h1>
            
            <p className="text-xs text-slate-400 mb-4 leading-relaxed">
              L'applicazione ha rilevato un errore imprevisto. Nessun dato è andato perso: puoi ricaricare la pagina o ripristinare lo stato locale.
            </p>

            {this.state.error && (
              <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-lg text-left mb-6 font-mono text-2xs text-rose-300 break-words overflow-x-auto max-h-32">
                {this.state.error.message || 'Errore sconosciuto'}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-2">
              <button
                onClick={this.handleReload}
                className="cursor-pointer flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Ricarica Pagina
              </button>
              
              <button
                onClick={this.handleReset}
                className="cursor-pointer flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-slate-700 hover:bg-slate-600 text-slate-200 font-semibold text-xs rounded-xl transition-colors border border-slate-600"
              >
                <RotateCcw className="w-4 h-4" />
                Ripristina Cache
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
