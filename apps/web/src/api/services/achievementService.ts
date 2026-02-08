/**
 * Achievement Service
 * Handles all achievement-related API calls
 */

import { apiClient } from '../client/apiClient';

interface Pagination {
  total: number;
  limit: number;
  offset: number;
}

interface PaginationParams {
  limit?: number;
  offset?: number;
}

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon?: string;
  xp_reward?: number;
  [key: string]: unknown;
}

interface AchievementListResponse {
  achievements: Achievement[];
  pagination?: Pagination;
}

interface CheckAchievementsResponse {
  unlockedAchievements: Achievement[];
}

interface AchievementByIdResponse {
  achievement: Achievement;
}

interface AchievementStatsResponse {
  achievement: Achievement;
  unlockedCount: number;
  recentUnlocks: unknown[];
}

export const achievementService = {
  async listAchievements(params: PaginationParams = {}): Promise<AchievementListResponse> {
    const response = await apiClient.get('/achievements', { params });
    return response.data as AchievementListResponse;
  },

  async getMyAchievements(params: PaginationParams = {}): Promise<AchievementListResponse> {
    const response = await apiClient.get('/achievements/my', { params });
    return response.data as AchievementListResponse;
  },

  async checkAchievements(): Promise<CheckAchievementsResponse> {
    const response = await apiClient.post('/achievements/check');
    return response.data as CheckAchievementsResponse;
  },

  async getUserAchievements(userId: string, params: PaginationParams = {}): Promise<AchievementListResponse> {
    const response = await apiClient.get(`/achievements/user/${userId}`, { params });
    return response.data as AchievementListResponse;
  },

  async getAchievementById(achievementId: string): Promise<AchievementByIdResponse> {
    const response = await apiClient.get(`/achievements/${achievementId}`);
    return response.data as AchievementByIdResponse;
  },

  async getAchievementStats(achievementId: string): Promise<AchievementStatsResponse> {
    const response = await apiClient.get(`/achievements/${achievementId}/stats`);
    return response.data as AchievementStatsResponse;
  },
};
