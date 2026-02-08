import { Server } from 'socket.io';
import { AuthenticatedSocket } from '../index.js';
import { logger } from '../../lib/logger.js';
import {
  setUserOnline,
  setUserOffline,
  checkUsersOnline,
  getOnlineUsers,
  extendPresenceTTL,
  storeUserActivity,
} from './presence-tracker.js';

/**
 * Setup presence handlers for online/offline tracking
 */
export function setupPresenceHandlers(_io: Server, socket: AuthenticatedSocket) {
  /** User comes online */
  socket.on('presence:online', async () => {
    if (!socket.userId) return;
    try {
      await setUserOnline(socket.userId);
      socket.broadcast.emit('user:online', {
        userId: socket.userId, timestamp: new Date().toISOString(),
      });
      logger.debug('PRESENCE', `User ${socket.userId} is now online`);
    } catch (error) {
      logger.error('PRESENCE', 'Error handling presence:online', error instanceof Error ? error : undefined);
      socket.emit('error', { code: 'PRESENCE_ERROR', message: 'Failed to update online status' });
    }
  });

  /** User goes offline */
  socket.on('presence:offline', async () => {
    if (!socket.userId) return;
    try {
      await setUserOffline(socket.userId);
      socket.broadcast.emit('user:offline', {
        userId: socket.userId, timestamp: new Date().toISOString(),
      });
      logger.debug('PRESENCE', `User ${socket.userId} is now offline`);
    } catch (error) {
      logger.error('PRESENCE', 'Error handling presence:offline', error instanceof Error ? error : undefined);
      socket.emit('error', { code: 'PRESENCE_ERROR', message: 'Failed to update offline status' });
    }
  });

  /** Get online status of specific users */
  socket.on('presence:check', async (data: { userIds: string[] }, callback) => {
    if (!socket.userId) return callback?.({ error: 'Unauthorized' });
    try {
      const statuses = await checkUsersOnline(data.userIds);
      callback?.({ success: true, data: statuses });
    } catch (error) {
      logger.error('PRESENCE', 'Error checking presence', error instanceof Error ? error : undefined);
      callback?.({ error: 'Failed to check user presence' });
    }
  });

  /** Get all online users */
  socket.on('presence:get-online', async (callback) => {
    if (!socket.userId) return callback?.({ error: 'Unauthorized' });
    try {
      const users = await getOnlineUsers();
      callback?.({ success: true, data: users });
    } catch (error) {
      logger.error('PRESENCE', 'Error getting online users', error instanceof Error ? error : undefined);
      callback?.({ error: 'Failed to get online users' });
    }
  });

  /** Heartbeat to keep connection alive */
  socket.on('presence:heartbeat', async () => {
    if (!socket.userId) return;
    try {
      await extendPresenceTTL(socket.userId);
      socket.emit('presence:heartbeat:ack', { timestamp: new Date().toISOString() });
    } catch (error) {
      logger.error('PRESENCE', 'Error handling heartbeat', error instanceof Error ? error : undefined);
    }
  });

  /** Update user activity status */
  socket.on('presence:activity', async (data: { activity: string; metadata?: Record<string, unknown> }) => {
    if (!socket.userId) return;
    try {
      const { activity, metadata } = data;
      await storeUserActivity(socket.userId, activity, metadata);

      if (activity === 'typing' && metadata?.chatId) {
        socket.to(`conversation:${metadata.chatId}`).emit('user:activity', {
          userId: socket.userId, activity, metadata,
        });
      } else {
        socket.broadcast.emit('user:activity', {
          userId: socket.userId, activity, metadata,
        });
      }
    } catch (error) {
      logger.error('PRESENCE', 'Error handling presence:activity', error instanceof Error ? error : undefined);
    }
  });
}
