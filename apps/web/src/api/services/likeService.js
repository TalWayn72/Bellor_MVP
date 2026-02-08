/**
 * Like Service
 * Handles all like-related API calls (romantic interest, positive feedback)
 */

import { apiClient } from '../client/apiClient';
import { validateUserId, validateRequiredId } from '../utils/validation';
import { transformLikes } from '@/utils';

export const likeService = {
  /**
   * Like a user
   * @param {string} targetUserId
   * @param {string} likeType - 'ROMANTIC' | 'POSITIVE' | 'SUPER'
   * @returns {Promise<{like, isMatch?}>}
   */
  async likeUser(targetUserId, likeType = 'ROMANTIC') {
    // Skip API call for demo users
    if (targetUserId?.startsWith('demo-')) {
      return { like: null, isMatch: false, demo: true };
    }

    validateUserId(targetUserId, 'likeUser');

    const response = await apiClient.post('/likes/user', { targetUserId, likeType });
    return response.data;
  },

  /**
   * Unlike a user
   * @param {string} targetUserId
   * @returns {Promise<{message}>}
   */
  async unlikeUser(targetUserId) {
    validateUserId(targetUserId, 'unlikeUser');

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
    validateRequiredId(responseId, 'responseId', 'likeResponse');

    const response = await apiClient.post('/likes/response', { responseId, likeType });
    return response.data;
  },

  /**
   * Unlike a response
   * @param {string} responseId
   * @returns {Promise<{message}>}
   */
  async unlikeResponse(responseId) {
    validateRequiredId(responseId, 'responseId', 'unlikeResponse');

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
    const result = response.data;
    return { ...result, likes: transformLikes(result.likes || []) };
  },

  /**
   * Get likes I sent
   * @param {object} params - { limit, offset }
   * @returns {Promise<{likes, pagination}>}
   */
  async getSentLikes(params = {}) {
    const response = await apiClient.get('/likes/sent', { params });
    const result = response.data;
    return { ...result, likes: transformLikes(result.likes || []) };
  },

  /**
   * Check if I liked a user
   * @param {string} targetUserId
   * @returns {Promise<{liked, like?, isMatch?}>}
   */
  async checkLiked(targetUserId) {
    // Skip API call for demo users
    if (targetUserId?.startsWith('demo-')) {
      return { liked: false, hasLiked: false, isMatch: false };
    }

    validateUserId(targetUserId, 'checkLiked');

    const response = await apiClient.get(`/likes/check/${targetUserId}`);
    // Normalize response - backend returns hasLiked, frontend expects liked
    const data = response.data;
    return {
      ...data,
      liked: data.hasLiked ?? data.liked ?? false,
      hasLiked: data.hasLiked ?? data.liked ?? false,
    };
  },

  /**
   * Get likes on a response
   * @param {string} responseId
   * @param {object} params - { limit, offset }
   * @returns {Promise<{likes, total}>}
   */
  async getResponseLikes(responseId, params = {}) {
    validateRequiredId(responseId, 'responseId', 'getResponseLikes');

    const response = await apiClient.get(`/likes/response/${responseId}`, { params });
    const result = response.data;
    return { ...result, likes: transformLikes(result.likes || []) };
  }
};
