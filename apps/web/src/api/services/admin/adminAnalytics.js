/**
 * Admin Analytics Service
 * Handles analytics, dashboard and monitoring API calls
 */

import { apiClient } from '../../client/apiClient';

export const adminAnalyticsService = {
  /**
   * Get dashboard overview
   * @returns {Promise<{data: object}>}
   */
  async getDashboard() {
    const response = await apiClient.get('/admin/dashboard');
    return response.data;
  },

  /**
   * Get user analytics
   * @param {object} params - { startDate, endDate }
   * @returns {Promise<{data: object}>}
   */
  async getUserAnalytics(params = {}) {
    const response = await apiClient.get('/admin/analytics/users', { params });
    return response.data;
  },

  /**
   * Get content analytics
   * @param {object} params - { startDate, endDate }
   * @returns {Promise<{data: object}>}
   */
  async getContentAnalytics(params = {}) {
    const response = await apiClient.get('/admin/analytics/content', { params });
    return response.data;
  },

  /**
   * Get moderation analytics
   * @returns {Promise<{data: object}>}
   */
  async getModerationAnalytics() {
    const response = await apiClient.get('/admin/analytics/moderation');
    return response.data;
  },

  /**
   * Get top users
   * @param {number} limit
   * @returns {Promise<{data: object}>}
   */
  async getTopUsers(limit = 10) {
    const response = await apiClient.get('/admin/analytics/top-users', { params: { limit } });
    return response.data;
  },

  /**
   * Get system health
   * @returns {Promise<{data: object}>}
   */
  async getSystemHealth() {
    const response = await apiClient.get('/admin/health');
    return response.data;
  },

  /**
   * Export users
   * @param {object} params - { startDate, endDate, format }
   * @returns {Promise<{data: object}>}
   */
  async exportUsers(params = {}) {
    const response = await apiClient.get('/admin/export/users', { params });
    return response.data;
  },

  /**
   * Get jobs status
   * @returns {Promise<{data: object}>}
   */
  async getJobs() {
    const response = await apiClient.get('/admin/jobs');
    return response.data;
  },

  /**
   * Run job manually
   * @param {string} jobName
   * @returns {Promise<{data: object}>}
   */
  async runJob(jobName) {
    const response = await apiClient.post('/admin/jobs/run', { jobName });
    return response.data;
  },
};
