/**
 * Follow Service
 * Handles all follow-related API calls
 */

import { apiClient } from '../client/apiClient';
import { validateUserId } from '../utils/validation';
import { isDemoUser, getDemoFollows } from '@/data/demoData';

export const followService = {
  /**
   * Follow a user
   * @param {string} userId
   * @returns {Promise<{follow}>}
   */
  async followUser(userId) {
    // Skip API call for demo users
    if (isDemoUser(userId)) {
      return { follow: { id: `demo-follow-${userId}`, following_id: userId }, demo: true };
    }

    validateUserId(userId, 'followUser');

    const response = await apiClient.post('/follows', { userId });
    return response.data;
  },

  /**
   * Unfollow a user
   * @param {string} userId
   * @returns {Promise<{message}>}
   */
  async unfollowUser(userId) {
    // Skip API call for demo users
    if (isDemoUser(userId)) {
      return { message: 'Unfollowed demo user', demo: true };
    }

    validateUserId(userId, 'unfollowUser');

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
    // Return false for demo users
    if (isDemoUser(userId)) {
      return { following: false, mutualFollow: false, isFollowing: false };
    }

    validateUserId(userId, 'checkFollowing');

    const response = await apiClient.get(`/follows/check/${userId}`);
    return response.data;
  },

  /**
   * Check if following (alias)
   * @param {string} userId
   * @returns {Promise<{isFollowing}>}
   */
  async isFollowing(userId) {
    const result = await this.checkFollowing(userId);
    return { isFollowing: result.following || result.isFollowing || false };
  },

  /**
   * Get followers of a specific user
   * @param {string} userId
   * @param {object} params - { limit, offset }
   * @returns {Promise<{followers, pagination}>}
   */
  async getUserFollowers(userId, params = {}) {
    // Return demo followers for demo users
    if (isDemoUser(userId)) {
      const followerIds = getDemoFollows(userId, 'followers');
      return {
        followers: followerIds,
        pagination: { total: followerIds.length, limit: 20, offset: 0 },
      };
    }

    validateUserId(userId, 'getUserFollowers');

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
    // Return demo following for demo users
    if (isDemoUser(userId)) {
      const followingIds = getDemoFollows(userId, 'following');
      return {
        following: followingIds,
        pagination: { total: followingIds.length, limit: 20, offset: 0 },
      };
    }

    validateUserId(userId, 'getUserFollowing');

    const response = await apiClient.get(`/follows/user/${userId}/following`, { params });
    return response.data;
  }
};
