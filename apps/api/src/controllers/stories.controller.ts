/**
 * Stories Controller
 * Handles HTTP requests for stories (24-hour ephemeral content)
 */

import { FastifyRequest, FastifyReply } from 'fastify';
import { StoriesService } from '../services/stories.service.js';
import { MediaType } from '@prisma/client';

interface CreateStoryBody {
  mediaType: MediaType;
  mediaUrl: string;
  thumbnailUrl?: string;
  caption?: string;
}

interface ListStoriesQuery {
  limit?: number;
  offset?: number;
}

export const StoriesController = {
  /**
   * Create a new story
   * POST /api/v1/stories
   */
  async createStory(
    request: FastifyRequest<{ Body: CreateStoryBody }>,
    reply: FastifyReply
  ) {
    try {
      const userId = request.user?.id;
      if (!userId) {
        return reply.status(401).send({ error: 'Unauthorized' });
      }

      const { mediaType, mediaUrl, thumbnailUrl, caption } = request.body;

      const story = await StoriesService.createStory({
        userId,
        mediaType,
        mediaUrl,
        thumbnailUrl,
        caption,
      });

      return reply.status(201).send({
        message: 'Story created successfully',
        data: story,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return reply.status(400).send({ error: message });
    }
  },

  /**
   * Get story by ID
   * GET /api/v1/stories/:id
   */
  async getStory(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) {
    try {
      const story = await StoriesService.getStoryById(request.params.id);
      return reply.send({ data: story });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return reply.status(404).send({ error: message });
    }
  },

  /**
   * Get stories feed
   * GET /api/v1/stories/feed
   */
  async getFeed(
    request: FastifyRequest<{ Querystring: ListStoriesQuery }>,
    reply: FastifyReply
  ) {
    try {
      const userId = request.user?.id;
      if (!userId) {
        return reply.status(401).send({ error: 'Unauthorized' });
      }

      const { limit, offset } = request.query;

      const feed = await StoriesService.getStoriesFeed(userId, {
        limit: limit ? parseInt(String(limit)) : undefined,
        offset: offset ? parseInt(String(offset)) : undefined,
      });

      return reply.send({ data: feed });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return reply.status(500).send({ error: message });
    }
  },

  /**
   * Get current user's stories
   * GET /api/v1/stories/my
   */
  async getMyStories(
    request: FastifyRequest,
    reply: FastifyReply
  ) {
    try {
      const userId = request.user?.id;
      if (!userId) {
        return reply.status(401).send({ error: 'Unauthorized' });
      }

      const stories = await StoriesService.getStoriesByUser(userId);
      return reply.send({ data: stories });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return reply.status(500).send({ error: message });
    }
  },

  /**
   * Get stories by user ID
   * GET /api/v1/stories/user/:userId
   */
  async getStoriesByUser(
    request: FastifyRequest<{ Params: { userId: string } }>,
    reply: FastifyReply
  ) {
    try {
      const stories = await StoriesService.getStoriesByUser(request.params.userId);
      return reply.send({ data: stories });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return reply.status(500).send({ error: message });
    }
  },

  /**
   * Mark story as viewed
   * POST /api/v1/stories/:id/view
   */
  async viewStory(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) {
    try {
      const userId = request.user?.id;
      if (!userId) {
        return reply.status(401).send({ error: 'Unauthorized' });
      }

      const story = await StoriesService.viewStory(request.params.id, userId);
      return reply.send({ data: story });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return reply.status(400).send({ error: message });
    }
  },

  /**
   * Delete a story
   * DELETE /api/v1/stories/:id
   */
  async deleteStory(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) {
    try {
      const userId = request.user?.id;
      if (!userId) {
        return reply.status(401).send({ error: 'Unauthorized' });
      }

      await StoriesService.deleteStory(request.params.id, userId);
      return reply.send({ message: 'Story deleted successfully' });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return reply.status(400).send({ error: message });
    }
  },

  /**
   * Get story statistics for current user
   * GET /api/v1/stories/stats
   */
  async getStats(
    request: FastifyRequest,
    reply: FastifyReply
  ) {
    try {
      const userId = request.user?.id;
      if (!userId) {
        return reply.status(401).send({ error: 'Unauthorized' });
      }

      const stats = await StoriesService.getUserStoryStats(userId);
      return reply.send({ data: stats });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return reply.status(500).send({ error: message });
    }
  },

  /**
   * Cleanup expired stories (admin/cron endpoint)
   * POST /api/v1/stories/cleanup
   */
  async cleanup(
    request: FastifyRequest,
    reply: FastifyReply
  ) {
    try {
      const user = request.user as unknown as { isAdmin?: boolean } | undefined;
      if (!user?.isAdmin) {
        return reply.status(403).send({ error: 'Admin access required' });
      }

      const result = await StoriesService.cleanupExpiredStories();
      return reply.send({
        message: `Cleaned up ${result.deletedCount} expired stories`,
        ...result,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return reply.status(500).send({ error: message });
    }
  },
};
