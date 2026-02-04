import { FastifyInstance } from 'fastify';
import { ResponsesController } from '../../controllers/responses.controller.js';
import { authMiddleware } from '../../middleware/auth.middleware.js';

export default async function responsesRoutes(app: FastifyInstance) {
  /**
   * GET /responses
   * List responses with pagination and filters
   */
  app.get('/', {
    preHandler: authMiddleware,
    handler: ResponsesController.listResponses,
  });

  /**
   * GET /responses/my
   * Get current user's responses
   * Note: This must come before /:id to avoid path conflicts
   */
  app.get('/my', {
    preHandler: authMiddleware,
    handler: ResponsesController.getMyResponses,
  });

  /**
   * GET /responses/:id
   * Get response by ID
   */
  app.get('/:id', {
    preHandler: authMiddleware,
    handler: ResponsesController.getResponseById,
  });

  /**
   * POST /responses
   * Create a new response
   */
  app.post('/', {
    preHandler: authMiddleware,
    handler: ResponsesController.createResponse,
  });

  /**
   * POST /responses/:id/like
   * Like a response
   */
  app.post('/:id/like', {
    preHandler: authMiddleware,
    handler: ResponsesController.likeResponse,
  });

  /**
   * DELETE /responses/:id
   * Delete a response
   */
  app.delete('/:id', {
    preHandler: authMiddleware,
    handler: ResponsesController.deleteResponse,
  });
}
