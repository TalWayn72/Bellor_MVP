/**
 * Notifications Routes
 * API endpoints for notifications functionality
 */

import { FastifyInstance } from 'fastify';
import { NotificationsController } from '../../controllers/notifications.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';

export default async function notificationsRoutes(app: FastifyInstance) {
  // All routes require authentication
  app.addHook('preHandler', authenticate);

  // Get my notifications
  app.get('/', NotificationsController.getNotifications);

  // Get unread count
  app.get('/unread-count', NotificationsController.getUnreadCount);

  // Mark all as read
  app.post('/read-all', NotificationsController.markAllAsRead);

  // Delete all read notifications
  app.delete('/read', NotificationsController.deleteReadNotifications);

  // Mark notification as read
  app.patch('/:id/read', NotificationsController.markAsRead);

  // Delete a notification
  app.delete('/:id', NotificationsController.deleteNotification);
}
