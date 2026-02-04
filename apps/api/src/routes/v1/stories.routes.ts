/**
 * Stories Routes
 * API endpoints for stories (24-hour ephemeral content)
 */

import { FastifyInstance } from 'fastify';
import { StoriesController } from '../../controllers/stories.controller.js';
import { authMiddleware } from '../../middleware/auth.middleware.js';

export default async function storiesRoutes(app: FastifyInstance) {
  // All routes require authentication
  app.addHook('onRequest', authMiddleware);

  // Get stories feed (grouped by user)
  app.get('/feed', StoriesController.getFeed);

  // Get current user's stories
  app.get('/my', StoriesController.getMyStories);

  // Get current user's story statistics
  app.get('/stats', StoriesController.getStats);

  // Create a new story
  app.post('/', StoriesController.createStory);

  // Cleanup expired stories (admin only)
  app.post('/cleanup', StoriesController.cleanup);

  // Get stories by user ID
  app.get('/user/:userId', StoriesController.getStoriesByUser);

  // Get story by ID
  app.get('/:id', StoriesController.getStory);

  // Mark story as viewed
  app.post('/:id/view', StoriesController.viewStory);

  // Delete a story
  app.delete('/:id', StoriesController.deleteStory);
}
