/**
 * Typed Mock Accessors
 *
 * Provides type-safe access to mocked modules without vi.mocked().
 * Import after mocks are loaded (via test/setup.ts or vi.mock).
 *
 * @example
 * import { getRedis, getPrisma } from '../test/helpers/typed-mocks';
 * const mockRedis = getRedis();
 * mockRedis.get.mockResolvedValue('value');
 */

import type { Mock } from 'vitest';
import { redis } from '../../lib/redis.js';
import { prisma } from '../../lib/prisma.js';

type MockFn = Mock;

export interface TypedRedis {
  get: MockFn;
  set: MockFn;
  setex: MockFn;
  del: MockFn;
  exists: MockFn;
  expire: MockFn;
  ttl: MockFn;
  incr: MockFn;
  decr: MockFn;
  hget: MockFn;
  hset: MockFn;
  hdel: MockFn;
  hgetall: MockFn;
  sadd: MockFn;
  srem: MockFn;
  smembers: MockFn;
  sismember: MockFn;
  zadd: MockFn;
  zrem: MockFn;
  zrange: MockFn;
  publish: MockFn;
  subscribe: MockFn;
  keys: MockFn;
  ping: MockFn;
  quit: MockFn;
  defineCommand: MockFn;
}

interface ModelMock {
  findUnique: MockFn;
  findFirst: MockFn;
  findMany: MockFn;
  create: MockFn;
  update: MockFn;
  updateMany: MockFn;
  delete: MockFn;
  deleteMany: MockFn;
  count: MockFn;
  aggregate: MockFn;
  groupBy: MockFn;
  createMany: MockFn;
  upsert: MockFn;
}

export interface TypedPrisma {
  user: ModelMock;
  chat: ModelMock;
  message: ModelMock;
  mission: ModelMock;
  response: ModelMock;
  story: ModelMock;
  like: ModelMock;
  follow: ModelMock;
  notification: ModelMock;
  achievement: ModelMock;
  userAchievement: ModelMock;
  report: ModelMock;
  subscriptionPlan: ModelMock;
  deviceToken: ModelMock;
  $transaction: MockFn;
  $connect: MockFn;
  $disconnect: MockFn;
  $queryRaw: MockFn;
}

/** Get typed Redis mock (already mocked via test/setup.ts) */
export function getRedis(): TypedRedis {
  return redis as unknown as TypedRedis;
}

/** Get typed Prisma mock (already mocked via test/setup.ts) */
export function getPrisma(): TypedPrisma {
  return prisma as unknown as TypedPrisma;
}
