/**
 * User Service
 * Handles all user-related API calls
 */

import { apiClient } from '../client/apiClient';
import { validateUserId, validateDataObject } from '../utils/validation';
import { isDemoUser, getDemoUser } from '@/data/demoData';

interface User {
  id: string;
  email?: string;
  nickname?: string;
  first_name?: string;
  last_name?: string;
  bio?: string;
  age?: number;
  location?: string;
  profile_images?: string[];
  main_profile_image_url?: string;
  is_verified?: boolean;
  is_admin?: boolean;
  is_premium?: boolean;
  is_blocked?: boolean;
  [key: string]: unknown;
}

interface Pagination {
  total: number;
  limit: number;
  offset: number;
}

interface PaginationParams {
  limit?: number;
  offset?: number;
}

interface GetUserResponse {
  user: User;
}

interface UpdateProfileData {
  firstName?: string;
  lastName?: string;
  bio?: string;
  location?: string;
  profilePictureUrl?: string;
  preferredLanguage?: string;
  profile_images?: string[];
  main_profile_image_url?: string;
  [key: string]: unknown;
}

interface SearchUsersParams extends PaginationParams {
  search?: string;
  isBlocked?: boolean;
}

interface SearchUsersResponse {
  users: User[];
  total: number;
  pagination?: Pagination;
}

interface UserStatsResponse {
  stats: unknown;
}

interface MessageResponse {
  message: string;
}

interface ExportDataResponse {
  data: unknown;
}

export const userService = {
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

  async blockUser(userId: string): Promise<MessageResponse> {
    validateUserId(userId, 'blockUser');

    const response = await apiClient.post(`/users/${userId}/block`);
    return response.data as MessageResponse;
  },

  async unblockUser(userId: string): Promise<MessageResponse> {
    validateUserId(userId, 'unblockUser');

    const response = await apiClient.post(`/users/${userId}/unblock`);
    return response.data as MessageResponse;
  },

  async deleteUser(userId: string): Promise<MessageResponse> {
    validateUserId(userId, 'deleteUser');

    const response = await apiClient.delete(`/users/${userId}`);
    return response.data as MessageResponse;
  },

  async updateUser(userId: string, data: UpdateProfileData): Promise<unknown> {
    validateUserId(userId, 'updateUser');
    validateDataObject(data, 'updateUser');

    const response = await apiClient.patch(`/users/${userId}`, data);
    return response.data;
  },

  async exportUserData(userId: string): Promise<ExportDataResponse> {
    validateUserId(userId, 'exportUserData');

    const response = await apiClient.get(`/users/${userId}/export`);
    return response.data as ExportDataResponse;
  },

  async deleteUserGDPR(userId: string): Promise<MessageResponse> {
    validateUserId(userId, 'deleteUserGDPR');

    const response = await apiClient.delete(`/users/${userId}/gdpr`);
    return response.data as MessageResponse;
  },
};
