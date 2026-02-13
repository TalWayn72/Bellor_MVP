import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
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

describe('[P1][content] MissionsService', () => {
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

      (prisma.mission.create as Mock).mockResolvedValue(mockMission as never);

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

      (prisma.mission.findUnique as Mock).mockResolvedValue(mockMission as never);

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
      (prisma.mission.findUnique as Mock).mockResolvedValue(null);

      await expect(MissionsService.getMissionById('non-existent')).rejects.toThrow('Mission not found');
    });
  });

  describe('listMissions', () => {
    it('should return paginated missions', async () => {
      const mockMissions = [
        { id: 'mission-1', title: 'Mission 1' },
        { id: 'mission-2', title: 'Mission 2' },
      ];

      (prisma.mission.findMany as Mock).mockResolvedValue(mockMissions as never);
      (prisma.mission.count as Mock).mockResolvedValue(10);

      const result = await MissionsService.listMissions({
        limit: 20,
        offset: 0,
      });

      expect(result.missions).toHaveLength(2);
      expect(result.pagination.total).toBe(10);
      expect(result.pagination.hasMore).toBe(true);
    });

    it('should filter by mission type', async () => {
      (prisma.mission.findMany as Mock).mockResolvedValue([]);
      (prisma.mission.count as Mock).mockResolvedValue(0);

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
      (prisma.mission.delete as Mock).mockResolvedValue({} as never);

      await MissionsService.deleteMission('mission-1');

      expect(prisma.mission.delete).toHaveBeenCalledWith({
        where: { id: 'mission-1' },
      });
    });
  });
});
