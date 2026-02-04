/**
 * Follows Service
 * Handles user follow/unfollow functionality
 */

import { prisma } from '../lib/prisma.js';

interface ListFollowsParams {
  limit?: number;
  offset?: number;
}

export const FollowsService = {
  /**
   * Follow a user
   */
  async followUser(followerId: string, followingId: string) {
    if (followerId === followingId) {
      throw new Error('Cannot follow yourself');
    }

    // Check if already following
    const existing = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId,
          followingId,
        },
      },
    });

    if (existing) {
      return existing;
    }

    const follow = await prisma.follow.create({
      data: {
        followerId,
        followingId,
      },
    });

    // Create notification for followed user
    await prisma.notification.create({
      data: {
        userId: followingId,
        type: 'NEW_FOLLOW',
        title: 'New Follower',
        message: 'Someone started following you!',
        relatedUserId: followerId,
      },
    });

    return follow;
  },

  /**
   * Unfollow a user
   */
  async unfollowUser(followerId: string, followingId: string) {
    const follow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId,
          followingId,
        },
      },
    });

    if (!follow) {
      throw new Error('Follow not found');
    }

    await prisma.follow.delete({
      where: { id: follow.id },
    });

    return { success: true };
  },

  /**
   * Get user's followers
   */
  async getFollowers(userId: string, params: ListFollowsParams = {}) {
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
  },

  /**
   * Get users that user is following
   */
  async getFollowing(userId: string, params: ListFollowsParams = {}) {
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
  },

  /**
   * Check if user is following another user
   */
  async isFollowing(followerId: string, followingId: string): Promise<boolean> {
    const follow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId,
          followingId,
        },
      },
    });
    return !!follow;
  },

  /**
   * Get follow stats for user
   */
  async getFollowStats(userId: string) {
    const [followersCount, followingCount] = await Promise.all([
      prisma.follow.count({ where: { followingId: userId } }),
      prisma.follow.count({ where: { followerId: userId } }),
    ]);

    return {
      followersCount,
      followingCount,
    };
  },

  /**
   * Check mutual follow
   */
  async areMutualFollowers(userId1: string, userId2: string): Promise<boolean> {
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
  },
};
