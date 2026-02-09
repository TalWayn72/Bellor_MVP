/**
 * Chat Messages Routes
 * Message operations, history, read receipts, and deletion
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { MessageType } from '@prisma/client';
import { chatService } from '../../services/chat.service.js';
import { isDemoId } from '../../utils/demoId.util.js';
import { RATE_LIMITS } from '../../config/rate-limits.js';

export default async function chatsMessagesRoutes(app: FastifyInstance) {
  /**
   * GET /chats/:chatId/messages - Get messages in a chat
   */
  app.get(
    '/:chatId/messages',
    async (request: FastifyRequest, reply: FastifyReply) => {
      const userId = request.user!.id;
      const { chatId } = request.params as { chatId: string };
      const { limit, offset } = request.query as {
        limit?: string;
        offset?: string;
      };

      const result = await chatService.getMessages(chatId, userId, {
        limit: limit ? parseInt(limit) : undefined,
        offset: offset ? parseInt(offset) : undefined,
      });

      if (!result) {
        return reply.code(404).send({ error: 'Chat not found' });
      }

      return reply.send(result);
    }
  );

  /**
   * POST /chats/:chatId/messages - Send a message
   */
  app.post(
    '/:chatId/messages',
    { config: { rateLimit: RATE_LIMITS.chat.sendMessage } },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const userId = request.user!.id;
      const { chatId } = request.params as { chatId: string };
      const { content, messageType, message_type, type } = request.body as {
        content: string;
        messageType?: string;
        message_type?: string;
        type?: string;
      };

      if (!content) {
        return reply.code(400).send({ error: 'content is required' });
      }

      // Reject operations on demo chats
      if (isDemoId(chatId)) {
        return reply.code(400).send({
          error: 'Cannot perform operations on demo chats',
        });
      }

      const msgType = messageType || message_type || type || 'TEXT';

      const message = await chatService.sendMessage(chatId, userId, {
        content,
        messageType: msgType as MessageType,
      });

      if (!message) {
        return reply.code(404).send({
          error: 'Chat not found or access denied',
        });
      }

      return reply.code(201).send({ message });
    }
  );

  /**
   * PATCH /chats/:chatId/messages/:messageId/read - Mark as read
   */
  app.patch(
    '/:chatId/messages/:messageId/read',
    async (request: FastifyRequest, reply: FastifyReply) => {
      const userId = request.user!.id;
      const { messageId } = request.params as {
        chatId: string;
        messageId: string;
      };

      const result = await chatService.markMessageAsRead(messageId, userId);

      if (!result) {
        return reply.code(404).send({
          error: 'Message not found or not authorized',
        });
      }

      return reply.send({ message: result });
    }
  );

  /**
   * DELETE /chats/:chatId/messages/:messageId - Delete a message
   */
  app.delete(
    '/:chatId/messages/:messageId',
    async (request: FastifyRequest, reply: FastifyReply) => {
      const userId = request.user!.id;
      const { chatId, messageId } = request.params as {
        chatId: string;
        messageId: string;
      };

      // Reject operations on demo chats/messages
      if (isDemoId(chatId) || isDemoId(messageId)) {
        return reply.code(400).send({
          error: 'Cannot perform operations on demo content',
        });
      }

      const result = await chatService.deleteMessage(messageId, userId);

      if (!result) {
        return reply.code(404).send({
          error: 'Message not found or not authorized',
        });
      }

      return reply.send(result);
    }
  );
}
