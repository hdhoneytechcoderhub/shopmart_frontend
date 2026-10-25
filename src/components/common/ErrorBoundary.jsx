import { Component } from 'react';
import { AlertTriangle, RefreshCcw, Home } from 'lucide-react';

// Catches render errors anywhere below it in the tree. Class component
// because error boundaries are one of the few things React still requires
// a class for (no hook equivalent as of this React version).
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // Best-effort console logging — no error-reporting service (Sentry etc.)
    // is wired up in this project yet; that's the natural next step once one
    // is chosen.
    console.error('ErrorBoundary caught:', error, info?.componentStack);
  }

  reset = () => {
    this.setState({ hasError: false, error: null });
    this.props.onReset?.();
  };

  render() {
    if (!this.state.hasError) return this.props.children;
    if (this.props.fallback) return this.props.fallback(this.state.error, this.reset);

    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
        <span className="grid h-16 w-16 place-items-center rounded-2xl bg-red-50 text-red-600"><AlertTriangle className="h-8 w-8" /></span>
        <h1 className="mt-4 text-xl font-bold text-ink">Something went wrong</h1>
        <p className="mt-2 max-w-sm text-sm text-ink-muted">
          This page hit an unexpected error. You can try again, or head back to a safe page.
        </p>
        {import.meta.env.DEV && this.state.error && (
          <pre className="mt-4 max-w-lg overflow-auto rounded-lg bg-slate-900 p-3 text-left text-xs text-red-300">{String(this.state.error?.stack || this.state.error)}</pre>
        )}
        <div className="mt-6 flex gap-3">
          <button onClick={this.reset} className="btn-primary"><RefreshCcw className="h-4 w-4" /> Try again</button>
          <a href="/" className="btn-outline"><Home className="h-4 w-4" /> Go home</a>
        </div>
      </div>
    );
  }
}
