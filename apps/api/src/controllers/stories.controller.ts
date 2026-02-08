/**
 * Stories Controller
 * Handles HTTP requests for stories (24-hour ephemeral content) with Zod validation
 */

import { FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { StoriesService } from '../services/stories.service.js';
import {
  createStoryBodySchema,
  listStoriesQuerySchema,
  storyIdParamsSchema,
  storyUserParamsSchema,
  CreateStoryBody,
  ListStoriesQuery,
  StoryIdParams,
  StoryUserParams,
} from './stories/stories-schemas.js';

function zodError(reply: FastifyReply, error: z.ZodError) {
  return reply.status(400).send({ error: 'Validation failed', details: error.errors });
}

export const StoriesController = {
  /** POST /api/v1/stories */
  async createStory(request: FastifyRequest<{ Body: CreateStoryBody }>, reply: FastifyReply) {
    try {
      const userId = request.user?.id;
      if (!userId) return reply.status(401).send({ error: 'Unauthorized' });
      const body = createStoryBodySchema.parse(request.body);
      const story = await StoriesService.createStory({ userId, ...body });
      return reply.status(201).send({ message: 'Story created successfully', data: story });
    } catch (error: unknown) {
      if (error instanceof z.ZodError) return zodError(reply, error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      return reply.status(400).send({ error: message });
    }
  },

  /** GET /api/v1/stories/:id */
  async getStory(request: FastifyRequest<{ Params: StoryIdParams }>, reply: FastifyReply) {
    try {
      const params = storyIdParamsSchema.parse(request.params);
      const story = await StoriesService.getStoryById(params.id);
      return reply.send({ data: story });
    } catch (error: unknown) {
      if (error instanceof z.ZodError) return zodError(reply, error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      return reply.status(404).send({ error: message });
    }
  },

  /** GET /api/v1/stories/feed */
  async getFeed(request: FastifyRequest<{ Querystring: ListStoriesQuery }>, reply: FastifyReply) {
    try {
      const userId = request.user?.id;
      if (!userId) return reply.status(401).send({ error: 'Unauthorized' });
      const query = listStoriesQuerySchema.parse(request.query);
      const feed = await StoriesService.getStoriesFeed(userId, {
        limit: query.limit, offset: query.offset,
      });
      return reply.send({ data: feed });
    } catch (error: unknown) {
      if (error instanceof z.ZodError) return zodError(reply, error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      return reply.status(500).send({ error: message });
    }
  },

  /** GET /api/v1/stories/my */
  async getMyStories(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = request.user?.id;
      if (!userId) return reply.status(401).send({ error: 'Unauthorized' });
      const stories = await StoriesService.getStoriesByUser(userId);
      return reply.send({ data: stories });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return reply.status(500).send({ error: message });
    }
  },

  /** GET /api/v1/stories/user/:userId */
  async getStoriesByUser(request: FastifyRequest<{ Params: StoryUserParams }>, reply: FastifyReply) {
    try {
      const params = storyUserParamsSchema.parse(request.params);
      const stories = await StoriesService.getStoriesByUser(params.userId);
      return reply.send({ data: stories });
    } catch (error: unknown) {
      if (error instanceof z.ZodError) return zodError(reply, error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      return reply.status(500).send({ error: message });
    }
  },

  /** POST /api/v1/stories/:id/view */
  async viewStory(request: FastifyRequest<{ Params: StoryIdParams }>, reply: FastifyReply) {
    try {
      const userId = request.user?.id;
      if (!userId) return reply.status(401).send({ error: 'Unauthorized' });
      const params = storyIdParamsSchema.parse(request.params);
      const story = await StoriesService.viewStory(params.id, userId);
      return reply.send({ data: story });
    } catch (error: unknown) {
      if (error instanceof z.ZodError) return zodError(reply, error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      return reply.status(400).send({ error: message });
    }
  },

  /** DELETE /api/v1/stories/:id */
  async deleteStory(request: FastifyRequest<{ Params: StoryIdParams }>, reply: FastifyReply) {
    try {
      const userId = request.user?.id;
      if (!userId) return reply.status(401).send({ error: 'Unauthorized' });
      const params = storyIdParamsSchema.parse(request.params);
      await StoriesService.deleteStory(params.id, userId);
      return reply.send({ message: 'Story deleted successfully' });
    } catch (error: unknown) {
      if (error instanceof z.ZodError) return zodError(reply, error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      return reply.status(400).send({ error: message });
    }
  },

  /** GET /api/v1/stories/stats */
  async getStats(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = request.user?.id;
      if (!userId) return reply.status(401).send({ error: 'Unauthorized' });
      const stats = await StoriesService.getUserStoryStats(userId);
      return reply.send({ data: stats });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return reply.status(500).send({ error: message });
    }
  },

  /** POST /api/v1/stories/cleanup (admin/cron) */
  async cleanup(request: FastifyRequest, reply: FastifyReply) {
    try {
      const user = request.user as unknown as { isAdmin?: boolean } | undefined;
      if (!user?.isAdmin) return reply.status(403).send({ error: 'Admin access required' });
      const result = await StoriesService.cleanupExpiredStories();
      return reply.send({ message: `Cleaned up ${result.deletedCount} expired stories`, ...result });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return reply.status(500).send({ error: message });
    }
  },
};
