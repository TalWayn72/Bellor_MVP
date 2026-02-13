/**
 * Stories Query Service
 * Feed queries: getUserStories, getFeedStories, getStoryViewers
 */

import { prisma } from '../../lib/prisma.js';
import { cacheGetOrSet, CacheKey, CacheTTL } from '../../lib/cache.js';

interface ListStoriesParams {
  userId?: string;
  limit?: number;
  offset?: number;
}

/** User select fields used across story queries */
export const STORY_USER_SELECT = {
  id: true,
  firstName: true,
  lastName: true,
  profileImages: true,
} as const;

/**
 * Get stories by user ID (active stories only)
 */
export async function getStoriesByUser(userId: string) {
  return cacheGetOrSet(CacheKey.storiesUser(userId), CacheTTL.STORIES_USER, async () => {
    const stories = await prisma.story.findMany({
      where: {
        userId,
        expiresAt: { gt: new Date() },
      },
      include: {
        user: { select: STORY_USER_SELECT },
      },
      orderBy: { createdAt: 'desc' },
    });
    return stories;
  });
}

/**
 * Get stories feed (from all users, grouped by user)
 */
export async function getStoriesFeed(currentUserId: string, params: ListStoriesParams = {}) {
  const { limit = 50, offset = 0 } = params;

  // Get all active stories
  const stories = await prisma.story.findMany({
    where: {
      expiresAt: { gt: new Date() },
      user: { isBlocked: false },
    },
    include: {
      user: { select: STORY_USER_SELECT },
    },
    orderBy: { createdAt: 'desc' },
    skip: offset,
    take: limit,
  });

  // Group stories by user
  const groupedByUser = stories.reduce((acc, story) => {
    const userId = story.userId;
    if (!acc[userId]) {
      acc[userId] = {
        user: story.user,
        stories: [],
        hasUnviewed: false,
      };
    }
    acc[userId].stories.push(story);
    return acc;
  }, {} as Record<string, { user: typeof stories[number]['user']; stories: typeof stories; hasUnviewed: boolean }>);

  // Convert to array and sort (current user's stories first, then by most recent)
  const feedArray = Object.values(groupedByUser).sort((a, b) => {
    if (a.user.id === currentUserId) return -1;
    if (b.user.id === currentUserId) return 1;
    const aLatest = Math.max(...a.stories.map((s: { createdAt: Date }) => s.createdAt.getTime()));
    const bLatest = Math.max(...b.stories.map((s: { createdAt: Date }) => s.createdAt.getTime()));
    return bLatest - aLatest;
  });

  return feedArray;
}

/**
 * Get story statistics for a user
 */
export async function getUserStoryStats(userId: string) {
  const [activeCount, totalViews] = await Promise.all([
    prisma.story.count({
      where: {
        userId,
        expiresAt: { gt: new Date() },
      },
    }),
    prisma.story.aggregate({
      where: { userId },
      _sum: { viewCount: true },
    }),
  ]);

  return {
    activeStories: activeCount,
    totalViews: totalViews._sum.viewCount || 0,
  };
}

/**
 * Check if user has any active stories
 */
export async function userHasActiveStories(userId: string): Promise<boolean> {
  const count = await prisma.story.count({
    where: {
      userId,
      expiresAt: { gt: new Date() },
    },
  });

  return count > 0;
}
