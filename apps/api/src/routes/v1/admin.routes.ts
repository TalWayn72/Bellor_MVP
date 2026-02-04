/**
 * Admin Routes
 * All routes require admin authentication
 */

import { FastifyInstance } from 'fastify';
import { authMiddleware, adminMiddleware } from '../../middleware/auth.middleware.js';
import { AdminController } from '../../controllers/admin.controller.js';

export default async function adminRoutes(app: FastifyInstance) {
  // Apply auth and admin middleware to all routes
  app.addHook('onRequest', authMiddleware);
  app.addHook('onRequest', adminMiddleware);

  // =====================
  // Dashboard
  // =====================

  // GET /admin/dashboard - Get overview metrics
  app.get('/dashboard', AdminController.getDashboard);

  // GET /admin/health - System health check
  app.get('/health', AdminController.getSystemHealth);

  // =====================
  // Analytics
  // =====================

  // GET /admin/analytics/users - User growth and activity
  app.get('/analytics/users', AdminController.getUserAnalytics);

  // GET /admin/analytics/content - Content metrics (messages, stories, etc.)
  app.get('/analytics/content', AdminController.getContentAnalytics);

  // GET /admin/analytics/moderation - Moderation statistics
  app.get('/analytics/moderation', AdminController.getModerationAnalytics);

  // GET /admin/analytics/top-users - Top users by activity
  app.get('/analytics/top-users', AdminController.getTopUsers);

  // =====================
  // User Management
  // =====================

  // GET /admin/users - List all users with filters
  app.get('/users', AdminController.listUsers);

  // POST /admin/users/action - Perform action on user (block, unblock, etc.)
  app.post('/users/action', AdminController.userAction);

  // =====================
  // Reports / Moderation
  // =====================

  // GET /admin/reports - List all reports
  app.get('/reports', AdminController.listReports);

  // POST /admin/reports/action - Take action on a report
  app.post('/reports/action', AdminController.reportAction);

  // =====================
  // Achievements Management
  // =====================

  // POST /admin/achievements - Create new achievement
  app.post('/achievements', AdminController.createAchievement);

  // =====================
  // Maintenance
  // =====================

  // POST /admin/cleanup/stories - Manually trigger expired story cleanup
  app.post('/cleanup/stories', AdminController.cleanupStories);

  // =====================
  // Export
  // =====================

  // GET /admin/export/users - Export users data (JSON or CSV)
  app.get('/export/users', AdminController.exportUsers);

  // =====================
  // Background Jobs
  // =====================

  // GET /admin/jobs - Get status of all background jobs
  app.get('/jobs', AdminController.getJobs);

  // POST /admin/jobs/run - Manually trigger a specific job
  app.post('/jobs/run', AdminController.runJob);
}
