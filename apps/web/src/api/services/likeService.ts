/**
 * Like Service
 * Handles all like-related API calls (romantic interest, positive feedback)
 */

import { apiClient } from '../client/apiClient';
import { validateUserId, validateRequiredId } from '../utils/validation';
import { transformLikes } from '@/utils';

type LikeType = 'ROMANTIC' | 'POSITIVE' | 'SUPER';

interface Pagination {
  total: number;
  limit: number;
  offset: number;
}

interface PaginationParams {
  limit?: number;
  offset?: number;
}

interface Like {
  id: string;
  like_type: LikeType;
  [key: string]: unknown;
}

interface LikeUserResponse {
  like: Like | null;
  isMatch?: boolean;
  demo?: boolean;
}

interface UnlikeResponse {
  message: string;
}

interface LikeResponseResponse {
  like: Like;
}

interface LikesListResponse {
  likes: Like[];
  pagination?: Pagination;
}

interface CheckLikedResponse {
  liked: boolean;
  hasLiked: boolean;
  isMatch: boolean;
  like?: Like;
}

interface ResponseLikesResponse {
  likes: Like[];
  total: number;
}

export const likeService = {
  async likeUser(targetUserId: string, likeType: LikeType = 'ROMANTIC'): Promise<LikeUserResponse> {
    if (targetUserId?.startsWith('demo-')) {
      return { like: null, isMatch: false, demo: true };
    }

    validateUserId(targetUserId, 'likeUser');

    const response = await apiClient.post('/likes/user', { targetUserId, likeType });
    return response.data as LikeUserResponse;
  },

  async unlikeUser(targetUserId: string): Promise<UnlikeResponse> {
    validateUserId(targetUserId, 'unlikeUser');

    const response = await apiClient.delete(`/likes/user/${targetUserId}`);
    return response.data as UnlikeResponse;
  },

  async likeResponse(responseId: string, likeType: LikeType = 'POSITIVE'): Promise<LikeResponseResponse> {
    validateRequiredId(responseId, 'responseId', 'likeResponse');

    const response = await apiClient.post('/likes/response', { responseId, likeType });
    return response.data as LikeResponseResponse;
  },

  async unlikeResponse(responseId: string): Promise<UnlikeResponse> {
    validateRequiredId(responseId, 'responseId', 'unlikeResponse');

    const response = await apiClient.delete(`/likes/response/${responseId}`);
    return response.data as UnlikeResponse;
  },

  async getReceivedLikes(params: PaginationParams = {}): Promise<LikesListResponse> {
    const response = await apiClient.get('/likes/received', { params });
    const result = response.data as LikesListResponse;
    return { ...result, likes: transformLikes(result.likes || []) };
  },

  async getSentLikes(params: PaginationParams = {}): Promise<LikesListResponse> {
    const response = await apiClient.get('/likes/sent', { params });
    const result = response.data as LikesListResponse;
    return { ...result, likes: transformLikes(result.likes || []) };
  },

  async checkLiked(targetUserId: string): Promise<CheckLikedResponse> {
    if (targetUserId?.startsWith('demo-')) {
      return { liked: false, hasLiked: false, isMatch: false };
    }

    validateUserId(targetUserId, 'checkLiked');

    const response = await apiClient.get(`/likes/check/${targetUserId}`);
    const data = response.data as { hasLiked?: boolean; liked?: boolean; isMatch?: boolean };
    return {
      ...data,
      liked: data.hasLiked ?? data.liked ?? false,
      hasLiked: data.hasLiked ?? data.liked ?? false,
      isMatch: data.isMatch ?? false,
    };
  },

  async getResponseLikes(responseId: string, params: PaginationParams = {}): Promise<ResponseLikesResponse> {
    validateRequiredId(responseId, 'responseId', 'getResponseLikes');

    const response = await apiClient.get(`/likes/response/${responseId}`, { params });
    const result = response.data as ResponseLikesResponse;
    return { ...result, likes: transformLikes(result.likes || []) };
  },
};
