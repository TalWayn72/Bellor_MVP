import { FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { ResponsesService } from '../services/responses.service.js';

// Validation schemas
const createResponseSchema = z.object({
  missionId: z.string().optional(),
  responseType: z.enum(['TEXT', 'VOICE', 'VIDEO', 'DRAWING']),
  content: z.string().min(1),
  textContent: z.string().optional(),
  thumbnailUrl: z.string().url().optional(),
  duration: z.number().int().min(0).optional(),
  isPublic: z.boolean().optional().default(true),
});

const listResponsesQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(1000).optional().default(20),
  offset: z.coerce.number().int().min(0).optional().default(0),
  userId: z.string().optional(),
  missionId: z.string().optional(),
  responseType: z.enum(['TEXT', 'VOICE', 'VIDEO', 'DRAWING']).optional(),
  isPublic: z.coerce.boolean().optional(),
});

export class ResponsesController {
  /**
   * POST /responses
   * Create a new response
   */
  static async createResponse(request: FastifyRequest, reply: FastifyReply) {
    try {
      const data = createResponseSchema.parse(request.body);
      const userId = request.user!.userId;

      const response = await ResponsesService.createResponse({
        ...data,
        userId,
      });

      return reply.code(201).send({
        success: true,
        data: response,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request body',
            details: error.errors,
          },
        });
      }

      request.log.error({ error }, 'Error creating response');
      return reply.code(500).send({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An error occurred while creating the response',
        },
      });
    }
  }

  /**
   * GET /responses
   * List responses with pagination
   */
  static async listResponses(request: FastifyRequest, reply: FastifyReply) {
    try {
      const query = listResponsesQuerySchema.parse(request.query);

      const result = await ResponsesService.listResponses({
        limit: query.limit,
        offset: query.offset,
        userId: query.userId,
        missionId: query.missionId,
        responseType: query.responseType,
        isPublic: query.isPublic,
      });

      return reply.code(200).send({
        success: true,
        data: result.responses,
        pagination: result.pagination,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid query parameters',
            details: error.errors,
          },
        });
      }

      request.log.error({ error }, 'Error listing responses');
      return reply.code(500).send({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An error occurred while fetching responses',
        },
      });
    }
  }

  /**
   * GET /responses/my
   * Get current user's responses
   */
  static async getMyResponses(request: FastifyRequest, reply: FastifyReply) {
    try {
      const query = listResponsesQuerySchema.parse(request.query);
      const userId = request.user!.userId;

      const result = await ResponsesService.getUserResponses(userId, {
        limit: query.limit,
        offset: query.offset,
      });

      return reply.code(200).send({
        success: true,
        data: result.responses,
        pagination: result.pagination,
      });
    } catch (error) {
      request.log.error({ error }, 'Error getting my responses');
      return reply.code(500).send({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An error occurred while fetching your responses',
        },
      });
    }
  }

  /**
   * GET /responses/:id
   * Get response by ID
   */
  static async getResponseById(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      const { id } = request.params;

      const response = await ResponsesService.getResponseById(id);

      // Increment view count
      await ResponsesService.incrementViewCount(id);

      return reply.code(200).send({
        success: true,
        data: response,
      });
    } catch (error) {
      if (error instanceof Error && error.message === 'Response not found') {
        return reply.code(404).send({
          success: false,
          error: {
            code: 'RESPONSE_NOT_FOUND',
            message: 'Response not found',
          },
        });
      }

      request.log.error({ error }, 'Error getting response');
      return reply.code(500).send({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An error occurred while fetching the response',
        },
      });
    }
  }

  /**
   * POST /responses/:id/like
   * Like a response
   */
  static async likeResponse(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      const { id } = request.params;

      const response = await ResponsesService.incrementLikeCount(id);

      return reply.code(200).send({
        success: true,
        data: { likeCount: response.likeCount },
      });
    } catch (error) {
      request.log.error({ error }, 'Error liking response');
      return reply.code(500).send({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An error occurred while liking the response',
        },
      });
    }
  }

  /**
   * DELETE /responses/:id
   * Delete a response
   */
  static async deleteResponse(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      const { id } = request.params;
      const userId = request.user!.userId;

      await ResponsesService.deleteResponse(id, userId);

      return reply.code(200).send({
        success: true,
        message: 'Response deleted successfully',
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'Response not found') {
          return reply.code(404).send({
            success: false,
            error: {
              code: 'RESPONSE_NOT_FOUND',
              message: 'Response not found',
            },
          });
        }
        if (error.message === 'Unauthorized') {
          return reply.code(403).send({
            success: false,
            error: {
              code: 'UNAUTHORIZED',
              message: 'You can only delete your own responses',
            },
          });
        }
      }

      request.log.error({ error }, 'Error deleting response');
      return reply.code(500).send({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An error occurred while deleting the response',
        },
      });
    }
  }
}
