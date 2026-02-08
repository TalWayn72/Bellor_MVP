/**
 * Token Validation Helpers
 * Shared token extraction and admin verification logic
 */

import { FastifyRequest, FastifyReply } from 'fastify';
import { verifyAccessToken, JWTPayload } from '../utils/jwt.util.js';

// Extend FastifyRequest to include user property
declare module 'fastify' {
  interface FastifyRequest {
    user?: JWTPayload;
  }
}

/**
 * Extract and verify Bearer token from Authorization header
 * Returns the payload or null if invalid/missing
 */
export function extractBearerToken(authHeader: string | undefined): JWTPayload | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);
  if (!token) return null;

  try {
    return verifyAccessToken(token);
  } catch {
    return null;
  }
}

/**
 * Send a standardized auth error response
 */
export function sendAuthError(
  reply: FastifyReply,
  code: string,
  message: string,
  statusCode = 401
) {
  return reply.code(statusCode).send({
    success: false,
    error: { code, message },
  });
}

/**
 * Role-based authorization middleware
 * Use after authMiddleware to check for specific roles
 */
export function requireRole(..._allowedRoles: string[]) {
  return async function (request: FastifyRequest, reply: FastifyReply): Promise<void> {
    if (!request.user) {
      return sendAuthError(reply, 'UNAUTHORIZED', 'Authentication required');
    }
    // Placeholder for future role-based access control
  };
}
