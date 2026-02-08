import React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  AlertTriangle, WifiOff, ServerCrash, Lock, FileQuestion, RefreshCw, Home, ArrowLeft,
} from 'lucide-react';

const variantConfig = {
  default: { icon: AlertTriangle, title: 'Something went wrong', description: 'An unexpected error occurred. Please try again.', color: 'text-destructive bg-destructive/10' },
  network: { icon: WifiOff, title: 'No connection', description: 'Please check your internet connection and try again.', color: 'text-warning bg-warning/10' },
  server: { icon: ServerCrash, title: 'Server error', description: 'Our servers are having issues. Please try again later.', color: 'text-destructive bg-destructive/10' },
  notFound: { icon: FileQuestion, title: 'Not found', description: "The page or content you're looking for doesn't exist.", color: 'text-muted-foreground bg-muted' },
  unauthorized: { icon: Lock, title: 'Access denied', description: 'You need to log in to access this content.', color: 'text-warning bg-warning/10' },
  forbidden: { icon: Lock, title: 'Permission denied', description: "You don't have permission to access this content.", color: 'text-destructive bg-destructive/10' },
};

/**
 * ErrorState - Reusable error display component
 */
export function ErrorState({
  variant = 'default', title, description, onRetry, onGoBack, onGoHome,
  errorCode, error, showDetails = false, className,
}) {
  const config = variantConfig[variant] || variantConfig.default;
  const Icon = config.icon;
  const displayTitle = title || config.title;
  const displayDescription = description || config.description;

  return (
    <div className={cn('flex flex-col items-center justify-center py-12 px-4 text-center', className)}>
      <div className={cn('rounded-full p-6 mb-6', config.color)}>
        <Icon className="h-12 w-12" />
      </div>

      {errorCode && (
        <span className="text-xs font-mono text-muted-foreground mb-2 px-2 py-1 bg-muted rounded">
          Error: {errorCode}
        </span>
      )}

      <h3 className="text-xl font-semibold text-foreground mb-2">{displayTitle}</h3>
      <p className="text-muted-foreground max-w-sm mb-6">{displayDescription}</p>

      <div className="flex flex-col sm:flex-row gap-3">
        {onRetry && (
          <Button onClick={onRetry} variant="default">
            <RefreshCw className="h-4 w-4 mr-2" />Try again
          </Button>
        )}
        {onGoBack && (
          <Button onClick={onGoBack} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />Go back
          </Button>
        )}
        {onGoHome && (
          <Button onClick={onGoHome} variant="outline">
            <Home className="h-4 w-4 mr-2" />Go home
          </Button>
        )}
      </div>

      {showDetails && error && (
        <details className="mt-8 w-full max-w-md text-left">
          <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground">
            Show error details
          </summary>
          <pre className="mt-2 p-3 bg-muted rounded-lg text-xs overflow-auto max-h-40">
            {JSON.stringify({
              message: error.message,
              name: error.name,
              stack: error.stack?.split('\n').slice(0, 5).join('\n'),
            }, null, 2)}
          </pre>
        </details>
      )}
    </div>
  );
}

// Re-export shorthand variants for backward compatibility
export { NetworkError, ServerError, NotFoundError, UnauthorizedError, ForbiddenError, GenericError } from './ErrorStateVariants';

export default ErrorState;
