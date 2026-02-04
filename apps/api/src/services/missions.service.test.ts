import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MissionsService } from './missions.service.js';
import { prisma } from '../lib/prisma.js';

// Mock Prisma
vi.mock('../lib/prisma', () => ({
  prisma: {
    mission: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

describe('MissionsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createMission', () => {
    it('should create a mission with required fields', async () => {
      const mockMission = {
        id: 'mission-1',
        title: 'Test Mission',
        description: 'Test Description',
        missionType: 'DAILY',
        difficulty: 1,
        xpReward: 10,
        activeFrom: null,
        activeUntil: null,
        createdAt: new Date(),
        _count: { responses: 0 },
      };

      vi.mocked(prisma.mission.create).mockResolvedValue(mockMission as any);

      const result = await MissionsService.createMission({
        title: 'Test Mission',
        description: 'Test Description',
        missionType: 'DAILY',
      });

      expect(prisma.mission.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          title: 'Test Mission',
          description: 'Test Description',
          missionType: 'DAILY',
        }),
        include: {
          _count: { select: { responses: true } },
        },
      });

      expect(result.id).toBe('mission-1');
      expect(result.title).toBe('Test Mission');
    });
  });

  describe('getMissionById', () => {
    it('should return a mission when found', async () => {
      const mockMission = {
        id: 'mission-1',
        title: 'Test Mission',
        _count: { responses: 5 },
      };

      vi.mocked(prisma.mission.findUnique).mockResolvedValue(mockMission as any);

      const result = await MissionsService.getMissionById('mission-1');

      expect(prisma.mission.findUnique).toHaveBeenCalledWith({
        where: { id: 'mission-1' },
        include: {
          _count: { select: { responses: true } },
        },
      });

      expect(result.id).toBe('mission-1');
    });

    it('should throw error when mission not found', async () => {
      vi.mocked(prisma.mission.findUnique).mockResolvedValue(null);

      await expect(MissionsService.getMissionById('non-existent')).rejects.toThrow('Mission not found');
    });
  });

  describe('listMissions', () => {
    it('should return paginated missions', async () => {
      const mockMissions = [
        { id: 'mission-1', title: 'Mission 1' },
        { id: 'mission-2', title: 'Mission 2' },
      ];

      vi.mocked(prisma.mission.findMany).mockResolvedValue(mockMissions as any);
      vi.mocked(prisma.mission.count).mockResolvedValue(10);

      const result = await MissionsService.listMissions({
        limit: 20,
        offset: 0,
      });

      expect(result.missions).toHaveLength(2);
      expect(result.pagination.total).toBe(10);
      expect(result.pagination.hasMore).toBe(true);
    });

    it('should filter by mission type', async () => {
      vi.mocked(prisma.mission.findMany).mockResolvedValue([]);
      vi.mocked(prisma.mission.count).mockResolvedValue(0);

      await MissionsService.listMissions({
        limit: 20,
        offset: 0,
        type: 'DAILY',
      });

      expect(prisma.mission.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { missionType: 'DAILY' },
        })
      );
    });
  });

  describe('deleteMission', () => {
    it('should delete a mission', async () => {
      vi.mocked(prisma.mission.delete).mockResolvedValue({} as any);

      await MissionsService.deleteMission('mission-1');

      expect(prisma.mission.delete).toHaveBeenCalledWith({
        where: { id: 'mission-1' },
      });
    });
  });
});
