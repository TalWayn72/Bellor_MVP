/**
 * Achievements Controller
 * HTTP handlers for achievements API with Zod validation
 */

import { FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { AchievementsService } from '../services/achievements.service.js';
import {
  listAchievementsQuerySchema,
  achievementIdParamsSchema,
  achievementUserParamsSchema,
  ListAchievementsQuery,
  AchievementIdParams,
  AchievementUserParams,
} from './achievements/achievements-schemas.js';

function zodError(reply: FastifyReply, error: z.ZodError) {
  return reply.status(400).send({ error: 'Validation failed', details: error.errors });
}

export const AchievementsController = {
  /** GET /achievements */
  async listAchievements(
    request: FastifyRequest<{ Querystring: ListAchievementsQuery }>,
    reply: FastifyReply
  ) {
    try {
      const query = listAchievementsQuerySchema.parse(request.query);
      const result = await AchievementsService.listAchievements({
        limit: query.limit, offset: query.offset,
      });
      return reply.send(result);
    } catch (error: unknown) {
      if (error instanceof z.ZodError) return zodError(reply, error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      return reply.status(500).send({ error: message });
    }
  },

  /** GET /achievements/my */
  async getMyAchievements(
    request: FastifyRequest<{ Querystring: ListAchievementsQuery }>,
    reply: FastifyReply
  ) {
    try {
      const userId = request.user!.id;
      const query = listAchievementsQuerySchema.parse(request.query);
      const result = await AchievementsService.getUserAchievements(userId, {
        limit: query.limit, offset: query.offset,
      });
      return reply.send(result);
    } catch (error: unknown) {
      if (error instanceof z.ZodError) return zodError(reply, error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      return reply.status(500).send({ error: message });
    }
  },

  /** GET /achievements/user/:userId */
  async getUserAchievements(
    request: FastifyRequest<{ Params: AchievementUserParams; Querystring: ListAchievementsQuery }>,
    reply: FastifyReply
  ) {
    try {
      const params = achievementUserParamsSchema.parse(request.params);
      const query = listAchievementsQuerySchema.parse(request.query);
      const result = await AchievementsService.getUserAchievements(params.userId, {
        limit: query.limit, offset: query.offset,
      });
      return reply.send(result);
    } catch (error: unknown) {
      if (error instanceof z.ZodError) return zodError(reply, error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      return reply.status(500).send({ error: message });
    }
  },

  /** GET /achievements/:id */
  async getAchievementById(
    request: FastifyRequest<{ Params: AchievementIdParams }>,
    reply: FastifyReply
  ) {
    try {
      const params = achievementIdParamsSchema.parse(request.params);
      const achievement = await AchievementsService.getAchievementById(params.id);
      return reply.send({ achievement });
    } catch (error: unknown) {
      if (error instanceof z.ZodError) return zodError(reply, error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      return reply.status(404).send({ error: message });
    }
  },

  /** POST /achievements/check */
  async checkAchievements(request: FastifyRequest, reply: FastifyReply) {
    const userId = request.user!.id;
    try {
      const unlocked = await AchievementsService.checkAndUnlockAchievements(userId);
      return reply.send({ unlockedAchievements: unlocked });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return reply.status(500).send({ error: message });
    }
  },

  /** GET /achievements/:id/stats */
  async getAchievementStats(
    request: FastifyRequest<{ Params: AchievementIdParams }>,
    reply: FastifyReply
  ) {
    try {
      const params = achievementIdParamsSchema.parse(request.params);
      const stats = await AchievementsService.getAchievementStats(params.id);
      return reply.send(stats);
    } catch (error: unknown) {
      if (error instanceof z.ZodError) return zodError(reply, error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      return reply.status(500).send({ error: message });
    }
  },
};
