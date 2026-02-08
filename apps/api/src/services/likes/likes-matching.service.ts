/**
 * Likes Matching Service
 * Match detection, mutual likes, response likes
 */

import { prisma } from '../../lib/prisma.js';
import { Prisma, LikeType } from '@prisma/client';

interface ListLikesParams {
  limit?: number;
  offset?: number;
  likeType?: LikeType;
}

/**
 * Like a response
 */
export async function likeResponse(userId: string, responseId: string) {
  const existing = await prisma.like.findUnique({
    where: {
      userId_targetResponseId: { userId, targetResponseId: responseId },
    },
  });

  if (existing) {
    return existing;
  }

  const [like] = await prisma.$transaction([
    prisma.like.create({
      data: { userId, targetResponseId: responseId, likeType: 'POSITIVE' },
    }),
    prisma.response.update({
      where: { id: responseId },
      data: { likeCount: { increment: 1 } },
    }),
  ]);

  return like;
}

/**
 * Unlike a response
 */
export async function unlikeResponse(userId: string, responseId: string) {
  const like = await prisma.like.findUnique({
    where: {
      userId_targetResponseId: { userId, targetResponseId: responseId },
    },
  });

  if (!like) {
    throw new Error('Like not found');
  }

  await prisma.$transaction([
    prisma.like.delete({ where: { id: like.id } }),
    prisma.response.update({
      where: { id: responseId },
      data: { likeCount: { decrement: 1 } },
    }),
  ]);

  return { success: true };
}

/**
 * Check if user has liked another user
 */
export async function hasLikedUser(userId: string, targetUserId: string): Promise<boolean> {
  const like = await prisma.like.findUnique({
    where: {
      userId_targetUserId: { userId, targetUserId },
    },
  });
  return !!like;
}

/**
 * Check for mutual like (match)
 */
export async function checkMatch(userId: string, targetUserId: string): Promise<boolean> {
  const [myLike, theirLike] = await Promise.all([
    prisma.like.findFirst({ where: { userId, targetUserId } }),
    prisma.like.findFirst({ where: { userId: targetUserId, targetUserId: userId } }),
  ]);

  return !!myLike && !!theirLike;
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
