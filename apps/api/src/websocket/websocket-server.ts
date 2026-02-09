/**
 * WebSocket Server
 * Socket.io server initialization and connection handling
 */

import { Server as HttpServer } from 'http';
import { Server } from 'socket.io';
import { redis } from '../lib/redis.js';
import { env } from '../config/env.js';
import { logger } from '../lib/logger.js';
import { setupPresenceHandlers } from './handlers/presence.handler.js';
import { setupChatHandlers } from './handlers/chat.handler.js';
import { AuthenticatedSocket, authMiddleware } from './websocket-auth.js';
import {
  startStaleSocketCleanup,
  setCleanupInterval,
} from './websocket-presence.js';

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
  io.use(authMiddleware);

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
  const interval = startStaleSocketCleanup(io);
  setCleanupInterval(interval);

  return io;
}
