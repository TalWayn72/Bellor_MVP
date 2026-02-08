import { FastifyRequest, FastifyReply } from 'fastify';
import { extractBearerToken, sendAuthError, requireRole } from './token-validation.js';

// Re-export for backward compatibility
export { requireRole } from './token-validation.js';

/**
 * Authentication middleware - requires valid JWT token
 */
export async function authMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  try {
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      return sendAuthError(reply, 'UNAUTHORIZED', 'Authorization header is required');
    }

    if (!authHeader.startsWith('Bearer ')) {
      return sendAuthError(reply, 'INVALID_TOKEN_FORMAT', 'Authorization header must use Bearer scheme');
    }

    const token = authHeader.substring(7);
    if (!token) {
      return sendAuthError(reply, 'MISSING_TOKEN', 'Token is required');
    }

    const payload = extractBearerToken(authHeader);
    if (!payload) {
      return sendAuthError(reply, 'INVALID_TOKEN', 'Invalid or expired access token');
    }

    request.user = payload;
  } catch (error) {
    return sendAuthError(reply, 'INTERNAL_SERVER_ERROR', 'An error occurred during authentication', 500);
  }
}

/**
 * Optional authentication middleware - attaches user if token is present
 */
export async function optionalAuthMiddleware(
  request: FastifyRequest,
  _reply: FastifyReply
): Promise<void> {
  try {
    const payload = extractBearerToken(request.headers.authorization);
    if (payload) {
      request.user = payload;
    }
  } catch (error) {
    // Silently fail for optional auth
  }
}

// Alias for backwards compatibility
export const authenticate = authMiddleware;

/**
 * Admin middleware - requires user to be an admin.
 * Uses the isAdmin flag cached in the JWT payload to avoid a DB query
 * on every admin request. The flag is refreshed on login/token-refresh.
 */
export async function adminMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  if (!request.user) {
    return sendAuthError(reply, 'UNAUTHORIZED', 'Authentication required');
  }

  // isAdmin is cached in the JWT since C7 improvement.
  // For tokens issued before this change, isAdmin may be undefined -> treat as false.
  if (!request.user.isAdmin) {
    return sendAuthError(reply, 'FORBIDDEN', 'Admin access required', 403);
  }
}
