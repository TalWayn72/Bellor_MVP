/**
 * Response Service
 * Handles all response-related API calls (user responses to missions)
 */

import { apiClient } from '../client/apiClient';
import { validateUserId, validateRequiredId, validateDataObject } from '../utils/validation';
import { isDemoUser, getDemoResponses } from '@/data/demoData';
import { transformResponses, transformResponse } from '@/utils';

interface Pagination {
  total: number;
  limit: number;
  offset: number;
}

interface PaginationParams {
  limit?: number;
  offset?: number;
}

interface UserResponse {
  id: string;
  user_id?: string;
  response_type?: string;
  content?: string;
  [key: string]: unknown;
}

interface ResponseListResponse {
  data: UserResponse[];
  responses: UserResponse[];
  pagination?: Pagination;
}

interface UserResponsesResponse {
  responses: UserResponse[];
  total: number;
}

interface ResponseByIdResponse {
  data: UserResponse;
  [key: string]: unknown;
}

interface CreateResponseData {
  missionId: string;
  content?: string;
  mediaUrl?: string;
  responseType?: string;
  [key: string]: unknown;
}

interface LikeResponseResponse {
  [key: string]: unknown;
}

interface DeleteResponseResponse {
  [key: string]: unknown;
}

export const responseService = {
  async listResponses(params: PaginationParams = {}): Promise<ResponseListResponse> {
    const response = await apiClient.get('/responses', { params });
    const result = response.data as { data?: UserResponse[]; responses?: UserResponse[]; pagination?: Pagination };
    const responses = transformResponses(result?.data || result?.responses || []);
    return {
      ...result,
      data: responses,
      responses: responses,
      pagination: result?.pagination,
    } as ResponseListResponse;
  },

  async getMyResponses(params: PaginationParams = {}): Promise<ResponseListResponse> {
    const response = await apiClient.get('/responses/my', { params });
    const result = response.data as { data?: UserResponse[]; responses?: UserResponse[]; pagination?: Pagination };
    const responses = transformResponses(result?.data || result?.responses || []);
    return {
      ...result,
      data: responses,
      responses: responses,
      pagination: result?.pagination,
    } as ResponseListResponse;
  },

  async getUserResponses(userId: string, params: PaginationParams = {}): Promise<UserResponsesResponse> {
    if (isDemoUser(userId)) {
      const demoResponses = getDemoResponses(userId) as UserResponse[];
      return { responses: demoResponses, total: demoResponses.length };
    }

    validateUserId(userId, 'getUserResponses');

    const response = await apiClient.get('/responses', {
      params: { ...params, userId, user_id: userId },
    });
    const result = response.data as { data?: UserResponse[]; responses?: UserResponse[]; total?: number; pagination?: Pagination };
    const responses = transformResponses(result.data || result.responses || []);
    return {
      responses,
      total: result.total || result.pagination?.total || 0,
    };
  },

  async getResponseById(id: string): Promise<ResponseByIdResponse> {
    validateRequiredId(id, 'responseId', 'getResponseById');
    const response = await apiClient.get(`/responses/${id}`);
    const result = response.data as ResponseByIdResponse;
    return { ...result, data: transformResponse(result.data) };
  },

  async createResponse(data: CreateResponseData): Promise<unknown> {
    validateDataObject(data, 'createResponse');
    const response = await apiClient.post('/responses', data);
    return response.data;
  },

  async likeResponse(id: string): Promise<LikeResponseResponse> {
    validateRequiredId(id, 'responseId', 'likeResponse');
    const response = await apiClient.post(`/responses/${id}/like`);
    return response.data as LikeResponseResponse;
  },

  async deleteResponse(id: string): Promise<DeleteResponseResponse> {
    validateRequiredId(id, 'responseId', 'deleteResponse');
    const response = await apiClient.delete(`/responses/${id}`);
    return response.data as DeleteResponseResponse;
  },
};
