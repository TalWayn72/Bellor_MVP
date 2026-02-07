/**
 * Likes Service
 * Handles user likes (romantic interest, positive feedback)
 */

import { prisma } from '../lib/prisma.js';
import { LikeType } from '@prisma/client';

interface ListLikesParams {
  limit?: number;
  offset?: number;
  likeType?: LikeType;
}

export const LikesService = {
  /**
   * Like a user
   */
  async likeUser(userId: string, targetUserId: string, likeType: LikeType = 'ROMANTIC') {
    // Verify target user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true },
    });

    if (!targetUser) {
      throw new Error('Target user not found');
    }

    // Check if like already exists
    const existing = await prisma.like.findUnique({
      where: {
        userId_targetUserId: {
          userId,
          targetUserId,
        },
      },
    });

    if (existing) {
      // Update like type if different
      if (existing.likeType !== likeType) {
        return prisma.like.update({
          where: { id: existing.id },
          data: { likeType },
        });
      }
      return existing;
    }

    const like = await prisma.like.create({
      data: {
        userId,
        targetUserId,
        likeType,
      },
    });

    // Create notification for target user
    await prisma.notification.create({
      data: {
        userId: targetUserId,
        type: 'NEW_LIKE',
        title: likeType === 'ROMANTIC' ? 'New Romantic Interest' : 'New Positive Feedback',
        message: 'Someone showed interest in you!',
        relatedUserId: userId,
      },
    });

    // Check for mutual like (match)
    const mutualLike = await prisma.like.findFirst({
      where: {
        userId: targetUserId,
        targetUserId: userId,
      },
    });

    return {
      like,
      isMatch: !!mutualLike,
    };
  },

  /**
   * Unlike a user
   */
  async unlikeUser(userId: string, targetUserId: string) {
    const like = await prisma.like.findUnique({
      where: {
        userId_targetUserId: {
          userId,
          targetUserId,
        },
      },
    });

    if (!like) {
      throw new Error('Like not found');
    }

    await prisma.like.delete({
      where: { id: like.id },
    });

    return { success: true };
  },

  /**
   * Like a response
   */
  async likeResponse(userId: string, responseId: string) {
    // Check if already liked
    const existing = await prisma.like.findUnique({
      where: {
        userId_targetResponseId: {
          userId,
          targetResponseId: responseId,
        },
      },
    });

    if (existing) {
      return existing;
    }

    const like = await prisma.like.create({
      data: {
        userId,
        targetResponseId: responseId,
        likeType: 'POSITIVE',
      },
    });

    // Increment like count on response
    await prisma.response.update({
      where: { id: responseId },
      data: {
        likeCount: { increment: 1 },
      },
    });

    return like;
  },

  /**
   * Unlike a response
   */
  async unlikeResponse(userId: string, responseId: string) {
    const like = await prisma.like.findUnique({
      where: {
        userId_targetResponseId: {
          userId,
          targetResponseId: responseId,
        },
      },
    });

    if (!like) {
      throw new Error('Like not found');
    }

    await prisma.like.delete({
      where: { id: like.id },
    });

    // Decrement like count on response
    await prisma.response.update({
      where: { id: responseId },
      data: {
        likeCount: { decrement: 1 },
      },
    });

    return { success: true };
  },

  /**
   * Get likes I received (from other users)
   */
  async getReceivedLikes(userId: string, params: ListLikesParams = {}) {
    const { limit = 50, offset = 0, likeType } = params;

    const where: any = { targetUserId: userId };
    if (likeType) {
      where.likeType = likeType;
    }

    const [likes, total] = await Promise.all([
      prisma.like.findMany({
        where,
        skip: offset,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.like.count({ where }),
    ]);

    return {
      likes,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + likes.length < total,
      },
    };
  },

  /**
   * Get likes I sent
   */
  async getSentLikes(userId: string, params: ListLikesParams = {}) {
    const { limit = 50, offset = 0, likeType } = params;

    const where: any = {
      userId,
      targetUserId: { not: null },
    };
    if (likeType) {
      where.likeType = likeType;
    }

    const [likes, total] = await Promise.all([
      prisma.like.findMany({
        where,
        skip: offset,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.like.count({ where }),
    ]);

    return {
      likes,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + likes.length < total,
      },
    };
  },

  /**
   * Check if user has liked another user
   */
  async hasLikedUser(userId: string, targetUserId: string): Promise<boolean> {
    const like = await prisma.like.findUnique({
      where: {
        userId_targetUserId: {
          userId,
          targetUserId,
        },
      },
    });
    return !!like;
  },

  /**
   * Check for mutual like (match)
   */
  async checkMatch(userId: string, targetUserId: string): Promise<boolean> {
    const [myLike, theirLike] = await Promise.all([
      prisma.like.findFirst({
        where: { userId, targetUserId },
      }),
      prisma.like.findFirst({
        where: { userId: targetUserId, targetUserId: userId },
      }),
    ]);

    return !!myLike && !!theirLike;
  },

  /**
   * Get likes on a response
   */
  async getResponseLikes(responseId: string, params: ListLikesParams = {}) {
    const { limit = 50, offset = 0 } = params;

    const [likes, total] = await Promise.all([
      prisma.like.findMany({
        where: { targetResponseId: responseId },
        skip: offset,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.like.count({ where: { targetResponseId: responseId } }),
    ]);

    return {
      likes,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + likes.length < total,
      },
    };
  },
};
