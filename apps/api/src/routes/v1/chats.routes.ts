/**
 * Chat Routes
 * Handles chat and messaging endpoints
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { MessageType } from '@prisma/client';
import { chatService } from '../../services/chat.service.js';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import { isDemoUserId, isDemoId } from '../../utils/demoId.util.js';
import { RATE_LIMITS } from '../../config/rate-limits.js';

export default async function chatsRoutes(app: FastifyInstance) {
  // Apply auth middleware to all routes
  app.addHook('preHandler', authMiddleware);

  /**
   * GET /chats - Get user's chats
   */
  app.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
    const userId = request.user!.id;
    const { limit, offset, is_temporary } = request.query as {
      limit?: string;
      offset?: string;
      is_temporary?: string;
    };

    const result = await chatService.getUserChats(userId, {
      limit: limit ? parseInt(limit) : undefined,
      offset: offset ? parseInt(offset) : undefined,
      isTemporary: is_temporary !== undefined ? is_temporary === 'true' : undefined,
    });

    return reply.send(result);
  });

  /**
   * GET /chats/:chatId - Get chat by ID
   */
  app.get('/:chatId', async (request: FastifyRequest, reply: FastifyReply) => {
    const userId = request.user!.id;
    const { chatId } = request.params as { chatId: string };

    const chat = await chatService.getChatById(chatId, userId);

    if (!chat) {
      return reply.code(404).send({ error: 'Chat not found' });
    }

    return reply.send({ chat });
  });

  /**
   * POST /chats - Create or get chat with user
   */
  app.post('/', async (request: FastifyRequest, reply: FastifyReply) => {
    const userId = request.user!.id;
    const { otherUserId, other_user_id, isTemporary, is_temporary } = request.body as {
      otherUserId?: string;
      other_user_id?: string;
      isTemporary?: boolean;
      is_temporary?: boolean;
    };

    const targetUserId = otherUserId || other_user_id;
    const temporary = isTemporary ?? is_temporary ?? true;

    if (!targetUserId) {
      return reply.code(400).send({ error: 'otherUserId is required' });
    }

    if (targetUserId === userId) {
      return reply.code(400).send({ error: 'Cannot create chat with yourself' });
    }

    // Reject operations on demo users
    if (isDemoUserId(targetUserId)) {
      return reply.code(400).send({ error: 'Cannot perform operations on demo users' });
    }

    try {
      const chat = await chatService.createOrGetChat(userId, targetUserId, temporary);
      return reply.code(201).send({ chat });
    } catch (error) {
      const err = error as Error;
      if (err.message === 'Target user not found') {
        return reply.code(404).send({ error: 'Target user not found' });
      }
      return reply.code(500).send({ error: err.message });
    }
  });

  /**
   * GET /chats/:chatId/messages - Get messages in a chat
   */
  app.get('/:chatId/messages', async (request: FastifyRequest, reply: FastifyReply) => {
    const userId = request.user!.id;
    const { chatId } = request.params as { chatId: string };
    const { limit, offset } = request.query as { limit?: string; offset?: string };

    const result = await chatService.getMessages(chatId, userId, {
      limit: limit ? parseInt(limit) : undefined,
      offset: offset ? parseInt(offset) : undefined,
    });

    if (!result) {
      return reply.code(404).send({ error: 'Chat not found' });
    }

    return reply.send(result);
  });

  /**
   * POST /chats/:chatId/messages - Send a message
   */
  app.post('/:chatId/messages', { config: { rateLimit: RATE_LIMITS.chat.sendMessage } }, async (request: FastifyRequest, reply: FastifyReply) => {
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
      return reply.code(400).send({ error: 'Cannot perform operations on demo chats' });
    }

    const msgType = messageType || message_type || type || 'TEXT';

    const message = await chatService.sendMessage(chatId, userId, {
      content,
      messageType: msgType as MessageType,
    });

    if (!message) {
      return reply.code(404).send({ error: 'Chat not found or access denied' });
    }

    return reply.code(201).send({ message });
  });

  /**
   * PATCH /chats/:chatId/messages/:messageId/read - Mark message as read
   */
  app.patch(
    '/:chatId/messages/:messageId/read',
    async (request: FastifyRequest, reply: FastifyReply) => {
      const userId = request.user!.id;
      const { messageId } = request.params as { chatId: string; messageId: string };

      const result = await chatService.markMessageAsRead(messageId, userId);

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
      const userId = request.user!.id;
      const { chatId, messageId } = request.params as { chatId: string; messageId: string };

      // Reject operations on demo chats/messages
      if (isDemoId(chatId) || isDemoId(messageId)) {
        return reply.code(400).send({ error: 'Cannot perform operations on demo content' });
      }

      const result = await chatService.deleteMessage(messageId, userId);

      if (!result) {
        return reply.code(404).send({ error: 'Message not found or not authorized' });
      }

      return reply.send(result);
    }
  );
}
