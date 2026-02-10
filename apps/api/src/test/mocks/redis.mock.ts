/**
 * Redis Mock
 * Provides mock implementations for all Redis operations
 */
import { vi } from 'vitest';

vi.mock('../../lib/redis.js', () => ({
  redis: {
    get: vi.fn(),
    set: vi.fn(),
    setex: vi.fn(),
    del: vi.fn(),
    exists: vi.fn(),
    expire: vi.fn(),
    ttl: vi.fn(),
    incr: vi.fn(),
    decr: vi.fn(),
    hget: vi.fn(),
    hset: vi.fn(),
    hdel: vi.fn(),
    hgetall: vi.fn(),
    sadd: vi.fn(),
    srem: vi.fn(),
    smembers: vi.fn(),
    sismember: vi.fn(),
    zadd: vi.fn(),
    zrem: vi.fn(),
    zrange: vi.fn(),
    publish: vi.fn(),
    subscribe: vi.fn(),
    keys: vi.fn().mockResolvedValue([]),
    ping: vi.fn().mockResolvedValue('PONG'),
    quit: vi.fn().mockResolvedValue('OK'),
    defineCommand: vi.fn(),
  },
}));
