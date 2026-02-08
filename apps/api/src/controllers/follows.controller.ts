/**
 * Follows Controller
 * HTTP handlers for follows API
 */

import { FastifyRequest, FastifyReply } from 'fastify';
import { FollowsService } from '../services/follows.service.js';
import { isDemoUserId } from '../utils/demoId.util.js';

interface FollowBody {
  userId: string;
}

interface ListFollowsQuery {
  limit?: number;
  offset?: number;
}

export const FollowsController = {
  /**
   * Follow a user
   * POST /follows
   */
  async follow(
    request: FastifyRequest<{ Body: FollowBody }>,
    reply: FastifyReply
  ) {
    const followerId = request.user!.id;
    const { userId: followingId } = request.body;

    if (!followingId) {
      return reply.status(400).send({ error: 'userId is required' });
    }

    // Reject operations on demo users
    if (isDemoUserId(followingId)) {
      return reply.status(400).send({ error: 'Cannot perform operations on demo users' });
    }

    try {
      const follow = await FollowsService.followUser(followerId, followingId);
      return reply.send({ follow });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return reply.status(400).send({ error: message });
    }
  },

  /**
   * Unfollow a user
   * DELETE /follows/:userId
   */
  async unfollow(
    request: FastifyRequest<{ Params: { userId: string } }>,
    reply: FastifyReply
  ) {
    const followerId = request.user!.id;
    const { userId: followingId } = request.params;

    // Reject operations on demo users
    if (isDemoUserId(followingId)) {
      return reply.status(400).send({ error: 'Cannot perform operations on demo users' });
    }

    try {
      const result = await FollowsService.unfollowUser(followerId, followingId);
      return reply.send(result);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return reply.status(404).send({ error: message });
    }
  },

  /**
   * Get my followers
   * GET /follows/followers
   */
  async getMyFollowers(
    request: FastifyRequest<{ Querystring: ListFollowsQuery }>,
    reply: FastifyReply
  ) {
    const userId = request.user!.id;
    const { limit, offset } = request.query;

    try {
      const result = await FollowsService.getFollowers(userId, {
        limit: limit ? Number(limit) : undefined,
        offset: offset ? Number(offset) : undefined,
      });
      return reply.send(result);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return reply.status(500).send({ error: message });
    }
  },

  /**
   * Get users I'm following
   * GET /follows/following
   */
  async getMyFollowing(
    request: FastifyRequest<{ Querystring: ListFollowsQuery }>,
    reply: FastifyReply
  ) {
    const userId = request.user!.id;
    const { limit, offset } = request.query;

    try {
      const result = await FollowsService.getFollowing(userId, {
        limit: limit ? Number(limit) : undefined,
        offset: offset ? Number(offset) : undefined,
      });
      return reply.send(result);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return reply.status(500).send({ error: message });
    }
  },

  /**
   * Get followers of a specific user
   * GET /follows/user/:userId/followers
   */
  async getUserFollowers(
    request: FastifyRequest<{ Params: { userId: string }; Querystring: ListFollowsQuery }>,
    reply: FastifyReply
  ) {
    const { userId } = request.params;
    const { limit, offset } = request.query;

    try {
      const result = await FollowsService.getFollowers(userId, {
        limit: limit ? Number(limit) : undefined,
        offset: offset ? Number(offset) : undefined,
      });
      return reply.send(result);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return reply.status(500).send({ error: message });
    }
  },

  /**
   * Get users that a specific user is following
   * GET /follows/user/:userId/following
   */
  async getUserFollowing(
    request: FastifyRequest<{ Params: { userId: string }; Querystring: ListFollowsQuery }>,
    reply: FastifyReply
  ) {
    const { userId } = request.params;
    const { limit, offset } = request.query;

    try {
      const result = await FollowsService.getFollowing(userId, {
        limit: limit ? Number(limit) : undefined,
        offset: offset ? Number(offset) : undefined,
      });
      return reply.send(result);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return reply.status(500).send({ error: message });
    }
  },

  /**
   * Check if I'm following a user
   * GET /follows/check/:userId
   */
  async checkFollowing(
    request: FastifyRequest<{ Params: { userId: string } }>,
    reply: FastifyReply
  ) {
    const followerId = request.user!.id;
    const { userId: followingId } = request.params;

    try {
      const isFollowing = await FollowsService.isFollowing(followerId, followingId);
      const isMutual = await FollowsService.areMutualFollowers(followerId, followingId);
      return reply.send({ isFollowing, isMutual });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return reply.status(500).send({ error: message });
    }
  },

  /**
   * Get follow stats
   * GET /follows/stats
   */
  async getStats(
    request: FastifyRequest,
    reply: FastifyReply
  ) {
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
