/**
 * Follow Service
 * Handles all follow-related API calls
 */

import { apiClient } from '../client/apiClient';

export const followService = {
  /**
   * Follow a user
   * @param {string} userId
   * @returns {Promise<{follow}>}
   */
  async followUser(userId) {
    const response = await apiClient.post('/follows', { userId });
    return response.data;
  },

  /**
   * Unfollow a user
   * @param {string} userId
   * @returns {Promise<{message}>}
   */
  async unfollowUser(userId) {
    const response = await apiClient.delete(`/follows/${userId}`);
    return response.data;
  },

  /**
   * Get my followers
   * @param {object} params - { limit, offset }
   * @returns {Promise<{followers, pagination}>}
   */
  async getMyFollowers(params = {}) {
    const response = await apiClient.get('/follows/followers', { params });
    return response.data;
  },

  /**
   * Get users I'm following
   * @param {object} params - { limit, offset }
   * @returns {Promise<{following, pagination}>}
   */
  async getMyFollowing(params = {}) {
    const response = await apiClient.get('/follows/following', { params });
    return response.data;
  },

  /**
   * Get follow stats for current user
   * @returns {Promise<{followersCount, followingCount}>}
   */
  async getStats() {
    const response = await apiClient.get('/follows/stats');
    return response.data;
  },

  /**
   * Check if I'm following a user
   * @param {string} userId
   * @returns {Promise<{following, mutualFollow}>}
   */
  async checkFollowing(userId) {
    const response = await apiClient.get(`/follows/check/${userId}`);
    return response.data;
  },

  /**
   * Get followers of a specific user
   * @param {string} userId
   * @param {object} params - { limit, offset }
   * @returns {Promise<{followers, pagination}>}
   */
  async getUserFollowers(userId, params = {}) {
    const response = await apiClient.get(`/follows/user/${userId}/followers`, { params });
    return response.data;
  },

  /**
   * Get users that a specific user is following
   * @param {string} userId
   * @param {object} params - { limit, offset }
   * @returns {Promise<{following, pagination}>}
   */
  async getUserFollowing(userId, params = {}) {
    const response = await apiClient.get(`/follows/user/${userId}/following`, { params });
    return response.data;
  }
};
