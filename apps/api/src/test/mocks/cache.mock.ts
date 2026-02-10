/**
 * Cache Utility Mock
 * All cache operations are no-ops in tests
 */
import { vi } from 'vitest';

vi.mock('../../lib/cache.js', () => ({
  CacheTTL: {
    USER: 600,
    MISSION: 1800,
    MISSION_TODAY: 3600,
    ACHIEVEMENT: 3600,
    SHORT: 300,
    STORIES_FEED: 120,
    STORIES_USER: 120,
  },
  CacheKey: {
    user: (id: string) => `cache:user:${id}`,
    mission: (id: string) => `cache:mission:${id}`,
    missionToday: () => `cache:mission:today`,
    achievement: (id: string) => `cache:achievement:${id}`,
    achievementsList: () => `cache:achievements:list`,
    storiesFeed: (userId: string) => `cache:stories:feed:${userId}`,
    storiesUser: (userId: string) => `cache:stories:user:${userId}`,
  },
  cacheGet: vi.fn().mockResolvedValue(null),
  cacheSet: vi.fn().mockResolvedValue(undefined),
  cacheDel: vi.fn().mockResolvedValue(undefined),
  cacheDelMany: vi.fn().mockResolvedValue(undefined),
  cacheInvalidatePattern: vi.fn().mockResolvedValue(undefined),
  cacheGetOrSet: vi.fn(async (_key: string, _ttl: number, fetcher: () => Promise<unknown>) => fetcher()),
}));
