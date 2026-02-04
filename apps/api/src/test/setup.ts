/**
 * Test Setup - Bellor API
 * Configures the test environment with mocks and utilities
 *
 * @see PRD.md Section 14 - Development Guidelines
 * Target: 80%+ test coverage for robust system supporting 10K+ concurrent users
 */

import { beforeAll, afterAll, afterEach, vi } from 'vitest';

// Mock environment variables for testing
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgresql://bellor:bellor_dev@localhost:5432/bellor_test';
process.env.JWT_SECRET = 'test-jwt-secret-min-32-chars-for-testing-12345678';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-min-32-chars-for-testing-87654321';
process.env.REDIS_URL = 'redis://localhost:6379';
process.env.FRONTEND_URL = 'http://localhost:5173';

// Mock Prisma before any imports
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
    chat: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    message: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    mission: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    response: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    story: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
    },
    like: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    follow: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    notification: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    achievement: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    userAchievement: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
    },
    report: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    $transaction: vi.fn((fn) => fn({
      user: { findUnique: vi.fn(), create: vi.fn(), update: vi.fn() },
    })),
    $connect: vi.fn(),
    $disconnect: vi.fn(),
  },
}));

// Mock Redis
vi.mock('../lib/redis.js', () => ({
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
    ping: vi.fn().mockResolvedValue('PONG'),
    quit: vi.fn().mockResolvedValue('OK'),
  },
}));

// Global test setup
beforeAll(() => {
  // Ensure test environment
  process.env.NODE_ENV = 'test';
});

// Clear all mocks after each test
afterEach(() => {
  vi.clearAllMocks();
});

// Cleanup after all tests
afterAll(() => {
  vi.resetAllMocks();
});

// ============================================
// Test Factory Functions
// ============================================

export const createMockUser = (overrides: Partial<MockUser> = {}): MockUser => ({
  id: 'test-user-id',
  email: 'test@example.com',
  passwordHash: 'hashed_password123',
  firstName: 'Test',
  lastName: 'User',
  nickname: 'testuser',
  birthDate: new Date('1990-01-01'),
  gender: 'MALE',
  preferredLanguage: 'ENGLISH',
  isBlocked: false,
  isVerified: false,
  isPremium: false,
  role: 'USER',
  createdAt: new Date(),
  updatedAt: new Date(),
  lastActiveAt: new Date(),
  ...overrides,
});

export const createMockChat = (overrides: Partial<MockChat> = {}): MockChat => ({
  id: 'test-chat-id',
  user1Id: 'user-1',
  user2Id: 'user-2',
  chatType: 'TEMPORARY',
  expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

export const createMockMessage = (overrides: Partial<MockMessage> = {}): MockMessage => ({
  id: 'test-message-id',
  chatId: 'test-chat-id',
  senderId: 'user-1',
  content: 'Hello, this is a test message',
  messageType: 'TEXT',
  isRead: false,
  createdAt: new Date(),
  ...overrides,
});

export const createMockMission = (overrides: Partial<MockMission> = {}): MockMission => ({
  id: 'test-mission-id',
  title: 'Test Mission',
  description: 'This is a test mission',
  missionType: 'DAILY',
  responseTypes: ['TEXT'],
  isActive: true,
  publishDate: new Date(),
  createdAt: new Date(),
  ...overrides,
});

export const createMockResponse = (overrides: Partial<MockResponse> = {}): MockResponse => ({
  id: 'test-response-id',
  userId: 'test-user-id',
  missionId: 'test-mission-id',
  responseType: 'TEXT',
  textContent: 'This is my response',
  isPublic: true,
  likesCount: 0,
  viewsCount: 0,
  createdAt: new Date(),
  ...overrides,
});

export const createMockLike = (overrides: Partial<MockLike> = {}): MockLike => ({
  id: 'test-like-id',
  userId: 'user-1',
  targetUserId: 'user-2',
  likeType: 'POSITIVE',
  responseId: null,
  createdAt: new Date(),
  ...overrides,
});

export const createMockFollow = (overrides: Partial<MockFollow> = {}): MockFollow => ({
  id: 'test-follow-id',
  followerId: 'user-1',
  followingId: 'user-2',
  createdAt: new Date(),
  ...overrides,
});

export const createMockNotification = (overrides: Partial<MockNotification> = {}): MockNotification => ({
  id: 'test-notification-id',
  userId: 'test-user-id',
  type: 'NEW_LIKE',
  title: 'New Like',
  message: 'Someone liked your response',
  isRead: false,
  data: {},
  createdAt: new Date(),
  ...overrides,
});

// ============================================
// Type Definitions for Mocks
// ============================================

export interface MockUser {
  id: string;
  email: string;
  passwordHash: string | null;
  firstName: string | null;
  lastName: string | null;
  nickname: string | null;
  birthDate: Date;
  gender: 'MALE' | 'FEMALE' | 'NON_BINARY' | 'OTHER';
  preferredLanguage: 'ENGLISH' | 'HEBREW' | 'SPANISH' | 'GERMAN' | 'FRENCH';
  isBlocked: boolean;
  isVerified: boolean;
  isPremium: boolean;
  role: 'USER' | 'ADMIN';
  createdAt: Date;
  updatedAt: Date;
  lastActiveAt: Date | null;
}

export interface MockChat {
  id: string;
  user1Id: string;
  user2Id: string;
  chatType: 'TEMPORARY' | 'PERMANENT';
  expiresAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface MockMessage {
  id: string;
  chatId: string;
  senderId: string;
  content: string;
  messageType: 'TEXT' | 'IMAGE' | 'AUDIO' | 'VIDEO';
  isRead: boolean;
  createdAt: Date;
}

export interface MockMission {
  id: string;
  title: string;
  description: string;
  missionType: 'DAILY' | 'WEEKLY' | 'SPECIAL';
  responseTypes: string[];
  isActive: boolean;
  publishDate: Date;
  createdAt: Date;
}

export interface MockResponse {
  id: string;
  userId: string;
  missionId: string;
  responseType: 'TEXT' | 'AUDIO' | 'VIDEO' | 'IMAGE' | 'DRAWING';
  textContent: string | null;
  isPublic: boolean;
  likesCount: number;
  viewsCount: number;
  createdAt: Date;
}

export interface MockLike {
  id: string;
  userId: string;
  targetUserId: string;
  likeType: 'POSITIVE' | 'ROMANTIC' | 'SUPER';
  responseId: string | null;
  createdAt: Date;
}

export interface MockFollow {
  id: string;
  followerId: string;
  followingId: string;
  createdAt: Date;
}

export interface MockNotification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  data: Record<string, unknown>;
  createdAt: Date;
}

// ============================================
// Test Helpers
// ============================================

/**
 * Wait for async operations to complete
 */
export const flushPromises = () => new Promise(resolve => setImmediate(resolve));

/**
 * Create a mock Fastify request object
 */
export const createMockRequest = (overrides = {}) => ({
  params: {},
  query: {},
  body: {},
  headers: {},
  user: createMockUser(),
  ...overrides,
});

/**
 * Create a mock Fastify reply object
 */
export const createMockReply = () => ({
  code: vi.fn().mockReturnThis(),
  send: vi.fn().mockReturnThis(),
  header: vi.fn().mockReturnThis(),
  status: vi.fn().mockReturnThis(),
});
