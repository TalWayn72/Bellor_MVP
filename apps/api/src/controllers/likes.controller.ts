/**
 * Likes Controller
 * HTTP handlers for likes API with Zod validation
 */

import { FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { LikesService } from '../services/likes.service.js';
import { isDemoUserId } from '../utils/demoId.util.js';
import { AppError } from '../lib/app-error.js';
import {
  likeUserBodySchema,
  listLikesQuerySchema,
  targetUserParamsSchema,
  LikeUserBody,
  ListLikesQuery,
} from './likes/likes-schemas.js';
import { LikesResponseController } from './likes/likes-response.controller.js';

function zodError(reply: FastifyReply, error: z.ZodError) {
  return reply.status(400).send({
    error: 'Validation failed',
    details: error.errors,
  });
}

const NOT_FOUND_MESSAGES = ['Target user not found', 'Like not found', 'Response not found', 'Not found'];

export const LikesController = {
  /** POST /likes/user */
  async likeUser(request: FastifyRequest<{ Body: LikeUserBody }>, reply: FastifyReply) {
    try {
      const body = likeUserBodySchema.parse(request.body);
      const userId = request.user!.id;

      if (userId === body.targetUserId) return reply.status(400).send({ error: 'Cannot like yourself' });
      if (isDemoUserId(body.targetUserId)) return reply.status(400).send({ error: 'Cannot perform operations on demo users' });

      const result = await LikesService.likeUser(userId, body.targetUserId, body.likeType);
      return reply.send(result);
    } catch (error: unknown) {
      if (error instanceof z.ZodError) return zodError(reply, error);
      if (error instanceof AppError) return reply.status(error.statusCode).send({ error: error.message });
      const message = error instanceof Error ? error.message : 'Unknown error';
      const status = NOT_FOUND_MESSAGES.includes(message) ? 404 : 500;
      return reply.status(status).send({ error: message });
    }
  },

  /** DELETE /likes/user/:targetUserId */
  async unlikeUser(request: FastifyRequest<{ Params: { targetUserId: string } }>, reply: FastifyReply) {
    try {
      const params = targetUserParamsSchema.parse(request.params);
      const userId = request.user!.id;
      if (isDemoUserId(params.targetUserId)) return reply.status(400).send({ error: 'Cannot perform operations on demo users' });

      const result = await LikesService.unlikeUser(userId, params.targetUserId);
      return reply.send(result);
    } catch (error: unknown) {
      if (error instanceof z.ZodError) return zodError(reply, error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      return reply.status(404).send({ error: message });
    }
  },

  /** POST /likes/response - delegated to LikesResponseController */
  likeResponse: LikesResponseController.likeResponse,

  /** DELETE /likes/response/:responseId - delegated to LikesResponseController */
  unlikeResponse: LikesResponseController.unlikeResponse,

  /** GET /likes/received */
  async getReceivedLikes(request: FastifyRequest<{ Querystring: ListLikesQuery }>, reply: FastifyReply) {
    try {
      const query = listLikesQuerySchema.parse(request.query);
      const userId = request.user!.id;
      const result = await LikesService.getReceivedLikes(userId, {
        limit: query.limit, offset: query.offset, likeType: query.likeType,
      });
      return reply.send(result);
    } catch (error: unknown) {
      if (error instanceof z.ZodError) return zodError(reply, error);
      if (error instanceof AppError) return reply.status(error.statusCode).send({ error: error.message });
      const message = error instanceof Error ? error.message : 'Unknown error';
      return reply.status(500).send({ error: message });
    }
  },

  /** GET /likes/sent */
  async getSentLikes(request: FastifyRequest<{ Querystring: ListLikesQuery }>, reply: FastifyReply) {
    try {
      const query = listLikesQuerySchema.parse(request.query);
      const userId = request.user!.id;
      const result = await LikesService.getSentLikes(userId, {
        limit: query.limit, offset: query.offset, likeType: query.likeType,
      });
      return reply.send(result);
    } catch (error: unknown) {
      if (error instanceof z.ZodError) return zodError(reply, error);
      if (error instanceof AppError) return reply.status(error.statusCode).send({ error: error.message });
      const message = error instanceof Error ? error.message : 'Unknown error';
      return reply.status(500).send({ error: message });
    }
  },

  /** GET /likes/check/:targetUserId */
  async checkLiked(request: FastifyRequest<{ Params: { targetUserId: string } }>, reply: FastifyReply) {
    try {
      const params = targetUserParamsSchema.parse(request.params);
      const userId = request.user!.id;
      const hasLiked = await LikesService.hasLikedUser(userId, params.targetUserId);
      const isMatch = await LikesService.checkMatch(userId, params.targetUserId);
      return reply.send({ hasLiked, isMatch });
    } catch (error: unknown) {
      if (error instanceof z.ZodError) return zodError(reply, error);
      if (error instanceof AppError) return reply.status(error.statusCode).send({ error: error.message });
      const message = error instanceof Error ? error.message : 'Unknown error';
      return reply.status(500).send({ error: message });
    }
  },

  /** GET /likes/response/:responseId - delegated to LikesResponseController */
  getResponseLikes: LikesResponseController.getResponseLikes,
};
