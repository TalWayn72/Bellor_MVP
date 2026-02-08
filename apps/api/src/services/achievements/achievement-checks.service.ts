/**
 * Achievement Checks Service
 * Progress checking and unlocking logic
 */

import { prisma } from '../../lib/prisma.js';
import { cacheDel, CacheKey } from '../../lib/cache.js';

/**
 * Check if user has unlocked an achievement
 */
export async function hasUnlocked(userId: string, achievementId: string): Promise<boolean> {
  const userAchievement = await prisma.userAchievement.findUnique({
    where: {
      userId_achievementId: { userId, achievementId },
    },
  });
  return !!userAchievement;
}

/**
 * Unlock achievement for user
 */
export async function unlockAchievement(userId: string, achievementId: string) {
  const existing = await prisma.userAchievement.findUnique({
    where: {
      userId_achievementId: { userId, achievementId },
    },
  });

  if (existing) {
    throw new Error('Achievement already unlocked');
  }

  const achievement = await prisma.achievement.findUnique({
    where: { id: achievementId },
  });

  if (!achievement) {
    throw new Error('Achievement not found');
  }

  const userAchievement = await prisma.userAchievement.create({
    data: { userId, achievementId },
    include: { achievement: true },
  });

  await prisma.notification.create({
    data: {
      userId,
      type: 'ACHIEVEMENT_UNLOCKED',
      title: 'Achievement Unlocked!',
      message: `You earned the "${achievement.name}" achievement!`,
      relatedContentId: achievementId,
    },
  });

  await cacheDel(CacheKey.achievementsList());
  await cacheDel(CacheKey.achievement(achievementId));

  return userAchievement;
}

/**
 * Check and unlock achievements based on user stats
 */
export async function checkAndUnlockAchievements(userId: string) {
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
      const hasIt = await hasUnlocked(userId, achievement.id);
      if (!hasIt) {
        try {
          const unlocked = await unlockAchievement(userId, achievement.id);
          unlockedAchievements.push(unlocked);
        } catch {
          // Already unlocked or error
        }
      }
    }
  }

  return unlockedAchievements;
}

/**
 * Get achievement stats
 */
export async function getAchievementStats(achievementId: string) {
  const [achievement, unlockedCount, recentUnlocks] = await Promise.all([
    prisma.achievement.findUnique({ where: { id: achievementId } }),
    prisma.userAchievement.count({ where: { achievementId } }),
    prisma.userAchievement.findMany({
      where: { achievementId },
      orderBy: { unlockedAt: 'desc' },
      take: 10,
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, profileImages: true },
        },
      },
    }),
  ]);

  return { achievement, unlockedCount, recentUnlocks };
}
