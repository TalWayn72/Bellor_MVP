/**
 * Auth Service Unit Tests - Refresh Tokens & Password Verification
 *
 * Tests for refresh tokens and verifyPassword functionality.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import bcrypt from 'bcrypt';

// Mock setup via helpers
import { prismaMock, redisMock, jwtMock, setupAuthMocks } from './auth-test-helpers.js';

// Import after mocking
import { AuthService } from './auth.service.js';

describe('[P0][auth] AuthService - refresh', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupAuthMocks();
  });

  afterEach(() => { vi.restoreAllMocks(); });

  it('should verify refresh token with JWT utility', async () => {
    const mockUser = { id: 'test-user-id', email: 'test@example.com', isBlocked: false };
    redisMock.get.mockResolvedValue('mock-refresh-token');
    prismaMock.user.findUnique.mockResolvedValue(mockUser as unknown);
    await AuthService.refresh('mock-refresh-token');
    expect(jwtMock.verifyRefreshToken).toHaveBeenCalledWith('mock-refresh-token');
  });

  it('should check refresh token in Redis', async () => {
    const mockUser = { id: 'test-user-id', email: 'test@example.com', isBlocked: false };
    redisMock.get.mockResolvedValue('mock-refresh-token');
    prismaMock.user.findUnique.mockResolvedValue(mockUser as unknown);
    await AuthService.refresh('mock-refresh-token');
    expect(redisMock.get).toHaveBeenCalledWith('refresh_token:test-user-id');
  });

  it('should throw error if refresh token not in Redis', async () => {
    redisMock.get.mockResolvedValue(null);
    await expect(AuthService.refresh('mock-refresh-token')).rejects.toThrow('Invalid or expired refresh token');
  });

  it('should throw error if stored token does not match', async () => {
    redisMock.get.mockResolvedValue('different-token');
    await expect(AuthService.refresh('mock-refresh-token')).rejects.toThrow('Invalid or expired refresh token');
  });

  it('should throw error if user not found', async () => {
    redisMock.get.mockResolvedValue('mock-refresh-token');
    prismaMock.user.findUnique.mockResolvedValue(null);
    await expect(AuthService.refresh('mock-refresh-token')).rejects.toThrow('User not found or inactive');
  });

  it('should throw error if user is blocked', async () => {
    redisMock.get.mockResolvedValue('mock-refresh-token');
    prismaMock.user.findUnique.mockResolvedValue({ id: 'test-user-id', email: 'test@example.com', isBlocked: true } as unknown);
    await expect(AuthService.refresh('mock-refresh-token')).rejects.toThrow('User not found or inactive');
  });

  it('should generate new access token on success', async () => {
    const mockUser = { id: 'test-user-id', email: 'test@example.com', isBlocked: false, isAdmin: false };
    redisMock.get.mockResolvedValue('mock-refresh-token');
    prismaMock.user.findUnique.mockResolvedValue(mockUser as unknown);
    const result = await AuthService.refresh('mock-refresh-token');
    expect(result).toHaveProperty('accessToken');
    expect(jwtMock.generateAccessToken).toHaveBeenCalledWith(mockUser.id, mockUser.email, mockUser.isAdmin);
  });
});

describe('[P0][auth] AuthService - verifyPassword', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupAuthMocks();
  });
  afterEach(() => { vi.restoreAllMocks(); });

  it('should return true for correct password', async () => {
    const password = 'Test123456!';
    const hashedPassword = await bcrypt.hash(password, 12);
    prismaMock.user.findUnique.mockResolvedValue({ id: 'test-user-id', passwordHash: hashedPassword } as unknown);
    const result = await AuthService.verifyPassword('test-user-id', password);
    expect(result).toBe(true);
  });

  it('should return false for incorrect password', async () => {
    const hashedPassword = await bcrypt.hash('correct-password', 12);
    prismaMock.user.findUnique.mockResolvedValue({ id: 'test-user-id', passwordHash: hashedPassword } as unknown);
    const result = await AuthService.verifyPassword('test-user-id', 'wrong-password');
    expect(result).toBe(false);
  });

  it('should return false if user does not exist', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);
    const result = await AuthService.verifyPassword('test-user-id', 'password');
    expect(result).toBe(false);
  });

  it('should return false if user has no password hash', async () => {
    prismaMock.user.findUnique.mockResolvedValue({ id: 'test-user-id', passwordHash: null } as unknown);
    const result = await AuthService.verifyPassword('test-user-id', 'password');
    expect(result).toBe(false);
  });
});
