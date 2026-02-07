/**
 * Rate Limiter Configuration
 * Per-endpoint rate limiting configuration for Fastify.
 * Uses @fastify/rate-limit with Redis backend.
 */

import { RATE_LIMITS } from '../config/security.config.js';
import { redis } from '../lib/redis.js';

/**
 * Rate limit options for different endpoint categories
 */
export function getAuthRateLimitConfig(endpoint: keyof typeof RATE_LIMITS.auth) {
  const config = RATE_LIMITS.auth[endpoint];
  return {
    max: config.max,
    timeWindow: config.timeWindow,
    redis,
    keyGenerator: (request: any) => {
      // Rate limit by IP for auth endpoints
      return `rl:auth:${endpoint}:${request.ip}`;
    },
    errorResponseBuilder: (_request: any, context: any) => ({
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: `Too many requests. Please try again after ${Math.ceil(context.ttl / 1000)} seconds.`,
      },
    }),
  };
}

export function getApiRateLimitConfig(endpoint: keyof typeof RATE_LIMITS.api) {
  const config = RATE_LIMITS.api[endpoint];
  return {
    max: config.max,
    timeWindow: config.timeWindow,
    redis,
    keyGenerator: (request: any) => {
      // Rate limit by user ID if authenticated, otherwise by IP
      const userId = request.user?.userId || request.user?.id;
      const key = userId || request.ip;
      return `rl:api:${endpoint}:${key}`;
    },
    errorResponseBuilder: (_request: any, context: any) => ({
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: `Too many requests. Please try again after ${Math.ceil(context.ttl / 1000)} seconds.`,
      },
    }),
  };
}

/**
 * Upload-specific rate limiter (checked manually in middleware)
 */
export async function checkUploadRateLimit(userId: string): Promise<{ allowed: boolean; remaining: number }> {
  const key = `rl:upload:${userId}`;
  const config = RATE_LIMITS.api.upload;

  const current = await redis.incr(key);

  if (current === 1) {
    // Set expiry based on time window (parse "1 minute" format)
    const seconds = parseTimeWindow(config.timeWindow);
    await redis.expire(key, seconds);
  }

  return {
    allowed: current <= config.max,
    remaining: Math.max(0, config.max - current),
  };
}

function parseTimeWindow(timeWindow: string): number {
  const match = timeWindow.match(/^(\d+)\s*(second|minute|hour|day)s?$/i);
  if (!match) return 60;

  const value = parseInt(match[1], 10);
  const unit = match[2].toLowerCase();

  switch (unit) {
    case 'second': return value;
    case 'minute': return value * 60;
    case 'hour': return value * 3600;
    case 'day': return value * 86400;
    default: return 60;
  }
}
