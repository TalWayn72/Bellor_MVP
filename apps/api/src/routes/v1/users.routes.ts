import { FastifyInstance } from 'fastify';
import { UsersController } from '../../controllers/users.controller.js';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import { RATE_LIMITS } from '../../config/rate-limits.js';

export default async function usersRoutes(app: FastifyInstance) {
  /**
   * GET /users
   * List users with pagination and filters
   */
  app.get('/', {
    preHandler: authMiddleware,
    handler: UsersController.listUsers,
  });

  /**
   * GET /users/search
   * Search users by name or email
   * Note: This must come before /:id route to avoid path conflicts
   */
  app.get('/search', {
    config: { rateLimit: RATE_LIMITS.search.users },
    preHandler: authMiddleware,
    handler: UsersController.searchUsers,
  });

  /**
   * GET /users/:id
   * Get user by ID
   */
  app.get('/:id', {
    preHandler: authMiddleware,
    handler: UsersController.getUserById,
  });

  /**
   * PATCH /users/:id
   * Update user profile
   */
  app.patch('/:id', {
    preHandler: authMiddleware,
    handler: UsersController.updateUserProfile,
  });

  /**
   * PATCH /users/:id/language
   * Update user language preference
   */
  app.patch('/:id/language', {
    preHandler: authMiddleware,
    handler: UsersController.updateUserLanguage,
  });

  /**
   * GET /users/:id/stats
   * Get user statistics
   */
  app.get('/:id/stats', {
    preHandler: authMiddleware,
    handler: UsersController.getUserStats,
  });

  /**
   * DELETE /users/:id
   * Deactivate user (soft delete)
   */
  app.delete('/:id', {
    preHandler: authMiddleware,
    handler: UsersController.deactivateUser,
  });

  /**
   * GET /users/:id/export
   * GDPR Data Export - Export all user data
   */
  app.get('/:id/export', {
    preHandler: authMiddleware,
    handler: UsersController.exportUserData,
  });

  /**
   * DELETE /users/:id/gdpr
   * GDPR Right to Erasure - Permanently delete all user data
   */
  app.delete('/:id/gdpr', {
    preHandler: authMiddleware,
    handler: UsersController.deleteUserGDPR,
  });
}
