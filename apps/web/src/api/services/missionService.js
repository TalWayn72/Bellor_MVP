/**
 * Mission Service
 * Handles all mission-related API calls
 */

import { apiClient } from '../client/apiClient';

export const missionService = {
  /**
   * List missions with pagination
   * @param {object} params - { limit, offset, type, isActive }
   * @returns {Promise<{data: Mission[], pagination}>}
   */
  async listMissions(params = {}) {
    const response = await apiClient.get('/missions', { params });
    return response.data;
  },

  /**
   * Get today's active mission
   * @returns {Promise<{data: Mission}>}
   */
  async getTodaysMission() {
    const response = await apiClient.get('/missions/today');
    return response.data;
  },

  /**
   * Get mission by ID
   * @param {string} id
   * @returns {Promise<{data: Mission}>}
   */
  async getMissionById(id) {
    const response = await apiClient.get(`/missions/${id}`);
    return response.data;
  },

  /**
   * Create a new mission
   * @param {object} data - { title, description, missionType, difficulty, xpReward, activeFrom, activeUntil }
   * @returns {Promise<{data: Mission}>}
   */
  async createMission(data) {
    const response = await apiClient.post('/missions', data);
    return response.data;
  },

  /**
   * Update a mission
   * @param {string} id
   * @param {object} data
   * @returns {Promise<{data: Mission}>}
   */
  async updateMission(id, data) {
    const response = await apiClient.patch(`/missions/${id}`, data);
    return response.data;
  },

  /**
   * Delete a mission
   * @param {string} id
   * @returns {Promise<{success: boolean}>}
   */
  async deleteMission(id) {
    const response = await apiClient.delete(`/missions/${id}`);
    return response.data;
  },
};
