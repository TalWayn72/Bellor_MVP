/**
 * Cache Utility Tests
 * Tests for Redis-based caching helpers: get, set, del, delMany, invalidatePattern, getOrSet
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Unmock cache.js so we test the real implementation (global setup mocks it)
vi.unmock('../lib/cache.js');

vi.mock('./redis.js', () => ({
  redis: {
    get: vi.fn(),
    setex: vi.fn(),
    del: vi.fn(),
    keys: vi.fn(),
  },
}));

vi.mock('./logger.js', () => ({
  logger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

import { redis } from './redis.js';
import { logger } from './logger.js';
import {
  cacheGet,
  cacheSet,
  cacheDel,
  cacheDelMany,
  cacheInvalidatePattern,
  cacheGetOrSet,
} from './cache.js';

const mockRedis = redis as unknown as {
  get: ReturnType<typeof vi.fn>;
  setex: ReturnType<typeof vi.fn>;
  del: ReturnType<typeof vi.fn>;
  keys: ReturnType<typeof vi.fn>;
};

const mockLogger = logger as unknown as {
  debug: ReturnType<typeof vi.fn>;
};

describe('Cache Utility', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ==================== cacheGet ====================
  describe('cacheGet', () => {
    it('should return parsed data when key exists', async () => {
      const data = { id: 'user-1', name: 'Test User' };
      mockRedis.get.mockResolvedValue(JSON.stringify(data));

      const result = await cacheGet<typeof data>('cache:user:user-1');

      expect(mockRedis.get).toHaveBeenCalledWith('cache:user:user-1');
      expect(result).toEqual(data);
    });

    it('should return null when key does not exist', async () => {
      mockRedis.get.mockResolvedValue(null);

      const result = await cacheGet('cache:user:missing');

      expect(result).toBeNull();
    });

    it('should return null on redis error', async () => {
      mockRedis.get.mockRejectedValue(new Error('Redis connection lost'));

      const result = await cacheGet('cache:user:error');

      expect(result).toBeNull();
    });
  });

  // ==================== cacheSet ====================
  describe('cacheSet', () => {
    it('should call setex with JSON-serialized value and TTL', async () => {
      const data = { id: 'user-1', name: 'Test User' };
      mockRedis.setex.mockResolvedValue('OK');

      await cacheSet('cache:user:user-1', data, 600);

      expect(mockRedis.setex).toHaveBeenCalledWith(
        'cache:user:user-1',
        600,
        JSON.stringify(data),
      );
    });

    it('should swallow errors without throwing', async () => {
      mockRedis.setex.mockRejectedValue(new Error('Redis write failure'));

      await expect(cacheSet('cache:user:err', { x: 1 }, 300)).resolves.toBeUndefined();
    });
  });

  // ==================== cacheDel ====================
  describe('cacheDel', () => {
    it('should call redis.del with the key', async () => {
      mockRedis.del.mockResolvedValue(1);

      await cacheDel('cache:user:user-1');

      expect(mockRedis.del).toHaveBeenCalledWith('cache:user:user-1');
    });
  });

  // ==================== cacheDelMany ====================
  describe('cacheDelMany', () => {
    it('should call redis.del with multiple keys', async () => {
      mockRedis.del.mockResolvedValue(3);

      await cacheDelMany('key:1', 'key:2', 'key:3');

      expect(mockRedis.del).toHaveBeenCalledWith('key:1', 'key:2', 'key:3');
    });

    it('should skip redis.del when no keys are provided', async () => {
      await cacheDelMany();

      expect(mockRedis.del).not.toHaveBeenCalled();
    });
  });

  // ==================== cacheInvalidatePattern ====================
  describe('cacheInvalidatePattern', () => {
    it('should find and delete matching keys', async () => {
      const matchingKeys = ['cache:user:1', 'cache:user:2', 'cache:user:3'];
      mockRedis.keys.mockResolvedValue(matchingKeys);
      mockRedis.del.mockResolvedValue(3);

      await cacheInvalidatePattern('cache:user:*');

      expect(mockRedis.keys).toHaveBeenCalledWith('cache:user:*');
      expect(mockRedis.del).toHaveBeenCalledWith(...matchingKeys);
      expect(mockLogger.debug).toHaveBeenCalledWith(
        'CACHE',
        'Invalidated 3 keys matching cache:user:*',
      );
    });

    it('should not call del when no keys match the pattern', async () => {
      mockRedis.keys.mockResolvedValue([]);

      await cacheInvalidatePattern('cache:nonexistent:*');

      expect(mockRedis.keys).toHaveBeenCalledWith('cache:nonexistent:*');
      expect(mockRedis.del).not.toHaveBeenCalled();
    });
  });

  // ==================== cacheGetOrSet ====================
  describe('cacheGetOrSet', () => {
    it('should return cached value when it exists', async () => {
      const cachedData = { id: 'user-1', name: 'Cached User' };
      mockRedis.get.mockResolvedValue(JSON.stringify(cachedData));
      const fetcher = vi.fn();

      const result = await cacheGetOrSet('cache:user:user-1', 600, fetcher);

      expect(result).toEqual(cachedData);
      expect(fetcher).not.toHaveBeenCalled();
      expect(mockRedis.setex).not.toHaveBeenCalled();
    });

    it('should call fetcher and cache result on cache miss', async () => {
      const freshData = { id: 'user-1', name: 'Fresh User' };
      mockRedis.get.mockResolvedValue(null);
      mockRedis.setex.mockResolvedValue('OK');
      const fetcher = vi.fn().mockResolvedValue(freshData);

      const result = await cacheGetOrSet('cache:user:user-1', 600, fetcher);

      expect(result).toEqual(freshData);
      expect(fetcher).toHaveBeenCalledOnce();
      expect(mockRedis.setex).toHaveBeenCalledWith(
        'cache:user:user-1',
        600,
        JSON.stringify(freshData),
      );
    });
  });
});
