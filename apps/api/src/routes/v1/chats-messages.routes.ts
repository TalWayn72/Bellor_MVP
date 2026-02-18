/**
 * Chat Messages Routes
 * Message operations, history, read receipts, and deletion
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { MessageType } from '@prisma/client';
import { chatService } from '../../services/chat.service.js';
import { RATE_LIMITS } from '../../config/rate-limits.js';
import {
  chatIdParamsSchema,
  messageParamsSchema,
  messageListQuerySchema,
  sendMessageBodySchema,
} from './chats-schemas.js';

export default async function chatsMessagesRoutes(app: FastifyInstance) {
  /**
   * GET /chats/:chatId/messages - Get messages in a chat
   */
  app.get(
    '/:chatId/messages',
    async (request: FastifyRequest, reply: FastifyReply) => {
      const params = chatIdParamsSchema.safeParse(request.params);
      if (!params.success) {
        return reply.code(400).send({ error: 'Validation failed', details: params.error.errors });
      }
      const query = messageListQuerySchema.safeParse(request.query);
      if (!query.success) {
        return reply.code(400).send({ error: 'Validation failed', details: query.error.errors });
      }
      const userId = request.user!.id;

      const result = await chatService.getMessages(params.data.chatId, userId, {
        limit: query.data.limit,
        offset: query.data.offset,
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
      const params = chatIdParamsSchema.safeParse(request.params);
      if (!params.success) {
        return reply.code(400).send({ error: 'Validation failed', details: params.error.errors });
      }
      const body = sendMessageBodySchema.safeParse(request.body);
      if (!body.success) {
        return reply.code(400).send({ error: 'Validation failed', details: body.error.errors });
      }
      const userId = request.user!.id;
      const { chatId } = params.data;

      const { content, messageType, message_type, type } = body.data;
      const msgType = messageType || message_type || type || 'TEXT';

      const message = await chatService.sendMessage(chatId, userId, {
        content,
        messageType: msgType as MessageType,
      });

      if (!message) {
        return reply.code(404).send({ error: 'Chat not found or access denied' });
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
      const params = messageParamsSchema.safeParse(request.params);
      if (!params.success) {
        return reply.code(400).send({ error: 'Validation failed', details: params.error.errors });
      }
      const userId = request.user!.id;

      const result = await chatService.markMessageAsRead(params.data.messageId, userId);

      if (!result) {
        return reply.code(404).send({ error: 'Message not found or not authorized' });
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
      const params = messageParamsSchema.safeParse(request.params);
      if (!params.success) {
        return reply.code(400).send({ error: 'Validation failed', details: params.error.errors });
      }
      const userId = request.user!.id;
      const { messageId } = params.data;

      const result = await chatService.deleteMessage(messageId, userId);

      if (!result) {
        return reply.code(404).send({ error: 'Message not found or not authorized' });
      }

      return reply.send(result);
    }
  );
}
