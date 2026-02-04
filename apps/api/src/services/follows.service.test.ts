/**
 * Follows Service Tests
 * Tests for user follow/unfollow functionality
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FollowsService } from './follows.service.js';
import { prisma } from '../lib/prisma.js';

// Type the mocked prisma
const mockPrisma = prisma as unknown as {
  follow: {
    findUnique: ReturnType<typeof vi.fn>;
    findMany: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
    count: ReturnType<typeof vi.fn>;
  };
  notification: {
    create: ReturnType<typeof vi.fn>;
  };
};

// Test data factories
const createMockFollow = (overrides: Record<string, unknown> = {}) => ({
  id: 'follow-1',
  followerId: 'user-1',
  followingId: 'user-2',
  createdAt: new Date('2024-01-01'),
  ...overrides,
});

describe('FollowsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ==================== followUser ====================
  describe('followUser', () => {
    it('should create a new follow', async () => {
      const mockFollow = createMockFollow();
      mockPrisma.follow.findUnique.mockResolvedValue(null);
      mockPrisma.follow.create.mockResolvedValue(mockFollow);
      mockPrisma.notification.create.mockResolvedValue({});

      const result = await FollowsService.followUser('user-1', 'user-2');

      expect(mockPrisma.follow.create).toHaveBeenCalledWith({
        data: {
          followerId: 'user-1',
          followingId: 'user-2',
        },
      });
      expect(result).toEqual(mockFollow);
    });

    it('should return existing follow without creating new one', async () => {
      const existingFollow = createMockFollow();
      mockPrisma.follow.findUnique.mockResolvedValue(existingFollow);

      const result = await FollowsService.followUser('user-1', 'user-2');

      expect(mockPrisma.follow.create).not.toHaveBeenCalled();
      expect(result).toEqual(existingFollow);
    });

    it('should throw error when trying to follow yourself', async () => {
      await expect(FollowsService.followUser('user-1', 'user-1')).rejects.toThrow(
        'Cannot follow yourself'
      );
      expect(mockPrisma.follow.findUnique).not.toHaveBeenCalled();
    });

    it('should create notification for followed user', async () => {
      mockPrisma.follow.findUnique.mockResolvedValue(null);
      mockPrisma.follow.create.mockResolvedValue(createMockFollow());
      mockPrisma.notification.create.mockResolvedValue({});

      await FollowsService.followUser('user-1', 'user-2');

      expect(mockPrisma.notification.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-2',
          type: 'NEW_FOLLOW',
          title: 'New Follower',
          message: 'Someone started following you!',
          relatedUserId: 'user-1',
        },
      });
    });
  });

  // ==================== unfollowUser ====================
  describe('unfollowUser', () => {
    it('should delete follow', async () => {
      const existingFollow = createMockFollow();
      mockPrisma.follow.findUnique.mockResolvedValue(existingFollow);
      mockPrisma.follow.delete.mockResolvedValue(existingFollow);

      const result = await FollowsService.unfollowUser('user-1', 'user-2');

      expect(mockPrisma.follow.delete).toHaveBeenCalledWith({
        where: { id: 'follow-1' },
      });
      expect(result).toEqual({ success: true });
    });

    it('should throw error when follow not found', async () => {
      mockPrisma.follow.findUnique.mockResolvedValue(null);

      await expect(FollowsService.unfollowUser('user-1', 'user-2')).rejects.toThrow(
        'Follow not found'
      );
      expect(mockPrisma.follow.delete).not.toHaveBeenCalled();
    });
  });

  // ==================== getFollowers ====================
  describe('getFollowers', () => {
    it('should return followers with pagination', async () => {
      const mockFollows = [
        createMockFollow({ followerId: 'user-2' }),
        createMockFollow({ id: 'follow-2', followerId: 'user-3' }),
      ];
      mockPrisma.follow.findMany.mockResolvedValue(mockFollows);
      mockPrisma.follow.count.mockResolvedValue(2);

      const result = await FollowsService.getFollowers('user-1');

      expect(result.followers).toEqual(['user-2', 'user-3']);
      expect(result.pagination.total).toBe(2);
      expect(mockPrisma.follow.findMany).toHaveBeenCalledWith({
        where: { followingId: 'user-1' },
        skip: 0,
        take: 50,
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should use custom pagination values', async () => {
      mockPrisma.follow.findMany.mockResolvedValue([]);
      mockPrisma.follow.count.mockResolvedValue(0);

      await FollowsService.getFollowers('user-1', { limit: 10, offset: 5 });

      expect(mockPrisma.follow.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 5,
          take: 10,
        })
      );
    });
  });

  // ==================== getFollowing ====================
  describe('getFollowing', () => {
    it('should return following users with pagination', async () => {
      const mockFollows = [
        createMockFollow({ followingId: 'user-2' }),
        createMockFollow({ id: 'follow-2', followingId: 'user-3' }),
      ];
      mockPrisma.follow.findMany.mockResolvedValue(mockFollows);
      mockPrisma.follow.count.mockResolvedValue(2);

      const result = await FollowsService.getFollowing('user-1');

      expect(result.following).toEqual(['user-2', 'user-3']);
      expect(result.pagination.total).toBe(2);
      expect(mockPrisma.follow.findMany).toHaveBeenCalledWith({
        where: { followerId: 'user-1' },
        skip: 0,
        take: 50,
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  // ==================== isFollowing ====================
  describe('isFollowing', () => {
    it('should return true when following', async () => {
      mockPrisma.follow.findUnique.mockResolvedValue(createMockFollow());

      const result = await FollowsService.isFollowing('user-1', 'user-2');

      expect(result).toBe(true);
    });

    it('should return false when not following', async () => {
      mockPrisma.follow.findUnique.mockResolvedValue(null);

      const result = await FollowsService.isFollowing('user-1', 'user-2');

      expect(result).toBe(false);
    });
  });

  // ==================== getFollowStats ====================
  describe('getFollowStats', () => {
    it('should return follow statistics', async () => {
      mockPrisma.follow.count
        .mockResolvedValueOnce(100) // followers
        .mockResolvedValueOnce(50); // following

      const result = await FollowsService.getFollowStats('user-1');

      expect(result.followersCount).toBe(100);
      expect(result.followingCount).toBe(50);
    });
  });

  // ==================== areMutualFollowers ====================
  describe('areMutualFollowers', () => {
    it('should return true when users follow each other', async () => {
      mockPrisma.follow.findUnique
        .mockResolvedValueOnce(createMockFollow())
        .mockResolvedValueOnce(createMockFollow({ followerId: 'user-2', followingId: 'user-1' }));

      const result = await FollowsService.areMutualFollowers('user-1', 'user-2');

      expect(result).toBe(true);
    });

    it('should return false when only one follows the other', async () => {
      mockPrisma.follow.findUnique
        .mockResolvedValueOnce(createMockFollow())
        .mockResolvedValueOnce(null);

      const result = await FollowsService.areMutualFollowers('user-1', 'user-2');

      expect(result).toBe(false);
    });

    it('should return false when neither follows', async () => {
      mockPrisma.follow.findUnique
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);

      const result = await FollowsService.areMutualFollowers('user-1', 'user-2');

      expect(result).toBe(false);
    });
  });
});
