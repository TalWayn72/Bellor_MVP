import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';
import { env } from './env.js';

/**
 * Initialize Sentry for production error tracking and performance monitoring.
 * Only activates in production environment with valid DSN.
 *
 * Features:
 * - Error tracking with stack traces
 * - Performance profiling (10% sample rate)
 * - Request tracing (10% in prod, 100% in dev)
 * - Automatic sensitive data removal (auth headers, cookies)
 */
export function initSentry(): void {
  // Skip initialization in test environment or if no DSN provided
  if (!env.SENTRY_DSN || env.NODE_ENV === 'test') {
    return;
  }

  Sentry.init({
    dsn: env.SENTRY_DSN,
    environment: env.NODE_ENV,

    integrations: [
      // Performance profiling integration
      nodeProfilingIntegration() as any,
    ],

    // Performance monitoring
    // Production: sample 10% of transactions to reduce costs
    // Development: sample 100% for debugging
    tracesSampleRate: env.NODE_ENV === 'production' ? 0.1 : 1.0,

    // Profile 10% of transactions for performance insights
    profilesSampleRate: 0.1,

    // Filter and sanitize events before sending to Sentry
    beforeSend(event) {
      // Remove sensitive headers that may contain tokens or session data
      if (event.request?.headers) {
        delete event.request.headers.authorization;
        delete event.request.headers.cookie;
        delete event.request.headers['x-csrf-token'];
      }

      // Remove sensitive query parameters
      if (event.request?.query_string) {
        const sanitizedQuery = String(event.request.query_string)
          .replace(/token=[^&]*/gi, 'token=[REDACTED]')
          .replace(/key=[^&]*/gi, 'key=[REDACTED]')
          .replace(/password=[^&]*/gi, 'password=[REDACTED]');
        event.request.query_string = sanitizedQuery;
      }

      return event;
    },
  });
}
