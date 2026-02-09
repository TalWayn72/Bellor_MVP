/**
 * Responses Mutations Controller
 * Handles create, delete, and like operations for responses
 */

import { FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { ResponsesService } from '../../services/responses.service.js';
import { createResponseSchema } from './responses-schemas.js';
import { securityLogger } from '../../security/logger.js';

export class ResponsesMutationsController {
  /** POST /responses */
  static async createResponse(request: FastifyRequest, reply: FastifyReply) {
    try {
      const data = createResponseSchema.parse(request.body);
      const userId = request.user!.userId;

      const response = await ResponsesService.createResponse({ ...data, userId });

      return reply.code(201).send({ success: true, data: response });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Invalid request body', details: error.errors },
        });
      }
      request.log.error({ error }, 'Error creating response');
      return reply.code(500).send({
        success: false,
        error: { code: 'INTERNAL_SERVER_ERROR', message: 'An error occurred while creating the response' },
      });
    }
  }

  /** POST /responses/:id/like */
  static async likeResponse(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      const { id } = request.params;
      const response = await ResponsesService.incrementLikeCount(id);
      return reply.code(200).send({ success: true, data: { likeCount: response.likeCount } });
    } catch (error) {
      request.log.error({ error }, 'Error liking response');
      return reply.code(500).send({
        success: false,
        error: { code: 'INTERNAL_SERVER_ERROR', message: 'An error occurred while liking the response' },
      });
    }
  }

  /** DELETE /responses/:id */
  static async deleteResponse(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      const { id } = request.params;
      const userId = request.user!.userId;
      await ResponsesService.deleteResponse(id, userId);
      return reply.code(200).send({ success: true, message: 'Response deleted successfully' });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'Response not found') {
          return reply.code(404).send({
            success: false,
            error: { code: 'RESPONSE_NOT_FOUND', message: 'Response not found' },
          });
        }
        if (error.message === 'Unauthorized') {
          securityLogger.accessDenied(request, 'responses.deleteResponse');
          return reply.code(403).send({
            success: false,
            error: { code: 'UNAUTHORIZED', message: 'You can only delete your own responses' },
          });
        }
      }
      request.log.error({ error }, 'Error deleting response');
      return reply.code(500).send({
        success: false,
        error: { code: 'INTERNAL_SERVER_ERROR', message: 'An error occurred while deleting the response' },
      });
    }
  }
}
