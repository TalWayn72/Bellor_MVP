/**
 * Response Service
 * Handles all response-related API calls (user responses to missions)
 */

import { apiClient } from '../client/apiClient';
import { validateUserId, validateRequiredId, validateDataObject } from '../utils/validation';
import { isDemoUser, getDemoResponses } from '@/data/demoData';
import { transformResponses, transformResponse } from '@/utils';

export const responseService = {
  /**
   * List responses with pagination
   */
  async listResponses(params = {}) {
    const response = await apiClient.get('/responses', { params });
    const result = response.data;
    const responses = transformResponses(result?.data || result?.responses || []);
    return {
      ...result,
      data: responses,
      responses: responses,
      pagination: result?.pagination,
    };
  },

  /**
   * Get current user's responses
   */
  async getMyResponses(params = {}) {
    const response = await apiClient.get('/responses/my', { params });
    const result = response.data;
    const responses = transformResponses(result?.data || result?.responses || []);
    return {
      ...result,
      data: responses,
      responses: responses,
      pagination: result?.pagination,
    };
  },

  /**
   * Get responses by user ID
   */
  async getUserResponses(userId, params = {}) {
    if (isDemoUser(userId)) {
      const demoResponses = getDemoResponses(userId);
      return { responses: demoResponses, total: demoResponses.length };
    }

    validateUserId(userId, 'getUserResponses');

    const response = await apiClient.get('/responses', {
      params: { ...params, userId, user_id: userId },
    });
    const responses = transformResponses(response.data.data || response.data.responses || []);
    return {
      responses,
      total: response.data.total || response.data.pagination?.total || 0,
    };
  },

  /**
   * Get response by ID
   */
  async getResponseById(id) {
    validateRequiredId(id, 'responseId', 'getResponseById');
    const response = await apiClient.get(`/responses/${id}`);
    const result = response.data;
    return { ...result, data: transformResponse(result.data) };
  },

  /**
   * Create a new response
   */
  async createResponse(data) {
    validateDataObject(data, 'createResponse');
    const response = await apiClient.post('/responses', data);
    return response.data;
  },

  /**
   * Like a response
   */
  async likeResponse(id) {
    validateRequiredId(id, 'responseId', 'likeResponse');
    const response = await apiClient.post(`/responses/${id}/like`);
    return response.data;
  },

  /**
   * Delete a response
   */
  async deleteResponse(id) {
    validateRequiredId(id, 'responseId', 'deleteResponse');
    const response = await apiClient.delete(`/responses/${id}`);
    return response.data;
  },
};
