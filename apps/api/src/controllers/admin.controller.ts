/**
 * Admin Controller - Barrel re-export
 * Combines all admin handler modules into a single AdminController object
 */

import { getDashboard, getUserAnalytics, getContentAnalytics, getModerationAnalytics, getTopUsers, getSystemHealth, exportUsers } from './admin/admin-analytics.controller.js';
import { listUsers, userAction } from './admin/admin-users.controller.js';
import { listReports, reportAction, createAchievement, cleanupStories, getJobs, runJob } from './admin/admin-content.controller.js';

export const AdminController = {
  getDashboard,
  getUserAnalytics,
  getContentAnalytics,
  getModerationAnalytics,
  getTopUsers,
  getSystemHealth,
  exportUsers,
  listUsers,
  userAction,
  listReports,
  reportAction,
  createAchievement,
  cleanupStories,
  getJobs,
  runJob,
};
