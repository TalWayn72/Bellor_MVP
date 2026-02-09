/**
 * Chat Handler
 * Connection/room handlers: join, leave
 * Message handlers delegated to chat-messaging.handler.ts
 */

import { Server } from 'socket.io';
import { AuthenticatedSocket } from '../index.js';
import { prisma } from '../../lib/prisma.js';
import { setupChatMessagingHandlers } from './chat-messaging.handler.js';
import { logger } from '../../lib/logger.js';

/**
 * Setup chat handlers for real-time messaging
 * Returns cleanup function to remove all listeners
 */
export function setupChatHandlers(io: Server, socket: AuthenticatedSocket): () => void {
  /**
   * Join a conversation room
   */
  const handleChatJoin = async (data: { chatId: string }, callback?: (response: unknown) => void) => {
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

      logger.debug('CHAT', `User ${socket.userId} joined conversation ${chatId}`);

      callback?.({
        success: true,
        data: {
          chatId,
        },
      });
    } catch (error) {
      logger.error('CHAT', 'Error joining conversation', error instanceof Error ? error : undefined);
      callback?.({
        error: 'Failed to join conversation',
      });
    }
  };

  /**
   * Leave a conversation room
   */
  const handleChatLeave = async (data: { chatId: string }, callback?: (response: unknown) => void) => {
    if (!socket.userId) {
      return callback?.({
        error: 'Unauthorized',
      });
    }

    try {
      const { chatId } = data;

      // Leave room
      await socket.leave(`conversation:${chatId}`);

      logger.debug('CHAT', `User ${socket.userId} left conversation ${chatId}`);

      callback?.({
        success: true,
      });
    } catch (error) {
      logger.error('CHAT', 'Error leaving conversation', error instanceof Error ? error : undefined);
      callback?.({
        error: 'Failed to leave conversation',
      });
    }
  };

  // Register event handlers
  socket.on('chat:join', handleChatJoin);
  socket.on('chat:leave', handleChatLeave);

  // Setup message-related handlers (send, read, typing, unread, delete)
  const cleanupMessagingHandlers = setupChatMessagingHandlers(io, socket);

  // Return cleanup function to remove all listeners
  return () => {
    socket.off('chat:join', handleChatJoin);
    socket.off('chat:leave', handleChatLeave);
    cleanupMessagingHandlers();
  };
}
