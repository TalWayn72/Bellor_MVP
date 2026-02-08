/**
 * Admin Analytics Service
 * Handles analytics, dashboard and monitoring API calls
 */

import { apiClient } from '../../client/apiClient';

interface AnalyticsParams {
  startDate?: string;
  endDate?: string;
}

interface ExportParams extends AnalyticsParams {
  format?: string;
}

export const adminAnalyticsService = {
  async getDashboard(): Promise<unknown> {
    const response = await apiClient.get('/admin/dashboard');
    return response.data;
  },

  async getUserAnalytics(params: AnalyticsParams = {}): Promise<unknown> {
    const response = await apiClient.get('/admin/analytics/users', { params });
    return response.data;
  },

  async getContentAnalytics(params: AnalyticsParams = {}): Promise<unknown> {
    const response = await apiClient.get('/admin/analytics/content', { params });
    return response.data;
  },

  async getModerationAnalytics(): Promise<unknown> {
    const response = await apiClient.get('/admin/analytics/moderation');
    return response.data;
  },

  async getTopUsers(limit: number = 10): Promise<unknown> {
    const response = await apiClient.get('/admin/analytics/top-users', { params: { limit } });
    return response.data;
  },

  async getSystemHealth(): Promise<unknown> {
    const response = await apiClient.get('/admin/health');
    return response.data;
  },

  async exportUsers(params: ExportParams = {}): Promise<unknown> {
    const response = await apiClient.get('/admin/export/users', { params });
    return response.data;
  },

  async getJobs(): Promise<unknown> {
    const response = await apiClient.get('/admin/jobs');
    return response.data;
  },

  async runJob(jobName: string): Promise<unknown> {
    const response = await apiClient.post('/admin/jobs/run', { jobName });
    return response.data;
  },
};
