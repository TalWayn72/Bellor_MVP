/**
 * Follows Controller Schemas & Helpers
 * Type definitions and shared handler logic for follows API
 */

import { FastifyRequest, FastifyReply } from 'fastify';
import { FollowsService } from '../../services/follows.service.js';

export interface FollowBody {
  userId: string;
}

export interface ListFollowsQuery {
  limit?: number;
  offset?: number;
}

/**
 * Generic handler for listing followers/following
 */
export async function handleListFollows(
  request: FastifyRequest<{ Params?: { userId?: string }; Querystring: ListFollowsQuery }>,
  reply: FastifyReply,
  mode: 'followers' | 'following',
  userId: string
) {
  const { limit, offset } = request.query;

  try {
    const serviceFn = mode === 'followers'
      ? FollowsService.getFollowers
      : FollowsService.getFollowing;

    const result = await serviceFn(userId, {
      limit: limit ? Number(limit) : undefined,
      offset: offset ? Number(offset) : undefined,
    });
    return reply.send(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return reply.status(500).send({ error: message });
  }
}
