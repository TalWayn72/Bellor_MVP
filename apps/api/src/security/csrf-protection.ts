/**
 * CSRF Protection
 * Double-submit cookie pattern + Origin/Referer validation.
 * For Fastify with JWT-based auth (stateless).
 */

import { FastifyRequest, FastifyReply } from 'fastify';
import crypto from 'crypto';
import { env } from '../config/env.js';
import { securityLogger } from './logger.js';

const CSRF_COOKIE_NAME = '__bellor_csrf';
const CSRF_HEADER_NAME = 'x-csrf-token';
const TOKEN_LENGTH = 32;

/**
 * Generate a CSRF token
 */
export function generateCsrfToken(): string {
  return crypto.randomBytes(TOKEN_LENGTH).toString('hex');
}

/**
 * Set CSRF cookie on response
 */
export function setCsrfCookie(reply: FastifyReply): string {
  const token = generateCsrfToken();

  reply.setCookie(CSRF_COOKIE_NAME, token, {
    httpOnly: false,  // Must be readable by JavaScript
    secure: env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 3600, // 1 hour
  });

  return token;
}

/**
 * Validate Origin/Referer headers against allowed frontend URL
 */
function validateOrigin(request: FastifyRequest): boolean {
  const origin = request.headers.origin;
  const referer = request.headers.referer;

  // In development, be more lenient
  if (env.NODE_ENV === 'development') {
    return true;
  }

  const allowedOrigin = env.FRONTEND_URL;

  if (origin) {
    return origin === allowedOrigin || origin.startsWith(allowedOrigin);
  }

  if (referer) {
    return referer.startsWith(allowedOrigin);
  }

  // No origin or referer — block in production
  return false;
}

/**
 * CSRF protection middleware
 * Validates the double-submit cookie pattern for state-changing requests.
 * Safe methods (GET, HEAD, OPTIONS) are excluded.
 */
export async function csrfProtection(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  // Skip safe methods
  const safeMethods = ['GET', 'HEAD', 'OPTIONS'];
  if (safeMethods.includes(request.method)) {
    return;
  }

  // Skip for API-to-API calls (no browser involved)
  const contentType = request.headers['content-type'] || '';
  const isApiCall = request.headers.authorization?.startsWith('Bearer ');

  // For JWT-based auth, Origin validation is the primary CSRF defense
  if (isApiCall) {
    if (!validateOrigin(request)) {
      securityLogger.suspiciousActivity(request, 'CSRF origin validation failed');
      return reply.code(403).send({
        success: false,
        error: {
          code: 'CSRF_VALIDATION_FAILED',
          message: 'Request origin validation failed',
        },
      });
    }
    return;
  }

  // For cookie-based sessions (if any), use double-submit pattern
  // Parse cookies from the Cookie header
  const cookieHeader = request.headers.cookie || '';
  const parsedCookies: Record<string, string> = {};
  for (const pair of cookieHeader.split(';')) {
    const [key, ...val] = pair.trim().split('=');
    if (key) parsedCookies[key] = val.join('=');
  }
  const cookieToken = parsedCookies[CSRF_COOKIE_NAME];
  const headerToken = request.headers[CSRF_HEADER_NAME];

  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    securityLogger.suspiciousActivity(request, 'CSRF token mismatch');
    return reply.code(403).send({
      success: false,
      error: {
        code: 'CSRF_VALIDATION_FAILED',
        message: 'CSRF token validation failed',
      },
    });
  }
}
