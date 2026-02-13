/**
 * Feedback Service Unit Tests
 *
 * Tests for CRUD operations on user feedback submissions:
 * createFeedback and listFeedback.
 */

import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from 'vitest';

// Mock prisma before importing the service
vi.mock('../lib/prisma.js', () => ({
  prisma: {
    feedback: {
      create: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
    },
  },
}));

import { FeedbackService } from './feedback.service.js';
import { prisma } from '../lib/prisma.js';

// ---------------------------------------------------------------------------
// createFeedback
// ---------------------------------------------------------------------------
describe('[P2][profile] FeedbackService - createFeedback', () => {
  beforeEach(() => { vi.clearAllMocks(); });
  afterEach(() => { vi.restoreAllMocks(); });

  const baseInput = {
    userId: 'user-123',
    type: 'BUG',
    title: 'App crashes on login',
    description: 'When I click login the app freezes.',
  };

  it('should create feedback and return it with user info', async () => {
    const mockResult = {
      id: 'fb-1',
      ...baseInput,
      rating: null,
      createdAt: new Date(),
      user: { id: 'user-123', firstName: 'John', lastName: 'Doe', nickname: 'johnd' },
    };

    (prisma.feedback.create as Mock).mockResolvedValue(mockResult as never);

    const result = await FeedbackService.createFeedback(baseInput);

    expect(result).toEqual(mockResult);
    expect(prisma.feedback.create).toHaveBeenCalledWith({
      data: {
        userId: baseInput.userId,
        type: baseInput.type,
        title: baseInput.title,
        description: baseInput.description,
        rating: undefined,
      },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, nickname: true } },
      },
    });
  });

  it('should pass rating when provided', async () => {
    const inputWithRating = { ...baseInput, rating: 4 };
    const mockResult = {
      id: 'fb-2',
      ...inputWithRating,
      createdAt: new Date(),
      user: { id: 'user-123', firstName: 'John', lastName: 'Doe', nickname: 'johnd' },
    };

    (prisma.feedback.create as Mock).mockResolvedValue(mockResult as never);

    const result = await FeedbackService.createFeedback(inputWithRating);

    expect(result.rating).toBe(4);
    expect(prisma.feedback.create).toHaveBeenCalledWith({
      data: {
        userId: inputWithRating.userId,
        type: inputWithRating.type,
        title: inputWithRating.title,
        description: inputWithRating.description,
        rating: 4,
      },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, nickname: true } },
      },
    });
  });

  it('should propagate Prisma errors', async () => {
    (prisma.feedback.create as Mock).mockRejectedValue(
      new Error('Unique constraint failed on the fields: (`title`)')
    );

    await expect(FeedbackService.createFeedback(baseInput)).rejects.toThrow(
      'Unique constraint failed'
    );
  });

  it('should handle different feedback types', async () => {
    const featureInput = { ...baseInput, type: 'FEATURE_REQUEST', title: 'Add dark mode' };
    (prisma.feedback.create as Mock).mockResolvedValue({ id: 'fb-3', ...featureInput } as never);

    await FeedbackService.createFeedback(featureInput);

    expect(prisma.feedback.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ type: 'FEATURE_REQUEST' }),
      })
    );
  });
});

// ---------------------------------------------------------------------------
// listFeedback
// ---------------------------------------------------------------------------
describe('[P2][profile] FeedbackService - listFeedback', () => {
  beforeEach(() => { vi.clearAllMocks(); });
  afterEach(() => { vi.restoreAllMocks(); });

  it('should list feedbacks with default pagination', async () => {
    const mockFeedbacks = [
      {
        id: 'fb-1', type: 'BUG', title: 'Bug 1', description: 'Desc',
        user: { id: 'u1', firstName: 'A', lastName: 'B', nickname: 'ab' },
      },
    ];

    (prisma.feedback.findMany as Mock).mockResolvedValue(mockFeedbacks as never);
    (prisma.feedback.count as Mock).mockResolvedValue(1);

    const result = await FeedbackService.listFeedback({});

    expect(result.feedbacks).toEqual(mockFeedbacks);
    expect(result.pagination).toEqual({
      total: 1,
      limit: 20,
      offset: 0,
      hasMore: false,
    });
  });

  it('should apply status filter when provided', async () => {
    (prisma.feedback.findMany as Mock).mockResolvedValue([]);
    (prisma.feedback.count as Mock).mockResolvedValue(0);

    await FeedbackService.listFeedback({ status: 'OPEN' });

    expect(prisma.feedback.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { status: 'OPEN' },
      })
    );
    expect(prisma.feedback.count).toHaveBeenCalledWith({
      where: { status: 'OPEN' },
    });
  });

  it('should use custom limit and offset', async () => {
    (prisma.feedback.findMany as Mock).mockResolvedValue([]);
    (prisma.feedback.count as Mock).mockResolvedValue(0);

    await FeedbackService.listFeedback({ limit: 5, offset: 10 });

    expect(prisma.feedback.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 10,
        take: 5,
      })
    );
  });

  it('should compute hasMore correctly when more items exist', async () => {
    const mockFeedbacks = Array.from({ length: 5 }, (_, i) => ({
      id: `fb-${i}`, type: 'BUG', title: `Bug ${i}`, description: 'Desc',
      user: { id: `u${i}`, firstName: 'A', lastName: 'B', nickname: 'ab' },
    }));

    (prisma.feedback.findMany as Mock).mockResolvedValue(mockFeedbacks as never);
    (prisma.feedback.count as Mock).mockResolvedValue(15);

    const result = await FeedbackService.listFeedback({ limit: 5, offset: 0 });

    // offset(0) + feedbacks.length(5) = 5 < total(15) => hasMore = true
    expect(result.pagination.hasMore).toBe(true);
  });

  it('should set hasMore to false when on last page', async () => {
    const mockFeedbacks = Array.from({ length: 3 }, (_, i) => ({
      id: `fb-${i}`, type: 'BUG', title: `Bug ${i}`, description: 'Desc',
      user: { id: `u${i}`, firstName: 'A', lastName: 'B', nickname: 'ab' },
    }));

    (prisma.feedback.findMany as Mock).mockResolvedValue(mockFeedbacks as never);
    (prisma.feedback.count as Mock).mockResolvedValue(8);

    const result = await FeedbackService.listFeedback({ limit: 5, offset: 5 });

    // offset(5) + feedbacks.length(3) = 8 = total(8) => hasMore = false
    expect(result.pagination.hasMore).toBe(false);
  });

  it('should order by createdAt descending', async () => {
    (prisma.feedback.findMany as Mock).mockResolvedValue([]);
    (prisma.feedback.count as Mock).mockResolvedValue(0);

    await FeedbackService.listFeedback({});

    expect(prisma.feedback.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: { createdAt: 'desc' },
      })
    );
  });

  it('should include user select fields in results', async () => {
    (prisma.feedback.findMany as Mock).mockResolvedValue([]);
    (prisma.feedback.count as Mock).mockResolvedValue(0);

    await FeedbackService.listFeedback({});

    expect(prisma.feedback.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        include: {
          user: { select: { id: true, firstName: true, lastName: true, nickname: true } },
        },
      })
    );
  });

  it('should not filter by status when status is not provided', async () => {
    (prisma.feedback.findMany as Mock).mockResolvedValue([]);
    (prisma.feedback.count as Mock).mockResolvedValue(0);

    await FeedbackService.listFeedback({});

    expect(prisma.feedback.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {},
      })
    );
  });

  it('should return empty feedbacks and correct pagination for no data', async () => {
    (prisma.feedback.findMany as Mock).mockResolvedValue([]);
    (prisma.feedback.count as Mock).mockResolvedValue(0);

    const result = await FeedbackService.listFeedback({});

    expect(result.feedbacks).toEqual([]);
    expect(result.pagination).toEqual({
      total: 0,
      limit: 20,
      offset: 0,
      hasMore: false,
    });
  });

  it('should propagate database errors from findMany', async () => {
    (prisma.feedback.findMany as Mock).mockRejectedValue(new Error('Connection timeout'));
    (prisma.feedback.count as Mock).mockResolvedValue(0);

    await expect(FeedbackService.listFeedback({})).rejects.toThrow('Connection timeout');
  });
});
