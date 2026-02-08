/**
 * Follow Service
 * Handles all follow-related API calls
 */

import { apiClient } from '../client/apiClient';
import { validateUserId } from '../utils/validation';
import { isDemoUser, getDemoFollows } from '@/data/demoData';

interface Pagination {
  total: number;
  limit: number;
  offset: number;
}

interface PaginationParams {
  limit?: number;
  offset?: number;
}

interface Follow {
  id: string;
  following_id: string;
  [key: string]: unknown;
}

interface FollowResponse {
  follow: Follow;
  demo?: boolean;
}

interface UnfollowResponse {
  message: string;
  demo?: boolean;
}

interface FollowersResponse {
  followers: unknown[];
  pagination?: Pagination;
}

interface FollowingResponse {
  following: unknown[];
  pagination?: Pagination;
}

interface FollowStatsResponse {
  followersCount: number;
  followingCount: number;
}

interface CheckFollowingResponse {
  following: boolean;
  mutualFollow: boolean;
  isFollowing?: boolean;
}

interface IsFollowingResponse {
  isFollowing: boolean;
}

export const followService = {
  async followUser(userId: string): Promise<FollowResponse> {
    if (isDemoUser(userId)) {
      return { follow: { id: `demo-follow-${userId}`, following_id: userId }, demo: true };
    }

    validateUserId(userId, 'followUser');

    const response = await apiClient.post('/follows', { userId });
    return response.data as FollowResponse;
  },

  async unfollowUser(userId: string): Promise<UnfollowResponse> {
    if (isDemoUser(userId)) {
      return { message: 'Unfollowed demo user', demo: true };
    }

    validateUserId(userId, 'unfollowUser');

    const response = await apiClient.delete(`/follows/${userId}`);
    return response.data as UnfollowResponse;
  },

  async getMyFollowers(params: PaginationParams = {}): Promise<FollowersResponse> {
    const response = await apiClient.get('/follows/followers', { params });
    return response.data as FollowersResponse;
  },

  async getMyFollowing(params: PaginationParams = {}): Promise<FollowingResponse> {
    const response = await apiClient.get('/follows/following', { params });
    return response.data as FollowingResponse;
  },

  async getStats(): Promise<FollowStatsResponse> {
    const response = await apiClient.get('/follows/stats');
    return response.data as FollowStatsResponse;
  },

  async checkFollowing(userId: string): Promise<CheckFollowingResponse> {
    if (isDemoUser(userId)) {
      return { following: false, mutualFollow: false, isFollowing: false };
    }

    validateUserId(userId, 'checkFollowing');

    const response = await apiClient.get(`/follows/check/${userId}`);
    return response.data as CheckFollowingResponse;
  },

  async isFollowing(userId: string): Promise<IsFollowingResponse> {
    const result = await this.checkFollowing(userId);
    return { isFollowing: result.following || result.isFollowing || false };
  },

  async getUserFollowers(userId: string, params: PaginationParams = {}): Promise<FollowersResponse> {
    if (isDemoUser(userId)) {
      const followerIds = getDemoFollows(userId, 'followers') as unknown[];
      return {
        followers: followerIds,
        pagination: { total: followerIds.length, limit: 20, offset: 0 },
      };
    }

    validateUserId(userId, 'getUserFollowers');

    const response = await apiClient.get(`/follows/user/${userId}/followers`, { params });
    return response.data as FollowersResponse;
  },

  async getUserFollowing(userId: string, params: PaginationParams = {}): Promise<FollowingResponse> {
    if (isDemoUser(userId)) {
      const followingIds = getDemoFollows(userId, 'following') as unknown[];
      return {
        following: followingIds,
        pagination: { total: followingIds.length, limit: 20, offset: 0 },
      };
    }

    validateUserId(userId, 'getUserFollowing');

    const response = await apiClient.get(`/follows/user/${userId}/following`, { params });
    return response.data as FollowingResponse;
  },
};
