/**
 * Follows Controller
 * HTTP handlers for follows API
 */

import { FastifyRequest, FastifyReply } from 'fastify';
import { FollowsService } from '../services/follows.service.js';
import { isDemoUserId } from '../utils/demoId.util.js';
import { FollowBody, ListFollowsQuery, handleListFollows } from './follows/follows-schemas.js';

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
    return handleListFollows(request, reply, 'followers', request.user!.id);
  },

  /**
   * Get users I'm following
   * GET /follows/following
   */
  async getMyFollowing(
    request: FastifyRequest<{ Querystring: ListFollowsQuery }>,
    reply: FastifyReply
  ) {
    return handleListFollows(request, reply, 'following', request.user!.id);
  },

  /**
   * Get followers of a specific user
   * GET /follows/user/:userId/followers
   */
  async getUserFollowers(
    request: FastifyRequest<{ Params: { userId: string }; Querystring: ListFollowsQuery }>,
    reply: FastifyReply
  ) {
    return handleListFollows(request, reply, 'followers', request.params.userId);
  },

  /**
   * Get users that a specific user is following
   * GET /follows/user/:userId/following
   */
  async getUserFollowing(
    request: FastifyRequest<{ Params: { userId: string }; Querystring: ListFollowsQuery }>,
    reply: FastifyReply
  ) {
    return handleListFollows(request, reply, 'following', request.params.userId);
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
