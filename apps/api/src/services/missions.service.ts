import { prisma } from '../lib/prisma.js';
import { MissionType, Prisma } from '@prisma/client';

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
      include: {
        _count: {
          select: { responses: true },
        },
      },
    });

    return mission;
  }

  /**
   * Get mission by ID
   */
  static async getMissionById(id: string) {
    const mission = await prisma.mission.findUnique({
      where: { id },
      include: {
        _count: {
          select: { responses: true },
        },
      },
    });

    if (!mission) {
      throw new Error('Mission not found');
    }

    return mission;
  }

  /**
   * List missions with pagination
   */
  static async listMissions(params: ListMissionsParams) {
    const { limit, offset, type, isActive } = params;

    const where: Prisma.MissionWhereInput = {};

    if (type) {
      where.missionType = type;
    }

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
        where.OR = [
          { activeUntil: { lt: now } },
        ];
      }
    }

    const [missions, total] = await Promise.all([
      prisma.mission.findMany({
        where,
        skip: offset,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: { responses: true },
          },
        },
      }),
      prisma.mission.count({ where }),
    ]);

    return {
      missions,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + missions.length < total,
      },
    };
  }

  /**
   * Get today's active mission (or create a daily one)
   */
  static async getTodaysMission() {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

    // Find today's daily mission
    let mission = await prisma.mission.findFirst({
      where: {
        missionType: 'DAILY',
        activeFrom: { gte: startOfDay },
        activeUntil: { lte: endOfDay },
      },
      include: {
        _count: {
          select: { responses: true },
        },
      },
    });

    // If no daily mission exists, find any active mission
    if (!mission) {
      mission = await prisma.mission.findFirst({
        where: {
          OR: [
            { activeFrom: null, activeUntil: null },
            { activeFrom: { lte: now }, activeUntil: { gte: now } },
          ],
        },
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: { responses: true },
          },
        },
      });
    }

    return mission;
  }

  /**
   * Update a mission
   */
  static async updateMission(id: string, data: Partial<CreateMissionInput>) {
    const mission = await prisma.mission.update({
      where: { id },
      data: {
        title: data.title,
        description: data.description,
        missionType: data.missionType,
        difficulty: data.difficulty,
        xpReward: data.xpReward,
        activeFrom: data.activeFrom,
        activeUntil: data.activeUntil,
      },
      include: {
        _count: {
          select: { responses: true },
        },
      },
    });

    return mission;
  }

  /**
   * Delete a mission
   */
  static async deleteMission(id: string) {
    await prisma.mission.delete({
      where: { id },
    });
  }
}
