/**
 * Shared test helpers for Auth Service tests
 *
 * Contains mock setup used across all auth service test files.
 */

import { vi } from 'vitest';
import { prisma } from '../lib/prisma.js';
import { redis } from '../lib/redis.js';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt.util.js';

// Mock modules before importing the service
vi.mock('../lib/prisma.js', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock('../lib/redis.js', () => ({
  redis: {
    setex: vi.fn().mockResolvedValue('OK'),
    get: vi.fn().mockResolvedValue(null),
    del: vi.fn().mockResolvedValue(1),
  },
}));

vi.mock('../utils/jwt.util.js', () => ({
  generateAccessToken: vi.fn().mockReturnValue('mock-access-token'),
  generateRefreshToken: vi.fn().mockReturnValue('mock-refresh-token'),
  verifyRefreshToken: vi.fn().mockReturnValue({ userId: 'test-user-id' }),
}));

// Type the mocked prisma (avoids `as any` in test files)
export const mockPrisma = prisma as unknown as {
  user: {
    findUnique: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
  };
};

// Type the mocked redis (avoids `as any` in test files)
export const mockRedis = redis as unknown as {
  setex: ReturnType<typeof vi.fn>;
  get: ReturnType<typeof vi.fn>;
  del: ReturnType<typeof vi.fn>;
};

/**
 * Reset mock return values after clearAllMocks.
 * Call this in beforeEach after vi.clearAllMocks().
 */
export function resetAuthMocks() {
  vi.mocked(generateAccessToken).mockReturnValue('mock-access-token');
  vi.mocked(generateRefreshToken).mockReturnValue('mock-refresh-token');
  vi.mocked(verifyRefreshToken).mockReturnValue({ userId: 'test-user-id' });
}
