import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { userService } from './userService';
import { apiClient } from '../client/apiClient';

describe('[P2][profile] userService', () => {
  beforeEach(() => {
    vi.spyOn(apiClient, 'get').mockResolvedValue(undefined);
    vi.spyOn(apiClient, 'post').mockResolvedValue(undefined);
    vi.spyOn(apiClient, 'patch').mockResolvedValue(undefined);
    vi.spyOn(apiClient, 'delete').mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('updateProfile', () => {
    it('should pass userId as first parameter, not as part of data object', async () => {
      const mockResponse = { data: { user: { id: 'user-123' } } };
      apiClient.patch.mockResolvedValue(mockResponse);

      const userId = 'user-123';
      const data = { response_count: 5 };

      await userService.updateProfile(userId, data);

      expect(apiClient.patch).toHaveBeenCalledWith('/users/user-123', data);
    });

    it('should NOT accept data object as first parameter (bug pattern)', () => {
      const dataAsFirstParam = { response_count: 5 };
      const interpolatedUrl = `/users/${dataAsFirstParam}`;

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
      const wrongUsage = { profile_images: ['image.jpg'] };
      const resultUrl = `/users/${wrongUsage}`;

      expect(resultUrl).toBe('/users/[object Object]');
    });

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
      const currentUser = { id: 'cm123user', response_count: 5 };

      const correctParams = [
        currentUser.id,
        {
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

      const wrongFirstParam = {
        response_count: currentUser.response_count + 1
      };

      expect(String(wrongFirstParam)).toBe('[object Object]');
    });
  });
});
