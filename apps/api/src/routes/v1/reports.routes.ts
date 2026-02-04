/**
 * Reports Routes
 * API endpoints for reports and moderation
 */

import { FastifyInstance } from 'fastify';
import { ReportsController } from '../../controllers/reports.controller.js';
import { authMiddleware } from '../../middleware/auth.middleware.js';

export default async function reportsRoutes(app: FastifyInstance) {
  // All routes require authentication
  app.addHook('onRequest', authMiddleware);

  // Create a new report (any authenticated user)
  app.post('/', ReportsController.createReport);

  // Get pending reports count (admin only)
  app.get('/pending/count', ReportsController.getPendingCount);

  // Get report statistics (admin only)
  app.get('/statistics', ReportsController.getStatistics);

  // List reports (admin only)
  app.get('/', ReportsController.listReports);

  // Get reports for a specific user (admin only)
  app.get('/user/:userId', ReportsController.getReportsForUser);

  // Get report by ID (admin only)
  app.get('/:id', ReportsController.getReport);

  // Review a report (admin only)
  app.patch('/:id/review', ReportsController.reviewReport);
}
