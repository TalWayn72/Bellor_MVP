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

/** Cleanup interval for stale socket entries */
let cleanupInterval: NodeJS.Timeout | null = null;

/**
 * Setup WebSocket server with Socket.io
 */
export function setupWebSocket(httpServer: HttpServer): Server {
  const io = new Server(httpServer, {
    pingInterval: 25000,
    pingTimeout: 20000,
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
    } catch {
      next(new Error('Invalid or expired token'));
    }
  });

  // Connection handler
  io.on('connection', async (socket: AuthenticatedSocket) => {
    logger.info('WEBSOCKET', `User connected: ${socket.userId} (${socket.id})`);

    // Join user-specific room
    if (socket.userId) {
      await socket.join(`user:${socket.userId}`);

      // Store socket ID in Redis for presence tracking (5 min TTL)
      await redis.setex(`socket:${socket.userId}`, 300, socket.id);
      await redis.setex(`online:${socket.userId}`, 300, new Date().toISOString());
    }

    // Periodic presence refresh every 2 minutes to keep TTL alive
    const presenceInterval = setInterval(async () => {
      if (socket.userId) {
        try {
          await redis.setex(`socket:${socket.userId}`, 300, socket.id);
          await redis.setex(`online:${socket.userId}`, 300, new Date().toISOString());
        } catch (error) {
          logger.error('WEBSOCKET', 'Error refreshing presence', error instanceof Error ? error : undefined);
        }
      }
    }, 120000);

    // Setup handlers and store their cleanup functions
    const cleanupPresenceHandlers = setupPresenceHandlers(io, socket);
    const cleanupChatHandlers = setupChatHandlers(io, socket);

    // Cleanup function to prevent memory leaks
    const cleanup = async () => {
      // Clear presence interval
      clearInterval(presenceInterval);

      // Call handler cleanup functions to remove all event listeners
      cleanupPresenceHandlers();
      cleanupChatHandlers();

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

      // Remove disconnect and error listeners
      socket.removeAllListeners('disconnect');
      socket.removeAllListeners('error');
    };

    // Handle disconnection
    socket.on('disconnect', async () => {
      logger.info('WEBSOCKET', `User disconnected: ${socket.userId} (${socket.id})`);
      await cleanup();
    });

    // Error handling - also cleanup on error to prevent memory leaks
    socket.on('error', async (error) => {
      logger.error('WEBSOCKET', `Socket error for user ${socket.userId}`, error instanceof Error ? error : undefined);
      await cleanup();
    });
  });

  // Start periodic cleanup of stale socket entries
  cleanupInterval = startStaleSocketCleanup(io);

  return io;
}

/**
 * Stop the stale socket cleanup interval
 * Should be called during graceful shutdown
 */
export function stopStaleSocketCleanup(): void {
  if (cleanupInterval) {
    clearInterval(cleanupInterval);
    cleanupInterval = null;
    logger.info('WEBSOCKET', 'Stale socket cleanup stopped');
  }
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

/**
 * Clean up stale socket entries in Redis.
 * Removes socket:* and online:* keys that reference sockets
 * no longer connected to the given Socket.io server.
 * Runs periodically to prevent connection leaks.
 */
export function startStaleSocketCleanup(io: Server): NodeJS.Timeout {
  const CLEANUP_INTERVAL = 60000; // Every 60 seconds

  return setInterval(async () => {
    try {
      const socketKeys = await redis.keys('socket:*');
      const connectedSocketIds = new Set<string>();

      for (const [, socket] of io.sockets.sockets) {
        connectedSocketIds.add(socket.id);
      }

      let cleaned = 0;
      for (const key of socketKeys) {
        const storedSocketId = await redis.get(key);
        if (storedSocketId && !connectedSocketIds.has(storedSocketId)) {
          const userId = key.replace('socket:', '');
          await redis.del(key);
          await redis.del(`online:${userId}`);
          cleaned++;
        }
      }

      if (cleaned > 0) {
        logger.info('WEBSOCKET', `Stale socket cleanup: removed ${cleaned} stale entries`);
      }
    } catch (error) {
      logger.error('WEBSOCKET', 'Error during stale socket cleanup', error instanceof Error ? error : undefined);
    }
  }, CLEANUP_INTERVAL);
}
