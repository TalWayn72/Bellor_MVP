/**
 * WebSocket Authentication
 * AuthenticatedSocket interface and authentication middleware
 */

import { Socket } from 'socket.io';
import { verifyAccessToken } from '../utils/jwt.util.js';

export interface AuthenticatedSocket extends Socket {
  userId?: string;
  userEmail?: string;
}

/**
 * Socket.io authentication middleware
 * Verifies JWT token from handshake auth or query params
 */
export async function authMiddleware(
  socket: AuthenticatedSocket,
  next: (err?: Error) => void
): Promise<void> {
  try {
    // Get token from handshake auth or query
    const token = socket.handshake.auth.token || socket.handshake.query.token;

    if (!token) {
      return next(new Error('Authentication token is required'));
    }

    // Verify token
    const payload = verifyAccessToken(token as string);

    // Attach user info to socket
    socket.userId = payload.userId;
    socket.userEmail = payload.email;

    next();
  } catch {
    next(new Error('Invalid or expired token'));
  }
}
