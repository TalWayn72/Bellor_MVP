/**
 * Achievements Controller
 * HTTP handlers for achievements API
 */

import { FastifyRequest, FastifyReply } from 'fastify';
import { AchievementsService } from '../services/achievements.service.js';

interface ListAchievementsQuery {
  limit?: number;
  offset?: number;
}

export const AchievementsController = {
  /**
   * List all achievements
   * GET /achievements
   */
  async listAchievements(
    request: FastifyRequest<{ Querystring: ListAchievementsQuery }>,
    reply: FastifyReply
  ) {
    const { limit, offset } = request.query;

    try {
      const result = await AchievementsService.listAchievements({
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
   * Get my achievements
   * GET /achievements/my
   */
  async getMyAchievements(
    request: FastifyRequest<{ Querystring: ListAchievementsQuery }>,
    reply: FastifyReply
  ) {
    const userId = request.user!.id;
    const { limit, offset } = request.query;

    try {
      const result = await AchievementsService.getUserAchievements(userId, {
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
   * Get user's achievements
   * GET /achievements/user/:userId
   */
  async getUserAchievements(
    request: FastifyRequest<{ Params: { userId: string }; Querystring: ListAchievementsQuery }>,
    reply: FastifyReply
  ) {
    const { userId } = request.params;
    const { limit, offset } = request.query;

    try {
      const result = await AchievementsService.getUserAchievements(userId, {
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
   * Get achievement by ID
   * GET /achievements/:id
   */
  async getAchievementById(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) {
    const { id } = request.params;

    try {
      const achievement = await AchievementsService.getAchievementById(id);
      return reply.send({ achievement });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return reply.status(404).send({ error: message });
    }
  },

  /**
   * Check and unlock achievements
   * POST /achievements/check
   */
  async checkAchievements(
    request: FastifyRequest,
    reply: FastifyReply
  ) {
    const userId = request.user!.id;

    try {
      const unlocked = await AchievementsService.checkAndUnlockAchievements(userId);
      return reply.send({ unlockedAchievements: unlocked });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return reply.status(500).send({ error: message });
    }
  },

  /**
   * Get achievement stats
   * GET /achievements/:id/stats
   */
  async getAchievementStats(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) {
    const { id } = request.params;

    try {
      const stats = await AchievementsService.getAchievementStats(id);
      return reply.send(stats);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return reply.status(500).send({ error: message });
    }
  },
};
