/**
 * Prisma ORM Mock
 * Provides mock implementations for all Prisma model operations
 */
import { vi } from 'vitest';

/** Creates a standard set of mock methods for a Prisma model */
const createModelMock = () => ({
  findUnique: vi.fn(),
  findFirst: vi.fn(),
  findMany: vi.fn().mockResolvedValue([]),
  create: vi.fn(),
  update: vi.fn(),
  updateMany: vi.fn().mockResolvedValue({ count: 0 }),
  delete: vi.fn(),
  deleteMany: vi.fn(),
  count: vi.fn(),
  aggregate: vi.fn(),
  groupBy: vi.fn(),
  createMany: vi.fn(),
  upsert: vi.fn(),
});

vi.mock('../../lib/prisma.js', () => {
  const mockPrismaObj = {
    user: createModelMock(),
    chat: createModelMock(),
    message: createModelMock(),
    mission: createModelMock(),
    response: createModelMock(),
    story: createModelMock(),
    like: createModelMock(),
    follow: createModelMock(),
    notification: createModelMock(),
    achievement: createModelMock(),
    userAchievement: createModelMock(),
    report: createModelMock(),
    subscriptionPlan: createModelMock(),
    subscription: createModelMock(),
    payment: createModelMock(),
    feedback: createModelMock(),
    referral: createModelMock(),
    deviceToken: createModelMock(),
    $transaction: vi.fn(),
    $connect: vi.fn(),
    $disconnect: vi.fn(),
    $queryRaw: vi.fn().mockResolvedValue([{ result: 1 }]),
  };

  // $transaction supports both array and callback styles
  mockPrismaObj.$transaction.mockImplementation(async (fn: unknown) => {
    if (typeof fn === 'function') return (fn as (p: typeof mockPrismaObj) => unknown)(mockPrismaObj);
    return Promise.all(fn as Promise<unknown>[]);
  });

  return { prisma: mockPrismaObj };
});
