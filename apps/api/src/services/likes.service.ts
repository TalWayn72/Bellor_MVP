/**
 * Likes Service
 * Core: like, unlike user
 * Response likes and matching delegated to likes/likes-matching.service.ts
 */

import { prisma } from '../lib/prisma.js';
import { LikeType } from '@prisma/client';
import {
  likeResponse,
  unlikeResponse,
  hasLikedUser,
  checkMatch,
  getResponseLikes,
  getReceivedLikes,
  getSentLikes,
} from './likes/likes-matching.service.js';

export const LikesService = {
  /**
   * Like a user
   */
  async likeUser(userId: string, targetUserId: string, likeType: LikeType = 'ROMANTIC') {
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true },
    });

    if (!targetUser) {
      throw new Error('Target user not found');
    }

    const existing = await prisma.like.findUnique({
      where: { userId_targetUserId: { userId, targetUserId } },
    });

    if (existing) {
      if (existing.likeType !== likeType) {
        return prisma.like.update({
          where: { id: existing.id },
          data: { likeType },
        });
      }
      return existing;
    }

    const like = await prisma.like.create({
      data: { userId, targetUserId, likeType },
    });

    await prisma.notification.create({
      data: {
        userId: targetUserId,
        type: 'NEW_LIKE',
        title: likeType === 'ROMANTIC' ? 'New Romantic Interest' : 'New Positive Feedback',
        message: 'Someone showed interest in you!',
        relatedUserId: userId,
      },
    });

    const mutualLike = await prisma.like.findFirst({
      where: { userId: targetUserId, targetUserId: userId },
    });

    return { like, isMatch: !!mutualLike };
  },

  /**
   * Unlike a user
   */
  async unlikeUser(userId: string, targetUserId: string) {
    const like = await prisma.like.findUnique({
      where: { userId_targetUserId: { userId, targetUserId } },
    });

    if (!like) {
      throw new Error('Like not found');
    }

    await prisma.like.delete({ where: { id: like.id } });
    return { success: true };
  },

  // Delegated methods
  likeResponse,
  unlikeResponse,
  hasLikedUser,
  checkMatch,
  getResponseLikes,
  getReceivedLikes,
  getSentLikes,
};
