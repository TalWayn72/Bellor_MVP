import { Server } from 'socket.io';
import { AuthenticatedSocket } from '../index.js';
import { prisma } from '../../lib/prisma.js';
import { redis } from '../../lib/redis.js';
import { PushNotificationsService } from '../../services/push-notifications.service.js';

/**
 * Setup chat handlers for real-time messaging
 */
export function setupChatHandlers(io: Server, socket: AuthenticatedSocket) {
  /**
   * Join a conversation room
   */
  socket.on('chat:join', async (data: { chatId: string }, callback) => {
    if (!socket.userId) {
      return callback?.({
        error: 'Unauthorized',
      });
    }

    try {
      const { chatId } = data;

      // Verify user is part of the conversation (using user1/user2)
      const chat = await prisma.chat.findFirst({
        where: {
          id: chatId,
          OR: [
            { user1Id: socket.userId },
            { user2Id: socket.userId },
          ],
        },
      });

      if (!chat) {
        return callback?.({
          error: 'Conversation not found or access denied',
        });
      }

      // Join room
      await socket.join(`conversation:${chatId}`);

      console.log(`User ${socket.userId} joined conversation ${chatId}`);

      callback?.({
        success: true,
        data: {
          chatId,
        },
      });
    } catch (error) {
      console.error('Error joining conversation:', error);
      callback?.({
        error: 'Failed to join conversation',
      });
    }
  });

  /**
   * Leave a conversation room
   */
  socket.on('chat:leave', async (data: { chatId: string }, callback) => {
    if (!socket.userId) {
      return callback?.({
        error: 'Unauthorized',
      });
    }

    try {
      const { chatId } = data;

      // Leave room
      await socket.leave(`conversation:${chatId}`);

      console.log(`User ${socket.userId} left conversation ${chatId}`);

      callback?.({
        success: true,
      });
    } catch (error) {
      console.error('Error leaving conversation:', error);
      callback?.({
        error: 'Failed to leave conversation',
      });
    }
  });

  /**
   * Send a message
   */
  socket.on('chat:message', async (data: {
    chatId: string;
    content: string;
    metadata?: any;
  }, callback) => {
    if (!socket.userId) {
      return callback?.({
        error: 'Unauthorized',
      });
    }

    try {
      const { chatId, content, metadata } = data;

      // Verify user is part of the conversation
      const chat = await prisma.chat.findFirst({
        where: {
          id: chatId,
          OR: [
            { user1Id: socket.userId },
            { user2Id: socket.userId },
          ],
        },
        include: {
          user1: {
            select: { id: true },
          },
          user2: {
            select: { id: true },
          },
        },
      });

      if (!chat) {
        return callback?.({
          error: 'Conversation not found or access denied',
        });
      }

      // Determine recipient
      const recipientId = chat.user1Id === socket.userId ? chat.user2Id : chat.user1Id;

      // Create message in database
      const message = await prisma.message.create({
        data: {
          chatId,
          senderId: socket.userId,
          content,
          messageType: 'TEXT', // Default message type
          isRead: false,
        },
        include: {
          sender: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              profileImages: true,
            },
          },
        },
      });

      // Update conversation last message
      await prisma.chat.update({
        where: { id: chatId },
        data: {
          lastMessageAt: new Date(),
        },
      });

      // Broadcast message to all participants in the conversation room
      io.to(`conversation:${chatId}`).emit('chat:message:new', {
        message,
        metadata,
      });

      // Send push notification to offline recipient
      const isOnline = await redis.get(`online:${recipientId}`);
      if (!isOnline) {
        try {
          const senderName = message.sender?.firstName || 'Someone';
          await PushNotificationsService.sendNewMessageNotification(
            recipientId,
            senderName,
            chatId,
            content.substring(0, 100)
          );
        } catch (pushError) {
          // Don't fail the message send if push notification fails
          console.error('Failed to send push notification:', pushError);
        }
      }

      callback?.({
        success: true,
        data: message,
      });
    } catch (error) {
      console.error('Error sending message:', error);
      callback?.({
        error: 'Failed to send message',
      });
    }
  });

  /**
   * Mark message as read
   */
  socket.on('chat:message:read', async (data: { messageId: string }, callback) => {
    if (!socket.userId) {
      return callback?.({
        error: 'Unauthorized',
      });
    }

    try {
      const { messageId } = data;

      // Get message
      const message = await prisma.message.findUnique({
        where: { id: messageId },
        include: {
          chat: true,
        },
      });

      if (!message) {
        return callback?.({
          error: 'Message not found',
        });
      }

      // Verify user is part of the chat
      if (message.chat.user1Id !== socket.userId && message.chat.user2Id !== socket.userId) {
        return callback?.({
          error: 'Access denied',
        });
      }

      // Update message read status
      await prisma.message.update({
        where: { id: messageId },
        data: { isRead: true },
      });

      // Notify sender that message was read
      io.to(`user:${message.senderId}`).emit('chat:message:read', {
        messageId,
        readBy: socket.userId,
        timestamp: new Date().toISOString(),
      });

      callback?.({
        success: true,
      });
    } catch (error) {
      console.error('Error marking message as read:', error);
      callback?.({
        error: 'Failed to mark message as read',
      });
    }
  });

  /**
   * Typing indicator
   */
  socket.on('chat:typing', async (data: { chatId: string; isTyping: boolean }) => {
    if (!socket.userId) return;

    try {
      const { chatId, isTyping } = data;

      // Broadcast typing status to conversation room (except sender)
      socket.to(`conversation:${chatId}`).emit('chat:typing', {
        userId: socket.userId,
        chatId,
        isTyping,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error handling typing indicator:', error);
    }
  });

  /**
   * Get unread message count
   */
  socket.on('chat:unread:count', async (callback) => {
    if (!socket.userId) {
      return callback?.({
        error: 'Unauthorized',
      });
    }

    try {
      // Get all chats where user is participant (user1 or user2)
      const chats = await prisma.chat.findMany({
        where: {
          OR: [
            { user1Id: socket.userId },
            { user2Id: socket.userId },
          ],
        },
        select: {
          id: true,
        },
      });

      const chatIds = chats.map((c: { id: string }) => c.id);

      // Count unread messages
      const unreadCount = await prisma.message.count({
        where: {
          chatId: { in: chatIds },
          senderId: { not: socket.userId },
          isRead: false,
        },
      });

      callback?.({
        success: true,
        data: {
          unreadCount,
        },
      });
    } catch (error) {
      console.error('Error getting unread count:', error);
      callback?.({
        error: 'Failed to get unread count',
      });
    }
  });

  /**
   * Delete message
   */
  socket.on('chat:message:delete', async (data: { messageId: string }, callback) => {
    if (!socket.userId) {
      return callback?.({
        error: 'Unauthorized',
      });
    }

    try {
      const { messageId } = data;

      // Get message
      const message = await prisma.message.findUnique({
        where: { id: messageId },
      });

      if (!message || message.senderId !== socket.userId) {
        return callback?.({
          error: 'Message not found or you are not the sender',
        });
      }

      // Soft delete message
      await prisma.message.delete({
        where: { id: messageId },
      });

      // Notify all participants in the conversation
      io.to(`conversation:${message.chatId}`).emit('chat:message:deleted', {
        messageId,
        chatId: message.chatId,
        timestamp: new Date().toISOString(),
      });

      callback?.({
        success: true,
      });
    } catch (error) {
      console.error('Error deleting message:', error);
      callback?.({
        error: 'Failed to delete message',
      });
    }
  });
}
