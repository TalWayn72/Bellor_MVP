/**
 * Report Service
 * Handles all report-related API calls (moderation)
 */

import { apiClient } from '../client/apiClient';
import { validateUserId, validateRequiredId, validateDataObject } from '../utils/validation';

export const reportService = {
  /**
   * Create a new report
   * @param {object} data - { reportedUserId?, reportedResponseId?, reason, description? }
   * @returns {Promise<{report}>}
   */
  async createReport(data) {
    validateDataObject(data, 'createReport');

    const response = await apiClient.post('/reports', data);
    return response.data;
  },

  /**
   * Get pending reports count (admin only)
   * @returns {Promise<{count}>}
   */
  async getPendingCount() {
    const response = await apiClient.get('/reports/pending/count');
    return response.data;
  },

  /**
   * Get report statistics (admin only)
   * @returns {Promise<{statistics}>}
   */
  async getStatistics() {
    const response = await apiClient.get('/reports/statistics');
    return response.data;
  },

  /**
   * List reports (admin only)
   * @param {object} params - { status, limit, offset }
   * @returns {Promise<{reports, pagination}>}
   */
  async listReports(params = {}) {
    const response = await apiClient.get('/reports', { params });
    // API returns { success, data: [...reports], pagination }
    // Normalize to { reports, pagination }
    const result = response.data;
    return {
      reports: result.data || result.reports || [],
      total: result.pagination?.total || (result.data || result.reports || []).length,
      pagination: result.pagination,
    };
  },

  /**
   * Get reports for a specific user (admin only)
   * @param {string} userId
   * @param {object} params - { limit, offset }
   * @returns {Promise<{reports, pagination}>}
   */
  async getReportsForUser(userId, params = {}) {
    validateUserId(userId, 'getReportsForUser');

    const response = await apiClient.get(`/reports/user/${userId}`, { params });
    return response.data;
  },

  /**
   * Get report by ID (admin only)
   * @param {string} reportId
   * @returns {Promise<{report}>}
   */
  async getReportById(reportId) {
    validateRequiredId(reportId, 'reportId', 'getReportById');

    const response = await apiClient.get(`/reports/${reportId}`);
    return response.data;
  },

  /**
   * Review a report (admin only)
   * @param {string} reportId
   * @param {object} data - { action: 'DISMISSED' | 'WARNING' | 'CONTENT_REMOVED' | 'USER_BANNED', notes? }
   * @returns {Promise<{report}>}
   */
  async reviewReport(reportId, data) {
    validateRequiredId(reportId, 'reportId', 'reviewReport');
    validateDataObject(data, 'reviewReport');

    const response = await apiClient.patch(`/reports/${reportId}/review`, data);
    return response.data;
  }
};
