/**
 * Likes Controller
 * HTTP handlers for likes API
 */

import { FastifyRequest, FastifyReply } from 'fastify';
import { LikesService } from '../services/likes.service.js';
import { LikeType } from '@prisma/client';
import { isDemoUserId, isDemoId } from '../utils/demoId.util.js';

interface LikeUserBody {
  targetUserId: string;
  likeType?: LikeType;
}

interface LikeResponseBody {
  responseId: string;
}

interface ListLikesQuery {
  limit?: number;
  offset?: number;
  likeType?: LikeType;
}

export const LikesController = {
  /**
   * Like a user
   * POST /likes/user
   */
  async likeUser(
    request: FastifyRequest<{ Body: LikeUserBody }>,
    reply: FastifyReply
  ) {
    const userId = request.user!.id;
    const { targetUserId, likeType } = request.body;

    if (!targetUserId) {
      return reply.status(400).send({ error: 'targetUserId is required' });
    }

    if (userId === targetUserId) {
      return reply.status(400).send({ error: 'Cannot like yourself' });
    }

    // Reject operations on demo users
    if (isDemoUserId(targetUserId)) {
      return reply.status(400).send({ error: 'Cannot perform operations on demo users' });
    }

    try {
      const result = await LikesService.likeUser(userId, targetUserId, likeType);
      return reply.send(result);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      if (message === 'Target user not found') {
        return reply.status(404).send({ error: 'Target user not found' });
      }
      return reply.status(500).send({ error: message });
    }
  },

  /**
   * Unlike a user
   * DELETE /likes/user/:targetUserId
   */
  async unlikeUser(
    request: FastifyRequest<{ Params: { targetUserId: string } }>,
    reply: FastifyReply
  ) {
    const userId = request.user!.id;
    const { targetUserId } = request.params;

    // Reject operations on demo users
    if (isDemoUserId(targetUserId)) {
      return reply.status(400).send({ error: 'Cannot perform operations on demo users' });
    }

    try {
      const result = await LikesService.unlikeUser(userId, targetUserId);
      return reply.send(result);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return reply.status(404).send({ error: message });
    }
  },

  /**
   * Like a response
   * POST /likes/response
   */
  async likeResponse(
    request: FastifyRequest<{ Body: LikeResponseBody }>,
    reply: FastifyReply
  ) {
    const userId = request.user!.id;
    const { responseId } = request.body;

    if (!responseId) {
      return reply.status(400).send({ error: 'responseId is required' });
    }

    // Reject operations on demo responses
    if (isDemoId(responseId)) {
      return reply.status(400).send({ error: 'Cannot perform operations on demo content' });
    }

    try {
      const like = await LikesService.likeResponse(userId, responseId);
      return reply.send({ like });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return reply.status(500).send({ error: message });
    }
  },

  /**
   * Unlike a response
   * DELETE /likes/response/:responseId
   */
  async unlikeResponse(
    request: FastifyRequest<{ Params: { responseId: string } }>,
    reply: FastifyReply
  ) {
    const userId = request.user!.id;
    const { responseId } = request.params;

    // Reject operations on demo responses
    if (isDemoId(responseId)) {
      return reply.status(400).send({ error: 'Cannot perform operations on demo content' });
    }

    try {
      const result = await LikesService.unlikeResponse(userId, responseId);
      return reply.send(result);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return reply.status(404).send({ error: message });
    }
  },

  /**
   * Get likes I received
   * GET /likes/received
   */
  async getReceivedLikes(
    request: FastifyRequest<{ Querystring: ListLikesQuery }>,
    reply: FastifyReply
  ) {
    const userId = request.user!.id;
    const { limit, offset, likeType } = request.query;

    try {
      const result = await LikesService.getReceivedLikes(userId, {
        limit: limit ? Number(limit) : undefined,
        offset: offset ? Number(offset) : undefined,
        likeType,
      });
      return reply.send(result);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return reply.status(500).send({ error: message });
    }
  },

  /**
   * Get likes I sent
   * GET /likes/sent
   */
  async getSentLikes(
    request: FastifyRequest<{ Querystring: ListLikesQuery }>,
    reply: FastifyReply
  ) {
    const userId = request.user!.id;
    const { limit, offset, likeType } = request.query;

    try {
      const result = await LikesService.getSentLikes(userId, {
        limit: limit ? Number(limit) : undefined,
        offset: offset ? Number(offset) : undefined,
        likeType,
      });
      return reply.send(result);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return reply.status(500).send({ error: message });
    }
  },

  /**
   * Check if I liked a user
   * GET /likes/check/:targetUserId
   */
  async checkLiked(
    request: FastifyRequest<{ Params: { targetUserId: string } }>,
    reply: FastifyReply
  ) {
    const userId = request.user!.id;
    const { targetUserId } = request.params;

    try {
      const hasLiked = await LikesService.hasLikedUser(userId, targetUserId);
      const isMatch = await LikesService.checkMatch(userId, targetUserId);
      return reply.send({ hasLiked, isMatch });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return reply.status(500).send({ error: message });
    }
  },

  /**
   * Get likes on a response
   * GET /likes/response/:responseId
   */
  async getResponseLikes(
    request: FastifyRequest<{ Params: { responseId: string }; Querystring: ListLikesQuery }>,
    reply: FastifyReply
  ) {
    const { responseId } = request.params;
    const { limit, offset } = request.query;

    try {
      const result = await LikesService.getResponseLikes(responseId, {
        limit: limit ? Number(limit) : undefined,
        offset: offset ? Number(offset) : undefined,
      });
      return reply.send(result);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return reply.status(500).send({ error: message });
    }
  },
};
