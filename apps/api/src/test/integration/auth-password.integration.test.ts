/**
 * Auth Routes - Integration Tests: Logout, Password & Health
 *
 * Tests the full HTTP request/response cycle for logout,
 * change password, forgot password, reset password, and health check.
 */

import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildTestApp, authHeader } from '../build-test-app.js';
import { prisma } from '../../lib/prisma.js';
import { redis } from '../../lib/redis.js';
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

describe('[P0][auth] POST /api/v1/auth/logout', () => {
  it('should return 401 without authorization', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/logout',
    });

    expect(response.statusCode).toBe(401);
  });

  it('should logout successfully with valid token', async () => {
    vi.mocked(redis.del).mockResolvedValue(1);

    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/logout',
      headers: { authorization: authHeader() },
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.payload);
    expect(body.success).toBe(true);
  });
});

describe('[P0][auth] POST /api/v1/auth/change-password', () => {
  it('should return 401 without authorization', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/change-password',
      payload: {
        currentPassword: 'OldP@ss1',
        newPassword: 'NewP@ss1!',
      },
    });

    expect(response.statusCode).toBe(401);
  });

  it('should return 400 for missing fields', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/change-password',
      headers: { authorization: authHeader() },
      payload: {},
    });

    expect(response.statusCode).toBe(400);
  });

  it('should return 400 for weak new password', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/change-password',
      headers: { authorization: authHeader() },
      payload: {
        currentPassword: 'OldP@ss1',
        newPassword: 'weak',
      },
    });

    expect(response.statusCode).toBe(400);
  });
});

describe('[P0][auth] POST /api/v1/auth/forgot-password', () => {
  it('should return 200 for valid email (user exists)', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: 'test-user-id',
      email: 'test@example.com',
      firstName: 'Test',
      isBlocked: false,
    } as unknown as User);
    vi.mocked(redis.setex).mockResolvedValue('OK');

    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/forgot-password',
      payload: { email: 'test@example.com' },
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.payload);
    expect(body.success).toBe(true);
    expect(body.data.message).toContain('password reset link');
  });

  it('should return 200 for non-existent email (prevents enumeration)', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/forgot-password',
      payload: { email: 'nonexistent@example.com' },
    });

    // Should still return 200 to prevent email enumeration
    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.payload);
    expect(body.success).toBe(true);
  });

  it('should return 400 for invalid email format', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/forgot-password',
      payload: { email: 'not-an-email' },
    });

    expect(response.statusCode).toBe(400);
  });

  it('should return 400 for missing email', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/forgot-password',
      payload: {},
    });

    expect(response.statusCode).toBe(400);
  });

  it('should return 200 for blocked user (prevents enumeration)', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: 'blocked-user',
      email: 'blocked@example.com',
      firstName: 'Blocked',
      isBlocked: true,
    } as unknown as User);

    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/forgot-password',
      payload: { email: 'blocked@example.com' },
    });

    // Should return 200 even for blocked users
    expect(response.statusCode).toBe(200);
  });
});

describe('[P0][auth] POST /api/v1/auth/reset-password', () => {
  it('should return 400 for invalid/expired token', async () => {
    vi.mocked(redis.get).mockResolvedValue(null);

    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/reset-password',
      payload: {
        token: 'expired-or-invalid-token',
        newPassword: 'NewSecure@Pass1',
      },
    });

    expect(response.statusCode).toBe(400);
    const body = JSON.parse(response.payload);
    expect(body.error.code).toBe('INVALID_RESET_TOKEN');
  });

  it('should return 400 for weak new password', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/reset-password',
      payload: {
        token: 'some-token',
        newPassword: 'weak',
      },
    });

    expect(response.statusCode).toBe(400);
  });

  it('should return 400 for missing token', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/reset-password',
      payload: {
        newPassword: 'NewSecure@Pass1',
      },
    });

    expect(response.statusCode).toBe(400);
  });

  it('should return 400 for missing password', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/reset-password',
      payload: {
        token: 'some-token',
      },
    });

    expect(response.statusCode).toBe(400);
  });
});

describe('[P0][auth] GET /api/v1/health', () => {
  it('should return health status', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/health',
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.payload);
    expect(body.status).toBe('ok');
    expect(body).toHaveProperty('version');
    expect(body).toHaveProperty('timestamp');
  });
});
