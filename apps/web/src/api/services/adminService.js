/**
 * Admin Service
 * Handles admin-specific API calls
 */

import { apiClient } from '../client/apiClient';

export const adminService = {
  // ============ Dashboard & Analytics ============

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

  // ============ User Management ============

  /**
   * List all users (admin view)
   * @param {object} params - { limit, offset, search, isBlocked, isPremium, isAdmin, sortBy, sortOrder }
   * @returns {Promise<{data: { users, pagination }}>}
   */
  async listUsers(params = {}) {
    const response = await apiClient.get('/admin/users', { params });
    return response.data;
  },

  /**
   * Perform action on user
   * @param {object} data - { userId, action, reason }
   * @returns {Promise<{data: object}>}
   */
  async userAction(data) {
    const response = await apiClient.post('/admin/users/action', data);
    return response.data;
  },

  /**
   * Block user
   * @param {string} userId
   * @param {string} reason
   * @returns {Promise<{data: object}>}
   */
  async blockUser(userId, reason) {
    return this.userAction({ userId, action: 'block', reason });
  },

  /**
   * Unblock user
   * @param {string} userId
   * @returns {Promise<{data: object}>}
   */
  async unblockUser(userId) {
    return this.userAction({ userId, action: 'unblock' });
  },

  /**
   * Make user admin
   * @param {string} userId
   * @returns {Promise<{data: object}>}
   */
  async makeAdmin(userId) {
    return this.userAction({ userId, action: 'make_admin' });
  },

  /**
   * Remove admin role
   * @param {string} userId
   * @returns {Promise<{data: object}>}
   */
  async removeAdmin(userId) {
    return this.userAction({ userId, action: 'remove_admin' });
  },

  /**
   * Make user premium
   * @param {string} userId
   * @returns {Promise<{data: object}>}
   */
  async makePremium(userId) {
    return this.userAction({ userId, action: 'make_premium' });
  },

  /**
   * Remove premium
   * @param {string} userId
   * @returns {Promise<{data: object}>}
   */
  async removePremium(userId) {
    return this.userAction({ userId, action: 'remove_premium' });
  },

  // ============ Report Management ============

  /**
   * List all reports
   * @param {object} params - { limit, offset, status, reason }
   * @returns {Promise<{data: { reports, pagination }}>}
   */
  async listReports(params = {}) {
    const response = await apiClient.get('/admin/reports', { params });
    return response.data;
  },

  /**
   * Take action on report
   * @param {object} data - { reportId, action, notes }
   * @returns {Promise<{data: object}>}
   */
  async reportAction(data) {
    const response = await apiClient.post('/admin/reports/action', data);
    return response.data;
  },

  /**
   * Review report
   * @param {string} reportId
   * @param {string} notes
   * @returns {Promise<{data: object}>}
   */
  async reviewReport(reportId, notes) {
    return this.reportAction({ reportId, action: 'review', notes });
  },

  /**
   * Mark report as action taken
   * @param {string} reportId
   * @param {string} notes
   * @returns {Promise<{data: object}>}
   */
  async actionTakenReport(reportId, notes) {
    return this.reportAction({ reportId, action: 'action_taken', notes });
  },

  /**
   * Dismiss report
   * @param {string} reportId
   * @param {string} notes
   * @returns {Promise<{data: object}>}
   */
  async dismissReport(reportId, notes) {
    return this.reportAction({ reportId, action: 'dismiss', notes });
  },

  // ============ Achievements ============

  /**
   * Create achievement
   * @param {object} data - { name, description, iconUrl, requirement, xpReward }
   * @returns {Promise<{data: object}>}
   */
  async createAchievement(data) {
    const response = await apiClient.post('/admin/achievements', data);
    return response.data;
  },

  // ============ Maintenance ============

  /**
   * Cleanup expired stories
   * @returns {Promise<{data: object}>}
   */
  async cleanupStories() {
    const response = await apiClient.post('/admin/cleanup/stories');
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

  // ============ Jobs ============

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
