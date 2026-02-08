/**
 * Admin Controller - Message Management Handlers
 */

import { FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { chatService } from '../../services/chat.service.js';
import { logger } from '../../lib/logger.js';
import { adminDeleteMessageSchema } from './admin-schemas.js';

export async function deleteMessage(
  request: FastifyRequest<{ Params: { messageId: string } }>,
  reply: FastifyReply
) {
  try {
    const { messageId } = adminDeleteMessageSchema.parse(request.params);
    const adminId = request.user?.id;

    const result = await chatService.adminDeleteMessage(messageId);

    if (!result) {
      return reply.code(404).send({
        success: false,
        error: { code: 'MESSAGE_NOT_FOUND', message: 'Message not found' },
      });
    }

    if ('alreadyDeleted' in result) {
      return reply.code(409).send({
        success: false,
        error: { code: 'ALREADY_DELETED', message: 'Message already deleted' },
      });
    }

    logger.info('ADMIN', `Admin ${adminId} deleted message ${messageId}`);

    return reply.code(204).send();
  } catch (error) {
    if (error instanceof z.ZodError) {
      return reply.code(400).send({
        success: false,
        error: { code: 'VALIDATION_ERROR', details: error.errors },
      });
    }
    logger.error('ADMIN', 'Failed to delete message', error instanceof Error ? error : undefined);
    return reply.code(500).send({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to delete message' },
    });
  }
}
