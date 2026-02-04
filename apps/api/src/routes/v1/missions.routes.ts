import { FastifyInstance } from 'fastify';
import { MissionsController } from '../../controllers/missions.controller.js';
import { authMiddleware } from '../../middleware/auth.middleware.js';

export default async function missionsRoutes(app: FastifyInstance) {
  /**
   * GET /missions
   * List missions with pagination and filters
   */
  app.get('/', {
    preHandler: authMiddleware,
    handler: MissionsController.listMissions,
  });

  /**
   * GET /missions/today
   * Get today's active mission
   * Note: This must come before /:id to avoid path conflicts
   */
  app.get('/today', {
    preHandler: authMiddleware,
    handler: MissionsController.getTodaysMission,
  });

  /**
   * GET /missions/:id
   * Get mission by ID
   */
  app.get('/:id', {
    preHandler: authMiddleware,
    handler: MissionsController.getMissionById,
  });

  /**
   * POST /missions
   * Create a new mission (authenticated users only for now)
   */
  app.post('/', {
    preHandler: authMiddleware,
    handler: MissionsController.createMission,
  });

  /**
   * PATCH /missions/:id
   * Update a mission
   */
  app.patch('/:id', {
    preHandler: authMiddleware,
    handler: MissionsController.updateMission,
  });

  /**
   * DELETE /missions/:id
   * Delete a mission
   */
  app.delete('/:id', {
    preHandler: authMiddleware,
    handler: MissionsController.deleteMission,
  });
}
