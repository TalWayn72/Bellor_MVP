/**
 * Follows Controller
 * HTTP handlers for follows API with Zod validation
 */

import { FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { FollowsService } from '../services/follows.service.js';
import {
  followBodySchema,
  userIdParamsSchema,
  FollowBody,
  ListFollowsQuery,
  handleListFollows,
} from './follows/follows-schemas.js';

function zodError(reply: FastifyReply, error: z.ZodError) {
  return reply.status(400).send({ error: 'Validation failed', details: error.errors });
}

export const FollowsController = {
  /** POST /follows */
  async follow(request: FastifyRequest<{ Body: FollowBody }>, reply: FastifyReply) {
    try {
      const body = followBodySchema.parse(request.body);
      const followerId = request.user!.id;

      const follow = await FollowsService.followUser(followerId, body.userId);
      return reply.send({ follow });
    } catch (error: unknown) {
      if (error instanceof z.ZodError) return zodError(reply, error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      return reply.status(400).send({ error: message });
    }
  },

  /** DELETE /follows/:userId */
  async unfollow(request: FastifyRequest<{ Params: { userId: string } }>, reply: FastifyReply) {
    try {
      const params = userIdParamsSchema.parse(request.params);
      const followerId = request.user!.id;

      const result = await FollowsService.unfollowUser(followerId, params.userId);
      return reply.send(result);
    } catch (error: unknown) {
      if (error instanceof z.ZodError) return zodError(reply, error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      return reply.status(404).send({ error: message });
    }
  },

  /** GET /follows/followers */
  async getMyFollowers(
    request: FastifyRequest<{ Querystring: ListFollowsQuery }>,
    reply: FastifyReply
  ) {
    return handleListFollows(request, reply, 'followers', request.user!.id);
  },

  /** GET /follows/following */
  async getMyFollowing(
    request: FastifyRequest<{ Querystring: ListFollowsQuery }>,
    reply: FastifyReply
  ) {
    return handleListFollows(request, reply, 'following', request.user!.id);
  },

  /** GET /follows/user/:userId/followers */
  async getUserFollowers(
    request: FastifyRequest<{ Params: { userId: string }; Querystring: ListFollowsQuery }>,
    reply: FastifyReply
  ) {
    try {
      const params = userIdParamsSchema.parse(request.params);
      return handleListFollows(request, reply, 'followers', params.userId);
    } catch (error: unknown) {
      if (error instanceof z.ZodError) return zodError(reply, error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      return reply.status(500).send({ error: message });
    }
  },

  /** GET /follows/user/:userId/following */
  async getUserFollowing(
    request: FastifyRequest<{ Params: { userId: string }; Querystring: ListFollowsQuery }>,
    reply: FastifyReply
  ) {
    try {
      const params = userIdParamsSchema.parse(request.params);
      return handleListFollows(request, reply, 'following', params.userId);
    } catch (error: unknown) {
      if (error instanceof z.ZodError) return zodError(reply, error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      return reply.status(500).send({ error: message });
    }
  },

  /** GET /follows/check/:userId */
  async checkFollowing(request: FastifyRequest<{ Params: { userId: string } }>, reply: FastifyReply) {
    try {
      const params = userIdParamsSchema.parse(request.params);
      const followerId = request.user!.id;

      const isFollowing = await FollowsService.isFollowing(followerId, params.userId);
      const isMutual = await FollowsService.areMutualFollowers(followerId, params.userId);
      return reply.send({ isFollowing, isMutual });
    } catch (error: unknown) {
      if (error instanceof z.ZodError) return zodError(reply, error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      return reply.status(500).send({ error: message });
    }
  },

  /** GET /follows/stats */
  async getStats(request: FastifyRequest, reply: FastifyReply) {
    const userId = request.user!.id;
    try {
      const stats = await FollowsService.getFollowStats(userId);
      return reply.send(stats);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return reply.status(500).send({ error: message });
    }
  },
};
