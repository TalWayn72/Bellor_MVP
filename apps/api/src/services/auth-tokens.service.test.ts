/**
 * Auth Service Unit Tests - Refresh Tokens & Password Verification
 *
 * Tests for refresh tokens and verifyPassword functionality.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import bcrypt from 'bcrypt';

// Mock setup via helpers
import './auth-test-helpers.js';

// Import after mocking
import { AuthService } from './auth.service.js';
import { prisma } from '../lib/prisma.js';
import { redis } from '../lib/redis.js';
import { generateAccessToken, verifyRefreshToken } from '../utils/jwt.util.js';

describe('AuthService - refresh', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(generateAccessToken).mockReturnValue('mock-access-token');
    vi.mocked(verifyRefreshToken).mockReturnValue({ userId: 'test-user-id' });
  });

  afterEach(() => { vi.restoreAllMocks(); });

  it('should verify refresh token with JWT utility', async () => {
    const mockUser = { id: 'test-user-id', email: 'test@example.com', isBlocked: false };
    vi.mocked(redis.get).mockResolvedValue('mock-refresh-token');
    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);
    await AuthService.refresh('mock-refresh-token');
    expect(verifyRefreshToken).toHaveBeenCalledWith('mock-refresh-token');
  });

  it('should check refresh token in Redis', async () => {
    const mockUser = { id: 'test-user-id', email: 'test@example.com', isBlocked: false };
    vi.mocked(redis.get).mockResolvedValue('mock-refresh-token');
    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);
    await AuthService.refresh('mock-refresh-token');
    expect(redis.get).toHaveBeenCalledWith('refresh_token:test-user-id');
  });

  it('should throw error if refresh token not in Redis', async () => {
    vi.mocked(redis.get).mockResolvedValue(null);
    await expect(AuthService.refresh('mock-refresh-token')).rejects.toThrow('Invalid or expired refresh token');
  });

  it('should throw error if stored token does not match', async () => {
    vi.mocked(redis.get).mockResolvedValue('different-token');
    await expect(AuthService.refresh('mock-refresh-token')).rejects.toThrow('Invalid or expired refresh token');
  });

  it('should throw error if user not found', async () => {
    vi.mocked(redis.get).mockResolvedValue('mock-refresh-token');
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
    await expect(AuthService.refresh('mock-refresh-token')).rejects.toThrow('User not found or inactive');
  });

  it('should throw error if user is blocked', async () => {
    vi.mocked(redis.get).mockResolvedValue('mock-refresh-token');
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: 'test-user-id', email: 'test@example.com', isBlocked: true } as any);
    await expect(AuthService.refresh('mock-refresh-token')).rejects.toThrow('User not found or inactive');
  });

  it('should generate new access token on success', async () => {
    const mockUser = { id: 'test-user-id', email: 'test@example.com', isBlocked: false, isAdmin: false };
    vi.mocked(redis.get).mockResolvedValue('mock-refresh-token');
    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);
    const result = await AuthService.refresh('mock-refresh-token');
    expect(result).toHaveProperty('accessToken');
    expect(generateAccessToken).toHaveBeenCalledWith(mockUser.id, mockUser.email, mockUser.isAdmin);
  });
});

describe('AuthService - verifyPassword', () => {
  beforeEach(() => { vi.clearAllMocks(); });
  afterEach(() => { vi.restoreAllMocks(); });

  it('should return true for correct password', async () => {
    const password = 'Test123456!';
    const hashedPassword = await bcrypt.hash(password, 12);
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: 'test-user-id', passwordHash: hashedPassword } as any);
    const result = await AuthService.verifyPassword('test-user-id', password);
    expect(result).toBe(true);
  });

  it('should return false for incorrect password', async () => {
    const hashedPassword = await bcrypt.hash('correct-password', 12);
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: 'test-user-id', passwordHash: hashedPassword } as any);
    const result = await AuthService.verifyPassword('test-user-id', 'wrong-password');
    expect(result).toBe(false);
  });

  it('should return false if user does not exist', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
    const result = await AuthService.verifyPassword('test-user-id', 'password');
    expect(result).toBe(false);
  });

  it('should return false if user has no password hash', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: 'test-user-id', passwordHash: null } as any);
    const result = await AuthService.verifyPassword('test-user-id', 'password');
    expect(result).toBe(false);
  });
});
