/**
 * Shared test helpers for Auth Service tests
 *
 * Contains mock setup used across all auth service test files.
 */

import { vi } from 'vitest';

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

/**
 * Reset mock return values after clearAllMocks.
 * Call this in beforeEach after vi.clearAllMocks().
 */
export function resetAuthMocks() {
  const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../utils/jwt.util.js');
  vi.mocked(generateAccessToken).mockReturnValue('mock-access-token');
  vi.mocked(generateRefreshToken).mockReturnValue('mock-refresh-token');
  vi.mocked(verifyRefreshToken).mockReturnValue({ userId: 'test-user-id' });
}
