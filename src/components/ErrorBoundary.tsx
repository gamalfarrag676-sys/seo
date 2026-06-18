// Error Boundary — Catches React rendering errors and displays a user-friendly fallback
import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary] Uncaught error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[400px] flex items-center justify-center p-8" dir="rtl">
          <div className="relative w-full max-w-md">
            {/* Glow effect */}
            <div className="absolute -inset-0.5 bg-gradient-to-r from-red-500 via-orange-500 to-amber-500 rounded-3xl opacity-30 blur-sm"></div>
            
            <div className="relative bg-slate-900/90 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-8 text-center space-y-6">
              {/* Icon */}
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-red-500 to-orange-600 shadow-lg shadow-red-500/30">
                <AlertTriangle className="w-8 h-8 text-white" />
              </div>

              {/* Message */}
              <div className="space-y-2">
                <h2 className="text-xl font-bold text-white">
                  {this.props.fallbackTitle || 'حدث خطأ غير متوقع'}
                </h2>
                <p className="text-slate-400 text-sm leading-relaxed">
                  عذراً، حدث خطأ أثناء تحميل هذا الجزء من التطبيق. 
                  يمكنك المحاولة مرة أخرى.
                </p>
              </div>

              {/* Error details (dev only) */}
              {import.meta.env.DEV && this.state.error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-right">
                  <p className="text-red-400 text-xs font-mono break-all" dir="ltr">
                    {this.state.error.message}
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 justify-center">
                <button
                  onClick={this.handleReset}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-indigo-500/25"
                >
                  <RefreshCw className="w-4 h-4" />
                  إعادة المحاولة
                </button>
                <button
                  onClick={() => window.location.reload()}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold transition-all border border-slate-700"
                >
                  تحديث الصفحة
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
