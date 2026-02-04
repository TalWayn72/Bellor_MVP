/**
 * Like Service
 * Handles all like-related API calls (romantic interest, positive feedback)
 */

import { apiClient } from '../client/apiClient';

export const likeService = {
  /**
   * Like a user
   * @param {string} targetUserId
   * @param {string} likeType - 'ROMANTIC' | 'POSITIVE' | 'SUPER'
   * @returns {Promise<{like, isMatch?}>}
   */
  async likeUser(targetUserId, likeType = 'ROMANTIC') {
    const response = await apiClient.post('/likes/user', { targetUserId, likeType });
    return response.data;
  },

  /**
   * Unlike a user
   * @param {string} targetUserId
   * @returns {Promise<{message}>}
   */
  async unlikeUser(targetUserId) {
    const response = await apiClient.delete(`/likes/user/${targetUserId}`);
    return response.data;
  },

  /**
   * Like a response
   * @param {string} responseId
   * @param {string} likeType - 'ROMANTIC' | 'POSITIVE' | 'SUPER'
   * @returns {Promise<{like}>}
   */
  async likeResponse(responseId, likeType = 'POSITIVE') {
    const response = await apiClient.post('/likes/response', { responseId, likeType });
    return response.data;
  },

  /**
   * Unlike a response
   * @param {string} responseId
   * @returns {Promise<{message}>}
   */
  async unlikeResponse(responseId) {
    const response = await apiClient.delete(`/likes/response/${responseId}`);
    return response.data;
  },

  /**
   * Get likes I received
   * @param {object} params - { limit, offset }
   * @returns {Promise<{likes, pagination}>}
   */
  async getReceivedLikes(params = {}) {
    const response = await apiClient.get('/likes/received', { params });
    return response.data;
  },

  /**
   * Get likes I sent
   * @param {object} params - { limit, offset }
   * @returns {Promise<{likes, pagination}>}
   */
  async getSentLikes(params = {}) {
    const response = await apiClient.get('/likes/sent', { params });
    return response.data;
  },

  /**
   * Check if I liked a user
   * @param {string} targetUserId
   * @returns {Promise<{liked, like?}>}
   */
  async checkLiked(targetUserId) {
    const response = await apiClient.get(`/likes/check/${targetUserId}`);
    return response.data;
  },

  /**
   * Get likes on a response
   * @param {string} responseId
   * @param {object} params - { limit, offset }
   * @returns {Promise<{likes, total}>}
   */
  async getResponseLikes(responseId, params = {}) {
    const response = await apiClient.get(`/likes/response/${responseId}`, { params });
    return response.data;
  }
};
