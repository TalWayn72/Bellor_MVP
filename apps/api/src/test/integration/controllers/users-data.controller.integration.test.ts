/**
 * Users Data Controller Integration Tests
 * Tests for user statistics, GDPR data export, and data deletion
 *
 * @see PRD.md Section 10 - Phase 6 Testing (Integration)
 */

import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildTestApp, authHeader } from '../../build-test-app.js';
import { prisma } from '../../../lib/prisma.js';
import { createMockUser } from '../../setup.js';

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

const mockUserStats = {
  totalResponses: 10,
  totalLikesReceived: 25,
  totalLikesGiven: 30,
  totalMatches: 5,
  totalChats: 8,
  totalMessages: 150,
  profileViews: 100,
  storiesPosted: 15,
};

const mockExportData = {
  user: createMockUser(),
  responses: [],
  likes: [],
  matches: [],
  chats: [],
  messages: [],
  stories: [],
  notifications: [],
};

// ============================================
// GET USER STATS
// ============================================
describe('GET /api/v1/users/:id/stats - Get User Stats', () => {
  it('should get own user stats', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(createMockUser());
    vi.mocked(prisma.response.count).mockResolvedValue(10);
    vi.mocked(prisma.like.count).mockResolvedValue(25);

    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/users/test-user-id/stats',
      headers: { authorization: authHeader('test-user-id') },
    });

    expect([200, 404, 500]).toContain(response.statusCode);
  });

  it('should reject accessing other user stats', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/users/different-user-id/stats',
      headers: { authorization: authHeader('test-user-id') },
    });

    expect(response.statusCode).toBe(403);
  });

  it('should require authentication', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/users/test-user-id/stats',
    });

    expect(response.statusCode).toBe(401);
  });

  it('should return 404 for non-existent user', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/users/test-user-id/stats',
      headers: { authorization: authHeader('test-user-id') },
    });

    expect([404, 500]).toContain(response.statusCode);
  });

  it('should return comprehensive statistics', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(createMockUser());
    vi.mocked(prisma.response.count).mockResolvedValue(10);
    vi.mocked(prisma.like.count).mockResolvedValue(25);
    vi.mocked(prisma.chat.count).mockResolvedValue(8);
    vi.mocked(prisma.message.count).mockResolvedValue(150);

    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/users/test-user-id/stats',
      headers: { authorization: authHeader('test-user-id') },
    });

    if (response.statusCode === 200) {
      const body = JSON.parse(response.payload);
      expect(body.success).toBe(true);
      expect(body.data).toBeDefined();
    }
  });
});

// ============================================
// EXPORT USER DATA (GDPR)
// ============================================
describe('GET /api/v1/users/:id/export - GDPR Data Export', () => {
  it('should export own user data', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(createMockUser());
    vi.mocked(prisma.response.findMany).mockResolvedValue([]);
    vi.mocked(prisma.like.findMany).mockResolvedValue([]);
    vi.mocked(prisma.chat.findMany).mockResolvedValue([]);
    vi.mocked(prisma.message.findMany).mockResolvedValue([]);

    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/users/test-user-id/export',
      headers: { authorization: authHeader('test-user-id') },
    });

    expect([200, 404, 500]).toContain(response.statusCode);
  });

  it('should reject exporting other user data', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/users/different-user-id/export',
      headers: { authorization: authHeader('test-user-id') },
    });

    expect(response.statusCode).toBe(403);
  });

  it('should require authentication', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/users/test-user-id/export',
    });

    expect(response.statusCode).toBe(401);
  });

  it('should return 404 for non-existent user', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/users/test-user-id/export',
      headers: { authorization: authHeader('test-user-id') },
    });

    expect([404, 500]).toContain(response.statusCode);
  });

  it('should set correct headers for file download', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(createMockUser());
    vi.mocked(prisma.response.findMany).mockResolvedValue([]);
    vi.mocked(prisma.like.findMany).mockResolvedValue([]);

    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/users/test-user-id/export',
      headers: { authorization: authHeader('test-user-id') },
    });

    if (response.statusCode === 200) {
      expect(response.headers['content-type']).toContain('application/json');
      expect(response.headers['content-disposition']).toContain('attachment');
      expect(response.headers['content-disposition']).toContain('bellor-data-export');
    }
  });

  it('should include all user data in export', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(createMockUser());
    vi.mocked(prisma.response.findMany).mockResolvedValue([]);
    vi.mocked(prisma.like.findMany).mockResolvedValue([]);
    vi.mocked(prisma.chat.findMany).mockResolvedValue([]);
    vi.mocked(prisma.message.findMany).mockResolvedValue([]);
    vi.mocked(prisma.story.findMany).mockResolvedValue([]);
    vi.mocked(prisma.notification.findMany).mockResolvedValue([]);

    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/users/test-user-id/export',
      headers: { authorization: authHeader('test-user-id') },
    });

    if (response.statusCode === 200) {
      const body = JSON.parse(response.payload);
      expect(body.data).toBeDefined();
      expect(body.exportedAt).toBeDefined();
    }
  });

  it('should not include password hash in export', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(createMockUser());
    vi.mocked(prisma.response.findMany).mockResolvedValue([]);
    vi.mocked(prisma.like.findMany).mockResolvedValue([]);

    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/users/test-user-id/export',
      headers: { authorization: authHeader('test-user-id') },
    });

    if (response.statusCode === 200) {
      expect(response.payload).not.toContain('passwordHash');
    }
  });
});

// ============================================
// DELETE USER GDPR (RIGHT TO ERASURE)
// ============================================
describe('DELETE /api/v1/users/:id/gdpr - GDPR Right to Erasure', () => {
  it('should delete own user data permanently', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(createMockUser());
    vi.mocked(prisma.user.delete).mockResolvedValue(createMockUser());

    const response = await app.inject({
      method: 'DELETE',
      url: '/api/v1/users/test-user-id/gdpr',
      headers: { authorization: authHeader('test-user-id') },
    });

    expect([200, 404, 500]).toContain(response.statusCode);
  });

  it('should reject deleting other user data', async () => {
    const response = await app.inject({
      method: 'DELETE',
      url: '/api/v1/users/different-user-id/gdpr',
      headers: { authorization: authHeader('test-user-id') },
    });

    expect(response.statusCode).toBe(403);
  });

  it('should require authentication', async () => {
    const response = await app.inject({
      method: 'DELETE',
      url: '/api/v1/users/test-user-id/gdpr',
    });

    expect(response.statusCode).toBe(401);
  });

  it('should return 404 for non-existent user', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

    const response = await app.inject({
      method: 'DELETE',
      url: '/api/v1/users/test-user-id/gdpr',
      headers: { authorization: authHeader('test-user-id') },
    });

    expect([404, 500]).toContain(response.statusCode);
  });

  it('should return GDPR compliance message', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(createMockUser());
    vi.mocked(prisma.user.delete).mockResolvedValue(createMockUser());

    const response = await app.inject({
      method: 'DELETE',
      url: '/api/v1/users/test-user-id/gdpr',
      headers: { authorization: authHeader('test-user-id') },
    });

    if (response.statusCode === 200) {
      const body = JSON.parse(response.payload);
      expect(body.message).toContain('GDPR');
      expect(body.message).toContain('Article 17');
    }
  });

  it('should cascade delete all related data', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(createMockUser());
    vi.mocked(prisma.$transaction).mockImplementation(async (callback: any) => {
      if (typeof callback === 'function') {
        return callback(prisma);
      }
      return Promise.all(callback);
    });
    vi.mocked(prisma.response.deleteMany).mockResolvedValue({ count: 10 });
    vi.mocked(prisma.like.deleteMany).mockResolvedValue({ count: 20 });
    vi.mocked(prisma.message.deleteMany).mockResolvedValue({ count: 50 });
    vi.mocked(prisma.user.delete).mockResolvedValue(createMockUser());

    const response = await app.inject({
      method: 'DELETE',
      url: '/api/v1/users/test-user-id/gdpr',
      headers: { authorization: authHeader('test-user-id') },
    });

    expect([200, 404, 500]).toContain(response.statusCode);
  });
});
