/**
 * Stories Service
 * Handles 24-hour ephemeral content (Stories) - CRUD operations
 */

import { prisma } from '../lib/prisma.js';
import { MediaType } from '@prisma/client';
import {
  getStoriesByUser,
  getStoriesFeed,
  getUserStoryStats,
  userHasActiveStories,
  STORY_USER_SELECT,
} from './stories/stories-queries.service.js';

interface CreateStoryInput {
  userId: string;
  mediaType: MediaType;
  mediaUrl: string;
  thumbnailUrl?: string;
  caption?: string;
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
        user: { select: STORY_USER_SELECT },
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
        user: { select: STORY_USER_SELECT },
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
