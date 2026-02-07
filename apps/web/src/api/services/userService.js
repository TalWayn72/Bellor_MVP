/**
 * User Service
 * Handles all user-related API calls
 */

import { apiClient } from '../client/apiClient';
import { validateUserId, validateDataObject } from '../utils/validation';
import { isDemoUser, getDemoUser } from '@/data/demoData';

export const userService = {
  /**
   * Get user by ID
   * @param {string} userId
   * @returns {Promise<{user}>}
   */
  async getUserById(userId) {
    // Handle demo users - return mock data without API call
    if (isDemoUser(userId)) {
      return { user: getDemoUser(userId) };
    }

    validateUserId(userId, 'getUserById');

    const response = await apiClient.get(`/users/${userId}`);
    // Backend returns { success, data } - extract user from data
    return { user: response.data?.data || response.data };
  },

  /**
   * Update user profile
   * @param {string} userId
   * @param {object} data - { firstName, lastName, bio, location, profilePictureUrl, preferredLanguage }
   * @returns {Promise<{user}>}
   */
  async updateProfile(userId, data) {
    validateUserId(userId, 'updateProfile');
    validateDataObject(data, 'updateProfile');

    const response = await apiClient.patch(`/users/${userId}`, data);
    return response.data;
  },

  /**
   * Search users
   * @param {object} params - { search, isBlocked, limit, offset }
   * @returns {Promise<{users, total, pagination}>}
   */
  async searchUsers(params = {}) {
    const response = await apiClient.get('/users', { params });
    // API returns { success, data: [...users], pagination }
    // Normalize to { users, total, pagination }
    const result = response.data;
    return {
      users: result.data || result.users || [],
      total: result.pagination?.total || (result.data || result.users || []).length,
      pagination: result.pagination,
    };
  },

  /**
   * Get user statistics
   * @param {string} userId
   * @returns {Promise<{stats}>}
   */
  async getUserStats(userId) {
    validateUserId(userId, 'getUserStats');

    const response = await apiClient.get(`/users/${userId}/stats`);
    return response.data;
  },

  /**
   * Block user
   * @param {string} userId
   * @returns {Promise<{message}>}
   */
  async blockUser(userId) {
    validateUserId(userId, 'blockUser');

    const response = await apiClient.post(`/users/${userId}/block`);
    return response.data;
  },

  /**
   * Unblock user
   * @param {string} userId
   * @returns {Promise<{message}>}
   */
  async unblockUser(userId) {
    validateUserId(userId, 'unblockUser');

    const response = await apiClient.post(`/users/${userId}/unblock`);
    return response.data;
  },

  /**
   * Delete user account
   * @param {string} userId
   * @returns {Promise<{message}>}
   */
  async deleteUser(userId) {
    validateUserId(userId, 'deleteUser');

    const response = await apiClient.delete(`/users/${userId}`);
    return response.data;
  },

  /**
   * Update user (alias for updateProfile for backward compatibility)
   * @param {string} userId
   * @param {object} data - { firstName, lastName, bio, location, profilePictureUrl, profile_images, main_profile_image_url, ... }
   * @returns {Promise<{user}>}
   */
  async updateUser(userId, data) {
    validateUserId(userId, 'updateUser');
    validateDataObject(data, 'updateUser');

    const response = await apiClient.patch(`/users/${userId}`, data);
    return response.data;
  },

  /**
   * GDPR Data Export - Export all user data
   * @param {string} userId
   * @returns {Promise<{data}>}
   */
  async exportUserData(userId) {
    validateUserId(userId, 'exportUserData');

    const response = await apiClient.get(`/users/${userId}/export`);
    return response.data;
  },

  /**
   * GDPR Right to Erasure - Permanently delete all user data
   * @param {string} userId
   * @returns {Promise<{message}>}
   */
  async deleteUserGDPR(userId) {
    validateUserId(userId, 'deleteUserGDPR');

    const response = await apiClient.delete(`/users/${userId}/gdpr`);
    return response.data;
  }
};
