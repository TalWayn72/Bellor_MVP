/**
 * Follows Routes
 * API endpoints for follow functionality
 */

import { FastifyInstance } from 'fastify';
import { FollowsController } from '../../controllers/follows.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';

export default async function followsRoutes(app: FastifyInstance) {
  // All routes require authentication
  app.addHook('preHandler', authenticate);

  // Follow a user
  app.post('/', FollowsController.follow);

  // Unfollow a user
  app.delete('/:userId', FollowsController.unfollow);

  // Get my followers
  app.get('/followers', FollowsController.getMyFollowers);

  // Get users I'm following
  app.get('/following', FollowsController.getMyFollowing);

  // Get follow stats
  app.get('/stats', FollowsController.getStats);

  // Check if I'm following a user
  app.get('/check/:userId', FollowsController.checkFollowing);

  // Get followers of a specific user
  app.get('/user/:userId/followers', FollowsController.getUserFollowers);

  // Get users that a specific user is following
  app.get('/user/:userId/following', FollowsController.getUserFollowing);
}
