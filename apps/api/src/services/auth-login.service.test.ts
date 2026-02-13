/**
 * Auth Service Unit Tests - Login & Logout
 *
 * Tests for login authentication, session management,
 * and logout functionality.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import bcrypt from 'bcrypt';

// Mock setup via helpers
import { mockPrisma, mockRedis, setupAuthMocks } from './auth-test-helpers.js';

// Import after mocking
import { AuthService } from './auth.service.js';

describe('[P0][auth] AuthService - login', () => {
  const loginInput = {
    email: 'test@example.com',
    password: 'Test123456!',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    setupAuthMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should login successfully with valid credentials', async () => {
    const hashedPassword = await bcrypt.hash(loginInput.password, 12);
    const mockUser = {
      id: 'test-user-id',
      email: loginInput.email,
      passwordHash: hashedPassword,
      firstName: 'John',
      lastName: 'Doe',
      preferredLanguage: 'ENGLISH',
      isBlocked: false,
    };

    mockPrisma.user.findUnique.mockResolvedValue(mockUser);
    mockPrisma.user.update.mockResolvedValue(mockUser);

    const result = await AuthService.login(loginInput);

    expect(result).toHaveProperty('user');
    expect(result).toHaveProperty('accessToken');
    expect(result).toHaveProperty('refreshToken');
    expect(result.user.email).toBe(loginInput.email);
  });

  it('should update lastActiveAt on successful login', async () => {
    const hashedPassword = await bcrypt.hash(loginInput.password, 12);
    const mockUser = {
      id: 'test-user-id',
      email: loginInput.email,
      passwordHash: hashedPassword,
      isBlocked: false,
      preferredLanguage: 'ENGLISH',
    };

    mockPrisma.user.findUnique.mockResolvedValue(mockUser);
    mockPrisma.user.update.mockResolvedValue(mockUser);

    await AuthService.login(loginInput);

    expect(mockPrisma.user.update).toHaveBeenCalledWith({
      where: { id: mockUser.id },
      data: { lastActiveAt: expect.any(Date) },
    });
  });

  it('should store refresh token in Redis on successful login', async () => {
    const hashedPassword = await bcrypt.hash(loginInput.password, 12);
    const mockUser = {
      id: 'test-user-id',
      email: loginInput.email,
      passwordHash: hashedPassword,
      isBlocked: false,
      preferredLanguage: 'ENGLISH',
    };

    mockPrisma.user.findUnique.mockResolvedValue(mockUser);
    mockPrisma.user.update.mockResolvedValue(mockUser);

    await AuthService.login(loginInput);

    expect(mockRedis.setex).toHaveBeenCalledWith(
      `refresh_token:${mockUser.id}`,
      7 * 24 * 60 * 60,
      'mock-refresh-token'
    );
  });

  it('should throw error if user does not exist', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);

    await expect(AuthService.login(loginInput)).rejects.toThrow(
      'Invalid email or password'
    );
  });

  it('should throw error if password is incorrect', async () => {
    const mockUser = {
      id: 'test-user-id',
      email: loginInput.email,
      passwordHash: await bcrypt.hash('different-password', 12),
      isBlocked: false,
    };

    mockPrisma.user.findUnique.mockResolvedValue(mockUser);

    await expect(AuthService.login(loginInput)).rejects.toThrow(
      'Invalid email or password'
    );
  });

  it('should throw error if user is blocked', async () => {
    const hashedPassword = await bcrypt.hash(loginInput.password, 12);
    const mockUser = {
      id: 'test-user-id',
      email: loginInput.email,
      passwordHash: hashedPassword,
      isBlocked: true,
    };

    mockPrisma.user.findUnique.mockResolvedValue(mockUser);

    await expect(AuthService.login(loginInput)).rejects.toThrow(
      'Account is deactivated'
    );
  });

  it('should return empty strings for null firstName/lastName', async () => {
    const hashedPassword = await bcrypt.hash(loginInput.password, 12);
    const mockUser = {
      id: 'test-user-id',
      email: loginInput.email,
      passwordHash: hashedPassword,
      firstName: null,
      lastName: null,
      isBlocked: false,
      preferredLanguage: 'ENGLISH',
    };

    mockPrisma.user.findUnique.mockResolvedValue(mockUser);
    mockPrisma.user.update.mockResolvedValue(mockUser);

    const result = await AuthService.login(loginInput);

    expect(result.user.firstName).toBe('');
    expect(result.user.lastName).toBe('');
  });
});

describe('[P0][auth] AuthService - logout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupAuthMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should delete refresh token from Redis', async () => {
    await AuthService.logout('test-user-id');

    expect(mockRedis.del).toHaveBeenCalledWith('refresh_token:test-user-id');
  });

  it('should handle different user IDs correctly', async () => {
    const userId = 'specific-user-123';

    await AuthService.logout(userId);

    expect(mockRedis.del).toHaveBeenCalledWith(`refresh_token:${userId}`);
  });
});
