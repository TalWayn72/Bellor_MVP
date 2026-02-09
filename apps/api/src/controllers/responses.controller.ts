import { FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { ResponsesService } from '../services/responses.service.js';
import { listResponsesQuerySchema } from './responses/responses-schemas.js';
import { ResponsesMutationsController } from './responses/responses-mutations.controller.js';

export class ResponsesController {
  /** POST /responses - delegated to ResponsesMutationsController */
  static createResponse = ResponsesMutationsController.createResponse;

  /**
   * GET /responses
   */
  static async listResponses(request: FastifyRequest, reply: FastifyReply) {
    try {
      const query = listResponsesQuerySchema.parse(request.query);
      const result = await ResponsesService.listResponses({
        limit: query.limit, offset: query.offset,
        userId: query.userId, missionId: query.missionId,
        responseType: query.responseType, isPublic: query.isPublic,
      });
      return reply.code(200).send({ success: true, data: result.responses, pagination: result.pagination });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Invalid query parameters', details: error.errors },
        });
      }
      request.log.error({ error }, 'Error listing responses');
      return reply.code(500).send({
        success: false,
        error: { code: 'INTERNAL_SERVER_ERROR', message: 'An error occurred while fetching responses' },
      });
    }
  }

  /**
   * GET /responses/my
   */
  static async getMyResponses(request: FastifyRequest, reply: FastifyReply) {
    try {
      const query = listResponsesQuerySchema.parse(request.query);
      const userId = request.user!.userId;
      const result = await ResponsesService.getUserResponses(userId, { limit: query.limit, offset: query.offset });
      return reply.code(200).send({ success: true, data: result.responses, pagination: result.pagination });
    } catch (error) {
      request.log.error({ error }, 'Error getting my responses');
      return reply.code(500).send({
        success: false,
        error: { code: 'INTERNAL_SERVER_ERROR', message: 'An error occurred while fetching your responses' },
      });
    }
  }

  /**
   * GET /responses/:id
   */
  static async getResponseById(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      const { id } = request.params;
      const response = await ResponsesService.getResponseById(id);
      await ResponsesService.incrementViewCount(id);
      return reply.code(200).send({ success: true, data: response });
    } catch (error) {
      if (error instanceof Error && error.message === 'Response not found') {
        return reply.code(404).send({
          success: false,
          error: { code: 'RESPONSE_NOT_FOUND', message: 'Response not found' },
        });
      }
      request.log.error({ error }, 'Error getting response');
      return reply.code(500).send({
        success: false,
        error: { code: 'INTERNAL_SERVER_ERROR', message: 'An error occurred while fetching the response' },
      });
    }
  }

  /** POST /responses/:id/like - delegated to ResponsesMutationsController */
  static likeResponse = ResponsesMutationsController.likeResponse;

  /** DELETE /responses/:id - delegated to ResponsesMutationsController */
  static deleteResponse = ResponsesMutationsController.deleteResponse;
}
