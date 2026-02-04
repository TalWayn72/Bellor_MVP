import React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  AlertTriangle,
  WifiOff,
  ServerCrash,
  Lock,
  FileQuestion,
  RefreshCw,
  Home,
  ArrowLeft,
} from 'lucide-react';

/**
 * ErrorState - Reusable error display component
 *
 * @param {string} variant - 'default' | 'network' | 'server' | 'notFound' | 'unauthorized' | 'forbidden'
 * @param {string} title - Error title
 * @param {string} description - Error description
 * @param {function} onRetry - Retry button handler
 * @param {function} onGoBack - Go back button handler
 * @param {function} onGoHome - Go home button handler
 * @param {string} errorCode - Optional error code to display
 * @param {object} error - Error object (for debugging)
 * @param {boolean} showDetails - Show error details (dev mode)
 * @param {string} className - Additional CSS classes
 */
export function ErrorState({
  variant = 'default',
  title,
  description,
  onRetry,
  onGoBack,
  onGoHome,
  errorCode,
  error,
  showDetails = false,
  className,
}) {
  // Icon mapping by variant
  const variantConfig = {
    default: {
      icon: AlertTriangle,
      title: 'Something went wrong',
      description: 'An unexpected error occurred. Please try again.',
      color: 'text-destructive bg-destructive/10',
    },
    network: {
      icon: WifiOff,
      title: 'No connection',
      description: 'Please check your internet connection and try again.',
      color: 'text-warning bg-warning/10',
    },
    server: {
      icon: ServerCrash,
      title: 'Server error',
      description: 'Our servers are having issues. Please try again later.',
      color: 'text-destructive bg-destructive/10',
    },
    notFound: {
      icon: FileQuestion,
      title: 'Not found',
      description: "The page or content you're looking for doesn't exist.",
      color: 'text-muted-foreground bg-muted',
    },
    unauthorized: {
      icon: Lock,
      title: 'Access denied',
      description: 'You need to log in to access this content.',
      color: 'text-warning bg-warning/10',
    },
    forbidden: {
      icon: Lock,
      title: 'Permission denied',
      description: "You don't have permission to access this content.",
      color: 'text-destructive bg-destructive/10',
    },
  };

  const config = variantConfig[variant] || variantConfig.default;
  const Icon = config.icon;

  const displayTitle = title || config.title;
  const displayDescription = description || config.description;

  return (
    <div className={cn('flex flex-col items-center justify-center py-12 px-4 text-center', className)}>
      {/* Icon */}
      <div className={cn('rounded-full p-6 mb-6', config.color)}>
        <Icon className="h-12 w-12" />
      </div>

      {/* Error code */}
      {errorCode && (
        <span className="text-xs font-mono text-muted-foreground mb-2 px-2 py-1 bg-muted rounded">
          Error: {errorCode}
        </span>
      )}

      {/* Title */}
      <h3 className="text-xl font-semibold text-foreground mb-2">{displayTitle}</h3>

      {/* Description */}
      <p className="text-muted-foreground max-w-sm mb-6">{displayDescription}</p>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        {onRetry && (
          <Button onClick={onRetry} variant="default">
            <RefreshCw className="h-4 w-4 mr-2" />
            Try again
          </Button>
        )}
        {onGoBack && (
          <Button onClick={onGoBack} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go back
          </Button>
        )}
        {onGoHome && (
          <Button onClick={onGoHome} variant="outline">
            <Home className="h-4 w-4 mr-2" />
            Go home
          </Button>
        )}
      </div>

      {/* Error details (dev mode) */}
      {showDetails && error && (
        <details className="mt-8 w-full max-w-md text-left">
          <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground">
            Show error details
          </summary>
          <pre className="mt-2 p-3 bg-muted rounded-lg text-xs overflow-auto max-h-40">
            {JSON.stringify(
              {
                message: error.message,
                name: error.name,
                stack: error.stack?.split('\n').slice(0, 5).join('\n'),
              },
              null,
              2
            )}
          </pre>
        </details>
      )}
    </div>
  );
}

// Shorthand exports for common use cases
export function NetworkError({ onRetry }) {
  return <ErrorState variant="network" onRetry={onRetry} />;
}

export function ServerError({ onRetry }) {
  return <ErrorState variant="server" onRetry={onRetry} />;
}

export function NotFoundError({ onGoBack, onGoHome }) {
  return <ErrorState variant="notFound" onGoBack={onGoBack} onGoHome={onGoHome} />;
}

export function UnauthorizedError({ onGoBack }) {
  return (
    <ErrorState
      variant="unauthorized"
      onGoBack={onGoBack}
      description="Please log in to continue."
    />
  );
}

export function ForbiddenError({ onGoBack, onGoHome }) {
  return <ErrorState variant="forbidden" onGoBack={onGoBack} onGoHome={onGoHome} />;
}

// Generic error boundary fallback
export function GenericError({ error, onRetry }) {
  const isDev = import.meta.env.DEV;
  return (
    <ErrorState
      variant="default"
      error={error}
      showDetails={isDev}
      onRetry={onRetry}
    />
  );
}

export default ErrorState;
