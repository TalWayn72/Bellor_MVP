/**
 * Admin Service
 * Handles admin-specific API calls
 * Analytics methods are in ./admin/adminAnalytics.js
 */

import { apiClient } from '../client/apiClient';
import { adminAnalyticsService } from './admin/adminAnalytics';

export const adminService = {
  // ============ Re-export Analytics ============
  ...adminAnalyticsService,

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

  /** Block user */
  async blockUser(userId, reason) {
    return this.userAction({ userId, action: 'block', reason });
  },

  /** Unblock user */
  async unblockUser(userId) {
    return this.userAction({ userId, action: 'unblock' });
  },

  /** Make user admin */
  async makeAdmin(userId) {
    return this.userAction({ userId, action: 'make_admin' });
  },

  /** Remove admin role */
  async removeAdmin(userId) {
    return this.userAction({ userId, action: 'remove_admin' });
  },

  /** Make user premium */
  async makePremium(userId) {
    return this.userAction({ userId, action: 'make_premium' });
  },

  /** Remove premium */
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

  /** Review report */
  async reviewReport(reportId, notes) {
    return this.reportAction({ reportId, action: 'review', notes });
  },

  /** Mark report as action taken */
  async actionTakenReport(reportId, notes) {
    return this.reportAction({ reportId, action: 'action_taken', notes });
  },

  /** Dismiss report */
  async dismissReport(reportId, notes) {
    return this.reportAction({ reportId, action: 'dismiss', notes });
  },

  // ============ Message Moderation ============

  /**
   * Delete a message (admin moderation - soft delete)
   * @param {string} messageId - The message ID to delete
   * @returns {Promise<void>}
   */
  async deleteMessage(messageId) {
    await apiClient.delete(`/admin/messages/${messageId}`);
  },

  // ============ Achievements ============

  /** Create achievement */
  async createAchievement(data) {
    const response = await apiClient.post('/admin/achievements', data);
    return response.data;
  },

  // ============ Maintenance ============

  /** Cleanup expired stories */
  async cleanupStories() {
    const response = await apiClient.post('/admin/cleanup/stories');
    return response.data;
  },
};
