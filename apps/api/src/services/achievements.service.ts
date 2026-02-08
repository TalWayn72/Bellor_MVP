/**
 * Achievements Service
 * CRUD: list, get, definitions, create
 * Progress checking delegated to achievements/achievement-checks.service.ts
 */

import { prisma } from '../lib/prisma.js';
import { cacheGet, cacheSet, CacheKey, CacheTTL } from '../lib/cache.js';
import {
  hasUnlocked,
  unlockAchievement,
  checkAndUnlockAchievements,
  getAchievementStats,
} from './achievements/achievement-checks.service.js';

interface ListAchievementsParams {
  limit?: number;
  offset?: number;
}

interface CreateAchievementInput {
  name: string;
  description: string;
  iconUrl?: string;
  requirement: {
    type: string;
    value: number;
  };
  xpReward?: number;
}

export const AchievementsService = {
  /**
   * List all achievements
   */
  async listAchievements(params: ListAchievementsParams = {}) {
    const { limit = 100, offset = 0 } = params;

    const cacheKey = offset === 0 && limit === 100 ? CacheKey.achievementsList() : null;
    if (cacheKey) {
      const cached = await cacheGet<Record<string, unknown>>(cacheKey);
      if (cached) return cached;
    }

    const [achievements, total] = await Promise.all([
      prisma.achievement.findMany({
        skip: offset,
        take: limit,
        include: { _count: { select: { users: true } } },
      }),
      prisma.achievement.count(),
    ]);

    const result = {
      achievements: achievements.map(a => ({
        ...a,
        unlockedCount: a._count.users,
      })),
      pagination: { total, limit, offset, hasMore: offset + achievements.length < total },
    };

    if (cacheKey) {
      await cacheSet(cacheKey, result, CacheTTL.ACHIEVEMENT);
    }

    return result;
  },

  /**
   * Get achievement by ID
   */
  async getAchievementById(id: string) {
    const cached = await cacheGet<Record<string, unknown>>(CacheKey.achievement(id));
    if (cached) return cached;

    const achievement = await prisma.achievement.findUnique({
      where: { id },
      include: { _count: { select: { users: true } } },
    });

    if (!achievement) {
      throw new Error('Achievement not found');
    }

    const result = { ...achievement, unlockedCount: achievement._count.users };
    await cacheSet(CacheKey.achievement(id), result, CacheTTL.ACHIEVEMENT);
    return result;
  },

  /**
   * Get user's unlocked achievements
   */
  async getUserAchievements(userId: string, params: ListAchievementsParams = {}) {
    const { limit = 100, offset = 0 } = params;

    const [userAchievements, total] = await Promise.all([
      prisma.userAchievement.findMany({
        where: { userId },
        skip: offset,
        take: limit,
        orderBy: { unlockedAt: 'desc' },
        include: { achievement: true },
      }),
      prisma.userAchievement.count({ where: { userId } }),
    ]);

    return {
      achievements: userAchievements.map(ua => ({
        ...ua.achievement,
        unlockedAt: ua.unlockedAt,
      })),
      pagination: { total, limit, offset, hasMore: offset + userAchievements.length < total },
    };
  },

  /**
   * Create a new achievement (admin)
   */
  async createAchievement(data: CreateAchievementInput) {
    return prisma.achievement.create({
      data: {
        name: data.name,
        description: data.description,
        iconUrl: data.iconUrl,
        requirement: data.requirement,
        xpReward: data.xpReward ?? 50,
      },
    });
  },

  // Delegated methods
  hasUnlocked,
  unlockAchievement,
  checkAndUnlockAchievements,
  getAchievementStats,
};
