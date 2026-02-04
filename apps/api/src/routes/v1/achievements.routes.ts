/**
 * Achievements Routes
 * API endpoints for achievements functionality
 */

import { FastifyInstance } from 'fastify';
import { AchievementsController } from '../../controllers/achievements.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';

export default async function achievementsRoutes(app: FastifyInstance) {
  // All routes require authentication
  app.addHook('preHandler', authenticate);

  // List all achievements
  app.get('/', AchievementsController.listAchievements);

  // Get my achievements
  app.get('/my', AchievementsController.getMyAchievements);

  // Check and unlock achievements
  app.post('/check', AchievementsController.checkAchievements);

  // Get user's achievements
  app.get('/user/:userId', AchievementsController.getUserAchievements);

  // Get achievement by ID
  app.get('/:id', AchievementsController.getAchievementById);

  // Get achievement stats
  app.get('/:id/stats', AchievementsController.getAchievementStats);
}
