/**
 * Shared test helpers for Users Service tests
 *
 * Contains mock setup and factory functions used across
 * all users service test files.
 */

import { vi } from 'vitest';

// Mock modules before importing the service
vi.mock('../lib/prisma.js', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    message: {
      deleteMany: vi.fn(),
    },
    response: {
      deleteMany: vi.fn(),
    },
    story: {
      deleteMany: vi.fn(),
    },
    userAchievement: {
      deleteMany: vi.fn(),
    },
    notification: {
      deleteMany: vi.fn(),
    },
    chat: {
      deleteMany: vi.fn(),
    },
    report: {
      deleteMany: vi.fn(),
    },
    like: {
      deleteMany: vi.fn(),
    },
    follow: {
      deleteMany: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

// Helper to create mock user data
export const createMockUser = (overrides = {}) => ({
  id: 'test-user-id',
  email: 'test@example.com',
  firstName: 'John',
  lastName: 'Doe',
  birthDate: new Date('1990-01-01'),
  gender: 'MALE',
  preferredLanguage: 'ENGLISH',
  bio: 'Test bio',
  profileImages: ['https://example.com/image.jpg'],
  isBlocked: false,
  isVerified: true,
  isPremium: false,
  createdAt: new Date('2024-01-01'),
  lastActiveAt: new Date('2024-06-01'),
  ...overrides,
});
