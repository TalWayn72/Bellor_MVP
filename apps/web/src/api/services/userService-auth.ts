/**
 * User Auth/Admin Service
 * Handles auth, moderation, and GDPR-related API calls
 */

import { apiClient } from '../client/apiClient';
import { validateUserId } from '../utils/validation';
import type { MessageResponse, ExportDataResponse } from './userService-types';

export const userAuthService = {
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
