/**
 * Follows Service
 * Handles user follow/unfollow functionality
 */

import { prisma } from '../lib/prisma.js';
import {
  ListFollowsParams,
  getFollowers,
  getFollowing,
  isFollowing,
  getFollowStats,
  areMutualFollowers,
} from './follows/follow-queries.js';

export type { ListFollowsParams };

export const FollowsService = {
  getFollowers,
  getFollowing,
  isFollowing,
  getFollowStats,
  areMutualFollowers,

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
};
