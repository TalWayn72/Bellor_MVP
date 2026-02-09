/**
 * Chat Typing & Delete Handler
 * Handles typing indicators and message deletion
 */

import { Server } from 'socket.io';
import { AuthenticatedSocket } from '../index.js';
import { prisma } from '../../lib/prisma.js';
import { logger } from '../../lib/logger.js';

/**
 * Create the typing indicator handler for the given socket
 */
export function createTypingHandler(socket: AuthenticatedSocket) {
  return async (data: { chatId: string; isTyping: boolean }) => {
    if (!socket.userId) return;
    try {
      const { chatId, isTyping } = data;
      socket.to(`conversation:${chatId}`).emit('chat:typing', {
        userId: socket.userId, chatId, isTyping, timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('CHAT', 'Error handling typing indicator', error instanceof Error ? error : undefined);
    }
  };
}

/**
 * Create the message delete handler for the given socket
 */
export function createMessageDeleteHandler(io: Server, socket: AuthenticatedSocket) {
  return async (data: { messageId: string }, callback?: (response: unknown) => void) => {
    if (!socket.userId) {
      return callback?.({ error: 'Unauthorized' });
    }

    try {
      const { messageId } = data;
      const message = await prisma.message.findUnique({ where: { id: messageId } });

      if (!message || message.senderId !== socket.userId) {
        return callback?.({ error: 'Message not found or you are not the sender' });
      }

      await prisma.message.delete({ where: { id: messageId } });

      io.to(`conversation:${message.chatId}`).emit('chat:message:deleted', {
        messageId, chatId: message.chatId, timestamp: new Date().toISOString(),
      });

      callback?.({ success: true });
    } catch (error) {
      logger.error('CHAT', 'Error deleting message', error instanceof Error ? error : undefined);
      callback?.({ error: 'Failed to delete message' });
    }
  };
}
