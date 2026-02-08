/**
 * Follow Queries
 * Shared query helpers and lookup operations for follows
 */

import { prisma } from '../../lib/prisma.js';

export interface ListFollowsParams {
  limit?: number;
  offset?: number;
}

/**
 * Get user's followers with pagination
 */
export async function getFollowers(userId: string, params: ListFollowsParams = {}) {
  const { limit = 50, offset = 0 } = params;

  const [follows, total] = await Promise.all([
    prisma.follow.findMany({
      where: { followingId: userId },
      skip: offset,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.follow.count({ where: { followingId: userId } }),
  ]);

  return {
    followers: follows.map(f => f.followerId),
    pagination: {
      total,
      limit,
      offset,
      hasMore: offset + follows.length < total,
    },
  };
}

/**
 * Get users that user is following with pagination
 */
export async function getFollowing(userId: string, params: ListFollowsParams = {}) {
  const { limit = 50, offset = 0 } = params;

  const [follows, total] = await Promise.all([
    prisma.follow.findMany({
      where: { followerId: userId },
      skip: offset,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.follow.count({ where: { followerId: userId } }),
  ]);

  return {
    following: follows.map(f => f.followingId),
    pagination: {
      total,
      limit,
      offset,
      hasMore: offset + follows.length < total,
    },
  };
}

/**
 * Check if user is following another user
 */
export async function isFollowing(followerId: string, followingId: string): Promise<boolean> {
  const follow = await prisma.follow.findUnique({
    where: {
      followerId_followingId: {
        followerId,
        followingId,
      },
    },
  });
  return !!follow;
}

/**
 * Get follow stats for user
 */
export async function getFollowStats(userId: string) {
  const [followersCount, followingCount] = await Promise.all([
    prisma.follow.count({ where: { followingId: userId } }),
    prisma.follow.count({ where: { followerId: userId } }),
  ]);

  return {
    followersCount,
    followingCount,
  };
}

/**
 * Check mutual follow
 */
export async function areMutualFollowers(userId1: string, userId2: string): Promise<boolean> {
  const [follow1, follow2] = await Promise.all([
    prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: userId1,
          followingId: userId2,
        },
      },
    }),
    prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: userId2,
          followingId: userId1,
        },
      },
    }),
  ]);

  return !!follow1 && !!follow2;
}
