/**
 * Cache utility for Redis-based data caching
 * Provides get/set/invalidate/getOrSet helpers with JSON serialization
 */

import { redis } from './redis.js';
import { logger } from './logger.js';

/** Default TTL values in seconds */
export const CacheTTL = {
  USER: 600,            // 10 minutes
  MISSION: 1800,        // 30 minutes
  MISSION_TODAY: 3600,  // 1 hour (refreshed daily)
  ACHIEVEMENT: 3600,    // 1 hour
  SHORT: 300,           // 5 minutes
  STORIES_FEED: 120,    // 2 minutes
  STORIES_USER: 120,    // 2 minutes
} as const;

/** Cache key prefixes */
export const CacheKey = {
  user: (id: string) => `cache:user:${id}`,
  mission: (id: string) => `cache:mission:${id}`,
  missionToday: () => `cache:mission:today`,
  achievement: (id: string) => `cache:achievement:${id}`,
  achievementsList: () => `cache:achievements:list`,
  storiesFeed: (userId: string) => `cache:stories:feed:${userId}`,
  storiesUser: (userId: string) => `cache:stories:user:${userId}`,
} as const;

/**
 * Get a cached value, deserializing from JSON
 */
export async function cacheGet<T>(key: string): Promise<T | null> {
  try {
    const data = await redis.get(key);
    if (!data) return null;
    return JSON.parse(data) as T;
  } catch {
    return null;
  }
}

/**
 * Set a cached value with TTL, serializing to JSON
 */
export async function cacheSet(key: string, value: unknown, ttlSeconds: number): Promise<void> {
  try {
    await redis.setex(key, ttlSeconds, JSON.stringify(value));
  } catch {
    // Cache write failures are non-critical
  }
}

/**
 * Delete a cached value
 */
export async function cacheDel(key: string): Promise<void> {
  try {
    await redis.del(key);
  } catch {
    // Cache delete failures are non-critical
  }
}

/**
 * Delete multiple cached values by keys
 */
export async function cacheDelMany(...keys: string[]): Promise<void> {
  try {
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  } catch {
    // Cache delete failures are non-critical
  }
}

/**
 * Invalidate cache entries matching a glob pattern.
 * Use sparingly - KEYS command is O(N).
 */
export async function cacheInvalidatePattern(pattern: string): Promise<void> {
  try {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
      logger.debug('CACHE', `Invalidated ${keys.length} keys matching ${pattern}`);
    }
  } catch {
    // Cache invalidation failures are non-critical
  }
}

/**
 * Get a cached value or fetch and cache it.
 * Avoids cache stampede by fetching only once.
 */
export async function cacheGetOrSet<T>(
  key: string,
  ttlSeconds: number,
  fetcher: () => Promise<T>,
): Promise<T> {
  const cached = await cacheGet<T>(key);
  if (cached !== null) return cached;

  const fresh = await fetcher();
  await cacheSet(key, fresh, ttlSeconds);
  return fresh;
}
