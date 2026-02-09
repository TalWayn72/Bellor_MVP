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
 * Returns cleanup function to remove all listeners
 */
export function setupPresenceHandlers(_io: Server, socket: AuthenticatedSocket): () => void {
  /** User comes online */
  const handlePresenceOnline = async () => {
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
  };

  /** User goes offline */
  const handlePresenceOffline = async () => {
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
  };

  /** Get online status of specific users */
  const handlePresenceCheck = async (data: { userIds: string[] }, callback?: (response: unknown) => void) => {
    if (!socket.userId) return callback?.({ error: 'Unauthorized' });
    try {
      const statuses = await checkUsersOnline(data.userIds);
      callback?.({ success: true, data: statuses });
    } catch (error) {
      logger.error('PRESENCE', 'Error checking presence', error instanceof Error ? error : undefined);
      callback?.({ error: 'Failed to check user presence' });
    }
  };

  /** Get all online users */
  const handlePresenceGetOnline = async (callback?: (response: unknown) => void) => {
    if (!socket.userId) return callback?.({ error: 'Unauthorized' });
    try {
      const users = await getOnlineUsers();
      callback?.({ success: true, data: users });
    } catch (error) {
      logger.error('PRESENCE', 'Error getting online users', error instanceof Error ? error : undefined);
      callback?.({ error: 'Failed to get online users' });
    }
  };

  /** Heartbeat to keep connection alive */
  const handlePresenceHeartbeat = async () => {
    if (!socket.userId) return;
    try {
      await extendPresenceTTL(socket.userId);
      socket.emit('presence:heartbeat:ack', { timestamp: new Date().toISOString() });
    } catch (error) {
      logger.error('PRESENCE', 'Error handling heartbeat', error instanceof Error ? error : undefined);
    }
  };

  /** Update user activity status */
  const handlePresenceActivity = async (data: { activity: string; metadata?: Record<string, unknown> }) => {
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
  };

  // Register event handlers
  socket.on('presence:online', handlePresenceOnline);
  socket.on('presence:offline', handlePresenceOffline);
  socket.on('presence:check', handlePresenceCheck);
  socket.on('presence:get-online', handlePresenceGetOnline);
  socket.on('presence:heartbeat', handlePresenceHeartbeat);
  socket.on('presence:activity', handlePresenceActivity);

  // Return cleanup function to remove all listeners
  return () => {
    socket.off('presence:online', handlePresenceOnline);
    socket.off('presence:offline', handlePresenceOffline);
    socket.off('presence:check', handlePresenceCheck);
    socket.off('presence:get-online', handlePresenceGetOnline);
    socket.off('presence:heartbeat', handlePresenceHeartbeat);
    socket.off('presence:activity', handlePresenceActivity);
  };
}
