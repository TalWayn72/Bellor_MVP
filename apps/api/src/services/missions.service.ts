import { prisma } from '../lib/prisma.js';
import { MissionType, Prisma } from '@prisma/client';
import { cacheGet, cacheSet, cacheDel, CacheKey, CacheTTL } from '../lib/cache.js';
import { getTodaysMission, MISSION_INCLUDE } from './missions/mission-generator.js';

interface CreateMissionInput {
  title: string;
  description: string;
  missionType: MissionType;
  difficulty?: number;
  xpReward?: number;
  activeFrom?: Date;
  activeUntil?: Date;
}

interface ListMissionsParams {
  limit: number;
  offset: number;
  type?: MissionType;
  isActive?: boolean;
}

export class MissionsService {
  /**
   * Create a new mission
   */
  static async createMission(data: CreateMissionInput) {
    const mission = await prisma.mission.create({
      data: {
        title: data.title,
        description: data.description,
        missionType: data.missionType,
        difficulty: data.difficulty || 1,
        xpReward: data.xpReward || 10,
        activeFrom: data.activeFrom,
        activeUntil: data.activeUntil,
      },
      include: MISSION_INCLUDE,
    });

    return mission;
  }

  /**
   * Get mission by ID
   */
  static async getMissionById(id: string) {
    const cached = await cacheGet<Record<string, unknown>>(CacheKey.mission(id));
    if (cached) return cached;

    const mission = await prisma.mission.findUnique({
      where: { id },
      include: MISSION_INCLUDE,
    });

    if (!mission) {
      throw new Error('Mission not found');
    }

    await cacheSet(CacheKey.mission(id), mission, CacheTTL.MISSION);
    return mission;
  }

  /**
   * List missions with pagination
   */
  static async listMissions(params: ListMissionsParams) {
    const { limit, offset, type, isActive } = params;
    const where: Prisma.MissionWhereInput = {};

    if (type) where.missionType = type;

    if (isActive !== undefined) {
      const now = new Date();
      if (isActive) {
        where.OR = [
          { activeFrom: null, activeUntil: null },
          { activeFrom: { lte: now }, activeUntil: { gte: now } },
          { activeFrom: { lte: now }, activeUntil: null },
          { activeFrom: null, activeUntil: { gte: now } },
        ];
      } else {
        where.OR = [{ activeUntil: { lt: now } }];
      }
    }

    const [missions, total] = await Promise.all([
      prisma.mission.findMany({
        where, skip: offset, take: limit,
        orderBy: { createdAt: 'desc' },
        include: MISSION_INCLUDE,
      }),
      prisma.mission.count({ where }),
    ]);

    return {
      missions,
      pagination: { total, limit, offset, hasMore: offset + missions.length < total },
    };
  }

  /** Get today's active mission - delegated to mission-generator */
  static getTodaysMission = getTodaysMission;

  /**
   * Update a mission
   */
  static async updateMission(id: string, data: Partial<CreateMissionInput>) {
    const mission = await prisma.mission.update({
      where: { id },
      data: {
        title: data.title, description: data.description,
        missionType: data.missionType, difficulty: data.difficulty,
        xpReward: data.xpReward, activeFrom: data.activeFrom,
        activeUntil: data.activeUntil,
      },
      include: MISSION_INCLUDE,
    });

    await cacheDel(CacheKey.mission(id));
    await cacheDel(CacheKey.missionToday());
    return mission;
  }

  /**
   * Delete a mission
   */
  static async deleteMission(id: string) {
    await prisma.mission.delete({ where: { id } });
    await cacheDel(CacheKey.mission(id));
    await cacheDel(CacheKey.missionToday());
  }
}
