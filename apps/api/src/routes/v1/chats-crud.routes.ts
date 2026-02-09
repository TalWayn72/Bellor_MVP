/**
 * Chat CRUD Routes
 * Get, create, and delete chat endpoints
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { chatService } from '../../services/chat.service.js';
import { isDemoUserId } from '../../utils/demoId.util.js';

export default async function chatsCrudRoutes(app: FastifyInstance) {
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
      isTemporary: is_temporary !== undefined
        ? is_temporary === 'true'
        : undefined,
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
    const { otherUserId, other_user_id, isTemporary, is_temporary } =
      request.body as {
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
      return reply.code(400).send({
        error: 'Cannot create chat with yourself',
      });
    }

    // Reject operations on demo users
    if (isDemoUserId(targetUserId)) {
      return reply.code(400).send({
        error: 'Cannot perform operations on demo users',
      });
    }

    try {
      const chat = await chatService.createOrGetChat(
        userId, targetUserId, temporary
      );
      return reply.code(201).send({ chat });
    } catch (error) {
      const err = error as Error;
      if (err.message === 'Target user not found') {
        return reply.code(404).send({ error: 'Target user not found' });
      }
      return reply.code(500).send({ error: err.message });
    }
  });
}
