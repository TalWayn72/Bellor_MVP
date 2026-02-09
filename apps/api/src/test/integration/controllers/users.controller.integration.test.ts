/**
 * Users Controller Integration Tests
 * Tests for user CRUD operations, search, profile updates, and authorization
 *
 * @see PRD.md Section 10 - Phase 6 Testing (Integration)
 */

import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildTestApp, authHeader, generateTestToken } from '../../build-test-app.js';
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
// LIST USERS
// ============================================
describe('GET /api/v1/users - List Users', () => {
  it('should list users with default pagination', async () => {
    vi.mocked(prisma.user.findMany).mockResolvedValue([createMockUser()]);
    vi.mocked(prisma.user.count).mockResolvedValue(1);

    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/users',
      headers: { authorization: authHeader() },
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.payload);
    expect(body.success).toBe(true);
    expect(body.data).toBeDefined();
    expect(body.pagination).toBeDefined();
  });

  it('should require authentication', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/users',
    });

    expect(response.statusCode).toBe(401);
  });

  it('should accept pagination parameters', async () => {
    vi.mocked(prisma.user.findMany).mockResolvedValue([]);
    vi.mocked(prisma.user.count).mockResolvedValue(0);

    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/users?limit=20&offset=10',
      headers: { authorization: authHeader() },
    });

    expect(response.statusCode).toBe(200);
  });

  it('should accept filter parameters', async () => {
    vi.mocked(prisma.user.findMany).mockResolvedValue([]);
    vi.mocked(prisma.user.count).mockResolvedValue(0);

    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/users?isPremium=true&isBlocked=false',
      headers: { authorization: authHeader() },
    });

    expect(response.statusCode).toBe(200);
  });

  it('should reject invalid query parameters', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/users?limit=invalid',
      headers: { authorization: authHeader() },
    });

    expect(response.statusCode).toBe(400);
    const body = JSON.parse(response.payload);
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });
});

// ============================================
// GET USER BY ID
// ============================================
describe('GET /api/v1/users/:id - Get User By ID', () => {
  it('should get user by id successfully', async () => {
    const mockUser = createMockUser();
    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser);

    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/users/test-user-id',
      headers: { authorization: authHeader() },
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.payload);
    expect(body.success).toBe(true);
    expect(body.data).toBeDefined();
  });

  it('should return 404 for non-existent user', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/users/non-existent-id',
      headers: { authorization: authHeader() },
    });

    expect(response.statusCode).toBe(404);
    const body = JSON.parse(response.payload);
    expect(body.error.code).toBe('USER_NOT_FOUND');
  });

  it('should require authentication', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/users/test-user-id',
    });

    expect(response.statusCode).toBe(401);
  });
});

// ============================================
// UPDATE USER PROFILE
// ============================================
describe('PATCH /api/v1/users/:id - Update User Profile', () => {
  it('should update own profile successfully', async () => {
    const updatedUser = createMockUser({ firstName: 'Updated' });
    vi.mocked(prisma.user.update).mockResolvedValue(updatedUser);

    const response = await app.inject({
      method: 'PATCH',
      url: '/api/v1/users/test-user-id',
      headers: { authorization: authHeader('test-user-id') },
      payload: { firstName: 'Updated' },
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.payload);
    expect(body.success).toBe(true);
  });

  it('should reject updating other user profile', async () => {
    const response = await app.inject({
      method: 'PATCH',
      url: '/api/v1/users/different-user-id',
      headers: { authorization: authHeader('test-user-id') },
      payload: { firstName: 'Hacked' },
    });

    expect(response.statusCode).toBe(403);
    const body = JSON.parse(response.payload);
    expect(body.error.code).toBe('FORBIDDEN');
  });

  it('should validate input data', async () => {
    const response = await app.inject({
      method: 'PATCH',
      url: '/api/v1/users/test-user-id',
      headers: { authorization: authHeader('test-user-id') },
      payload: { firstName: 123 }, // Invalid type
    });

    expect(response.statusCode).toBe(400);
    const body = JSON.parse(response.payload);
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });

  it('should return 404 for non-existent user', async () => {
    vi.mocked(prisma.user.update).mockRejectedValue(new Error('User not found'));

    const response = await app.inject({
      method: 'PATCH',
      url: '/api/v1/users/test-user-id',
      headers: { authorization: authHeader('test-user-id') },
      payload: { firstName: 'Test' },
    });

    expect(response.statusCode).toBe(404);
  });
});

// ============================================
// UPDATE USER LANGUAGE
// ============================================
describe('PATCH /api/v1/users/:id/language - Update Language', () => {
  it('should update language preference', async () => {
    const updatedUser = createMockUser({ preferredLanguage: 'HEBREW' });
    vi.mocked(prisma.user.update).mockResolvedValue(updatedUser);

    const response = await app.inject({
      method: 'PATCH',
      url: '/api/v1/users/test-user-id/language',
      headers: { authorization: authHeader('test-user-id') },
      payload: { language: 'HEBREW' },
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.payload);
    expect(body.success).toBe(true);
  });

  it('should reject updating other user language', async () => {
    const response = await app.inject({
      method: 'PATCH',
      url: '/api/v1/users/different-user-id/language',
      headers: { authorization: authHeader('test-user-id') },
      payload: { language: 'HEBREW' },
    });

    expect(response.statusCode).toBe(403);
  });

  it('should validate language value', async () => {
    const response = await app.inject({
      method: 'PATCH',
      url: '/api/v1/users/test-user-id/language',
      headers: { authorization: authHeader('test-user-id') },
      payload: { language: 'INVALID_LANGUAGE' },
    });

    expect(response.statusCode).toBe(400);
  });
});

// ============================================
// SEARCH USERS
// ============================================
describe('GET /api/v1/users/search - Search Users', () => {
  it('should search users by query', async () => {
    vi.mocked(prisma.user.findMany).mockResolvedValue([createMockUser()]);
    vi.mocked(prisma.user.count).mockResolvedValue(1);

    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/users/search?q=test',
      headers: { authorization: authHeader() },
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.payload);
    expect(body.success).toBe(true);
    expect(body.data).toBeDefined();
  });

  it('should require query parameter', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/users/search',
      headers: { authorization: authHeader() },
    });

    expect(response.statusCode).toBe(400);
  });

  it('should handle empty search results', async () => {
    vi.mocked(prisma.user.findMany).mockResolvedValue([]);
    vi.mocked(prisma.user.count).mockResolvedValue(0);

    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/users/search?q=nonexistent',
      headers: { authorization: authHeader() },
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.payload);
    expect(body.data).toHaveLength(0);
  });

  it('should sanitize search query against SQL injection', async () => {
    vi.mocked(prisma.user.findMany).mockResolvedValue([]);
    vi.mocked(prisma.user.count).mockResolvedValue(0);

    const response = await app.inject({
      method: 'GET',
      url: `/api/v1/users/search?q=${encodeURIComponent("'; DROP TABLE users; --")}`,
      headers: { authorization: authHeader() },
    });

    expect([200, 400]).toContain(response.statusCode);
  });
});

// ============================================
// DEACTIVATE USER
// ============================================
describe('DELETE /api/v1/users/:id - Deactivate User', () => {
  it('should deactivate own account', async () => {
    vi.mocked(prisma.user.update).mockResolvedValue(createMockUser({ isBlocked: true }));

    const response = await app.inject({
      method: 'DELETE',
      url: '/api/v1/users/test-user-id',
      headers: { authorization: authHeader('test-user-id') },
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.payload);
    expect(body.success).toBe(true);
  });

  it('should reject deactivating other user account', async () => {
    const response = await app.inject({
      method: 'DELETE',
      url: '/api/v1/users/different-user-id',
      headers: { authorization: authHeader('test-user-id') },
    });

    expect(response.statusCode).toBe(403);
  });

  it('should return 404 for non-existent user', async () => {
    vi.mocked(prisma.user.update).mockRejectedValue(new Error('User not found'));

    const response = await app.inject({
      method: 'DELETE',
      url: '/api/v1/users/test-user-id',
      headers: { authorization: authHeader('test-user-id') },
    });

    expect(response.statusCode).toBe(404);
  });
});
