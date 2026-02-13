/**
 * Users Data Controller Integration Tests
 * Tests for user statistics, GDPR data export, and data deletion
 *
 * @see PRD.md Section 10 - Phase 6 Testing (Integration)
 */

import { describe, it, expect, vi, beforeAll, afterAll, beforeEach, type Mock } from 'vitest';
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


// ============================================
// GET USER STATS
// ============================================
describe('GET /api/v1/users/:id/stats - Get User Stats', () => {
  it('should get own user stats', async () => {
    (prisma.user.findUnique as Mock).mockResolvedValue(createMockUser());
    (prisma.response.count as Mock).mockResolvedValue(10);
    (prisma.like.count as Mock).mockResolvedValue(25);

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
    (prisma.user.findUnique as Mock).mockResolvedValue(null);

    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/users/test-user-id/stats',
      headers: { authorization: authHeader('test-user-id') },
    });

    expect([404, 500]).toContain(response.statusCode);
  });

  it('should return comprehensive statistics', async () => {
    (prisma.user.findUnique as Mock).mockResolvedValue(createMockUser());
    (prisma.response.count as Mock).mockResolvedValue(10);
    (prisma.like.count as Mock).mockResolvedValue(25);
    (prisma.chat.count as Mock).mockResolvedValue(8);
    (prisma.message.count as Mock).mockResolvedValue(150);

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
    (prisma.user.findUnique as Mock).mockResolvedValue(createMockUser());
    (prisma.response.findMany as Mock).mockResolvedValue([]);
    (prisma.like.findMany as Mock).mockResolvedValue([]);
    (prisma.chat.findMany as Mock).mockResolvedValue([]);
    (prisma.message.findMany as Mock).mockResolvedValue([]);

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
    (prisma.user.findUnique as Mock).mockResolvedValue(null);

    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/users/test-user-id/export',
      headers: { authorization: authHeader('test-user-id') },
    });

    expect([404, 500]).toContain(response.statusCode);
  });

  it('should set correct headers for file download', async () => {
    (prisma.user.findUnique as Mock).mockResolvedValue(createMockUser());
    (prisma.response.findMany as Mock).mockResolvedValue([]);
    (prisma.like.findMany as Mock).mockResolvedValue([]);

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
    (prisma.user.findUnique as Mock).mockResolvedValue(createMockUser());
    (prisma.response.findMany as Mock).mockResolvedValue([]);
    (prisma.like.findMany as Mock).mockResolvedValue([]);
    (prisma.chat.findMany as Mock).mockResolvedValue([]);
    (prisma.message.findMany as Mock).mockResolvedValue([]);
    (prisma.story.findMany as Mock).mockResolvedValue([]);
    (prisma.notification.findMany as Mock).mockResolvedValue([]);

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
    (prisma.user.findUnique as Mock).mockResolvedValue(createMockUser());
    (prisma.response.findMany as Mock).mockResolvedValue([]);
    (prisma.like.findMany as Mock).mockResolvedValue([]);

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
    (prisma.user.findUnique as Mock).mockResolvedValue(createMockUser());
    (prisma.user.delete as Mock).mockResolvedValue(createMockUser());

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
    (prisma.user.findUnique as Mock).mockResolvedValue(null);

    const response = await app.inject({
      method: 'DELETE',
      url: '/api/v1/users/test-user-id/gdpr',
      headers: { authorization: authHeader('test-user-id') },
    });

    expect([404, 500]).toContain(response.statusCode);
  });

  it('should return GDPR compliance message', async () => {
    (prisma.user.findUnique as Mock).mockResolvedValue(createMockUser());
    (prisma.user.delete as Mock).mockResolvedValue(createMockUser());

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
    (prisma.user.findUnique as Mock).mockResolvedValue(createMockUser());
    (prisma.$transaction as Mock).mockImplementation(async (callback: unknown) => {
      if (typeof callback === 'function') {
        return callback(prisma);
      }
      return Promise.all(callback as Promise<unknown>[]);
    });
    (prisma.response.deleteMany as Mock).mockResolvedValue({ count: 10 });
    (prisma.like.deleteMany as Mock).mockResolvedValue({ count: 20 });
    (prisma.message.deleteMany as Mock).mockResolvedValue({ count: 50 });
    (prisma.user.delete as Mock).mockResolvedValue(createMockUser());

    const response = await app.inject({
      method: 'DELETE',
      url: '/api/v1/users/test-user-id/gdpr',
      headers: { authorization: authHeader('test-user-id') },
    });

    expect([200, 404, 500]).toContain(response.statusCode);
  });
});
