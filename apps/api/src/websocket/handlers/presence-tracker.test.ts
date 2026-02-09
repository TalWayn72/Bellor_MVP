/**
 * Presence Tracker Tests
 * Tests for presence tracking and online user logic
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { getOnlineUsers, setUserOnline } from './presence-tracker.js';
import { redis } from '../../lib/redis.js';
import { prisma } from '../../lib/prisma.js';

vi.mock('../../lib/redis.js');
vi.mock('../../lib/prisma.js');

describe('Presence Tracker - Memory Leak Prevention', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getOnlineUsers', () => {
    it('should return only non-blocked online users', async () => {
      // Arrange
      const mockUserIds = ['user1', 'user2', 'user3'];
      const mockUsers = [
        { id: 'user1', firstName: 'John', lastName: 'Doe', profileImages: [], preferredLanguage: 'en' },
        { id: 'user2', firstName: 'Jane', lastName: 'Smith', profileImages: [], preferredLanguage: 'en' },
      ];

      vi.mocked(redis.keys).mockResolvedValue(['online:user1', 'online:user2', 'online:user3']);
      vi.mocked(prisma.user.findMany).mockResolvedValue(mockUsers);

      // Act
      const result = await getOnlineUsers();

      // Assert
      expect(prisma.user.findMany).toHaveBeenCalledWith({
        where: {
          id: { in: mockUserIds },
          isBlocked: false, // CRITICAL: Must be false, not true
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          profileImages: true,
          preferredLanguage: true,
        },
      });
      expect(result).toEqual(mockUsers);
    });

    it('should not return blocked users even if they are online', async () => {
      // Arrange
      vi.mocked(redis.keys).mockResolvedValue(['online:blockedUser']);
      vi.mocked(prisma.user.findMany).mockResolvedValue([]);

      // Act
      const result = await getOnlineUsers();

      // Assert
      expect(result).toEqual([]);
      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            isBlocked: false,
          }),
        })
      );
    });
  });

  describe('Memory leak regression tests', () => {
    it('should not accumulate Redis keys on repeated calls', async () => {
      // Arrange
      vi.mocked(redis.keys).mockResolvedValue(['online:user1']);
      vi.mocked(prisma.user.findMany).mockResolvedValue([]);

      // Act - call multiple times
      await getOnlineUsers();
      await getOnlineUsers();
      await getOnlineUsers();

      // Assert - should not accumulate calls
      expect(redis.keys).toHaveBeenCalledTimes(3);
      expect(prisma.user.findMany).toHaveBeenCalledTimes(3);
    });

    it('should properly set and expire online status', async () => {
      // Arrange
      const userId = 'test-user';
      const ttl = 300;

      // Act
      await setUserOnline(userId);

      // Assert
      expect(redis.setex).toHaveBeenCalledWith(
        `online:${userId}`,
        ttl,
        expect.any(String)
      );
    });
  });
});
