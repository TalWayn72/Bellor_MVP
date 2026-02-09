/**
 * Stories Admin Controller
 * Handles admin/cron story operations (stats, cleanup)
 */

import { FastifyRequest, FastifyReply } from 'fastify';
import { StoriesService } from '../../services/stories.service.js';
import { securityLogger } from '../../security/logger.js';

export const StoriesAdminController = {
  /** GET /api/v1/stories/stats */
  async getStats(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = request.user?.id;
      if (!userId) {
        securityLogger.accessDenied(request, 'stories.getStats');
        return reply.status(401).send({ error: 'Unauthorized' });
      }
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
      if (!user?.isAdmin) {
        securityLogger.accessDenied(request, 'stories.cleanup');
        return reply.status(403).send({ error: 'Admin access required' });
      }
      const result = await StoriesService.cleanupExpiredStories();
      return reply.send({ message: `Cleaned up ${result.deletedCount} expired stories`, ...result });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return reply.status(500).send({ error: message });
    }
  },
};
