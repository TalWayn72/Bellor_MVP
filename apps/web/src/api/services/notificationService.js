/**
 * Notification Service
 * Handles all notification-related API calls
 */

import { apiClient } from '../client/apiClient';

export const notificationService = {
  /**
   * Get my notifications
   * @param {object} params - { limit, offset, unreadOnly }
   * @returns {Promise<{notifications, pagination}>}
   */
  async getNotifications(params = {}) {
    const response = await apiClient.get('/notifications', { params });
    return response.data;
  },

  /**
   * Get unread notification count
   * @returns {Promise<{count}>}
   */
  async getUnreadCount() {
    const response = await apiClient.get('/notifications/unread-count');
    return response.data;
  },

  /**
   * Mark a notification as read
   * @param {string} notificationId
   * @returns {Promise<{notification}>}
   */
  async markAsRead(notificationId) {
    const response = await apiClient.patch(`/notifications/${notificationId}/read`);
    return response.data;
  },

  /**
   * Mark all notifications as read
   * @returns {Promise<{count}>}
   */
  async markAllAsRead() {
    const response = await apiClient.post('/notifications/read-all');
    return response.data;
  },

  /**
   * Delete a notification
   * @param {string} notificationId
   * @returns {Promise<{message}>}
   */
  async deleteNotification(notificationId) {
    const response = await apiClient.delete(`/notifications/${notificationId}`);
    return response.data;
  },

  /**
   * Delete all read notifications
   * @returns {Promise<{count}>}
   */
  async deleteReadNotifications() {
    const response = await apiClient.delete('/notifications/read');
    return response.data;
  }
};
