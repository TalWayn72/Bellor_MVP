/**
 * User Service
 * Handles all user-related API calls
 */

import { apiClient } from '../client/apiClient';

export const userService = {
  /**
   * Get user by ID
   * @param {string} userId
   * @returns {Promise<{user}>}
   */
  async getUserById(userId) {
    const response = await apiClient.get(`/users/${userId}`);
    return response.data;
  },

  /**
   * Update user profile
   * @param {string} userId
   * @param {object} data - { firstName, lastName, bio, location, profilePictureUrl, preferredLanguage }
   * @returns {Promise<{user}>}
   */
  async updateProfile(userId, data) {
    const response = await apiClient.patch(`/users/${userId}`, data);
    return response.data;
  },

  /**
   * Search users
   * @param {object} params - { search, isBlocked, limit, offset }
   * @returns {Promise<{users, total}>}
   */
  async searchUsers(params = {}) {
    const response = await apiClient.get('/users', { params });
    return response.data;
  },

  /**
   * Get user statistics
   * @param {string} userId
   * @returns {Promise<{stats}>}
   */
  async getUserStats(userId) {
    const response = await apiClient.get(`/users/${userId}/stats`);
    return response.data;
  },

  /**
   * Block user
   * @param {string} userId
   * @returns {Promise<{message}>}
   */
  async blockUser(userId) {
    const response = await apiClient.post(`/users/${userId}/block`);
    return response.data;
  },

  /**
   * Unblock user
   * @param {string} userId
   * @returns {Promise<{message}>}
   */
  async unblockUser(userId) {
    const response = await apiClient.post(`/users/${userId}/unblock`);
    return response.data;
  },

  /**
   * Delete user account
   * @param {string} userId
   * @returns {Promise<{message}>}
   */
  async deleteUser(userId) {
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
    const response = await apiClient.patch(`/users/${userId}`, data);
    return response.data;
  }
};
