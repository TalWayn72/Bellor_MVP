/**
 * Presence Tracker Tests
 * Tests for presence tracking and online user logic
 */

import { describe, it, expect, beforeEach, afterEach, vi, type Mock } from 'vitest';
import { getOnlineUsers, setUserOnline } from './presence-tracker.js';
import { redis } from '../../lib/redis.js';
import { prisma } from '../../lib/prisma.js';

vi.mock('../../lib/redis.js', () => ({
  redis: {
    keys: vi.fn().mockResolvedValue([]),
    setex: vi.fn(),
    del: vi.fn(),
    get: vi.fn(),
    expire: vi.fn(),
  },
}));

vi.mock('../../lib/prisma.js', () => ({
  prisma: {
    user: {
      findMany: vi.fn().mockResolvedValue([]),
    },
  },
}));

describe('[P1][chat] Presence Tracker - Memory Leak Prevention', () => {
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

      (redis.keys as Mock).mockResolvedValue(['online:user1', 'online:user2', 'online:user3']);
      (prisma.user.findMany as Mock).mockResolvedValue(mockUsers);

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
      (redis.keys as Mock).mockResolvedValue(['online:blockedUser']);
      (prisma.user.findMany as Mock).mockResolvedValue([]);

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
      (redis.keys as Mock).mockResolvedValue(['online:user1']);
      (prisma.user.findMany as Mock).mockResolvedValue([]);

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
