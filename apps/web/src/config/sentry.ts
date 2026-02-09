import * as Sentry from '@sentry/react';

/**
 * Initialize Sentry for production error tracking and session replay.
 * Only activates in production builds with valid DSN.
 *
 * Features:
 * - Error tracking with React component stack traces
 * - Browser performance tracing (10% sample rate)
 * - Session replay for debugging (10% normal, 100% on error)
 * - Automatic PII filtering (masks text and blocks media)
 * - Development environment filtering
 */
export function initSentry(): void {
  // Skip initialization in development or if no DSN provided
  if (!import.meta.env.VITE_SENTRY_DSN || import.meta.env.DEV) {
    return;
  }

  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.MODE,

    integrations: [
      // Browser performance tracing
      Sentry.browserTracingIntegration(),

      // Session replay for debugging user sessions
      Sentry.replayIntegration({
        maskAllText: true, // Hide all text content for privacy
        blockAllMedia: true, // Block images/videos for privacy
      }),
    ],

    // Performance monitoring
    // Sample 10% of transactions to reduce costs and data volume
    tracesSampleRate: 0.1,

    // Session replay sampling
    replaysSessionSampleRate: 0.1, // Capture 10% of normal sessions
    replaysOnErrorSampleRate: 1.0, // Capture 100% of sessions with errors

    // Filter events before sending to Sentry
    beforeSend(event) {
      // Filter out localhost errors in non-production environments
      if (event.request?.url?.includes('localhost')) {
        return null;
      }

      // Remove sensitive cookies
      if (event.request?.cookies) {
        delete event.request.cookies.authToken;
        delete event.request.cookies.refreshToken;
        delete event.request.cookies['connect.sid'];
      }

      return event;
    },
  });
}
