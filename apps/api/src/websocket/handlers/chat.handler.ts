/**
 * Chat Handler
 * Connection/room handlers: join, leave
 * Message handlers delegated to chat-messaging.handler.ts
 */

import { Server } from 'socket.io';
import { AuthenticatedSocket } from '../index.js';
import { prisma } from '../../lib/prisma.js';
import { setupChatMessagingHandlers } from './chat-messaging.handler.js';

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

  // Setup message-related handlers (send, read, typing, unread, delete)
  setupChatMessagingHandlers(io, socket);
}
