import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock apiClient
vi.mock('../client/apiClient', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  },
}));

import { likeService } from './likeService';
import { apiClient } from '../client/apiClient';

describe('[P1][social] likeService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getResponseLikes', () => {
    it('should pass params as object to apiClient', async () => {
      const mockResponse = { data: { likes: [], total: 0 } };
      apiClient.get.mockResolvedValue(mockResponse);

      await likeService.getResponseLikes('response-123', { likeType: 'POSITIVE' });

      expect(apiClient.get).toHaveBeenCalledWith(
        '/likes/response/response-123',
        { params: { likeType: 'POSITIVE' } }
      );
    });

    it('should handle empty params object', async () => {
      const mockResponse = { data: { likes: [], total: 0 } };
      apiClient.get.mockResolvedValue(mockResponse);

      await likeService.getResponseLikes('response-123', {});

      expect(apiClient.get).toHaveBeenCalledWith(
        '/likes/response/response-123',
        { params: {} }
      );
    });

    it('should handle undefined params (default to empty object)', async () => {
      const mockResponse = { data: { likes: [], total: 0 } };
      apiClient.get.mockResolvedValue(mockResponse);

      await likeService.getResponseLikes('response-123');

      expect(apiClient.get).toHaveBeenCalledWith(
        '/likes/response/response-123',
        { params: {} }
      );
    });

    it('should return response data', async () => {
      const mockLikes = [
        { id: 'like-1', user_id: 'user-1', response_id: 'response-123' },
        { id: 'like-2', user_id: 'user-2', response_id: 'response-123' },
      ];
      const mockResponse = { data: { likes: mockLikes, total: 2 } };
      apiClient.get.mockResolvedValue(mockResponse);

      const result = await likeService.getResponseLikes('response-123', { likeType: 'POSITIVE' });

      expect(result).toEqual({ likes: mockLikes, total: 2 });
    });

    it('should pass limit and offset params correctly', async () => {
      const mockResponse = { data: { likes: [], total: 0 } };
      apiClient.get.mockResolvedValue(mockResponse);

      await likeService.getResponseLikes('response-123', { limit: 10, offset: 5 });

      expect(apiClient.get).toHaveBeenCalledWith(
        '/likes/response/response-123',
        { params: { limit: 10, offset: 5 } }
      );
    });
  });

  describe('likeUser', () => {
    it('should send correct payload with likeType', async () => {
      const mockResponse = { data: { like: {}, isMatch: false } };
      apiClient.post.mockResolvedValue(mockResponse);

      await likeService.likeUser('target-user-123', 'ROMANTIC');

      expect(apiClient.post).toHaveBeenCalledWith(
        '/likes/user',
        { targetUserId: 'target-user-123', likeType: 'ROMANTIC' }
      );
    });

    it('should default likeType to ROMANTIC', async () => {
      const mockResponse = { data: { like: {}, isMatch: false } };
      apiClient.post.mockResolvedValue(mockResponse);

      await likeService.likeUser('target-user-123');

      expect(apiClient.post).toHaveBeenCalledWith(
        '/likes/user',
        { targetUserId: 'target-user-123', likeType: 'ROMANTIC' }
      );
    });
  });

  describe('likeResponse', () => {
    it('should send correct payload with likeType', async () => {
      const mockResponse = { data: { like: {} } };
      apiClient.post.mockResolvedValue(mockResponse);

      await likeService.likeResponse('response-123', 'POSITIVE');

      expect(apiClient.post).toHaveBeenCalledWith(
        '/likes/response',
        { responseId: 'response-123', likeType: 'POSITIVE' }
      );
    });

    it('should default likeType to POSITIVE', async () => {
      const mockResponse = { data: { like: {} } };
      apiClient.post.mockResolvedValue(mockResponse);

      await likeService.likeResponse('response-123');

      expect(apiClient.post).toHaveBeenCalledWith(
        '/likes/response',
        { responseId: 'response-123', likeType: 'POSITIVE' }
      );
    });
  });
});
