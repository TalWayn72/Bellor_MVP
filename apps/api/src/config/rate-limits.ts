/**
 * Endpoint-Specific Rate Limiting Configuration
 * Defines per-route rate limits for sensitive endpoints.
 * Uses Fastify's config.rateLimit option format.
 */

export const RATE_LIMITS = {
  default: { max: 100, timeWindow: '1 minute' },
  auth: {
    login: { max: 5, timeWindow: '15 minutes' },
    register: { max: 3, timeWindow: '1 hour' },
    passwordReset: { max: 3, timeWindow: '1 hour' },
  },
  chat: {
    sendMessage: { max: 30, timeWindow: '1 minute' },
  },
  search: {
    users: { max: 20, timeWindow: '1 minute' },
  },
  upload: {
    files: { max: 10, timeWindow: '1 minute' },
  },
} as const;
