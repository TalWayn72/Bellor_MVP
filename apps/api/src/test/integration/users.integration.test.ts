/**
 * Users Routes - Integration Tests
 * Tests the full HTTP request/response cycle for user endpoints
 *
 * @see PRD.md Section 10 - Phase 6 Testing
 */

import { describe, it, expect, vi, beforeAll, afterAll, beforeEach, type Mock } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildTestApp, authHeader } from '../build-test-app.js';
import { prisma } from '../../lib/prisma.js';
import type { User } from '@prisma/client';

let app: FastifyInstance;

beforeAll(async () => {
  app = await buildTestApp();
});

afterAll(async () => {
  await app.close();
});

beforeEach(() => {
  vi.clearAllMocks();
});

const mockUser = {
  id: 'test-user-id',
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User',
  birthDate: new Date('1990-01-01'),
  gender: 'MALE',
  preferredLanguage: 'ENGLISH',
  bio: 'Test bio',
  profileImages: ['https://example.com/img.jpg'],
  isBlocked: false,
  isVerified: true,
  isPremium: false,
  createdAt: new Date('2024-01-01'),
  lastActiveAt: new Date('2024-06-01'),
};

// ============================================
// LIST USERS
// ============================================
describe('[P2][profile] GET /api/v1/users', () => {
  it('should return 401 without authorization', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/users',
    });

    expect(response.statusCode).toBe(401);
  });

  it('should return paginated user list', async () => {
    (prisma.user.findMany as Mock).mockResolvedValue([mockUser] as unknown as User[]);
    (prisma.user.count as Mock).mockResolvedValue(1);

    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/users',
      headers: { authorization: authHeader() },
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.payload);
    expect(body.success).toBe(true);
    // Controller returns { success, data: users[], pagination: {...} }
    expect(body.data).toHaveLength(1);
    expect(body.pagination).toHaveProperty('total');
    expect(body.pagination).toHaveProperty('limit');
    expect(body.pagination).toHaveProperty('offset');
  });

  it('should accept pagination query params', async () => {
    (prisma.user.findMany as Mock).mockResolvedValue([]);
    (prisma.user.count as Mock).mockResolvedValue(0);

    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/users?limit=5&offset=10',
      headers: { authorization: authHeader() },
    });

    expect(response.statusCode).toBe(200);
  });
});

// ============================================
// GET USER BY ID
// ============================================
describe('[P2][profile] GET /api/v1/users/:id', () => {
  it('should return 401 without authorization', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/users/test-user-id',
    });

    expect(response.statusCode).toBe(401);
  });

  it('should return user details', async () => {
    (prisma.user.findUnique as Mock).mockResolvedValue(mockUser as unknown as User);

    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/users/test-user-id',
      headers: { authorization: authHeader() },
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.payload);
    expect(body.success).toBe(true);
    expect(body.data.id).toBe('test-user-id');
  });

  it('should return 404 for non-existent user', async () => {
    (prisma.user.findUnique as Mock).mockResolvedValue(null);

    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/users/nonexistent-id',
      headers: { authorization: authHeader() },
    });

    expect(response.statusCode).toBe(404);
  });
});

// ============================================
// UPDATE USER PROFILE
// ============================================
describe('[P2][profile] PATCH /api/v1/users/:id', () => {
  it('should return 401 without authorization', async () => {
    const response = await app.inject({
      method: 'PATCH',
      url: '/api/v1/users/test-user-id',
      payload: { firstName: 'New Name' },
    });

    expect(response.statusCode).toBe(401);
  });

  it('should update user profile', async () => {
    (prisma.user.findUnique as Mock).mockResolvedValue(mockUser as unknown as User);
    (prisma.user.update as Mock).mockResolvedValue({
      ...mockUser,
      firstName: 'Updated',
    } as unknown as User);

    const response = await app.inject({
      method: 'PATCH',
      url: '/api/v1/users/test-user-id',
      headers: { authorization: authHeader() },
      payload: { firstName: 'Updated' },
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.payload);
    expect(body.success).toBe(true);
  });

  it('should update bio field', async () => {
    (prisma.user.findUnique as Mock).mockResolvedValue(mockUser as unknown as User);
    (prisma.user.update as Mock).mockResolvedValue({
      ...mockUser,
      bio: 'New bio text',
    } as unknown as User);

    const response = await app.inject({
      method: 'PATCH',
      url: '/api/v1/users/test-user-id',
      headers: { authorization: authHeader() },
      payload: { bio: 'New bio text' },
    });

    expect(response.statusCode).toBe(200);
  });

  it('should handle snake_case fields from frontend', async () => {
    (prisma.user.findUnique as Mock).mockResolvedValue(mockUser as unknown as User);
    (prisma.user.update as Mock).mockResolvedValue(mockUser as unknown as User);

    const response = await app.inject({
      method: 'PATCH',
      url: '/api/v1/users/test-user-id',
      headers: { authorization: authHeader() },
      payload: {
        profile_images: ['https://example.com/new-img.jpg'],
        looking_for: 'female',
      },
    });

    expect(response.statusCode).toBe(200);
  });

  it('should return 403 when updating another users profile', async () => {
    // Controller checks ownership (userId match) before existence
    const response = await app.inject({
      method: 'PATCH',
      url: '/api/v1/users/nonexistent-id',
      headers: { authorization: authHeader() },
      payload: { firstName: 'Test' },
    });

    expect(response.statusCode).toBe(403);
  });
});

// ============================================
// UPDATE LANGUAGE
// ============================================
describe('[P2][profile] PATCH /api/v1/users/:id/language', () => {
  it('should update user language', async () => {
    (prisma.user.findUnique as Mock).mockResolvedValue(mockUser as unknown as User);
    (prisma.user.update as Mock).mockResolvedValue({
      ...mockUser,
      preferredLanguage: 'HEBREW',
    } as unknown as User);

    const response = await app.inject({
      method: 'PATCH',
      url: '/api/v1/users/test-user-id/language',
      headers: { authorization: authHeader() },
      payload: { language: 'HEBREW' },
    });

    expect(response.statusCode).toBe(200);
  });

  it('should return 401 without authorization', async () => {
    const response = await app.inject({
      method: 'PATCH',
      url: '/api/v1/users/test-user-id/language',
      payload: { language: 'HEBREW' },
    });

    expect(response.statusCode).toBe(401);
  });
});

// ============================================
// USER STATS
// ============================================
describe('[P2][profile] GET /api/v1/users/:id/stats', () => {
  it('should return user statistics', async () => {
    (prisma.user.findUnique as Mock).mockResolvedValue({
      id: 'test-user-id',
      isPremium: false,
      createdAt: new Date('2024-01-01'),
      lastActiveAt: new Date('2024-06-01'),
      _count: {
        sentMessages: 50,
        chatsAsUser1: 3,
        chatsAsUser2: 2,
      },
    } as unknown as User);

    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/users/test-user-id/stats',
      headers: { authorization: authHeader() },
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.payload);
    expect(body.success).toBe(true);
    expect(body.data).toHaveProperty('messagesCount');
    expect(body.data).toHaveProperty('chatsCount');
  });

  it('should return 401 without authorization', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/users/test-user-id/stats',
    });

    expect(response.statusCode).toBe(401);
  });
});

// ============================================
// SEARCH USERS
// ============================================
describe('[P2][profile] GET /api/v1/users/search', () => {
  it('should search users by query', async () => {
    (prisma.user.findMany as Mock).mockResolvedValue([mockUser] as unknown as User[]);
    (prisma.user.count as Mock).mockResolvedValue(1);

    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/users/search?q=Test',
      headers: { authorization: authHeader() },
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.payload);
    expect(body.success).toBe(true);
  });

  it('should return 401 without authorization', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/users/search?q=Test',
    });

    expect(response.statusCode).toBe(401);
  });
});

// ============================================
// DEACTIVATE USER
// ============================================
describe('[P2][profile] DELETE /api/v1/users/:id', () => {
  it('should return 401 without authorization', async () => {
    const response = await app.inject({
      method: 'DELETE',
      url: '/api/v1/users/test-user-id',
    });

    expect(response.statusCode).toBe(401);
  });

  it('should deactivate user', async () => {
    (prisma.user.findUnique as Mock).mockResolvedValue(mockUser as unknown as User);
    (prisma.user.update as Mock).mockResolvedValue({ ...mockUser, isBlocked: true } as unknown as User);

    const response = await app.inject({
      method: 'DELETE',
      url: '/api/v1/users/test-user-id',
      headers: { authorization: authHeader() },
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.payload);
    expect(body.success).toBe(true);
  });
});

// ============================================
// GDPR DATA EXPORT
// ============================================
describe('[P2][profile] GET /api/v1/users/:id/export', () => {
  it('should return 401 without authorization', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/users/test-user-id/export',
    });

    expect(response.statusCode).toBe(401);
  });

  it('should export user data (GDPR Article 20)', async () => {
    (prisma.user.findUnique as Mock).mockResolvedValue({
      ...mockUser,
      location: { city: 'Tel Aviv' },
      lookingFor: ['FEMALE'],
      ageRangeMin: 18,
      ageRangeMax: 35,
      maxDistance: 50,
      premiumExpiresAt: null,
      responseCount: 5,
      chatCount: 3,
      missionCompletedCount: 2,
      sentMessages: [],
      responses: [],
      stories: [],
      achievements: [],
      feedbacks: [],
    } as unknown as User);

    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/users/test-user-id/export',
      headers: { authorization: authHeader() },
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.payload);
    expect(body.success).toBe(true);
    expect(body.data).toHaveProperty('personalInformation');
    expect(body.data).toHaveProperty('preferences');
    expect(body.data).toHaveProperty('content');
  });
});

// ============================================
// GDPR DELETE
// ============================================
describe('[P2][profile] DELETE /api/v1/users/:id/gdpr', () => {
  it('should return 401 without authorization', async () => {
    const response = await app.inject({
      method: 'DELETE',
      url: '/api/v1/users/test-user-id/gdpr',
    });

    expect(response.statusCode).toBe(401);
  });

  it('should permanently delete user data (GDPR Article 17)', async () => {
    (prisma.user.findUnique as Mock).mockResolvedValue(mockUser as unknown as User);
    (prisma.$transaction as Mock).mockImplementation(async (cb: (tx: unknown) => Promise<unknown>) => {
      const tx = {
        message: { deleteMany: vi.fn().mockResolvedValue({ count: 0 }) },
        response: { deleteMany: vi.fn().mockResolvedValue({ count: 0 }) },
        story: { deleteMany: vi.fn().mockResolvedValue({ count: 0 }) },
        userAchievement: { deleteMany: vi.fn().mockResolvedValue({ count: 0 }) },
        notification: { deleteMany: vi.fn().mockResolvedValue({ count: 0 }) },
        deviceToken: { deleteMany: vi.fn().mockResolvedValue({ count: 0 }) },
        feedback: { deleteMany: vi.fn().mockResolvedValue({ count: 0 }) },
        payment: { deleteMany: vi.fn().mockResolvedValue({ count: 0 }) },
        subscription: { deleteMany: vi.fn().mockResolvedValue({ count: 0 }) },
        referral: { updateMany: vi.fn().mockResolvedValue({ count: 0 }) },
        chat: { deleteMany: vi.fn().mockResolvedValue({ count: 0 }) },
        report: { deleteMany: vi.fn().mockResolvedValue({ count: 0 }) },
        like: { deleteMany: vi.fn().mockResolvedValue({ count: 0 }) },
        follow: { deleteMany: vi.fn().mockResolvedValue({ count: 0 }) },
        user: { delete: vi.fn().mockResolvedValue(mockUser) },
      };
      return cb(tx);
    });

    const response = await app.inject({
      method: 'DELETE',
      url: '/api/v1/users/test-user-id/gdpr',
      headers: { authorization: authHeader() },
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.payload);
    expect(body.success).toBe(true);
  });
});
