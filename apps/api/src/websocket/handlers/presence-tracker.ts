/**
 * Presence Tracker
 * Core presence tracking logic - online status, heartbeat, activity
 */

import { redis } from '../../lib/redis.js';
import { prisma } from '../../lib/prisma.js';

/** TTL for online presence keys (1 hour) */
const PRESENCE_TTL = 3600;
/** TTL for activity keys (30 seconds) */
const ACTIVITY_TTL = 30;

/**
 * Set user as online in Redis
 */
export async function setUserOnline(userId: string): Promise<void> {
  await redis.setex(`online:${userId}`, PRESENCE_TTL, new Date().toISOString());
}

/**
 * Set user as offline in Redis
 */
export async function setUserOffline(userId: string): Promise<void> {
  await redis.del(`online:${userId}`);
}

/**
 * Check online status for multiple users
 */
export async function checkUsersOnline(userIds: string[]) {
  return Promise.all(
    userIds.map(async (userId) => {
      const online = await redis.get(`online:${userId}`);
      return {
        userId,
        isOnline: !!online,
        lastSeen: online || null,
      };
    })
  );
}

/**
 * Get all online user IDs from Redis
 */
export async function getOnlineUserIds(): Promise<string[]> {
  const keys = await redis.keys('online:*');
  return keys.map((key: string) => key.replace('online:', ''));
}

/**
 * Get online user details from database
 */
export async function getOnlineUsers() {
  const userIds = await getOnlineUserIds();

  return prisma.user.findMany({
    where: {
      id: { in: userIds },
      isBlocked: true,
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      profileImages: true,
      preferredLanguage: true,
    },
  });
}

/**
 * Extend presence TTL (heartbeat)
 */
export async function extendPresenceTTL(userId: string): Promise<void> {
  await redis.expire(`online:${userId}`, PRESENCE_TTL);
  await redis.expire(`socket:${userId}`, PRESENCE_TTL);
}

/**
 * Store user activity in Redis
 */
export async function storeUserActivity(
  userId: string,
  activity: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  await redis.setex(
    `activity:${userId}`,
    ACTIVITY_TTL,
    JSON.stringify({
      activity,
      metadata,
      timestamp: new Date().toISOString(),
    })
  );
}
