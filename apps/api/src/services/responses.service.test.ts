import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ResponsesService } from './responses.service.js';
import { prisma } from '../lib/prisma.js';

// Mock Prisma
vi.mock('../lib/prisma', () => {
  const mockPrisma = {
    response: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    user: {
      update: vi.fn(),
    },
    $transaction: vi.fn(),
  };
  mockPrisma.$transaction.mockImplementation(async (fnOrArray: unknown) => {
    if (typeof fnOrArray === 'function') return (fnOrArray as (p: typeof mockPrisma) => unknown)(mockPrisma);
    return Promise.all(fnOrArray as Promise<unknown>[]);
  });
  return { prisma: mockPrisma };
});

describe('ResponsesService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createResponse', () => {
    it('should create a response and update user stats', async () => {
      const mockResponse = {
        id: 'response-1',
        userId: 'user-1',
        missionId: 'mission-1',
        responseType: 'TEXT',
        content: 'My response',
        isPublic: true,
        createdAt: new Date(),
        user: { id: 'user-1', firstName: 'John', lastName: 'Doe', profileImages: [] },
        mission: { id: 'mission-1', title: 'Test Mission', missionType: 'DAILY' },
      };

      vi.mocked(prisma.response.create).mockResolvedValue(mockResponse as any);
      vi.mocked(prisma.user.update).mockResolvedValue({} as any);

      const result = await ResponsesService.createResponse({
        userId: 'user-1',
        missionId: 'mission-1',
        responseType: 'TEXT',
        content: 'My response',
      });

      expect(prisma.response.create).toHaveBeenCalled();
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: {
          responseCount: { increment: 1 },
          missionCompletedCount: { increment: 1 },
        },
      });

      expect(result.id).toBe('response-1');
    });

    it('should not increment missionCompletedCount when no missionId', async () => {
      const mockResponse = {
        id: 'response-1',
        userId: 'user-1',
        missionId: null,
        responseType: 'DRAWING',
        content: 'http://example.com/drawing.png',
        isPublic: true,
      };

      vi.mocked(prisma.response.create).mockResolvedValue(mockResponse as any);
      vi.mocked(prisma.user.update).mockResolvedValue({} as any);

      await ResponsesService.createResponse({
        userId: 'user-1',
        responseType: 'DRAWING',
        content: 'http://example.com/drawing.png',
      });

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: {
          responseCount: { increment: 1 },
          missionCompletedCount: undefined,
        },
      });
    });
  });

  describe('getResponseById', () => {
    it('should return a response when found', async () => {
      const mockResponse = {
        id: 'response-1',
        content: 'Test content',
        user: { id: 'user-1' },
      };

      vi.mocked(prisma.response.findUnique).mockResolvedValue(mockResponse as any);

      const result = await ResponsesService.getResponseById('response-1');

      expect(result.id).toBe('response-1');
    });

    it('should throw error when response not found', async () => {
      vi.mocked(prisma.response.findUnique).mockResolvedValue(null);

      await expect(ResponsesService.getResponseById('non-existent')).rejects.toThrow('Response not found');
    });
  });

  describe('listResponses', () => {
    it('should return paginated responses', async () => {
      const mockResponses = [
        { id: 'response-1', content: 'Response 1' },
        { id: 'response-2', content: 'Response 2' },
      ];

      vi.mocked(prisma.response.findMany).mockResolvedValue(mockResponses as any);
      vi.mocked(prisma.response.count).mockResolvedValue(50);

      const result = await ResponsesService.listResponses({
        limit: 20,
        offset: 0,
      });

      expect(result.responses).toHaveLength(2);
      expect(result.pagination.total).toBe(50);
      expect(result.pagination.hasMore).toBe(true);
    });

    it('should filter by missionId', async () => {
      vi.mocked(prisma.response.findMany).mockResolvedValue([]);
      vi.mocked(prisma.response.count).mockResolvedValue(0);

      await ResponsesService.listResponses({
        limit: 20,
        offset: 0,
        missionId: 'mission-1',
      });

      expect(prisma.response.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { missionId: 'mission-1' },
        })
      );
    });

    it('should filter by public responses only', async () => {
      vi.mocked(prisma.response.findMany).mockResolvedValue([]);
      vi.mocked(prisma.response.count).mockResolvedValue(0);

      await ResponsesService.listResponses({
        limit: 20,
        offset: 0,
        isPublic: true,
      });

      expect(prisma.response.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { isPublic: true },
        })
      );
    });
  });

  describe('incrementViewCount', () => {
    it('should increment view count', async () => {
      vi.mocked(prisma.response.update).mockResolvedValue({ viewCount: 11 } as any);

      await ResponsesService.incrementViewCount('response-1');

      expect(prisma.response.update).toHaveBeenCalledWith({
        where: { id: 'response-1' },
        data: { viewCount: { increment: 1 } },
      });
    });
  });

  describe('incrementLikeCount', () => {
    it('should increment like count', async () => {
      vi.mocked(prisma.response.update).mockResolvedValue({ likeCount: 6 } as any);

      await ResponsesService.incrementLikeCount('response-1');

      expect(prisma.response.update).toHaveBeenCalledWith({
        where: { id: 'response-1' },
        data: { likeCount: { increment: 1 } },
      });
    });
  });

  describe('deleteResponse', () => {
    it('should delete response when user is owner', async () => {
      const mockResponse = {
        id: 'response-1',
        userId: 'user-1',
      };

      vi.mocked(prisma.response.findUnique).mockResolvedValue(mockResponse as any);
      vi.mocked(prisma.response.delete).mockResolvedValue({} as any);
      vi.mocked(prisma.user.update).mockResolvedValue({} as any);

      await ResponsesService.deleteResponse('response-1', 'user-1');

      expect(prisma.response.delete).toHaveBeenCalledWith({
        where: { id: 'response-1' },
      });
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { responseCount: { decrement: 1 } },
      });
    });

    it('should throw error when user is not owner', async () => {
      const mockResponse = {
        id: 'response-1',
        userId: 'user-1',
      };

      vi.mocked(prisma.response.findUnique).mockResolvedValue(mockResponse as any);

      await expect(ResponsesService.deleteResponse('response-1', 'user-2')).rejects.toThrow('Unauthorized');
    });

    it('should throw error when response not found', async () => {
      vi.mocked(prisma.response.findUnique).mockResolvedValue(null);

      await expect(ResponsesService.deleteResponse('non-existent', 'user-1')).rejects.toThrow('Response not found');
    });
  });
});
