/**
 * WebSocket Presence
 * Presence tracking utilities, user online status, and stale connection cleanup
 */

import { Server } from 'socket.io';
import { redis } from '../lib/redis.js';
import { logger } from '../lib/logger.js';

/** Cleanup interval for stale socket entries */
let cleanupInterval: NodeJS.Timeout | null = null;

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
 * Set the cleanup interval reference (used by websocket-server)
 */
export function setCleanupInterval(interval: NodeJS.Timeout): void {
  cleanupInterval = interval;
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
