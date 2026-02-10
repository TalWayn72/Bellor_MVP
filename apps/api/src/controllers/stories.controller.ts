/**
 * Stories Controller
 * Handles HTTP requests for stories (24-hour ephemeral content) with Zod validation
 */

import { FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { StoriesService } from '../services/stories.service.js';
import { securityLogger } from '../security/logger.js';
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
import { StoriesAdminController } from './stories/stories-admin.controller.js';

function zodError(reply: FastifyReply, error: z.ZodError) {
  return reply.status(400).send({ error: 'Validation failed', details: error.errors });
}

function handleServiceError(reply: FastifyReply, error: unknown, statusMap?: Record<string, number>) {
  if (error instanceof z.ZodError) return zodError(reply, error);
  const message = error instanceof Error ? error.message : 'Unknown error';
  for (const [keyword, status] of Object.entries(statusMap ?? {})) {
    if (message.includes(keyword)) return reply.status(status).send({ error: message });
  }
  return reply.status(400).send({ error: message });
}

export const StoriesController = {
  /** POST /api/v1/stories */
  async createStory(request: FastifyRequest<{ Body: CreateStoryBody }>, reply: FastifyReply) {
    try {
      const userId = request.user?.id;
      if (!userId) {
        securityLogger.accessDenied(request, 'stories.createStory');
        return reply.status(401).send({ error: 'Unauthorized' });
      }
      const body = createStoryBodySchema.parse(request.body);
      const story = await StoriesService.createStory({ userId, ...body });
      return reply.status(201).send({ message: 'Story created successfully', data: story });
    } catch (error: unknown) { return handleServiceError(reply, error); }
  },

  /** GET /api/v1/stories/:id */
  async getStory(request: FastifyRequest<{ Params: StoryIdParams }>, reply: FastifyReply) {
    try {
      const params = storyIdParamsSchema.parse(request.params);
      const story = await StoriesService.getStoryById(params.id);
      return reply.send({ data: story });
    } catch (error: unknown) { return handleServiceError(reply, error, { 'not found': 404 }); }
  },

  /** GET /api/v1/stories/feed */
  async getFeed(request: FastifyRequest<{ Querystring: ListStoriesQuery }>, reply: FastifyReply) {
    try {
      const userId = request.user?.id;
      if (!userId) {
        securityLogger.accessDenied(request, 'stories.getFeed');
        return reply.status(401).send({ error: 'Unauthorized' });
      }
      const query = listStoriesQuerySchema.parse(request.query);
      const feed = await StoriesService.getStoriesFeed(userId, {
        limit: query.limit, offset: query.offset,
      });
      return reply.send({ data: feed });
    } catch (error: unknown) { return handleServiceError(reply, error); }
  },

  /** GET /api/v1/stories/my */
  async getMyStories(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = request.user?.id;
      if (!userId) {
        securityLogger.accessDenied(request, 'stories.getMyStories');
        return reply.status(401).send({ error: 'Unauthorized' });
      }
      const stories = await StoriesService.getStoriesByUser(userId);
      return reply.send({ data: stories });
    } catch (error: unknown) { return handleServiceError(reply, error); }
  },

  /** GET /api/v1/stories/user/:userId */
  async getStoriesByUser(request: FastifyRequest<{ Params: StoryUserParams }>, reply: FastifyReply) {
    try {
      const params = storyUserParamsSchema.parse(request.params);
      const stories = await StoriesService.getStoriesByUser(params.userId);
      return reply.send({ data: stories });
    } catch (error: unknown) { return handleServiceError(reply, error); }
  },

  /** POST /api/v1/stories/:id/view */
  async viewStory(request: FastifyRequest<{ Params: StoryIdParams }>, reply: FastifyReply) {
    try {
      const userId = request.user?.id;
      if (!userId) {
        securityLogger.accessDenied(request, 'stories.viewStory');
        return reply.status(401).send({ error: 'Unauthorized' });
      }
      const params = storyIdParamsSchema.parse(request.params);
      const story = await StoriesService.viewStory(params.id, userId);
      return reply.send({ data: story });
    } catch (error: unknown) { return handleServiceError(reply, error, { 'not found': 404 }); }
  },

  /** DELETE /api/v1/stories/:id */
  async deleteStory(request: FastifyRequest<{ Params: StoryIdParams }>, reply: FastifyReply) {
    try {
      const userId = request.user?.id;
      if (!userId) {
        securityLogger.accessDenied(request, 'stories.deleteStory');
        return reply.status(401).send({ error: 'Unauthorized' });
      }
      const params = storyIdParamsSchema.parse(request.params);
      await StoriesService.deleteStory(params.id, userId);
      return reply.send({ message: 'Story deleted successfully' });
    } catch (error: unknown) {
      return handleServiceError(reply, error, { 'not found': 404, 'Unauthorized': 403 });
    }
  },

  /** GET /api/v1/stories/stats - delegated to StoriesAdminController */
  getStats: StoriesAdminController.getStats,

  /** POST /api/v1/stories/cleanup (admin/cron) - delegated to StoriesAdminController */
  cleanup: StoriesAdminController.cleanup,
};
