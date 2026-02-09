/**
 * User Profile Service
 * Handles profile-related API calls (get, update, search, stats)
 */

import { apiClient } from '../client/apiClient';
import { validateUserId, validateDataObject } from '../utils/validation';
import { isDemoUser, getDemoUser } from '@/data/demoData';
import type {
  User,
  GetUserResponse,
  UpdateProfileData,
  SearchUsersParams,
  SearchUsersResponse,
  UserStatsResponse,
  Pagination,
} from './userService-types';

export const userProfileService = {
  async getUserById(userId: string): Promise<GetUserResponse> {
    if (isDemoUser(userId)) {
      return { user: getDemoUser(userId) as User };
    }

    validateUserId(userId, 'getUserById');

    const response = await apiClient.get(`/users/${userId}`);
    const data = response.data as { data?: User } & User;
    return { user: data?.data || data };
  },

  async updateProfile(userId: string, data: UpdateProfileData): Promise<unknown> {
    validateUserId(userId, 'updateProfile');
    validateDataObject(data, 'updateProfile');

    const response = await apiClient.patch(`/users/${userId}`, data);
    return response.data;
  },

  async searchUsers(params: SearchUsersParams = {}): Promise<SearchUsersResponse> {
    const response = await apiClient.get('/users', { params });
    const result = response.data as { data?: User[]; users?: User[]; pagination?: Pagination };
    return {
      users: result.data || result.users || [],
      total: result.pagination?.total || (result.data || result.users || []).length,
      pagination: result.pagination,
    };
  },

  async getUserStats(userId: string): Promise<UserStatsResponse> {
    validateUserId(userId, 'getUserStats');

    const response = await apiClient.get(`/users/${userId}/stats`);
    return response.data as UserStatsResponse;
  },

  async updateUser(userId: string, data: UpdateProfileData): Promise<unknown> {
    validateUserId(userId, 'updateUser');
    validateDataObject(data, 'updateUser');

    const response = await apiClient.patch(`/users/${userId}`, data);
    return response.data;
  },
};
