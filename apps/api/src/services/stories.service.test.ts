/**
 * Stories Service Tests
 * Tests for 24-hour ephemeral content (Stories)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { StoriesService } from './stories.service.js';
import { prisma } from '../lib/prisma.js';
import { MediaType } from '@prisma/client';

// Type the mocked prisma
const mockPrisma = prisma as unknown as {
  story: {
    findUnique: ReturnType<typeof vi.fn>;
    findMany: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
    deleteMany: ReturnType<typeof vi.fn>;
    count: ReturnType<typeof vi.fn>;
    aggregate: ReturnType<typeof vi.fn>;
  };
};

// Test data factories
const createMockUser = (overrides: Record<string, unknown> = {}) => ({
  id: 'user-1',
  firstName: 'Test',
  lastName: 'User',
  profileImages: ['https://example.com/image.jpg'],
  isBlocked: false,
  ...overrides,
});

const createMockStory = (overrides: Record<string, unknown> = {}) => ({
  id: 'story-1',
  userId: 'user-1',
  mediaType: MediaType.IMAGE,
  mediaUrl: 'https://example.com/story.jpg',
  thumbnailUrl: 'https://example.com/thumb.jpg',
  caption: 'My story',
  viewCount: 0,
  createdAt: new Date('2024-01-01'),
  expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
  user: createMockUser(),
  ...overrides,
});

describe('StoriesService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ==================== createStory ====================
  describe('createStory', () => {
    it('should create a new story', async () => {
      const mockStory = createMockStory();
      mockPrisma.story.create.mockResolvedValue(mockStory);

      const result = await StoriesService.createStory({
        userId: 'user-1',
        mediaType: MediaType.IMAGE,
        mediaUrl: 'https://example.com/story.jpg',
        thumbnailUrl: 'https://example.com/thumb.jpg',
        caption: 'My story',
      });

      expect(mockPrisma.story.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 'user-1',
          mediaType: MediaType.IMAGE,
          mediaUrl: 'https://example.com/story.jpg',
          expiresAt: expect.any(Date),
        }),
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              profileImages: true,
            },
          },
        },
      });
      expect(result).toEqual(mockStory);
    });

    it('should set expiration to 24 hours from now', async () => {
      mockPrisma.story.create.mockResolvedValue(createMockStory());

      await StoriesService.createStory({
        userId: 'user-1',
        mediaType: MediaType.IMAGE,
        mediaUrl: 'https://example.com/story.jpg',
      });

      const callArgs = mockPrisma.story.create.mock.calls[0][0];
      const expiresAt = callArgs.data.expiresAt as Date;
      const expectedMin = Date.now() + 23 * 60 * 60 * 1000; // 23 hours
      const expectedMax = Date.now() + 25 * 60 * 60 * 1000; // 25 hours

      expect(expiresAt.getTime()).toBeGreaterThan(expectedMin);
      expect(expiresAt.getTime()).toBeLessThan(expectedMax);
    });
  });

  // ==================== getStoryById ====================
  describe('getStoryById', () => {
    it('should return story when found and not expired', async () => {
      const mockStory = createMockStory();
      mockPrisma.story.findUnique.mockResolvedValue(mockStory);

      const result = await StoriesService.getStoryById('story-1');

      expect(result).toEqual(mockStory);
    });

    it('should throw error when story not found', async () => {
      mockPrisma.story.findUnique.mockResolvedValue(null);

      await expect(StoriesService.getStoryById('non-existent')).rejects.toThrow('Story not found');
    });

    it('should throw error when story has expired', async () => {
      const expiredStory = createMockStory({
        expiresAt: new Date(Date.now() - 1000), // Expired
      });
      mockPrisma.story.findUnique.mockResolvedValue(expiredStory);

      await expect(StoriesService.getStoryById('story-1')).rejects.toThrow('Story has expired');
    });
  });

  // ==================== getStoriesByUser ====================
  describe('getStoriesByUser', () => {
    it('should return active stories for user', async () => {
      const mockStories = [
        createMockStory({ id: 'story-1' }),
        createMockStory({ id: 'story-2' }),
      ];
      mockPrisma.story.findMany.mockResolvedValue(mockStories);

      const result = await StoriesService.getStoriesByUser('user-1');

      expect(result).toHaveLength(2);
      expect(mockPrisma.story.findMany).toHaveBeenCalledWith({
        where: {
          userId: 'user-1',
          expiresAt: { gt: expect.any(Date) },
        },
        include: expect.anything(),
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should return empty array when no active stories', async () => {
      mockPrisma.story.findMany.mockResolvedValue([]);

      const result = await StoriesService.getStoriesByUser('user-1');

      expect(result).toEqual([]);
    });
  });

  // ==================== getStoriesFeed ====================
  describe('getStoriesFeed', () => {
    it('should return stories grouped by user', async () => {
      const mockStories = [
        createMockStory({ id: 'story-1', userId: 'user-1', user: createMockUser({ id: 'user-1' }) }),
        createMockStory({ id: 'story-2', userId: 'user-1', user: createMockUser({ id: 'user-1' }) }),
        createMockStory({ id: 'story-3', userId: 'user-2', user: createMockUser({ id: 'user-2' }) }),
      ];
      mockPrisma.story.findMany.mockResolvedValue(mockStories);

      const result = await StoriesService.getStoriesFeed('current-user');

      expect(result).toHaveLength(2); // 2 users
      expect(result[0].stories).toBeDefined();
    });

    it('should put current user stories first', async () => {
      const mockStories = [
        createMockStory({ id: 'story-1', userId: 'user-1', user: createMockUser({ id: 'user-1' }) }),
        createMockStory({ id: 'story-2', userId: 'current-user', user: createMockUser({ id: 'current-user' }) }),
      ];
      mockPrisma.story.findMany.mockResolvedValue(mockStories);

      const result = await StoriesService.getStoriesFeed('current-user');

      expect(result[0].user.id).toBe('current-user');
    });

    it('should use pagination parameters', async () => {
      mockPrisma.story.findMany.mockResolvedValue([]);

      await StoriesService.getStoriesFeed('user-1', { limit: 20, offset: 10 });

      expect(mockPrisma.story.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 20,
          skip: 10,
        })
      );
    });
  });

  // ==================== viewStory ====================
  describe('viewStory', () => {
    it('should increment view count for non-owner', async () => {
      const mockStory = createMockStory({ userId: 'story-owner' });
      mockPrisma.story.findUnique.mockResolvedValue(mockStory);
      mockPrisma.story.update.mockResolvedValue({ ...mockStory, viewCount: 1 });

      const result = await StoriesService.viewStory('story-1', 'viewer-user');

      expect(mockPrisma.story.update).toHaveBeenCalledWith({
        where: { id: 'story-1' },
        data: { viewCount: { increment: 1 } },
      });
      expect(result.viewCount).toBe(1);
    });

    it('should not increment view count for self-view', async () => {
      const mockStory = createMockStory({ userId: 'user-1' });
      mockPrisma.story.findUnique.mockResolvedValue(mockStory);

      const result = await StoriesService.viewStory('story-1', 'user-1');

      expect(mockPrisma.story.update).not.toHaveBeenCalled();
      expect(result).toEqual(mockStory);
    });

    it('should throw error when story not found', async () => {
      mockPrisma.story.findUnique.mockResolvedValue(null);

      await expect(StoriesService.viewStory('non-existent', 'user-1')).rejects.toThrow('Story not found');
    });
  });

  // ==================== deleteStory ====================
  describe('deleteStory', () => {
    it('should delete story when user is owner', async () => {
      const mockStory = createMockStory({ userId: 'user-1' });
      mockPrisma.story.findUnique.mockResolvedValue(mockStory);
      mockPrisma.story.delete.mockResolvedValue(mockStory);

      const result = await StoriesService.deleteStory('story-1', 'user-1');

      expect(mockPrisma.story.delete).toHaveBeenCalledWith({
        where: { id: 'story-1' },
      });
      expect(result).toEqual({ success: true });
    });

    it('should throw error when story not found', async () => {
      mockPrisma.story.findUnique.mockResolvedValue(null);

      await expect(StoriesService.deleteStory('non-existent', 'user-1')).rejects.toThrow('Story not found');
    });

    it('should throw error when user is not owner', async () => {
      const mockStory = createMockStory({ userId: 'other-user' });
      mockPrisma.story.findUnique.mockResolvedValue(mockStory);

      await expect(StoriesService.deleteStory('story-1', 'user-1')).rejects.toThrow(
        'Unauthorized: You can only delete your own stories'
      );
      expect(mockPrisma.story.delete).not.toHaveBeenCalled();
    });
  });

  // ==================== cleanupExpiredStories ====================
  describe('cleanupExpiredStories', () => {
    it('should delete expired stories', async () => {
      mockPrisma.story.deleteMany.mockResolvedValue({ count: 5 });

      const result = await StoriesService.cleanupExpiredStories();

      expect(mockPrisma.story.deleteMany).toHaveBeenCalledWith({
        where: {
          expiresAt: { lt: expect.any(Date) },
        },
      });
      expect(result).toEqual({ deletedCount: 5 });
    });

    it('should return 0 when no expired stories', async () => {
      mockPrisma.story.deleteMany.mockResolvedValue({ count: 0 });

      const result = await StoriesService.cleanupExpiredStories();

      expect(result).toEqual({ deletedCount: 0 });
    });
  });

  // ==================== getUserStoryStats ====================
  describe('getUserStoryStats', () => {
    it('should return user story statistics', async () => {
      mockPrisma.story.count.mockResolvedValue(3);
      mockPrisma.story.aggregate.mockResolvedValue({ _sum: { viewCount: 100 } });

      const result = await StoriesService.getUserStoryStats('user-1');

      expect(result.activeStories).toBe(3);
      expect(result.totalViews).toBe(100);
    });

    it('should return 0 views when no views', async () => {
      mockPrisma.story.count.mockResolvedValue(0);
      mockPrisma.story.aggregate.mockResolvedValue({ _sum: { viewCount: null } });

      const result = await StoriesService.getUserStoryStats('user-1');

      expect(result.totalViews).toBe(0);
    });
  });

  // ==================== userHasActiveStories ====================
  describe('userHasActiveStories', () => {
    it('should return true when user has active stories', async () => {
      mockPrisma.story.count.mockResolvedValue(2);

      const result = await StoriesService.userHasActiveStories('user-1');

      expect(result).toBe(true);
    });

    it('should return false when user has no active stories', async () => {
      mockPrisma.story.count.mockResolvedValue(0);

      const result = await StoriesService.userHasActiveStories('user-1');

      expect(result).toBe(false);
    });
  });
});
