import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
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

describe('[P1][content] ResponsesService', () => {
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

      (prisma.response.create as Mock).mockResolvedValue(mockResponse as never);
      (prisma.user.update as Mock).mockResolvedValue({} as never);

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

      (prisma.response.create as Mock).mockResolvedValue(mockResponse as never);
      (prisma.user.update as Mock).mockResolvedValue({} as never);

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

      (prisma.response.findUnique as Mock).mockResolvedValue(mockResponse as never);

      const result = await ResponsesService.getResponseById('response-1');

      expect(result.id).toBe('response-1');
    });

    it('should throw error when response not found', async () => {
      (prisma.response.findUnique as Mock).mockResolvedValue(null);

      await expect(ResponsesService.getResponseById('non-existent')).rejects.toThrow('Response not found');
    });
  });

  describe('listResponses', () => {
    it('should return paginated responses', async () => {
      const mockResponses = [
        { id: 'response-1', content: 'Response 1' },
        { id: 'response-2', content: 'Response 2' },
      ];

      (prisma.response.findMany as Mock).mockResolvedValue(mockResponses as never);
      (prisma.response.count as Mock).mockResolvedValue(50);

      const result = await ResponsesService.listResponses({
        limit: 20,
        offset: 0,
      });

      expect(result.responses).toHaveLength(2);
      expect(result.pagination.total).toBe(50);
      expect(result.pagination.hasMore).toBe(true);
    });

    it('should filter by missionId', async () => {
      (prisma.response.findMany as Mock).mockResolvedValue([]);
      (prisma.response.count as Mock).mockResolvedValue(0);

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
      (prisma.response.findMany as Mock).mockResolvedValue([]);
      (prisma.response.count as Mock).mockResolvedValue(0);

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
      (prisma.response.update as Mock).mockResolvedValue({ viewCount: 11 } as never);

      await ResponsesService.incrementViewCount('response-1');

      expect(prisma.response.update).toHaveBeenCalledWith({
        where: { id: 'response-1' },
        data: { viewCount: { increment: 1 } },
      });
    });
  });

  describe('incrementLikeCount', () => {
    it('should increment like count', async () => {
      (prisma.response.update as Mock).mockResolvedValue({ likeCount: 6 } as never);

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

      (prisma.response.findUnique as Mock).mockResolvedValue(mockResponse as never);
      (prisma.response.delete as Mock).mockResolvedValue({} as never);
      (prisma.user.update as Mock).mockResolvedValue({} as never);

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

      (prisma.response.findUnique as Mock).mockResolvedValue(mockResponse as never);

      await expect(ResponsesService.deleteResponse('response-1', 'user-2')).rejects.toThrow('Unauthorized');
    });

    it('should throw error when response not found', async () => {
      (prisma.response.findUnique as Mock).mockResolvedValue(null);

      await expect(ResponsesService.deleteResponse('non-existent', 'user-1')).rejects.toThrow('Response not found');
    });
  });
});
