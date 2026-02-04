/**
 * Likes Routes
 * API endpoints for likes functionality
 */

import { FastifyInstance } from 'fastify';
import { LikesController } from '../../controllers/likes.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';

export default async function likesRoutes(app: FastifyInstance) {
  // All routes require authentication
  app.addHook('preHandler', authenticate);

  // Like a user (romantic interest / positive feedback)
  app.post('/user', LikesController.likeUser);

  // Unlike a user
  app.delete('/user/:targetUserId', LikesController.unlikeUser);

  // Like a response
  app.post('/response', LikesController.likeResponse);

  // Unlike a response
  app.delete('/response/:responseId', LikesController.unlikeResponse);

  // Get likes I received
  app.get('/received', LikesController.getReceivedLikes);

  // Get likes I sent
  app.get('/sent', LikesController.getSentLikes);

  // Check if I liked a user
  app.get('/check/:targetUserId', LikesController.checkLiked);

  // Get likes on a response
  app.get('/response/:responseId', LikesController.getResponseLikes);
}
