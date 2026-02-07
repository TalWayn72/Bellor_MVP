/**
 * Authentication Hardening
 * Brute force protection using Redis-based tracking.
 * Tracks failed login attempts per IP and locks out after threshold.
 */

import { FastifyRequest, FastifyReply } from 'fastify';
import { redis } from '../lib/redis.js';
import { RATE_LIMITS } from '../config/security.config.js';
import { securityLogger } from './logger.js';

const { maxAttempts, lockoutMinutes, trackingPrefix } = RATE_LIMITS.bruteForce;

/**
 * Get the brute force tracking key for an IP + identifier
 */
function getTrackingKey(ip: string, identifier: string): string {
  return `${trackingPrefix}${ip}:${identifier}`;
}

/**
 * Record a failed login attempt
 * Returns the current number of attempts
 */
export async function recordFailedAttempt(ip: string, identifier: string): Promise<number> {
  const key = getTrackingKey(ip, identifier);
  const attempts = await redis.incr(key);

  // Set expiry on first attempt
  if (attempts === 1) {
    await redis.expire(key, lockoutMinutes * 60);
  }

  return attempts;
}

/**
 * Check if an IP+identifier is currently locked out
 */
export async function isLockedOut(ip: string, identifier: string): Promise<boolean> {
  const key = getTrackingKey(ip, identifier);
  const attempts = await redis.get(key);
  return attempts !== null && parseInt(attempts, 10) >= maxAttempts;
}

/**
 * Clear failed attempts after successful login
 */
export async function clearFailedAttempts(ip: string, identifier: string): Promise<void> {
  const key = getTrackingKey(ip, identifier);
  await redis.del(key);
}

/**
 * Get remaining attempts before lockout
 */
export async function getRemainingAttempts(ip: string, identifier: string): Promise<number> {
  const key = getTrackingKey(ip, identifier);
  const attempts = await redis.get(key);
  const current = attempts ? parseInt(attempts, 10) : 0;
  return Math.max(0, maxAttempts - current);
}

/**
 * Brute force protection middleware for login endpoints
 * Must be applied before the actual login handler
 */
export async function bruteForceProtection(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const ip = request.ip;
  const body = request.body as { email?: string } | undefined;
  const identifier = body?.email || 'unknown';

  const locked = await isLockedOut(ip, identifier);

  if (locked) {
    securityLogger.bruteForceBlocked(request, identifier, maxAttempts);

    return reply.code(429).send({
      success: false,
      error: {
        code: 'TOO_MANY_ATTEMPTS',
        message: `Too many failed login attempts. Please try again in ${lockoutMinutes} minutes.`,
      },
    });
  }
}

/**
 * Record a failed login and check if lockout threshold is reached
 * Call this in the login error handler
 */
export async function handleFailedLogin(
  request: FastifyRequest,
  email: string
): Promise<{ locked: boolean; attempts: number; remaining: number }> {
  const ip = request.ip;
  const attempts = await recordFailedAttempt(ip, email);
  const remaining = Math.max(0, maxAttempts - attempts);
  const locked = attempts >= maxAttempts;

  if (locked) {
    securityLogger.bruteForceBlocked(request, email, attempts);
  } else {
    securityLogger.loginFailure(request, email, `Attempt ${attempts}/${maxAttempts}`);
  }

  return { locked, attempts, remaining };
}

/**
 * Handle successful login — clear tracking
 */
export async function handleSuccessfulLogin(
  request: FastifyRequest,
  email: string,
  userId: string
): Promise<void> {
  await clearFailedAttempts(request.ip, email);
  securityLogger.loginSuccess(request, userId);
}
