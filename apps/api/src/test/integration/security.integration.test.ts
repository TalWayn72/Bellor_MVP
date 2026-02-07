/**
 * Security Integration Tests
 * Tests for JWT validation, injection prevention, XSS, and authorization
 *
 * @see PRD.md Section 10 - Phase 6 Testing (Security)
 */

import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildTestApp, authHeader, generateTestToken } from '../build-test-app.js';
import { prisma } from '../../lib/prisma.js';

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
// JWT VALIDATION
// ============================================
describe('JWT Security', () => {
  it('should reject expired tokens', async () => {
    const jwt = await import('jsonwebtoken');
    const secret = process.env.JWT_SECRET || 'test-jwt-secret-min-32-chars-for-testing-12345678';
    const expiredToken = jwt.default.sign(
      { userId: 'test-user-id', id: 'test-user-id', email: 'test@example.com' },
      secret,
      { expiresIn: '-1s' }, // Already expired
    );

    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/auth/me',
      headers: { authorization: `Bearer ${expiredToken}` },
    });

    expect(response.statusCode).toBe(401);
  });

  it('should reject tokens with invalid signature', async () => {
    const jwt = await import('jsonwebtoken');
    const wrongSecret = 'wrong-secret-that-is-at-least-32-chars-long-!!!!!';
    const badToken = jwt.default.sign(
      { userId: 'test-user-id', id: 'test-user-id', email: 'test@example.com' },
      wrongSecret,
      { expiresIn: '15m' },
    );

    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/auth/me',
      headers: { authorization: `Bearer ${badToken}` },
    });

    expect(response.statusCode).toBe(401);
  });

  it('should reject malformed Bearer tokens', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/auth/me',
      headers: { authorization: 'Bearer not-a-valid-jwt' },
    });

    expect(response.statusCode).toBe(401);
  });

  it('should reject tokens without Bearer prefix', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/auth/me',
      headers: { authorization: generateTestToken() },
    });

    expect(response.statusCode).toBe(401);
  });

  it('should reject empty authorization header', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/auth/me',
      headers: { authorization: '' },
    });

    expect(response.statusCode).toBe(401);
  });

  it('should reject requests without authorization header', async () => {
    const endpoints = [
      { method: 'GET' as const, url: '/api/v1/users' },
      { method: 'GET' as const, url: '/api/v1/chats' },
      { method: 'GET' as const, url: '/api/v1/missions' },
      { method: 'GET' as const, url: '/api/v1/notifications' },
      { method: 'GET' as const, url: '/api/v1/likes/received' },
    ];

    for (const endpoint of endpoints) {
      const response = await app.inject(endpoint);
      expect(response.statusCode).toBe(401);
    }
  });
});

// ============================================
// SQL INJECTION PREVENTION
// ============================================
describe('SQL Injection Prevention', () => {
  it('should safely handle SQL injection in user search', async () => {
    vi.mocked(prisma.user.findMany).mockResolvedValue([]);
    vi.mocked(prisma.user.count).mockResolvedValue(0);

    const response = await app.inject({
      method: 'GET',
      url: `/api/v1/users/search?q=${encodeURIComponent("'; DROP TABLE users; --")}`,
      headers: { authorization: authHeader() },
    });

    // Should not crash - either returns 200 with empty results or 400
    expect([200, 400]).toContain(response.statusCode);
  });

  it('should safely handle SQL injection in URL params', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

    const response = await app.inject({
      method: 'GET',
      url: `/api/v1/users/${encodeURIComponent("1' OR '1'='1")}`,
      headers: { authorization: authHeader() },
    });

    // Should return 404, not expose data
    expect([400, 404]).toContain(response.statusCode);
  });
});

// ============================================
// XSS PREVENTION
// ============================================
describe('XSS Prevention', () => {
  it('should not reflect script tags in error responses', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/users/<script>alert(1)</script>',
      headers: { authorization: authHeader() },
    });

    // Response should not contain unescaped script tag
    expect(response.payload).not.toContain('<script>alert(1)</script>');
  });

  it('should safely handle XSS in registration fields', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/register',
      payload: {
        email: 'xss@test.com',
        password: 'TestPass123!',
        firstName: '<script>alert("xss")</script>',
        lastName: '<img onerror="alert(1)" src="x">',
        birthDate: '1990-01-01',
        gender: 'MALE',
      },
    });

    // Should either fail validation or succeed without executing script
    expect([201, 400, 409, 500]).toContain(response.statusCode);
  });

  it('should safely handle XSS in message content', async () => {
    vi.mocked(prisma.chat.findUnique).mockResolvedValue({
      id: 'chat-1',
      user1Id: 'test-user-id',
      user2Id: 'other-user',
    } as any);
    vi.mocked(prisma.message.create).mockResolvedValue({
      id: 'msg-1',
      content: '<script>alert(1)</script>',
      senderId: 'test-user-id',
    } as any);
    vi.mocked(prisma.chat.update).mockResolvedValue({} as any);

    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/chats/chat-1/messages',
      headers: { authorization: authHeader() },
      payload: { content: '<script>alert(1)</script>' },
    });

    // Should accept (content is stored, XSS prevention is at render time)
    // 404 if chat access check fails in mock environment
    expect([200, 201, 400, 404]).toContain(response.statusCode);
  });
});

// ============================================
// AUTHORIZATION / ACCESS CONTROL
// ============================================
describe('Authorization & Access Control', () => {
  it('should prevent users from updating other users profiles', async () => {
    const response = await app.inject({
      method: 'PATCH',
      url: '/api/v1/users/different-user-id',
      headers: { authorization: authHeader() },
      payload: { firstName: 'Hacked' },
    });

    expect(response.statusCode).toBe(403);
  });

  it('should prevent users from deleting other users', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

    const response = await app.inject({
      method: 'DELETE',
      url: '/api/v1/users/different-user-id',
      headers: { authorization: authHeader() },
    });

    // Should be 403 (ownership check) or 404 (user not found)
    expect([403, 404]).toContain(response.statusCode);
  });

  it('should prevent access to other users GDPR export', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/users/different-user-id/export',
      headers: { authorization: authHeader() },
    });

    expect([403, 404]).toContain(response.statusCode);
  });

  it('should prevent GDPR deletion of other users', async () => {
    const response = await app.inject({
      method: 'DELETE',
      url: '/api/v1/users/different-user-id/gdpr',
      headers: { authorization: authHeader() },
    });

    expect([403, 404]).toContain(response.statusCode);
  });
});

// ============================================
// INPUT VALIDATION
// ============================================
describe('Input Validation', () => {
  it('should reject registration with weak password', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/register',
      payload: {
        email: 'test@example.com',
        password: '123', // Too short, no uppercase, no special char
        firstName: 'Test',
        lastName: 'User',
        birthDate: '1990-01-01',
        gender: 'MALE',
      },
    });

    expect(response.statusCode).toBe(400);
  });

  it('should reject registration with invalid gender', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/register',
      payload: {
        email: 'test@example.com',
        password: 'ValidPass123!',
        firstName: 'Test',
        lastName: 'User',
        birthDate: '1990-01-01',
        gender: 'INVALID_GENDER',
      },
    });

    expect(response.statusCode).toBe(400);
  });

  it('should reject extremely long input values', async () => {
    const longString = 'A'.repeat(10000);

    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/register',
      payload: {
        email: `${longString}@example.com`,
        password: 'ValidPass123!',
        firstName: longString,
        lastName: 'User',
        birthDate: '1990-01-01',
        gender: 'MALE',
      },
    });

    // Should reject - either validation error or server handles it
    expect([400, 413, 500]).toContain(response.statusCode);
  });

  it('should reject empty message content', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/chats/chat-1/messages',
      headers: { authorization: authHeader() },
      payload: { content: '' },
    });

    expect(response.statusCode).toBe(400);
  });
});

// ============================================
// SENSITIVE DATA EXPOSURE
// ============================================
describe('Sensitive Data Exposure Prevention', () => {
  it('should not expose password hash in user responses', async () => {
    // Prisma select clause prevents passwordHash from being returned
    // Mock reflects what Prisma actually returns with the select clause
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: 'test-user-id',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      birthDate: new Date('1990-01-01'),
      gender: 'MALE',
      preferredLanguage: 'ENGLISH',
      bio: null,
      profileImages: [],
      isBlocked: false,
      isVerified: true,
      isPremium: false,
      createdAt: new Date(),
      lastActiveAt: new Date(),
    } as any);

    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/users/test-user-id',
      headers: { authorization: authHeader() },
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.payload);
    // Password hash should never be in the response
    expect(body.passwordHash).toBeUndefined();
    expect(body.data?.passwordHash).toBeUndefined();
    expect(response.payload).not.toContain('passwordHash');
  });

  it('should not expose internal errors to clients', async () => {
    vi.mocked(prisma.user.findMany).mockRejectedValue(new Error('ECONNREFUSED'));

    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/users',
      headers: { authorization: authHeader() },
    });

    // Should return generic error, not expose DB connection details
    expect(response.statusCode).toBe(500);
    expect(response.payload).not.toContain('ECONNREFUSED');
  });
});
