/**
 * Stories Service
 * Handles 24-hour ephemeral content (Stories) - CRUD operations
 */

import { prisma } from '../lib/prisma.js';
import { cacheDel, cacheInvalidatePattern, CacheKey } from '../lib/cache.js';
import { CreateStoryInput, STORY_DURATION_HOURS } from './stories.types.js';
import {
  getStoriesByUser,
  getStoriesFeed,
  getUserStoryStats,
  userHasActiveStories,
  STORY_USER_SELECT,
} from './stories/stories-queries.service.js';

export type { CreateStoryInput } from './stories.types.js';

export const StoriesService = {
  /**
   * Create a new story
   */
  async createStory(input: CreateStoryInput) {
    const { userId, mediaType, mediaUrl, thumbnailUrl, caption } = input;

    const expiresAt = new Date(Date.now() + STORY_DURATION_HOURS * 60 * 60 * 1000);

    const story = await prisma.story.create({
      data: {
        userId, mediaType, mediaUrl, thumbnailUrl, caption, expiresAt,
      },
      include: {
        user: { select: STORY_USER_SELECT },
      },
    });

    await cacheDel(CacheKey.storiesUser(userId));
    await cacheInvalidatePattern('cache:stories:feed:*');

    return story;
  },

  /**
   * Get story by ID
   */
  async getStoryById(storyId: string) {
    const story = await prisma.story.findUnique({
      where: { id: storyId },
      include: {
        user: { select: STORY_USER_SELECT },
      },
    });

    if (!story) {
      throw new Error('Story not found');
    }

    if (story.expiresAt < new Date()) {
      throw new Error('Story has expired');
    }

    return story;
  },

  /**
   * Mark story as viewed
   */
  async viewStory(storyId: string, viewerId: string) {
    const story = await prisma.story.findUnique({
      where: { id: storyId },
    });

    if (!story) {
      throw new Error('Story not found');
    }

    if (story.userId === viewerId) {
      return story;
    }

    const updatedStory = await prisma.story.update({
      where: { id: storyId },
      data: { viewCount: { increment: 1 } },
    });

    return updatedStory;
  },

  /**
   * Delete a story
   */
  async deleteStory(storyId: string, userId: string) {
    const story = await prisma.story.findUnique({
      where: { id: storyId },
    });

    if (!story) {
      throw new Error('Story not found');
    }

    if (story.userId !== userId) {
      throw new Error('Unauthorized: You can only delete your own stories');
    }

    await prisma.story.delete({
      where: { id: storyId },
    });

    await cacheDel(CacheKey.storiesUser(userId));
    await cacheInvalidatePattern('cache:stories:feed:*');

    return { success: true };
  },

  /**
   * Clean up expired stories (to be called by cron job)
   */
  async cleanupExpiredStories() {
    const result = await prisma.story.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });

    return { deletedCount: result.count };
  },

  // Re-export query functions
  getStoriesByUser,
  getStoriesFeed,
  getUserStoryStats,
  userHasActiveStories,
};
