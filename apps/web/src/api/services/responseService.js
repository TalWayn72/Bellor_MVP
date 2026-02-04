/**
 * Response Service
 * Handles all response-related API calls (user responses to missions)
 */

import { apiClient } from '../client/apiClient';

export const responseService = {
  /**
   * List responses with pagination
   * @param {object} params - { limit, offset, userId, missionId, responseType, isPublic }
   * @returns {Promise<{data: Response[], pagination}>}
   */
  async listResponses(params = {}) {
    const response = await apiClient.get('/responses', { params });
    return response.data;
  },

  /**
   * Get current user's responses
   * @param {object} params - { limit, offset }
   * @returns {Promise<{data: Response[], pagination}>}
   */
  async getMyResponses(params = {}) {
    const response = await apiClient.get('/responses/my', { params });
    return response.data;
  },

  /**
   * Get responses by user ID
   * @param {string} userId
   * @param {object} params - { limit, offset }
   * @returns {Promise<{responses: Response[], total: number}>}
   */
  async getUserResponses(userId, params = {}) {
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
    const response = await apiClient.get(`/responses/${id}`);
    return response.data;
  },

  /**
   * Create a new response
   * @param {object} data - { missionId, responseType, content, textContent, thumbnailUrl, duration, isPublic }
   * @returns {Promise<{data: Response}>}
   */
  async createResponse(data) {
    const response = await apiClient.post('/responses', data);
    return response.data;
  },

  /**
   * Like a response
   * @param {string} id
   * @returns {Promise<{data: {likeCount: number}}>}
   */
  async likeResponse(id) {
    const response = await apiClient.post(`/responses/${id}/like`);
    return response.data;
  },

  /**
   * Delete a response
   * @param {string} id
   * @returns {Promise<{success: boolean}>}
   */
  async deleteResponse(id) {
    const response = await apiClient.delete(`/responses/${id}`);
    return response.data;
  },
};
