/**
 * Stories Service
 * Handles 24-hour ephemeral content (Stories)
 */

import { prisma } from '../lib/prisma.js';
import { MediaType } from '@prisma/client';

interface CreateStoryInput {
  userId: string;
  mediaType: MediaType;
  mediaUrl: string;
  thumbnailUrl?: string;
  caption?: string;
}

interface ListStoriesParams {
  userId?: string;
  limit?: number;
  offset?: number;
}

// Story duration in hours
const STORY_DURATION_HOURS = 24;

export const StoriesService = {
  /**
   * Create a new story
   */
  async createStory(input: CreateStoryInput) {
    const { userId, mediaType, mediaUrl, thumbnailUrl, caption } = input;

    // Set expiration to 24 hours from now
    const expiresAt = new Date(Date.now() + STORY_DURATION_HOURS * 60 * 60 * 1000);

    const story = await prisma.story.create({
      data: {
        userId,
        mediaType,
        mediaUrl,
        thumbnailUrl,
        caption,
        expiresAt,
      },
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
    });

    return story;
  },

  /**
   * Get story by ID
   */
  async getStoryById(storyId: string) {
    const story = await prisma.story.findUnique({
      where: { id: storyId },
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
    });

    if (!story) {
      throw new Error('Story not found');
    }

    // Check if story has expired
    if (story.expiresAt < new Date()) {
      throw new Error('Story has expired');
    }

    return story;
  },

  /**
   * Get stories by user ID (active stories only)
   */
  async getStoriesByUser(userId: string) {
    const stories = await prisma.story.findMany({
      where: {
        userId,
        expiresAt: { gt: new Date() },
      },
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
      orderBy: { createdAt: 'desc' },
    });

    return stories;
  },

  /**
   * Get stories feed (from all users, grouped by user)
   */
  async getStoriesFeed(currentUserId: string, params: ListStoriesParams = {}) {
    const { limit = 50, offset = 0 } = params;

    // Get all active stories
    const stories = await prisma.story.findMany({
      where: {
        expiresAt: { gt: new Date() },
        user: {
          isBlocked: false,
        },
      },
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

    // Don't count self-views
    if (story.userId === viewerId) {
      return story;
    }

    // Increment view count
    const updatedStory = await prisma.story.update({
      where: { id: storyId },
      data: {
        viewCount: { increment: 1 },
      },
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

    return { success: true };
  },

  /**
   * Clean up expired stories (to be called by cron job)
   */
  async cleanupExpiredStories() {
    const result = await prisma.story.deleteMany({
      where: {
        expiresAt: { lt: new Date() },
      },
    });

    return { deletedCount: result.count };
  },

  /**
   * Get story statistics for a user
   */
  async getUserStoryStats(userId: string) {
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
  },

  /**
   * Check if user has any active stories
   */
  async userHasActiveStories(userId: string): Promise<boolean> {
    const count = await prisma.story.count({
      where: {
        userId,
        expiresAt: { gt: new Date() },
      },
    });

    return count > 0;
  },
};
