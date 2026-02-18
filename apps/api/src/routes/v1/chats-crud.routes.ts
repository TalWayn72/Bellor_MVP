/**
 * Chat CRUD Routes
 * Get, create, and delete chat endpoints
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { chatService } from '../../services/chat.service.js';
import {
  chatListQuerySchema,
  chatIdParamsSchema,
  createChatBodySchema,
} from './chats-schemas.js';

export default async function chatsCrudRoutes(app: FastifyInstance) {
  /**
   * GET /chats - Get user's chats
   */
  app.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
    const result = chatListQuerySchema.safeParse(request.query);
    if (!result.success) {
      return reply.code(400).send({ error: 'Validation failed', details: result.error.errors });
    }
    const userId = request.user!.id;
    const { limit, offset, is_temporary } = result.data;

    const chats = await chatService.getUserChats(userId, {
      limit, offset,
      isTemporary: is_temporary !== undefined ? is_temporary === 'true' : undefined,
    });

    return reply.send(chats);
  });

  /**
   * GET /chats/:chatId - Get chat by ID
   */
  app.get('/:chatId', async (request: FastifyRequest, reply: FastifyReply) => {
    const params = chatIdParamsSchema.safeParse(request.params);
    if (!params.success) {
      return reply.code(400).send({ error: 'Validation failed', details: params.error.errors });
    }
    const userId = request.user!.id;

    const chat = await chatService.getChatById(params.data.chatId, userId);

    if (!chat) {
      return reply.code(404).send({ error: 'Chat not found' });
    }

    return reply.send({ chat });
  });

  /**
   * POST /chats - Create or get chat with user
   */
  app.post('/', async (request: FastifyRequest, reply: FastifyReply) => {
    const body = createChatBodySchema.safeParse(request.body);
    if (!body.success) {
      return reply.code(400).send({ error: 'Validation failed', details: body.error.errors });
    }
    const userId = request.user!.id;
    const { otherUserId, other_user_id, isTemporary, is_temporary } = body.data;

    const targetUserId = (otherUserId || other_user_id)!;
    const temporary = isTemporary ?? is_temporary ?? true;

    if (targetUserId === userId) {
      return reply.code(400).send({ error: 'Cannot create chat with yourself' });
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
}
