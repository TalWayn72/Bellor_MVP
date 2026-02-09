/**
 * Security Event Logger
 * Structured logging for security events with IP, user agent, and contextual data.
 */

import { FastifyRequest } from 'fastify';
import { SECURITY_LOG_EVENTS } from '../config/security.config.js';

export interface SecurityEvent {
  event: string;
  timestamp: string;
  ip: string;
  userAgent: string;
  userId?: string;
  path?: string;
  method?: string;
  details?: Record<string, unknown>;
}

/**
 * Extract client IP from request (handles proxies)
 */
function getClientIp(request: FastifyRequest): string {
  const forwarded = request.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  if (Array.isArray(forwarded) && forwarded.length > 0) {
    return forwarded[0].split(',')[0].trim();
  }
  return request.ip || 'unknown';
}

/**
 * Build a security event object from request context
 */
function buildEvent(
  event: string,
  request: FastifyRequest | null,
  details?: Record<string, unknown>
): SecurityEvent {
  return {
    event,
    timestamp: new Date().toISOString(),
    ip: request ? getClientIp(request) : 'system',
    userAgent: request ? (request.headers['user-agent'] || 'unknown') : 'system',
    userId: request?.user?.userId || request?.user?.id,
    path: request?.url,
    method: request?.method,
    details,
  };
}

/**
 * Log a security event
 * Uses Fastify logger if request is available, otherwise console
 */
export function logSecurityEvent(
  event: string,
  request: FastifyRequest | null,
  details?: Record<string, unknown>
): void {
  const eventData = buildEvent(event, request, details);

  if (request?.log) {
    request.log.warn({ securityEvent: eventData }, `[SECURITY] ${event}`);
  } else {
    // Fallback to console for events without request context
    console.warn('[SECURITY]', JSON.stringify(eventData));
  }
}

/**
 * Convenience methods for common security events
 */
export const securityLogger = {
  loginSuccess(request: FastifyRequest, userId: string) {
    logSecurityEvent(SECURITY_LOG_EVENTS.AUTH_LOGIN_SUCCESS, request, { userId });
  },

  loginFailure(request: FastifyRequest, email: string, reason: string) {
    logSecurityEvent(SECURITY_LOG_EVENTS.AUTH_LOGIN_FAILURE, request, {
      email: email.substring(0, 3) + '***', // Partial email for privacy
      reason,
    });
  },

  bruteForceBlocked(request: FastifyRequest, email: string, attempts: number) {
    logSecurityEvent(SECURITY_LOG_EVENTS.AUTH_BRUTE_FORCE_LOCKOUT, request, {
      email: email.substring(0, 3) + '***',
      attempts,
    });
  },

  injectionBlocked(request: FastifyRequest, type: string, field: string) {
    logSecurityEvent(SECURITY_LOG_EVENTS.INPUT_INJECTION_BLOCKED, request, { type, field });
  },

  uploadRejected(request: FastifyRequest, reason: string, filename?: string) {
    logSecurityEvent(SECURITY_LOG_EVENTS.UPLOAD_REJECTED, request, { reason, filename });
  },

  uploadSuccess(request: FastifyRequest, fileType: string, size: number) {
    logSecurityEvent(SECURITY_LOG_EVENTS.UPLOAD_SUCCESS, request, { fileType, size });
  },

  rateLimitExceeded(request: FastifyRequest) {
    logSecurityEvent(SECURITY_LOG_EVENTS.RATE_LIMIT_EXCEEDED, request);
  },

  accessDenied(request: FastifyRequest, resource: string) {
    logSecurityEvent(SECURITY_LOG_EVENTS.ACCESS_DENIED, request, { resource });
  },

  suspiciousActivity(request: FastifyRequest, description: string) {
    logSecurityEvent(SECURITY_LOG_EVENTS.SUSPICIOUS_ACTIVITY, request, { description });
  },

  passwordChanged(request: FastifyRequest, userId: string) {
    logSecurityEvent(SECURITY_LOG_EVENTS.AUTH_PASSWORD_CHANGE, request, { userId });
  },

  clientAuthRedirect(request: FastifyRequest, details: Record<string, unknown>) {
    logSecurityEvent(SECURITY_LOG_EVENTS.CLIENT_AUTH_REDIRECT, request, details);
  },

  clientAdminDenied(request: FastifyRequest, details: Record<string, unknown>) {
    logSecurityEvent(SECURITY_LOG_EVENTS.CLIENT_ADMIN_DENIED, request, details);
  },
};
