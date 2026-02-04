/**
 * Achievement Service
 * Handles all achievement-related API calls
 */

import { apiClient } from '../client/apiClient';

export const achievementService = {
  /**
   * List all achievements
   * @param {object} params - { limit, offset }
   * @returns {Promise<{achievements, pagination}>}
   */
  async listAchievements(params = {}) {
    const response = await apiClient.get('/achievements', { params });
    return response.data;
  },

  /**
   * Get my achievements
   * @param {object} params - { limit, offset }
   * @returns {Promise<{achievements, pagination}>}
   */
  async getMyAchievements(params = {}) {
    const response = await apiClient.get('/achievements/my', { params });
    return response.data;
  },

  /**
   * Check and unlock achievements
   * @returns {Promise<{unlockedAchievements}>}
   */
  async checkAchievements() {
    const response = await apiClient.post('/achievements/check');
    return response.data;
  },

  /**
   * Get user's achievements
   * @param {string} userId
   * @param {object} params - { limit, offset }
   * @returns {Promise<{achievements, pagination}>}
   */
  async getUserAchievements(userId, params = {}) {
    const response = await apiClient.get(`/achievements/user/${userId}`, { params });
    return response.data;
  },

  /**
   * Get achievement by ID
   * @param {string} achievementId
   * @returns {Promise<{achievement}>}
   */
  async getAchievementById(achievementId) {
    const response = await apiClient.get(`/achievements/${achievementId}`);
    return response.data;
  },

  /**
   * Get achievement stats
   * @param {string} achievementId
   * @returns {Promise<{achievement, unlockedCount, recentUnlocks}>}
   */
  async getAchievementStats(achievementId) {
    const response = await apiClient.get(`/achievements/${achievementId}/stats`);
    return response.data;
  }
};
