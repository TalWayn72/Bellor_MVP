import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import * as Sentry from '@sentry/react';
import { reportRenderCrash } from '@/security/securityEventReporter';

/**
 * Global Error Boundary - catches React rendering crashes and reports to backend.
 * Wraps the entire app to prevent white-screen crashes.
 */
class GlobalErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    const route = window.location.pathname + window.location.search;
    const componentStack = errorInfo?.componentStack || '';

    console.error('[GlobalErrorBoundary] Render crash:', error, errorInfo);

    // Report to backend security event system
    reportRenderCrash(route, error?.message || 'Unknown render error', componentStack);

    // Report to Sentry for production error tracking
    Sentry.captureException(error, {
      contexts: {
        react: {
          componentStack,
        },
      },
      tags: {
        errorBoundary: 'GlobalErrorBoundary',
        route,
      },
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-6">
          <div className="bg-card rounded-2xl p-8 shadow-lg max-w-md text-center border border-border">
            <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-destructive" />
            </div>
            <h2 className="text-xl font-bold mb-2 text-foreground">Something went wrong</h2>
            <p className="text-muted-foreground mb-6">
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
              className="inline-flex items-center gap-2 px-5 py-2 bg-primary text-primary-foreground rounded-full font-semibold text-sm hover:bg-primary/90 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default GlobalErrorBoundary;
