/**
 * Shared test helpers for Auth Service tests
 *
 * Contains mock setup used across all auth service test files.
 * Uses factory functions with vi.fn() to create proper mocks.
 */

import { vi } from 'vitest';
import type { Mock } from 'vitest';

// Create mock functions first - these are used in factory functions below
const mockFindUnique = vi.fn();
const mockCreate = vi.fn();
const mockUpdate = vi.fn();
const mockSetex = vi.fn().mockResolvedValue('OK');
const mockRedisGet = vi.fn().mockResolvedValue(null);
const mockRedisDel = vi.fn().mockResolvedValue(1);
const mockGenerateAccessToken = vi.fn().mockReturnValue('mock-access-token');
const mockGenerateRefreshToken = vi.fn().mockReturnValue('mock-refresh-token');
const mockVerifyRefreshToken = vi.fn().mockReturnValue({ userId: 'test-user-id' });

// Mock modules with factory functions
vi.mock('../lib/prisma.js', () => ({
  prisma: {
    user: {
      findUnique: mockFindUnique,
      create: mockCreate,
      update: mockUpdate,
    },
  },
}));

vi.mock('../lib/redis.js', () => ({
  redis: {
    setex: mockSetex,
    get: mockRedisGet,
    del: mockRedisDel,
  },
}));

vi.mock('../utils/jwt.util.js', () => ({
  generateAccessToken: mockGenerateAccessToken,
  generateRefreshToken: mockGenerateRefreshToken,
  verifyRefreshToken: mockVerifyRefreshToken,
}));

// Export typed mocks for direct use in tests
export const prismaMock = {
  user: {
    findUnique: mockFindUnique as Mock,
    create: mockCreate as Mock,
    update: mockUpdate as Mock,
  },
};

export const redisMock = {
  setex: mockSetex as Mock,
  get: mockRedisGet as Mock,
  del: mockRedisDel as Mock,
};

export const jwtMock = {
  generateAccessToken: mockGenerateAccessToken as Mock,
  generateRefreshToken: mockGenerateRefreshToken as Mock,
  verifyRefreshToken: mockVerifyRefreshToken as Mock,
};

// Backwards-compatible aliases (used by auth-login.service.test.ts)
export const mockPrisma = prismaMock;
export const mockRedis = redisMock;

/**
 * Setup default mock return values.
 * Call in beforeEach after vi.clearAllMocks().
 */
export function setupAuthMocks() {
  jwtMock.generateAccessToken.mockReturnValue('mock-access-token');
  jwtMock.generateRefreshToken.mockReturnValue('mock-refresh-token');
  jwtMock.verifyRefreshToken.mockReturnValue({ userId: 'test-user-id' });
  redisMock.setex.mockResolvedValue('OK');
  redisMock.get.mockResolvedValue(null);
  redisMock.del.mockResolvedValue(1);
}
