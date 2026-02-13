import { vi } from 'vitest';
import type { Mock } from 'vitest';

const crudMock = () => ({
  findUnique: vi.fn(), findMany: vi.fn(), create: vi.fn(),
  update: vi.fn(), delete: vi.fn(), count: vi.fn(),
});

export function createPrismaMock() {
  return {
    user: crudMock(),
    chat: { ...crudMock(), findFirst: vi.fn() },
    message: crudMock(),
    response: { findUnique: vi.fn(), findMany: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() },
    story: { findUnique: vi.fn(), findMany: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() },
    $transaction: vi.fn((callback) => callback({ user: {}, chat: {} })),
  };
}

export function createRedisMock() {
  return {
    get: vi.fn(), set: vi.fn(), setex: vi.fn(), del: vi.fn(),
    incr: vi.fn(), expire: vi.fn(), keys: vi.fn(), ttl: vi.fn(),
    exists: vi.fn(), hget: vi.fn(), hset: vi.fn(), hdel: vi.fn(), hgetall: vi.fn(),
  };
}

export function createJwtMock() {
  return {
    generateAccessToken: vi.fn(), generateRefreshToken: vi.fn(),
    verifyAccessToken: vi.fn(), verifyRefreshToken: vi.fn(),
  };
}

export function createBcryptMock() {
  return { hash: vi.fn(), compare: vi.fn() };
}

export function setupModuleSpy(
  module: Record<string, unknown>, propertyName: string, mockImplementation: unknown
): Mock {
  return vi.spyOn(module as any, propertyName, 'get').mockReturnValue(mockImplementation) as unknown as Mock;
}

export function createMockRequest(overrides: Record<string, unknown> = {}) {
  return { body: {}, params: {}, query: {}, headers: {}, ip: '127.0.0.1', user: undefined, ...overrides };
}

export function createMockReply() {
  const reply: Record<string, Mock> = {
    code: vi.fn().mockReturnThis(), send: vi.fn().mockReturnThis(),
    status: vi.fn().mockReturnThis(), header: vi.fn().mockReturnThis(), headers: vi.fn().mockReturnThis(),
  };
  return reply;
}

export function resetAllMocks(...mocks: unknown[]) {
  mocks.forEach(mock => {
    if (mock && typeof mock === 'object') {
      Object.values(mock).forEach(value => {
        if (typeof value === 'function' && 'mockReset' in value) {
          (value as Mock).mockReset();
        } else if (value && typeof value === 'object') {
          Object.values(value).forEach(nv => {
            if (typeof nv === 'function' && 'mockReset' in nv) (nv as Mock).mockReset();
          });
        }
      });
    }
  });
}
