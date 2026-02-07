/**
 * Response Service
 * Handles all response-related API calls (user responses to missions)
 */

import { apiClient } from '../client/apiClient';
import { validateUserId, validateRequiredId, validateDataObject } from '../utils/validation';
import { isDemoUser, getDemoResponses } from '@/data/demoData';

export const responseService = {
  /**
   * List responses with pagination
   * @param {object} params - { limit, offset, userId, missionId, responseType, isPublic }
   * @returns {Promise<{data: Response[], responses: Response[], pagination}>}
   */
  async listResponses(params = {}) {
    const response = await apiClient.get('/responses', { params });
    const result = response.data;
    // Normalize response format - support both 'data' and 'responses' keys
    const responses = result?.data || result?.responses || [];
    return {
      ...result,
      data: responses,
      responses: responses,
      pagination: result?.pagination,
    };
  },

  /**
   * Get current user's responses
   * @param {object} params - { limit, offset }
   * @returns {Promise<{data: Response[], responses: Response[], pagination}>}
   */
  async getMyResponses(params = {}) {
    const response = await apiClient.get('/responses/my', { params });
    const result = response.data;
    const responses = result?.data || result?.responses || [];
    return {
      ...result,
      data: responses,
      responses: responses,
      pagination: result?.pagination,
    };
  },

  /**
   * Get responses by user ID
   * @param {string} userId
   * @param {object} params - { limit, offset }
   * @returns {Promise<{responses: Response[], total: number}>}
   */
  async getUserResponses(userId, params = {}) {
    // Return demo responses for demo users
    if (isDemoUser(userId)) {
      const demoResponses = getDemoResponses(userId);
      return {
        responses: demoResponses,
        total: demoResponses.length,
      };
    }

    validateUserId(userId, 'getUserResponses');

    const response = await apiClient.get('/responses', {
      params: { ...params, userId, user_id: userId },
    });
    return {
      responses: response.data.data || response.data.responses || [],
      total: response.data.total || response.data.pagination?.total || 0,
    };
  },

  /**
   * Get response by ID
   * @param {string} id
   * @returns {Promise<{data: Response}>}
   */
  async getResponseById(id) {
    validateRequiredId(id, 'responseId', 'getResponseById');

    const response = await apiClient.get(`/responses/${id}`);
    return response.data;
  },

  /**
   * Create a new response
   * @param {object} data - { missionId, responseType, content, textContent, thumbnailUrl, duration, isPublic }
   * @returns {Promise<{data: Response}>}
   */
  async createResponse(data) {
    validateDataObject(data, 'createResponse');

    const response = await apiClient.post('/responses', data);
    return response.data;
  },

  /**
   * Like a response
   * @param {string} id
   * @returns {Promise<{data: {likeCount: number}}>}
   */
  async likeResponse(id) {
    validateRequiredId(id, 'responseId', 'likeResponse');

    const response = await apiClient.post(`/responses/${id}/like`);
    return response.data;
  },

  /**
   * Delete a response
   * @param {string} id
   * @returns {Promise<{success: boolean}>}
   */
  async deleteResponse(id) {
    validateRequiredId(id, 'responseId', 'deleteResponse');

    const response = await apiClient.delete(`/responses/${id}`);
    return response.data;
  },
};
