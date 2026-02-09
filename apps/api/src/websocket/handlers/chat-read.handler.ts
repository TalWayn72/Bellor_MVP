/**
 * Chat Read Handler
 * Handles read receipts and unread message counts
 */

import { Server } from 'socket.io';
import { AuthenticatedSocket } from '../index.js';
import { prisma } from '../../lib/prisma.js';
import { logger } from '../../lib/logger.js';

/**
 * Create the mark-as-read handler for the given socket
 */
export function createMessageReadHandler(io: Server, socket: AuthenticatedSocket) {
  return async (data: { messageId: string }, callback?: (response: unknown) => void) => {
    if (!socket.userId) {
      return callback?.({ error: 'Unauthorized' });
    }

    try {
      const { messageId } = data;
      const message = await prisma.message.findUnique({
        where: { id: messageId },
        include: { chat: true },
      });

      if (!message) {
        return callback?.({ error: 'Message not found' });
      }

      if (message.chat.user1Id !== socket.userId && message.chat.user2Id !== socket.userId) {
        return callback?.({ error: 'Access denied' });
      }

      await prisma.message.update({ where: { id: messageId }, data: { isRead: true } });

      io.to(`user:${message.senderId}`).emit('chat:message:read', {
        messageId, readBy: socket.userId, timestamp: new Date().toISOString(),
      });

      callback?.({ success: true });
    } catch (error) {
      logger.error('CHAT', 'Error marking message as read', error instanceof Error ? error : undefined);
      callback?.({ error: 'Failed to mark message as read' });
    }
  };
}

/**
 * Create the unread count handler for the given socket
 */
export function createUnreadCountHandler(socket: AuthenticatedSocket) {
  return async (callback?: (response: unknown) => void) => {
    if (!socket.userId) {
      return callback?.({ error: 'Unauthorized' });
    }

    try {
      const chats = await prisma.chat.findMany({
        where: { OR: [{ user1Id: socket.userId }, { user2Id: socket.userId }] },
        select: { id: true },
      });
      const chatIds = chats.map((c: { id: string }) => c.id);
      const unreadCount = await prisma.message.count({
        where: { chatId: { in: chatIds }, senderId: { not: socket.userId }, isRead: false },
      });
      callback?.({ success: true, data: { unreadCount } });
    } catch (error) {
      logger.error('CHAT', 'Error getting unread count', error instanceof Error ? error : undefined);
      callback?.({ error: 'Failed to get unread count' });
    }
  };
}
