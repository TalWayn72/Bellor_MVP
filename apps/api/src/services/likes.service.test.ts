/**
 * Likes Service Tests
 * Tests for user likes (romantic interest, positive feedback)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LikesService } from './likes.service.js';
import { prisma } from '../lib/prisma.js';
import { LikeType } from '@prisma/client';

// Type the mocked prisma
const mockPrisma = prisma as unknown as {
  user: {
    findUnique: ReturnType<typeof vi.fn>;
  };
  like: {
    findUnique: ReturnType<typeof vi.fn>;
    findFirst: ReturnType<typeof vi.fn>;
    findMany: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
    count: ReturnType<typeof vi.fn>;
  };
  notification: {
    create: ReturnType<typeof vi.fn>;
  };
  response: {
    update: ReturnType<typeof vi.fn>;
  };
  $transaction: ReturnType<typeof vi.fn>;
};

// Test data factories
const createMockLike = (overrides: Record<string, unknown> = {}) => ({
  id: 'like-1',
  userId: 'user-1',
  targetUserId: 'user-2',
  targetResponseId: null,
  likeType: LikeType.ROMANTIC,
  createdAt: new Date('2024-01-01'),
  ...overrides,
});

describe('LikesService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock target user lookup (validation added to likeUser)
    mockPrisma.user.findUnique.mockResolvedValue({ id: 'user-2' });
    // Mock $transaction to support both array and callback styles
    mockPrisma.$transaction.mockImplementation(async (fn: unknown) => {
      if (typeof fn === 'function') return (fn as (p: typeof mockPrisma) => unknown)(mockPrisma);
      return Promise.all(fn as Promise<unknown>[]);
    });
  });

  // ==================== likeUser ====================
  describe('likeUser', () => {
    it('should create a new like when none exists', async () => {
      const newLike = createMockLike();
      mockPrisma.like.findUnique.mockResolvedValue(null);
      mockPrisma.like.create.mockResolvedValue(newLike);
      mockPrisma.notification.create.mockResolvedValue({});
      mockPrisma.like.findFirst.mockResolvedValue(null); // No mutual like

      const result = await LikesService.likeUser('user-1', 'user-2', LikeType.ROMANTIC);

      expect(mockPrisma.like.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-1',
          targetUserId: 'user-2',
          likeType: LikeType.ROMANTIC,
        },
      });
      expect(result.isMatch).toBe(false);
    });

    it('should return existing like without creating new one', async () => {
      const existingLike = createMockLike();
      mockPrisma.like.findUnique.mockResolvedValue(existingLike);

      const result = await LikesService.likeUser('user-1', 'user-2', LikeType.ROMANTIC);

      expect(mockPrisma.like.create).not.toHaveBeenCalled();
      expect(result).toEqual(existingLike);
    });

    it('should update like type if different', async () => {
      const existingLike = createMockLike({ likeType: LikeType.POSITIVE });
      const updatedLike = createMockLike({ likeType: LikeType.ROMANTIC });
      mockPrisma.like.findUnique.mockResolvedValue(existingLike);
      mockPrisma.like.update.mockResolvedValue(updatedLike);

      const result = await LikesService.likeUser('user-1', 'user-2', LikeType.ROMANTIC);

      expect(mockPrisma.like.update).toHaveBeenCalledWith({
        where: { id: 'like-1' },
        data: { likeType: LikeType.ROMANTIC },
      });
      expect(result).toEqual(updatedLike);
    });

    it('should create notification for target user', async () => {
      mockPrisma.like.findUnique.mockResolvedValue(null);
      mockPrisma.like.create.mockResolvedValue(createMockLike());
      mockPrisma.notification.create.mockResolvedValue({});
      mockPrisma.like.findFirst.mockResolvedValue(null);

      await LikesService.likeUser('user-1', 'user-2', LikeType.ROMANTIC);

      expect(mockPrisma.notification.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-2',
          type: 'NEW_LIKE',
          title: 'New Romantic Interest',
          message: 'Someone showed interest in you!',
          relatedUserId: 'user-1',
        },
      });
    });

    it('should use different notification title for POSITIVE like', async () => {
      mockPrisma.like.findUnique.mockResolvedValue(null);
      mockPrisma.like.create.mockResolvedValue(createMockLike({ likeType: LikeType.POSITIVE }));
      mockPrisma.notification.create.mockResolvedValue({});
      mockPrisma.like.findFirst.mockResolvedValue(null);

      await LikesService.likeUser('user-1', 'user-2', LikeType.POSITIVE);

      expect(mockPrisma.notification.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          title: 'New Positive Feedback',
        }),
      });
    });

    it('should detect mutual like (match)', async () => {
      const newLike = createMockLike();
      const mutualLike = createMockLike({ userId: 'user-2', targetUserId: 'user-1' });

      mockPrisma.like.findUnique.mockResolvedValue(null);
      mockPrisma.like.create.mockResolvedValue(newLike);
      mockPrisma.notification.create.mockResolvedValue({});
      mockPrisma.like.findFirst.mockResolvedValue(mutualLike);

      const result = await LikesService.likeUser('user-1', 'user-2');

      expect(result.isMatch).toBe(true);
    });

    it('should use default like type ROMANTIC', async () => {
      mockPrisma.like.findUnique.mockResolvedValue(null);
      mockPrisma.like.create.mockResolvedValue(createMockLike());
      mockPrisma.notification.create.mockResolvedValue({});
      mockPrisma.like.findFirst.mockResolvedValue(null);

      await LikesService.likeUser('user-1', 'user-2');

      expect(mockPrisma.like.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          likeType: 'ROMANTIC',
        }),
      });
    });
  });

  // ==================== unlikeUser ====================
  describe('unlikeUser', () => {
    it('should delete existing like', async () => {
      const existingLike = createMockLike();
      mockPrisma.like.findUnique.mockResolvedValue(existingLike);
      mockPrisma.like.delete.mockResolvedValue(existingLike);

      const result = await LikesService.unlikeUser('user-1', 'user-2');

      expect(mockPrisma.like.delete).toHaveBeenCalledWith({
        where: { id: 'like-1' },
      });
      expect(result).toEqual({ success: true });
    });

    it('should throw error when like not found', async () => {
      mockPrisma.like.findUnique.mockResolvedValue(null);

      await expect(LikesService.unlikeUser('user-1', 'user-2')).rejects.toThrow('Like not found');
      expect(mockPrisma.like.delete).not.toHaveBeenCalled();
    });
  });

  // ==================== likeResponse ====================
  describe('likeResponse', () => {
    it('should create like for response', async () => {
      const newLike = createMockLike({ targetUserId: null, targetResponseId: 'response-1' });
      mockPrisma.like.findUnique.mockResolvedValue(null);
      mockPrisma.like.create.mockResolvedValue(newLike);
      mockPrisma.response.update.mockResolvedValue({});

      const result = await LikesService.likeResponse('user-1', 'response-1');

      expect(mockPrisma.like.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-1',
          targetResponseId: 'response-1',
          likeType: 'POSITIVE',
        },
      });
      expect(result).toEqual(newLike);
    });

    it('should return existing like without creating new one', async () => {
      const existingLike = createMockLike({ targetResponseId: 'response-1' });
      mockPrisma.like.findUnique.mockResolvedValue(existingLike);

      const result = await LikesService.likeResponse('user-1', 'response-1');

      expect(mockPrisma.like.create).not.toHaveBeenCalled();
      expect(result).toEqual(existingLike);
    });

    it('should increment like count on response', async () => {
      mockPrisma.like.findUnique.mockResolvedValue(null);
      mockPrisma.like.create.mockResolvedValue(createMockLike({ targetResponseId: 'response-1' }));
      mockPrisma.response.update.mockResolvedValue({});

      await LikesService.likeResponse('user-1', 'response-1');

      expect(mockPrisma.response.update).toHaveBeenCalledWith({
        where: { id: 'response-1' },
        data: { likeCount: { increment: 1 } },
      });
    });
  });

  // ==================== unlikeResponse ====================
  describe('unlikeResponse', () => {
    it('should delete like and decrement count', async () => {
      const existingLike = createMockLike({ targetResponseId: 'response-1' });
      mockPrisma.like.findUnique.mockResolvedValue(existingLike);
      mockPrisma.like.delete.mockResolvedValue(existingLike);
      mockPrisma.response.update.mockResolvedValue({});

      const result = await LikesService.unlikeResponse('user-1', 'response-1');

      expect(mockPrisma.like.delete).toHaveBeenCalled();
      expect(mockPrisma.response.update).toHaveBeenCalledWith({
        where: { id: 'response-1' },
        data: { likeCount: { decrement: 1 } },
      });
      expect(result).toEqual({ success: true });
    });

    it('should throw error when like not found', async () => {
      mockPrisma.like.findUnique.mockResolvedValue(null);

      await expect(LikesService.unlikeResponse('user-1', 'response-1')).rejects.toThrow('Like not found');
    });
  });

  // ==================== getReceivedLikes ====================
  describe('getReceivedLikes', () => {
    it('should return received likes with pagination', async () => {
      const mockLikes = [
        createMockLike({ id: 'like-1' }),
        createMockLike({ id: 'like-2' }),
      ];
      mockPrisma.like.findMany.mockResolvedValue(mockLikes);
      mockPrisma.like.count.mockResolvedValue(2);

      const result = await LikesService.getReceivedLikes('user-2');

      expect(result.likes).toHaveLength(2);
      expect(result.pagination.total).toBe(2);
      expect(mockPrisma.like.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { targetUserId: 'user-2' },
        })
      );
    });

    it('should filter by likeType when specified', async () => {
      mockPrisma.like.findMany.mockResolvedValue([]);
      mockPrisma.like.count.mockResolvedValue(0);

      await LikesService.getReceivedLikes('user-2', { likeType: LikeType.ROMANTIC });

      expect(mockPrisma.like.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            targetUserId: 'user-2',
            likeType: LikeType.ROMANTIC,
          },
        })
      );
    });

    it('should use custom pagination values', async () => {
      mockPrisma.like.findMany.mockResolvedValue([]);
      mockPrisma.like.count.mockResolvedValue(0);

      await LikesService.getReceivedLikes('user-2', { limit: 10, offset: 5 });

      expect(mockPrisma.like.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 10,
          skip: 5,
        })
      );
    });

    it('should calculate hasMore correctly', async () => {
      mockPrisma.like.findMany.mockResolvedValue([createMockLike()]);
      mockPrisma.like.count.mockResolvedValue(10);

      const result = await LikesService.getReceivedLikes('user-2', { limit: 5, offset: 0 });

      expect(result.pagination.hasMore).toBe(true);
    });
  });

  // ==================== getSentLikes ====================
  describe('getSentLikes', () => {
    it('should return sent likes with pagination', async () => {
      const mockLikes = [createMockLike()];
      mockPrisma.like.findMany.mockResolvedValue(mockLikes);
      mockPrisma.like.count.mockResolvedValue(1);

      const result = await LikesService.getSentLikes('user-1');

      expect(result.likes).toHaveLength(1);
      expect(mockPrisma.like.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId: 'user-1',
            targetUserId: { not: null },
          }),
        })
      );
    });

    it('should filter by likeType when specified', async () => {
      mockPrisma.like.findMany.mockResolvedValue([]);
      mockPrisma.like.count.mockResolvedValue(0);

      await LikesService.getSentLikes('user-1', { likeType: LikeType.POSITIVE });

      expect(mockPrisma.like.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            likeType: LikeType.POSITIVE,
          }),
        })
      );
    });
  });

  // ==================== hasLikedUser ====================
  describe('hasLikedUser', () => {
    it('should return true when like exists', async () => {
      mockPrisma.like.findUnique.mockResolvedValue(createMockLike());

      const result = await LikesService.hasLikedUser('user-1', 'user-2');

      expect(result).toBe(true);
    });

    it('should return false when like does not exist', async () => {
      mockPrisma.like.findUnique.mockResolvedValue(null);

      const result = await LikesService.hasLikedUser('user-1', 'user-2');

      expect(result).toBe(false);
    });
  });

  // ==================== checkMatch ====================
  describe('checkMatch', () => {
    it('should return true when both users liked each other', async () => {
      mockPrisma.like.findFirst
        .mockResolvedValueOnce(createMockLike()) // My like
        .mockResolvedValueOnce(createMockLike({ userId: 'user-2', targetUserId: 'user-1' })); // Their like

      const result = await LikesService.checkMatch('user-1', 'user-2');

      expect(result).toBe(true);
    });

    it('should return false when only one user liked', async () => {
      mockPrisma.like.findFirst
        .mockResolvedValueOnce(createMockLike())
        .mockResolvedValueOnce(null);

      const result = await LikesService.checkMatch('user-1', 'user-2');

      expect(result).toBe(false);
    });

    it('should return false when neither user liked', async () => {
      mockPrisma.like.findFirst
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);

      const result = await LikesService.checkMatch('user-1', 'user-2');

      expect(result).toBe(false);
    });
  });

  // ==================== getResponseLikes ====================
  describe('getResponseLikes', () => {
    it('should return likes on a response with pagination', async () => {
      const mockLikes = [
        createMockLike({ targetResponseId: 'response-1' }),
        createMockLike({ id: 'like-2', targetResponseId: 'response-1' }),
      ];
      mockPrisma.like.findMany.mockResolvedValue(mockLikes);
      mockPrisma.like.count.mockResolvedValue(2);

      const result = await LikesService.getResponseLikes('response-1');

      expect(result.likes).toHaveLength(2);
      expect(result.pagination.total).toBe(2);
      expect(mockPrisma.like.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { targetResponseId: 'response-1' },
        })
      );
    });

    it('should use custom pagination values', async () => {
      mockPrisma.like.findMany.mockResolvedValue([]);
      mockPrisma.like.count.mockResolvedValue(0);

      await LikesService.getResponseLikes('response-1', { limit: 25, offset: 10 });

      expect(mockPrisma.like.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 25,
          skip: 10,
        })
      );
    });
  });
});
