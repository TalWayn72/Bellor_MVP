/** Analytics Service - Provides metrics and reporting for admin dashboard */
import { AnalyticsOverview } from './analytics/analytics-overview.service.js';
import { AnalyticsReporting } from './analytics/analytics-reporting.service.js';

// Re-export sub-modules for backward compatibility
export { AnalyticsOverview } from './analytics/analytics-overview.service.js';
export { AnalyticsReporting } from './analytics/analytics-reporting.service.js';
export type { DateRange, DailyMetric } from './analytics/analytics-overview.service.js';

export const AnalyticsService = {
  // Overview & user growth
  getDashboardOverview: AnalyticsOverview.getDashboardOverview,
  getUserGrowthMetrics: AnalyticsOverview.getUserGrowthMetrics,
  getUserActivityMetrics: AnalyticsOverview.getUserActivityMetrics,

  // Reporting & engagement
  getContentMetrics: AnalyticsReporting.getContentMetrics,
  getModerationMetrics: AnalyticsReporting.getModerationMetrics,
  getTopUsers: AnalyticsReporting.getTopUsers,
  getRetentionMetrics: AnalyticsReporting.getRetentionMetrics,
  getSystemHealth: AnalyticsReporting.getSystemHealth,
  exportUsersReport: AnalyticsReporting.exportUsersReport,
};
