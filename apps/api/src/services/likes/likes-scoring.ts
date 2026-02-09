/**
 * Likes Scoring Types & Query Helpers
 * Type definitions and pagination query functions for the likes system
 */

import { prisma } from '../../lib/prisma.js';
import { Prisma, LikeType } from '@prisma/client';

export interface ListLikesParams {
  limit?: number;
  offset?: number;
  likeType?: LikeType;
}

/**
 * Get likes on a response
 */
export async function getResponseLikes(responseId: string, params: ListLikesParams = {}) {
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
}

/**
 * Get likes I received (from other users)
 */
export async function getReceivedLikes(userId: string, params: ListLikesParams = {}) {
  const { limit = 50, offset = 0, likeType } = params;

  const where: Prisma.LikeWhereInput = { targetUserId: userId };
  if (likeType) {
    where.likeType = likeType;
  }

  const [likes, total] = await Promise.all([
    prisma.like.findMany({
      where, skip: offset, take: limit, orderBy: { createdAt: 'desc' },
    }),
    prisma.like.count({ where }),
  ]);

  return {
    likes,
    pagination: { total, limit, offset, hasMore: offset + likes.length < total },
  };
}

/**
 * Get likes I sent
 */
export async function getSentLikes(userId: string, params: ListLikesParams = {}) {
  const { limit = 50, offset = 0, likeType } = params;

  const where: Prisma.LikeWhereInput = { userId, targetUserId: { not: null } };
  if (likeType) {
    where.likeType = likeType;
  }

  const [likes, total] = await Promise.all([
    prisma.like.findMany({
      where, skip: offset, take: limit, orderBy: { createdAt: 'desc' },
    }),
    prisma.like.count({ where }),
  ]);

  return {
    likes,
    pagination: { total, limit, offset, hasMore: offset + likes.length < total },
  };
}
