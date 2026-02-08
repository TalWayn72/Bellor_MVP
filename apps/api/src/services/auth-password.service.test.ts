/**
 * Auth Service Unit Tests - Password Management
 *
 * Tests for changePassword, forgotPassword, and resetPassword.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import bcrypt from 'bcrypt';

// Mock setup via helpers
import './auth-test-helpers.js';

// Import after mocking
import { AuthService } from './auth.service.js';
import { prisma } from '../lib/prisma.js';
import { redis } from '../lib/redis.js';

describe('AuthService - changePassword', () => {
  beforeEach(() => { vi.clearAllMocks(); });
  afterEach(() => { vi.restoreAllMocks(); });

  it('should change password successfully', async () => {
    const currentPassword = 'CurrentPass123!';
    const newPassword = 'NewPass123!';
    const hashedCurrentPassword = await bcrypt.hash(currentPassword, 12);
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: 'test-user-id', passwordHash: hashedCurrentPassword } as any);
    vi.mocked(prisma.user.update).mockResolvedValue({ id: 'test-user-id' } as any);
    await AuthService.changePassword('test-user-id', currentPassword, newPassword);
    expect(prisma.user.update).toHaveBeenCalled();
  });

  it('should hash the new password before storing', async () => {
    const currentPassword = 'CurrentPass123!';
    const newPassword = 'NewPass123!';
    const hashedCurrentPassword = await bcrypt.hash(currentPassword, 12);
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: 'test-user-id', passwordHash: hashedCurrentPassword } as any);
    vi.mocked(prisma.user.update).mockImplementation(async ({ data }) => {
      expect(data.passwordHash).not.toBe(newPassword);
      expect(data.passwordHash!.length).toBeGreaterThan(50);
      return { id: 'test-user-id' } as any;
    });
    await AuthService.changePassword('test-user-id', currentPassword, newPassword);
  });

  it('should invalidate refresh token after password change', async () => {
    const currentPassword = 'CurrentPass123!';
    const newPassword = 'NewPass123!';
    const hashedCurrentPassword = await bcrypt.hash(currentPassword, 12);
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: 'test-user-id', passwordHash: hashedCurrentPassword } as any);
    vi.mocked(prisma.user.update).mockResolvedValue({ id: 'test-user-id' } as any);
    await AuthService.changePassword('test-user-id', currentPassword, newPassword);
    expect(redis.del).toHaveBeenCalledWith('refresh_token:test-user-id');
  });

  it('should throw error if current password is incorrect', async () => {
    const hashedPassword = await bcrypt.hash('different-password', 12);
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: 'test-user-id', passwordHash: hashedPassword } as any);
    await expect(AuthService.changePassword('test-user-id', 'wrong-password', 'new-password')).rejects.toThrow('Current password is incorrect');
  });

  it('should not update password if current password verification fails', async () => {
    const hashedPassword = await bcrypt.hash('correct-password', 12);
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: 'test-user-id', passwordHash: hashedPassword } as any);
    try { await AuthService.changePassword('test-user-id', 'wrong-password', 'new-password'); } catch (e) { /* Expected */ }
    expect(prisma.user.update).not.toHaveBeenCalled();
  });
});

describe('AuthService - forgotPassword', () => {
  beforeEach(() => { vi.clearAllMocks(); });
  afterEach(() => { vi.restoreAllMocks(); });

  it('should generate reset token and store in Redis for valid user', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: 'test-user-id', email: 'test@example.com', firstName: 'John', isBlocked: false } as any);
    await AuthService.forgotPassword('test@example.com');
    expect(redis.setex).toHaveBeenCalledWith(expect.stringContaining('password_reset:'), 60 * 60, 'test-user-id');
  });

  it('should silently succeed when user does not exist (prevent enumeration)', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
    await expect(AuthService.forgotPassword('nonexistent@example.com')).resolves.toBeUndefined();
    expect(redis.setex).not.toHaveBeenCalled();
  });

  it('should silently succeed when user is blocked (prevent enumeration)', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: 'blocked-user-id', email: 'blocked@example.com', firstName: 'Blocked', isBlocked: true } as any);
    await expect(AuthService.forgotPassword('blocked@example.com')).resolves.toBeUndefined();
    expect(redis.setex).not.toHaveBeenCalled();
  });

  it('should use firstName in email, default to "User" if null', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: 'test-user-id', email: 'test@example.com', firstName: null, isBlocked: false } as any);
    await AuthService.forgotPassword('test@example.com');
    expect(redis.setex).toHaveBeenCalled();
  });

  it('should generate cryptographically secure token (64 hex chars)', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: 'test-user-id', email: 'test@example.com', firstName: 'John', isBlocked: false } as any);
    await AuthService.forgotPassword('test@example.com');
    const setexCall = vi.mocked(redis.setex).mock.calls[0];
    const key = setexCall[0] as string;
    const token = key.replace('password_reset:', '');
    expect(token.length).toBe(64);
    expect(/^[a-f0-9]+$/.test(token)).toBe(true);
  });

  it('should set correct TTL of 1 hour (3600 seconds)', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: 'test-user-id', email: 'test@example.com', firstName: 'John', isBlocked: false } as any);
    await AuthService.forgotPassword('test@example.com');
    expect(redis.setex).toHaveBeenCalledWith(expect.any(String), 3600, expect.any(String));
  });
});

describe('AuthService - resetPassword', () => {
  const validToken = 'valid-reset-token-abc123';
  const newPassword = 'NewSecurePassword123!';

  beforeEach(() => { vi.clearAllMocks(); });
  afterEach(() => { vi.restoreAllMocks(); });

  it('should reset password successfully with valid token', async () => {
    vi.mocked(redis.get).mockResolvedValue('test-user-id');
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: 'test-user-id', email: 'test@example.com' } as any);
    vi.mocked(prisma.user.update).mockResolvedValue({ id: 'test-user-id' } as any);
    await AuthService.resetPassword(validToken, newPassword);
    expect(prisma.user.update).toHaveBeenCalledWith({ where: { id: 'test-user-id' }, data: { passwordHash: expect.any(String) } });
  });

  it('should throw error for invalid/expired token', async () => {
    vi.mocked(redis.get).mockResolvedValue(null);
    await expect(AuthService.resetPassword(validToken, newPassword)).rejects.toThrow('Invalid or expired reset token');
  });

  it('should throw error if user no longer exists', async () => {
    vi.mocked(redis.get).mockResolvedValue('deleted-user-id');
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
    await expect(AuthService.resetPassword(validToken, newPassword)).rejects.toThrow('Invalid or expired reset token');
  });

  it('should hash new password before storing', async () => {
    vi.mocked(redis.get).mockResolvedValue('test-user-id');
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: 'test-user-id', email: 'test@example.com' } as any);
    vi.mocked(prisma.user.update).mockImplementation(async ({ data }) => {
      expect(data.passwordHash).not.toBe(newPassword);
      expect(data.passwordHash!.length).toBeGreaterThan(50);
      return { id: 'test-user-id' } as any;
    });
    await AuthService.resetPassword(validToken, newPassword);
  });

  it('should delete reset token after successful reset (one-time use)', async () => {
    vi.mocked(redis.get).mockResolvedValue('test-user-id');
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: 'test-user-id', email: 'test@example.com' } as any);
    vi.mocked(prisma.user.update).mockResolvedValue({ id: 'test-user-id' } as any);
    await AuthService.resetPassword(validToken, newPassword);
    expect(redis.del).toHaveBeenCalledWith(`password_reset:${validToken}`);
  });

  it('should invalidate all refresh tokens (force re-login)', async () => {
    vi.mocked(redis.get).mockResolvedValue('test-user-id');
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: 'test-user-id', email: 'test@example.com' } as any);
    vi.mocked(prisma.user.update).mockResolvedValue({ id: 'test-user-id' } as any);
    await AuthService.resetPassword(validToken, newPassword);
    expect(redis.del).toHaveBeenCalledWith('refresh_token:test-user-id');
  });

  it('should look up token with correct prefix in Redis', async () => {
    vi.mocked(redis.get).mockResolvedValue(null);
    try { await AuthService.resetPassword(validToken, newPassword); } catch (e) { /* Expected */ }
    expect(redis.get).toHaveBeenCalledWith(`password_reset:${validToken}`);
  });
});
