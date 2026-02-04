import { FastifyRequest, FastifyReply } from 'fastify';
import { verifyAccessToken, JWTPayload } from '../utils/jwt.util.js';

// Extend FastifyRequest to include user property
declare module 'fastify' {
  interface FastifyRequest {
    user?: JWTPayload;
  }
}

/**
 * Authentication middleware - requires valid JWT token
 */
export async function authMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  try {
    // Get token from Authorization header
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      return reply.code(401).send({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authorization header is required',
        },
      });
    }

    // Check Bearer format
    if (!authHeader.startsWith('Bearer ')) {
      return reply.code(401).send({
        success: false,
        error: {
          code: 'INVALID_TOKEN_FORMAT',
          message: 'Authorization header must use Bearer scheme',
        },
      });
    }

    // Extract token
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    if (!token) {
      return reply.code(401).send({
        success: false,
        error: {
          code: 'MISSING_TOKEN',
          message: 'Token is required',
        },
      });
    }

    // Verify token
    try {
      const payload = verifyAccessToken(token);
      request.user = payload;
    } catch (error) {
      return reply.code(401).send({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid or expired access token',
        },
      });
    }
  } catch (error) {
    return reply.code(500).send({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An error occurred during authentication',
      },
    });
  }
}

/**
 * Optional authentication middleware - attaches user if token is present
 * Does not fail if token is missing
 */
export async function optionalAuthMiddleware(
  request: FastifyRequest,
  _reply: FastifyReply
): Promise<void> {
  try {
    const authHeader = request.headers.authorization;

    // If no auth header, just continue
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return;
    }

    const token = authHeader.substring(7);

    if (token) {
      try {
        const payload = verifyAccessToken(token);
        request.user = payload;
      } catch (error) {
        // Token is invalid, but we don't fail - just continue without user
        // This allows public endpoints to work with optional authentication
      }
    }
  } catch (error) {
    // Silently fail for optional auth
  }
}

/**
 * Role-based authorization middleware
 * Use after authMiddleware to check for specific roles
 */
export function requireRole(..._allowedRoles: string[]) {
  return async function (request: FastifyRequest, reply: FastifyReply): Promise<void> {
    if (!request.user) {
      return reply.code(401).send({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
      });
    }

    // For now, we don't have roles in JWT payload
    // This is a placeholder for future role-based access control
    // You would need to add roles to the JWT payload and check here

    // Example:
    // const userRoles = request.user.roles || [];
    // const hasPermission = allowedRoles.some(role => userRoles.includes(role));
    //
    // if (!hasPermission) {
    //   return reply.code(403).send({
    //     success: false,
    //     error: {
    //       code: 'FORBIDDEN',
    //       message: 'Insufficient permissions',
    //     },
    //   });
    // }
  };
}

/**
 * Admin middleware - requires user to be an admin
 * Must be used after authMiddleware
 */
// Alias for backwards compatibility
export const authenticate = authMiddleware;

/**
 * Admin middleware - requires user to be an admin
 * Must be used after authMiddleware
 */
export async function adminMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  // First, ensure user is authenticated
  if (!request.user) {
    return reply.code(401).send({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication required',
      },
    });
  }

  // Check if user is admin
  const { prisma } = await import('../lib/prisma.js');

  const user = await prisma.user.findUnique({
    where: { id: request.user.id },
    select: { isAdmin: true, isBlocked: true },
  });

  if (!user) {
    return reply.code(401).send({
      success: false,
      error: {
        code: 'USER_NOT_FOUND',
        message: 'User not found',
      },
    });
  }

  if (user.isBlocked) {
    return reply.code(403).send({
      success: false,
      error: {
        code: 'USER_BLOCKED',
        message: 'Your account has been blocked',
      },
    });
  }

  if (!user.isAdmin) {
    return reply.code(403).send({
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: 'Admin access required',
      },
    });
  }
}
