/**
 * Likes Matching Service
 * Match detection, mutual likes, response likes
 */

import { prisma } from '../../lib/prisma.js';
export type { ListLikesParams } from './likes-scoring.js';
export { getResponseLikes, getReceivedLikes, getSentLikes } from './likes-scoring.js';

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
