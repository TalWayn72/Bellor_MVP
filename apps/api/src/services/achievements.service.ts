/**
 * Achievements Service
 * Handles user achievements and badges
 */

import { prisma } from '../lib/prisma.js';
import { cacheGet, cacheSet, cacheDel, CacheKey, CacheTTL } from '../lib/cache.js';

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

    // Cache only first page (default params)
    const cacheKey = offset === 0 && limit === 100 ? CacheKey.achievementsList() : null;
    if (cacheKey) {
      const cached = await cacheGet<any>(cacheKey);
      if (cached) return cached;
    }

    const [achievements, total] = await Promise.all([
      prisma.achievement.findMany({
        skip: offset,
        take: limit,
        include: {
          _count: {
            select: { users: true },
          },
        },
      }),
      prisma.achievement.count(),
    ]);

    const result = {
      achievements: achievements.map(a => ({
        ...a,
        unlockedCount: a._count.users,
      })),
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + achievements.length < total,
      },
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
    const cached = await cacheGet<any>(CacheKey.achievement(id));
    if (cached) return cached;

    const achievement = await prisma.achievement.findUnique({
      where: { id },
      include: {
        _count: {
          select: { users: true },
        },
      },
    });

    if (!achievement) {
      throw new Error('Achievement not found');
    }

    const result = {
      ...achievement,
      unlockedCount: achievement._count.users,
    };

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
        include: {
          achievement: true,
        },
      }),
      prisma.userAchievement.count({ where: { userId } }),
    ]);

    return {
      achievements: userAchievements.map(ua => ({
        ...ua.achievement,
        unlockedAt: ua.unlockedAt,
      })),
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + userAchievements.length < total,
      },
    };
  },

  /**
   * Check if user has unlocked an achievement
   */
  async hasUnlocked(userId: string, achievementId: string): Promise<boolean> {
    const userAchievement = await prisma.userAchievement.findUnique({
      where: {
        userId_achievementId: {
          userId,
          achievementId,
        },
      },
    });
    return !!userAchievement;
  },

  /**
   * Unlock achievement for user
   */
  async unlockAchievement(userId: string, achievementId: string) {
    // Check if already unlocked
    const existing = await prisma.userAchievement.findUnique({
      where: {
        userId_achievementId: {
          userId,
          achievementId,
        },
      },
    });

    if (existing) {
      throw new Error('Achievement already unlocked');
    }

    // Get achievement for XP reward
    const achievement = await prisma.achievement.findUnique({
      where: { id: achievementId },
    });

    if (!achievement) {
      throw new Error('Achievement not found');
    }

    // Unlock achievement
    const userAchievement = await prisma.userAchievement.create({
      data: {
        userId,
        achievementId,
      },
      include: {
        achievement: true,
      },
    });

    // Create notification
    await prisma.notification.create({
      data: {
        userId,
        type: 'ACHIEVEMENT_UNLOCKED',
        title: 'Achievement Unlocked!',
        message: `You earned the "${achievement.name}" achievement!`,
        relatedContentId: achievementId,
      },
    });

    // Invalidate caches
    await cacheDel(CacheKey.achievementsList());
    await cacheDel(CacheKey.achievement(achievementId));

    return userAchievement;
  },

  /**
   * Check and unlock achievements based on user stats
   */
  async checkAndUnlockAchievements(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        responseCount: true,
        chatCount: true,
        missionCompletedCount: true,
        isPremium: true,
      },
    });

    if (!user) return [];

    const achievements = await prisma.achievement.findMany();
    const unlockedAchievements: any[] = [];

    for (const achievement of achievements) {
      const requirement = achievement.requirement as { type: string; value: number };
      let shouldUnlock = false;

      switch (requirement.type) {
        case 'response_count':
          shouldUnlock = user.responseCount >= requirement.value;
          break;
        case 'chat_count':
          shouldUnlock = user.chatCount >= requirement.value;
          break;
        case 'mission_count':
          shouldUnlock = user.missionCompletedCount >= requirement.value;
          break;
        case 'premium':
          shouldUnlock = user.isPremium;
          break;
      }

      if (shouldUnlock) {
        const hasIt = await this.hasUnlocked(userId, achievement.id);
        if (!hasIt) {
          try {
            const unlocked = await this.unlockAchievement(userId, achievement.id);
            unlockedAchievements.push(unlocked);
          } catch {
            // Already unlocked or error
          }
        }
      }
    }

    return unlockedAchievements;
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

  /**
   * Get achievement stats
   */
  async getAchievementStats(achievementId: string) {
    const [achievement, unlockedCount, recentUnlocks] = await Promise.all([
      prisma.achievement.findUnique({ where: { id: achievementId } }),
      prisma.userAchievement.count({ where: { achievementId } }),
      prisma.userAchievement.findMany({
        where: { achievementId },
        orderBy: { unlockedAt: 'desc' },
        take: 10,
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
      }),
    ]);

    return {
      achievement,
      unlockedCount,
      recentUnlocks,
    };
  },
};
