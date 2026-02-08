/**
 * Follows Controller Schemas & Helpers
 * Zod validation schemas and shared handler logic for follows API
 */

import { FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { FollowsService } from '../../services/follows.service.js';

export const followBodySchema = z.object({
  userId: z.string().min(1, 'userId is required'),
});

export const listFollowsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional(),
  offset: z.coerce.number().int().min(0).optional(),
});

export const userIdParamsSchema = z.object({
  userId: z.string().min(1, 'userId is required'),
});

// Inferred types
export type FollowBody = z.infer<typeof followBodySchema>;
export type ListFollowsQuery = z.infer<typeof listFollowsQuerySchema>;
export type UserIdParams = z.infer<typeof userIdParamsSchema>;

/**
 * Generic handler for listing followers/following
 */
export async function handleListFollows(
  request: FastifyRequest<{ Params?: { userId?: string }; Querystring: ListFollowsQuery }>,
  reply: FastifyReply,
  mode: 'followers' | 'following',
  userId: string
) {
  try {
    const query = listFollowsQuerySchema.parse(request.query);
    const serviceFn = mode === 'followers'
      ? FollowsService.getFollowers
      : FollowsService.getFollowing;

    const result = await serviceFn(userId, {
      limit: query.limit,
      offset: query.offset,
    });
    return reply.send(result);
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return reply.status(400).send({ error: 'Validation failed', details: error.errors });
    }
    const message = error instanceof Error ? error.message : 'Unknown error';
    return reply.status(500).send({ error: message });
  }
}
