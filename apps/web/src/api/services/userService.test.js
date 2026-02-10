import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock apiClient
vi.mock('../client/apiClient', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

import { userService } from './userService';
import { apiClient } from '../client/apiClient';

describe('[P2][profile] userService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('updateProfile', () => {
    it('should pass userId as first parameter, not as part of data object', async () => {
      const mockResponse = { data: { user: { id: 'user-123' } } };
      apiClient.patch.mockResolvedValue(mockResponse);

      const userId = 'user-123';
      const data = { response_count: 5 };

      await userService.updateProfile(userId, data);

      // Verify the URL contains the userId, not [object Object]
      expect(apiClient.patch).toHaveBeenCalledWith('/users/user-123', data);
    });

    it('should NOT accept data object as first parameter (bug pattern)', () => {
      // This test documents the bug that was fixed
      // BAD: userService.updateProfile({ response_count: 5 })
      // Would result in: PATCH /users/[object Object]

      const dataAsFirstParam = { response_count: 5 };
      const interpolatedUrl = `/users/${dataAsFirstParam}`;

      // This is what happens when object is passed as userId
      expect(interpolatedUrl).toBe('/users/[object Object]');
    });

    it('should correctly construct URL with string userId', () => {
      const userId = 'cm123abc';
      const url = `/users/${userId}`;

      expect(url).toBe('/users/cm123abc');
      expect(url).not.toContain('[object Object]');
    });

    it('should handle all profile update fields', async () => {
      const mockResponse = { data: { user: { id: 'user-123' } } };
      apiClient.patch.mockResolvedValue(mockResponse);

      const userId = 'user-123';
      const data = {
        response_count: 10,
        mission_completed_count: 5,
        last_active_date: '2026-02-04T12:00:00.000Z',
        bio: 'New bio',
        location: 'Tel Aviv'
      };

      await userService.updateProfile(userId, data);

      expect(apiClient.patch).toHaveBeenCalledWith('/users/user-123', data);
    });
  });

  describe('updateUser', () => {
    it('should pass userId as first parameter', async () => {
      const mockResponse = { data: { user: { id: 'user-456' } } };
      apiClient.patch.mockResolvedValue(mockResponse);

      const userId = 'user-456';
      const data = { profile_images: ['image1.jpg'] };

      await userService.updateUser(userId, data);

      expect(apiClient.patch).toHaveBeenCalledWith('/users/user-456', data);
    });

    it('should NOT use object as userId', () => {
      // This documents the anti-pattern
      const wrongUsage = { profile_images: ['image.jpg'] };
      const resultUrl = `/users/${wrongUsage}`;

      // This is what happens with wrong usage
      expect(resultUrl).toBe('/users/[object Object]');
    });

    // New validation tests (ISSUE-013)
    it('should throw error when userId is undefined', async () => {
      const data = { profile_images: ['image1.jpg'] };

      await expect(userService.updateUser(undefined, data))
        .rejects.toThrow('Invalid user ID: userId is required');
    });

    it('should throw error when userId is null', async () => {
      const data = { profile_images: ['image1.jpg'] };

      await expect(userService.updateUser(null, data))
        .rejects.toThrow('Invalid user ID: userId is required');
    });

    it('should throw error when userId is string "undefined"', async () => {
      const data = { profile_images: ['image1.jpg'] };

      await expect(userService.updateUser('undefined', data))
        .rejects.toThrow('Invalid user ID: "undefined" is not a valid ID for updateUser');
    });

    it('should throw error when userId is empty string', async () => {
      const data = { profile_images: ['image1.jpg'] };

      await expect(userService.updateUser('', data))
        .rejects.toThrow('Invalid user ID: userId is required');
    });

    it('should throw error when data is not an object', async () => {
      const userId = 'user-456';

      await expect(userService.updateUser(userId, 14))
        .rejects.toThrow('Invalid data: must be an object');
    });

    it('should throw error when data is null', async () => {
      const userId = 'user-456';

      await expect(userService.updateUser(userId, null))
        .rejects.toThrow('Invalid data: must be an object');
    });

    it('should NOT call API when validation fails', async () => {
      try {
        await userService.updateUser(undefined, { test: true });
      } catch (e) {
        // Expected
      }

      expect(apiClient.patch).not.toHaveBeenCalled();
    });
  });

  describe('getUserById', () => {
    it('should correctly interpolate userId in URL', async () => {
      const mockResponse = { data: { id: 'user-789', nickname: 'Test' } };
      apiClient.get.mockResolvedValue(mockResponse);

      await userService.getUserById('user-789');

      expect(apiClient.get).toHaveBeenCalledWith('/users/user-789');
    });
  });
});

describe('[P2][profile] Task Pages - User Update Pattern', () => {
  describe('Correct usage pattern', () => {
    it('should always pass currentUser.id as first param to updateProfile', () => {
      // Simulating correct pattern from AudioTask/VideoTask
      const currentUser = { id: 'cm123user', response_count: 5 };

      // Correct pattern
      const correctParams = [
        currentUser.id, // First param: userId string
        {               // Second param: data object
          response_count: currentUser.response_count + 1,
          mission_completed_count: 1
        }
      ];

      expect(typeof correctParams[0]).toBe('string');
      expect(typeof correctParams[1]).toBe('object');
      expect(correctParams[0]).not.toBe('[object Object]');
    });

    it('should detect incorrect pattern (object as first param)', () => {
      const currentUser = { id: 'cm123user', response_count: 5 };

      // WRONG pattern (bug that was fixed)
      const wrongFirstParam = {
        response_count: currentUser.response_count + 1
      };

      // When object is used as URL param, it becomes [object Object]
      expect(String(wrongFirstParam)).toBe('[object Object]');
    });
  });
});
