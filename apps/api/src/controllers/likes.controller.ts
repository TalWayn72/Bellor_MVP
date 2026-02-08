/**
 * Likes Controller
 * HTTP handlers for likes API
 */

import { FastifyRequest, FastifyReply } from 'fastify';
import { LikesService } from '../services/likes.service.js';
import { isDemoUserId, isDemoId } from '../utils/demoId.util.js';
import { LikeUserBody, LikeResponseBody, ListLikesQuery } from './likes/likes-schemas.js';

export const LikesController = {
  /** POST /likes/user */
  async likeUser(request: FastifyRequest<{ Body: LikeUserBody }>, reply: FastifyReply) {
    const userId = request.user!.id;
    const { targetUserId, likeType } = request.body;

    if (!targetUserId) return reply.status(400).send({ error: 'targetUserId is required' });
    if (userId === targetUserId) return reply.status(400).send({ error: 'Cannot like yourself' });
    if (isDemoUserId(targetUserId)) return reply.status(400).send({ error: 'Cannot perform operations on demo users' });

    try {
      const result = await LikesService.likeUser(userId, targetUserId, likeType);
      return reply.send(result);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      if (message === 'Target user not found') return reply.status(404).send({ error: message });
      return reply.status(500).send({ error: message });
    }
  },

  /** DELETE /likes/user/:targetUserId */
  async unlikeUser(request: FastifyRequest<{ Params: { targetUserId: string } }>, reply: FastifyReply) {
    const userId = request.user!.id;
    const { targetUserId } = request.params;
    if (isDemoUserId(targetUserId)) return reply.status(400).send({ error: 'Cannot perform operations on demo users' });

    try {
      const result = await LikesService.unlikeUser(userId, targetUserId);
      return reply.send(result);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return reply.status(404).send({ error: message });
    }
  },

  /** POST /likes/response */
  async likeResponse(request: FastifyRequest<{ Body: LikeResponseBody }>, reply: FastifyReply) {
    const userId = request.user!.id;
    const { responseId } = request.body;
    if (!responseId) return reply.status(400).send({ error: 'responseId is required' });
    if (isDemoId(responseId)) return reply.status(400).send({ error: 'Cannot perform operations on demo content' });

    try {
      const like = await LikesService.likeResponse(userId, responseId);
      return reply.send({ like });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return reply.status(500).send({ error: message });
    }
  },

  /** DELETE /likes/response/:responseId */
  async unlikeResponse(request: FastifyRequest<{ Params: { responseId: string } }>, reply: FastifyReply) {
    const userId = request.user!.id;
    const { responseId } = request.params;
    if (isDemoId(responseId)) return reply.status(400).send({ error: 'Cannot perform operations on demo content' });

    try {
      const result = await LikesService.unlikeResponse(userId, responseId);
      return reply.send(result);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return reply.status(404).send({ error: message });
    }
  },

  /** GET /likes/received */
  async getReceivedLikes(request: FastifyRequest<{ Querystring: ListLikesQuery }>, reply: FastifyReply) {
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

  /** GET /likes/sent */
  async getSentLikes(request: FastifyRequest<{ Querystring: ListLikesQuery }>, reply: FastifyReply) {
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

  /** GET /likes/check/:targetUserId */
  async checkLiked(request: FastifyRequest<{ Params: { targetUserId: string } }>, reply: FastifyReply) {
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

  /** GET /likes/response/:responseId */
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
