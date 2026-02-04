import { Server } from 'socket.io';
import { AuthenticatedSocket } from '../index.js';
import { redis } from '../../lib/redis.js';
import { prisma } from '../../lib/prisma.js';

/**
 * Setup presence handlers for online/offline tracking
 */
export function setupPresenceHandlers(_io: Server, socket: AuthenticatedSocket) {
  /**
   * User comes online
   */
  socket.on('presence:online', async () => {
    if (!socket.userId) return;

    try {
      // Update Redis
      await redis.setex(`online:${socket.userId}`, 3600, new Date().toISOString());

      // Broadcast to all users
      socket.broadcast.emit('user:online', {
        userId: socket.userId,
        timestamp: new Date().toISOString(),
      });

      console.log(`User ${socket.userId} is now online`);
    } catch (error) {
      console.error('Error handling presence:online:', error);
      socket.emit('error', {
        code: 'PRESENCE_ERROR',
        message: 'Failed to update online status',
      });
    }
  });

  /**
   * User goes offline
   */
  socket.on('presence:offline', async () => {
    if (!socket.userId) return;

    try {
      // Remove from Redis
      await redis.del(`online:${socket.userId}`);

      // Broadcast to all users
      socket.broadcast.emit('user:offline', {
        userId: socket.userId,
        timestamp: new Date().toISOString(),
      });

      console.log(`User ${socket.userId} is now offline`);
    } catch (error) {
      console.error('Error handling presence:offline:', error);
      socket.emit('error', {
        code: 'PRESENCE_ERROR',
        message: 'Failed to update offline status',
      });
    }
  });

  /**
   * Get online status of specific users
   */
  socket.on('presence:check', async (data: { userIds: string[] }, callback) => {
    if (!socket.userId) {
      return callback?.({
        error: 'Unauthorized',
      });
    }

    try {
      const { userIds } = data;

      // Check online status for each user
      const statuses = await Promise.all(
        userIds.map(async (userId) => {
          const online = await redis.get(`online:${userId}`);
          return {
            userId,
            isOnline: !!online,
            lastSeen: online || null,
          };
        })
      );

      callback?.({
        success: true,
        data: statuses,
      });
    } catch (error) {
      console.error('Error checking presence:', error);
      callback?.({
        error: 'Failed to check user presence',
      });
    }
  });

  /**
   * Get all online users
   */
  socket.on('presence:get-online', async (callback) => {
    if (!socket.userId) {
      return callback?.({
        error: 'Unauthorized',
      });
    }

    try {
      // Get all online user keys from Redis
      const keys = await redis.keys('online:*');
      const userIds = keys.map((key: string) => key.replace('online:', ''));

      // Get user details from database
      const users = await prisma.user.findMany({
        where: {
          id: { in: userIds },
          isBlocked: true,
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          profileImages: true,
          preferredLanguage: true,
        },
      });

      callback?.({
        success: true,
        data: users,
      });
    } catch (error) {
      console.error('Error getting online users:', error);
      callback?.({
        error: 'Failed to get online users',
      });
    }
  });

  /**
   * Heartbeat to keep connection alive and update presence
   */
  socket.on('presence:heartbeat', async () => {
    if (!socket.userId) return;

    try {
      // Extend TTL in Redis
      await redis.expire(`online:${socket.userId}`, 3600);
      await redis.expire(`socket:${socket.userId}`, 3600);

      // Send acknowledgment
      socket.emit('presence:heartbeat:ack', {
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error handling heartbeat:', error);
    }
  });

  /**
   * Update user activity status (typing, viewing, etc.)
   */
  socket.on('presence:activity', async (data: { activity: string; metadata?: any }) => {
    if (!socket.userId) return;

    try {
      const { activity, metadata } = data;

      // Store activity in Redis with short TTL (30 seconds)
      await redis.setex(
        `activity:${socket.userId}`,
        30,
        JSON.stringify({
          activity,
          metadata,
          timestamp: new Date().toISOString(),
        })
      );

      // Broadcast activity to relevant users
      // For chat typing indicators, send to the specific conversation
      if (activity === 'typing' && metadata?.chatId) {
        socket.to(`conversation:${metadata.chatId}`).emit('user:activity', {
          userId: socket.userId,
          activity,
          metadata,
        });
      } else {
        // Broadcast to all users for general activities
        socket.broadcast.emit('user:activity', {
          userId: socket.userId,
          activity,
          metadata,
        });
      }
    } catch (error) {
      console.error('Error handling presence:activity:', error);
    }
  });
}
