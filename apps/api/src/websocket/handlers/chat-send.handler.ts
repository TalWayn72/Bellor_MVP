/**
 * Chat Send Message Handler
 * Handles sending messages in chat conversations
 */

import { Server } from 'socket.io';
import { AuthenticatedSocket } from '../index.js';
import { prisma } from '../../lib/prisma.js';
import { redis } from '../../lib/redis.js';
import { PushNotificationsService } from '../../services/push-notifications.service.js';
import { logger } from '../../lib/logger.js';

/**
 * Create the send message handler for the given socket
 */
export function createSendMessageHandler(io: Server, socket: AuthenticatedSocket) {
  return async (data: {
    chatId: string;
    content: string;
    metadata?: Record<string, unknown>;
  }, callback?: (response: unknown) => void) => {
    if (!socket.userId) {
      return callback?.({ error: 'Unauthorized' });
    }

    try {
      const { chatId, content, metadata } = data;

      const chat = await prisma.chat.findFirst({
        where: {
          id: chatId,
          OR: [{ user1Id: socket.userId }, { user2Id: socket.userId }],
        },
        include: {
          user1: { select: { id: true } },
          user2: { select: { id: true } },
        },
      });

      if (!chat) {
        return callback?.({ error: 'Conversation not found or access denied' });
      }

      const recipientId = chat.user1Id === socket.userId ? chat.user2Id : chat.user1Id;

      const [message] = await prisma.$transaction([
        prisma.message.create({
          data: {
            chatId, senderId: socket.userId, content,
            messageType: 'TEXT', isRead: false,
          },
          include: {
            sender: {
              select: { id: true, firstName: true, lastName: true, profileImages: true },
            },
          },
        }),
        prisma.chat.update({
          where: { id: chatId },
          data: { lastMessageAt: new Date() },
        }),
      ]);

      io.to(`conversation:${chatId}`).emit('chat:message:new', { message, metadata });

      const isOnline = await redis.get(`online:${recipientId}`);
      if (!isOnline) {
        try {
          const senderName = message.sender?.firstName || 'Someone';
          await PushNotificationsService.sendNewMessageNotification(
            recipientId, senderName, chatId, content.substring(0, 100)
          );
        } catch (pushError) {
          logger.error('CHAT', 'Failed to send push notification', pushError instanceof Error ? pushError : undefined);
        }
      }

      callback?.({ success: true, data: message });
    } catch (error) {
      logger.error('CHAT', 'Error sending message', error instanceof Error ? error : undefined);
      callback?.({ error: 'Failed to send message' });
    }
  };
}
