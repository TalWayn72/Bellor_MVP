import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { verifyAccessToken } from '../utils/jwt.util.js';
import { redis } from '../lib/redis.js';
import { env } from '../config/env.js';
import { logger } from '../lib/logger.js';
import { setupPresenceHandlers } from './handlers/presence.handler.js';
import { setupChatHandlers } from './handlers/chat.handler.js';

export interface AuthenticatedSocket extends Socket {
  userId?: string;
  userEmail?: string;
}

/**
 * Setup WebSocket server with Socket.io
 */
export function setupWebSocket(httpServer: HttpServer): Server {
  const io = new Server(httpServer, {
    cors: {
      origin: env.FRONTEND_URL || 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  // Authentication middleware for Socket.io
  io.use(async (socket: AuthenticatedSocket, next) => {
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
    } catch (error) {
      next(new Error('Invalid or expired token'));
    }
  });

  // Connection handler
  io.on('connection', async (socket: AuthenticatedSocket) => {
    logger.info('WEBSOCKET', `User connected: ${socket.userId} (${socket.id})`);

    // Join user-specific room
    if (socket.userId) {
      await socket.join(`user:${socket.userId}`);

      // Store socket ID in Redis for presence tracking
      await redis.setex(`socket:${socket.userId}`, 3600, socket.id);
      await redis.setex(`online:${socket.userId}`, 3600, new Date().toISOString());
    }

    // Setup handlers
    setupPresenceHandlers(io, socket);
    setupChatHandlers(io, socket);

    // Handle disconnection
    socket.on('disconnect', async () => {
      logger.info('WEBSOCKET', `User disconnected: ${socket.userId} (${socket.id})`);

      if (socket.userId) {
        // Remove from Redis
        await redis.del(`socket:${socket.userId}`);
        await redis.del(`online:${socket.userId}`);

        // Notify others that user went offline
        socket.broadcast.emit('user:offline', {
          userId: socket.userId,
          timestamp: new Date().toISOString(),
        });
      }
    });

    // Error handling
    socket.on('error', (error) => {
      logger.error('WEBSOCKET', `Socket error for user ${socket.userId}`, error instanceof Error ? error : undefined);
    });
  });

  return io;
}

/**
 * Send message to specific user
 */
export async function sendToUser(
  io: Server,
  userId: string,
  event: string,
  data: Record<string, unknown>
): Promise<boolean> {
  try {
    const socketId = await redis.get(`socket:${userId}`);

    if (socketId) {
      io.to(`user:${userId}`).emit(event, data);
      return true;
    }

    return false; // User not online
  } catch (error) {
    logger.error('WEBSOCKET', 'Error sending message to user', error instanceof Error ? error : undefined);
    return false;
  }
}

/**
 * Check if user is online
 */
export async function isUserOnline(userId: string): Promise<boolean> {
  try {
    const online = await redis.get(`online:${userId}`);
    return !!online;
  } catch (error) {
    logger.error('WEBSOCKET', 'Error checking user online status', error instanceof Error ? error : undefined);
    return false;
  }
}

/**
 * Get all online users
 */
export async function getOnlineUsers(): Promise<string[]> {
  try {
    const keys = await redis.keys('online:*');
    return keys.map((key: string) => key.replace('online:', ''));
  } catch (error) {
    logger.error('WEBSOCKET', 'Error getting online users', error instanceof Error ? error : undefined);
    return [];
  }
}
