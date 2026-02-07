/**
 * Story Service
 * Handles all story-related API calls (24-hour ephemeral content)
 */

import { apiClient } from '../client/apiClient';
import { validateUserId, validateRequiredId, validateDataObject } from '../utils/validation';
import { isDemoUser, getDemoStories } from '@/data/demoData';

export const storyService = {
  /**
   * Get stories feed (grouped by user)
   * @param {object} params - { limit, offset }
   * @returns {Promise<{stories, pagination}>}
   */
  async getFeed(params = {}) {
    const response = await apiClient.get('/stories/feed', { params });
    return response.data;
  },

  /**
   * Get current user's stories
   * @returns {Promise<{stories}>}
   */
  async getMyStories() {
    const response = await apiClient.get('/stories/my');
    return response.data;
  },

  /**
   * Get current user's story statistics
   * @returns {Promise<{stats}>}
   */
  async getStats() {
    const response = await apiClient.get('/stories/stats');
    return response.data;
  },

  /**
   * Create a new story
   * @param {object} data - { mediaUrl, mediaType, caption?, duration? }
   * @returns {Promise<{story}>}
   */
  async createStory(data) {
    validateDataObject(data, 'createStory');

    const response = await apiClient.post('/stories', data);
    return response.data;
  },

  /**
   * Get stories by user ID
   * @param {string} userId
   * @returns {Promise<{stories}>}
   */
  async getStoriesByUser(userId) {
    // Return demo stories for demo users
    if (isDemoUser(userId)) {
      const stories = getDemoStories().filter(s => s.user_id === userId);
      return { stories };
    }

    validateUserId(userId, 'getStoriesByUser');

    const response = await apiClient.get(`/stories/user/${userId}`);
    return response.data;
  },

  /**
   * Get story by ID
   * @param {string} storyId
   * @returns {Promise<{story}>}
   */
  async getStoryById(storyId) {
    validateRequiredId(storyId, 'storyId', 'getStoryById');

    const response = await apiClient.get(`/stories/${storyId}`);
    return response.data;
  },

  /**
   * Mark story as viewed
   * @param {string} storyId
   * @returns {Promise<{message}>}
   */
  async viewStory(storyId) {
    validateRequiredId(storyId, 'storyId', 'viewStory');

    const response = await apiClient.post(`/stories/${storyId}/view`);
    return response.data;
  },

  /**
   * Delete a story
   * @param {string} storyId
   * @returns {Promise<{message}>}
   */
  async deleteStory(storyId) {
    validateRequiredId(storyId, 'storyId', 'deleteStory');

    const response = await apiClient.delete(`/stories/${storyId}`);
    return response.data;
  },

  /**
   * Cleanup expired stories (admin only)
   * @returns {Promise<{deletedCount}>}
   */
  async cleanup() {
    const response = await apiClient.post('/stories/cleanup');
    return response.data;
  }
};
