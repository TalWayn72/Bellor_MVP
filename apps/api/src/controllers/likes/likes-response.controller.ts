/**
 * Likes Response Controller
 * Handles HTTP requests for response-related likes (like/unlike/list response likes)
 */

import { FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { LikesService } from '../../services/likes.service.js';
import { AppError } from '../../lib/app-error.js';
import {
  likeResponseBodySchema,
  listLikesQuerySchema,
  responseIdParamsSchema,
  ListLikesQuery,
  ResponseIdParams,
} from './likes-schemas.js';

function zodError(reply: FastifyReply, error: z.ZodError) {
  return reply.status(400).send({
    error: 'Validation failed',
    details: error.errors,
  });
}

const NOT_FOUND_MESSAGES = ['Target user not found', 'Like not found', 'Response not found', 'Not found'];

export const LikesResponseController = {
  /** POST /likes/response */
  async likeResponse(request: FastifyRequest, reply: FastifyReply) {
    try {
      const body = likeResponseBodySchema.parse(request.body);
      const userId = request.user!.id;
      const like = await LikesService.likeResponse(userId, body.responseId);
      return reply.send({ like });
    } catch (error: unknown) {
      if (error instanceof z.ZodError) return zodError(reply, error);
      if (error instanceof AppError) return reply.status(error.statusCode).send({ error: error.message });
      const message = error instanceof Error ? error.message : 'Unknown error';
      const status = NOT_FOUND_MESSAGES.includes(message) ? 404 : 500;
      return reply.status(status).send({ error: message });
    }
  },

  /** DELETE /likes/response/:responseId */
  async unlikeResponse(request: FastifyRequest<{ Params: ResponseIdParams }>, reply: FastifyReply) {
    try {
      const params = responseIdParamsSchema.parse(request.params);
      const userId = request.user!.id;
      const result = await LikesService.unlikeResponse(userId, params.responseId);
      return reply.send(result);
    } catch (error: unknown) {
      if (error instanceof z.ZodError) return zodError(reply, error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      return reply.status(404).send({ error: message });
    }
  },

  /** GET /likes/response/:responseId */
  async getResponseLikes(
    request: FastifyRequest<{ Params: ResponseIdParams; Querystring: ListLikesQuery }>,
    reply: FastifyReply
  ) {
    try {
      const params = responseIdParamsSchema.parse(request.params);
      const query = listLikesQuerySchema.parse(request.query);
      const result = await LikesService.getResponseLikes(params.responseId, {
        limit: query.limit, offset: query.offset,
      });
      return reply.send(result);
    } catch (error: unknown) {
      if (error instanceof z.ZodError) return zodError(reply, error);
      if (error instanceof AppError) return reply.status(error.statusCode).send({ error: error.message });
      const message = error instanceof Error ? error.message : 'Unknown error';
      return reply.status(500).send({ error: message });
    }
  },
};
