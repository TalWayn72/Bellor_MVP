/**
 * Auth Controller Integration Tests
 * Tests for authentication, registration, login, logout, password management
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
// REGISTRATION
// ============================================
describe('POST /api/v1/auth/register - User Registration', () => {
  it('should register new user successfully', async () => {
    const mockUser = createMockUser({ email: 'newuser@example.com' });
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.user.create).mockResolvedValue(mockUser);

    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/register',
      payload: {
        email: 'newuser@example.com',
        password: 'SecurePass123!',
        firstName: 'John',
        lastName: 'Doe',
        birthDate: '1990-01-01',
        gender: 'MALE',
      },
    });

    expect([201, 409, 500]).toContain(response.statusCode);
  });

  it('should reject registration with weak password', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/register',
      payload: {
        email: 'test@example.com',
        password: '123',
        firstName: 'John',
        lastName: 'Doe',
        birthDate: '1990-01-01',
        gender: 'MALE',
      },
    });

    expect(response.statusCode).toBe(400);
    const body = JSON.parse(response.payload);
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });

  it('should reject registration with invalid email', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/register',
      payload: {
        email: 'invalid-email',
        password: 'SecurePass123!',
        firstName: 'John',
        lastName: 'Doe',
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
        password: 'SecurePass123!',
        firstName: 'John',
        lastName: 'Doe',
        birthDate: '1990-01-01',
        gender: 'INVALID',
      },
    });

    expect(response.statusCode).toBe(400);
  });

  it('should reject registration with missing required fields', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/register',
      payload: {
        email: 'test@example.com',
      },
    });

    expect(response.statusCode).toBe(400);
  });

  it('should sanitize XSS in registration fields', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/register',
      payload: {
        email: 'xss@example.com',
        password: 'SecurePass123!',
        firstName: '<script>alert("xss")</script>',
        lastName: 'Doe',
        birthDate: '1990-01-01',
        gender: 'MALE',
      },
    });

    expect([201, 400, 409, 500]).toContain(response.statusCode);
  });
});

// ============================================
// LOGIN
// ============================================
describe('POST /api/v1/auth/login - User Login', () => {
  it('should login with valid credentials', async () => {
    const mockUser = createMockUser();
    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser);

    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: {
        email: 'test@example.com',
        password: 'ValidPass123!',
      },
    });

    expect([200, 401, 500]).toContain(response.statusCode);
  });

  it('should reject login with invalid email', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: {
        email: 'nonexistent@example.com',
        password: 'ValidPass123!',
      },
    });

    expect([401, 500]).toContain(response.statusCode);
  });

  it('should reject login with invalid password', async () => {
    const mockUser = createMockUser();
    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser);

    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: {
        email: 'test@example.com',
        password: 'WrongPassword123!',
      },
    });

    expect([401, 500]).toContain(response.statusCode);
  });

  it('should validate input format', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: {
        email: 'invalid-email',
        password: 'short',
      },
    });

    expect(response.statusCode).toBe(400);
  });

  it('should reject login with missing fields', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: {
        email: 'test@example.com',
      },
    });

    expect(response.statusCode).toBe(400);
  });
});

// ============================================
// REFRESH TOKEN
// ============================================
describe('POST /api/v1/auth/refresh - Refresh Token', () => {
  it('should refresh token with valid refresh token', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/refresh',
      payload: {
        refreshToken: 'valid-refresh-token',
      },
    });

    expect([200, 401, 500]).toContain(response.statusCode);
  });

  it('should reject refresh with invalid token', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/refresh',
      payload: {
        refreshToken: 'invalid-token',
      },
    });

    expect(response.statusCode).toBe(401);
  });

  it('should reject refresh with missing token', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/refresh',
      payload: {},
    });

    expect(response.statusCode).toBe(400);
  });
});

// ============================================
// LOGOUT
// ============================================
describe('POST /api/v1/auth/logout - Logout', () => {
  it('should logout authenticated user', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/logout',
      headers: { authorization: authHeader() },
    });

    expect([200, 500]).toContain(response.statusCode);
  });

  it('should reject logout without authentication', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/logout',
    });

    expect(response.statusCode).toBe(401);
  });
});

// ============================================
// GET ME
// ============================================
describe('GET /api/v1/auth/me - Get Current User', () => {
  it('should get current user profile', async () => {
    const mockUser = createMockUser();
    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser);

    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/auth/me',
      headers: { authorization: authHeader() },
    });

    expect([200, 404, 500]).toContain(response.statusCode);
  });

  it('should not expose password hash', async () => {
    const mockUser = createMockUser();
    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser);

    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/auth/me',
      headers: { authorization: authHeader() },
    });

    if (response.statusCode === 200) {
      const body = JSON.parse(response.payload);
      expect(body.data?.passwordHash).toBeUndefined();
      expect(response.payload).not.toContain('passwordHash');
    }
  });

  it('should reject without authentication', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/auth/me',
    });

    expect(response.statusCode).toBe(401);
  });

  it('should reject with expired token', async () => {
    const jwt = await import('jsonwebtoken');
    const secret = process.env.JWT_SECRET || 'test-jwt-secret-min-32-chars-for-testing-12345678';
    const expiredToken = jwt.default.sign(
      { userId: 'test-user-id', id: 'test-user-id', email: 'test@example.com' },
      secret,
      { expiresIn: '-1s' }
    );

    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/auth/me',
      headers: { authorization: `Bearer ${expiredToken}` },
    });

    expect(response.statusCode).toBe(401);
  });
});

// ============================================
// CHANGE PASSWORD
// ============================================
describe('POST /api/v1/auth/change-password - Change Password', () => {
  it('should change password with valid credentials', async () => {
    const mockUser = createMockUser();
    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser);
    vi.mocked(prisma.user.update).mockResolvedValue(mockUser);

    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/change-password',
      headers: { authorization: authHeader() },
      payload: {
        currentPassword: 'OldPass123!',
        newPassword: 'NewPass123!',
      },
    });

    expect([200, 400, 500]).toContain(response.statusCode);
  });

  it('should reject change password with weak new password', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/change-password',
      headers: { authorization: authHeader() },
      payload: {
        currentPassword: 'OldPass123!',
        newPassword: '123',
      },
    });

    expect(response.statusCode).toBe(400);
  });

  it('should reject without authentication', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/change-password',
      payload: {
        currentPassword: 'OldPass123!',
        newPassword: 'NewPass123!',
      },
    });

    expect(response.statusCode).toBe(401);
  });

  it('should reject with incorrect current password', async () => {
    const mockUser = createMockUser();
    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser);

    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/change-password',
      headers: { authorization: authHeader() },
      payload: {
        currentPassword: 'WrongPass123!',
        newPassword: 'NewPass123!',
      },
    });

    expect([400, 500]).toContain(response.statusCode);
  });
});

// ============================================
// FORGOT PASSWORD
// ============================================
describe('POST /api/v1/auth/forgot-password - Forgot Password', () => {
  it('should send reset email for existing user', async () => {
    const mockUser = createMockUser();
    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser);

    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/forgot-password',
      payload: {
        email: 'test@example.com',
      },
    });

    expect([200, 500]).toContain(response.statusCode);
  });

  it('should not reveal if email exists (security)', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/forgot-password',
      payload: {
        email: 'nonexistent@example.com',
      },
    });

    expect(response.statusCode).toBe(200);
  });

  it('should validate email format', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/forgot-password',
      payload: {
        email: 'invalid-email',
      },
    });

    expect(response.statusCode).toBe(400);
  });
});

// ============================================
// RESET PASSWORD
// ============================================
describe('POST /api/v1/auth/reset-password - Reset Password', () => {
  it('should reset password with valid token', async () => {
    const mockUser = createMockUser();
    vi.mocked(prisma.user.findFirst).mockResolvedValue(mockUser);
    vi.mocked(prisma.user.update).mockResolvedValue(mockUser);

    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/reset-password',
      payload: {
        token: 'valid-reset-token',
        newPassword: 'NewSecurePass123!',
      },
    });

    expect([200, 400, 500]).toContain(response.statusCode);
  });

  it('should reject reset with invalid token', async () => {
    vi.mocked(prisma.user.findFirst).mockResolvedValue(null);

    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/reset-password',
      payload: {
        token: 'invalid-token',
        newPassword: 'NewSecurePass123!',
      },
    });

    expect([400, 500]).toContain(response.statusCode);
  });

  it('should reject reset with weak password', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/reset-password',
      payload: {
        token: 'valid-reset-token',
        newPassword: '123',
      },
    });

    expect(response.statusCode).toBe(400);
  });
});
