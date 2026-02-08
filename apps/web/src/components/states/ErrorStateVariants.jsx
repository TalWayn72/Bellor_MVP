import React from 'react';
import { ErrorState } from './ErrorState';

/** Network error shorthand */
export function NetworkError({ onRetry }) {
  return <ErrorState variant="network" onRetry={onRetry} />;
}

/** Server error shorthand */
export function ServerError({ onRetry }) {
  return <ErrorState variant="server" onRetry={onRetry} />;
}

/** Not found error shorthand */
export function NotFoundError({ onGoBack, onGoHome }) {
  return <ErrorState variant="notFound" onGoBack={onGoBack} onGoHome={onGoHome} />;
}

/** Unauthorized error shorthand */
export function UnauthorizedError({ onGoBack }) {
  return (
    <ErrorState
      variant="unauthorized"
      onGoBack={onGoBack}
      description="Please log in to continue."
    />
  );
}

/** Forbidden error shorthand */
export function ForbiddenError({ onGoBack, onGoHome }) {
  return <ErrorState variant="forbidden" onGoBack={onGoBack} onGoHome={onGoHome} />;
}

/** Generic error boundary fallback */
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
