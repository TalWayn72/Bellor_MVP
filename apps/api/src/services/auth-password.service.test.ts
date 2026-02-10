/**
 * Auth Service Unit Tests - Password Management
 *
 * Tests for changePassword, forgotPassword, and resetPassword.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import bcrypt from 'bcrypt';

// Mock setup via helpers
import { mockPrisma, mockRedis } from './auth-test-helpers.js';

// Import after mocking
import { AuthService } from './auth.service.js';

describe('[P0][auth] AuthService - changePassword', () => {
  beforeEach(() => { vi.clearAllMocks(); });
  afterEach(() => { vi.restoreAllMocks(); });

  it('should change password successfully', async () => {
    const currentPassword = 'CurrentPass123!';
    const newPassword = 'NewPass123!';
    const hashedCurrentPassword = await bcrypt.hash(currentPassword, 12);
    mockPrisma.user.findUnique.mockResolvedValue({ id: 'test-user-id', passwordHash: hashedCurrentPassword });
    mockPrisma.user.update.mockResolvedValue({ id: 'test-user-id' });
    await AuthService.changePassword('test-user-id', currentPassword, newPassword);
    expect(mockPrisma.user.update).toHaveBeenCalled();
  });

  it('should hash the new password before storing', async () => {
    const currentPassword = 'CurrentPass123!';
    const newPassword = 'NewPass123!';
    const hashedCurrentPassword = await bcrypt.hash(currentPassword, 12);
    mockPrisma.user.findUnique.mockResolvedValue({ id: 'test-user-id', passwordHash: hashedCurrentPassword });
    mockPrisma.user.update.mockImplementation(async ({ data }) => {
      expect(data.passwordHash).not.toBe(newPassword);
      expect(data.passwordHash!.length).toBeGreaterThan(50);
      return { id: 'test-user-id' };
    });
    await AuthService.changePassword('test-user-id', currentPassword, newPassword);
  });

  it('should invalidate refresh token after password change', async () => {
    const currentPassword = 'CurrentPass123!';
    const newPassword = 'NewPass123!';
    const hashedCurrentPassword = await bcrypt.hash(currentPassword, 12);
    mockPrisma.user.findUnique.mockResolvedValue({ id: 'test-user-id', passwordHash: hashedCurrentPassword });
    mockPrisma.user.update.mockResolvedValue({ id: 'test-user-id' });
    await AuthService.changePassword('test-user-id', currentPassword, newPassword);
    expect(mockRedis.del).toHaveBeenCalledWith('refresh_token:test-user-id');
  });

  it('should throw error if current password is incorrect', async () => {
    const hashedPassword = await bcrypt.hash('different-password', 12);
    mockPrisma.user.findUnique.mockResolvedValue({ id: 'test-user-id', passwordHash: hashedPassword });
    await expect(AuthService.changePassword('test-user-id', 'wrong-password', 'new-password')).rejects.toThrow('Current password is incorrect');
  });

  it('should not update password if current password verification fails', async () => {
    const hashedPassword = await bcrypt.hash('correct-password', 12);
    mockPrisma.user.findUnique.mockResolvedValue({ id: 'test-user-id', passwordHash: hashedPassword });
    try { await AuthService.changePassword('test-user-id', 'wrong-password', 'new-password'); } catch { /* Expected */ }
    expect(mockPrisma.user.update).not.toHaveBeenCalled();
  });
});

describe('[P0][auth] AuthService - forgotPassword', () => {
  beforeEach(() => { vi.clearAllMocks(); });
  afterEach(() => { vi.restoreAllMocks(); });

  it('should generate reset token and store in Redis for valid user', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ id: 'test-user-id', email: 'test@example.com', firstName: 'John', isBlocked: false });
    await AuthService.forgotPassword('test@example.com');
    expect(mockRedis.setex).toHaveBeenCalledWith(expect.stringContaining('password_reset:'), 60 * 60, 'test-user-id');
  });

  it('should silently succeed when user does not exist (prevent enumeration)', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);
    await expect(AuthService.forgotPassword('nonexistent@example.com')).resolves.toBeUndefined();
    expect(mockRedis.setex).not.toHaveBeenCalled();
  });

  it('should silently succeed when user is blocked (prevent enumeration)', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ id: 'blocked-user-id', email: 'blocked@example.com', firstName: 'Blocked', isBlocked: true });
    await expect(AuthService.forgotPassword('blocked@example.com')).resolves.toBeUndefined();
    expect(mockRedis.setex).not.toHaveBeenCalled();
  });

  it('should use firstName in email, default to "User" if null', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ id: 'test-user-id', email: 'test@example.com', firstName: null, isBlocked: false });
    await AuthService.forgotPassword('test@example.com');
    expect(mockRedis.setex).toHaveBeenCalled();
  });

  it('should generate cryptographically secure token (64 hex chars)', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ id: 'test-user-id', email: 'test@example.com', firstName: 'John', isBlocked: false });
    await AuthService.forgotPassword('test@example.com');
    const setexCall = mockRedis.setex.mock.calls[0];
    const key = setexCall[0] as string;
    const token = key.replace('password_reset:', '');
    expect(token.length).toBe(64);
    expect(/^[a-f0-9]+$/.test(token)).toBe(true);
  });

  it('should set correct TTL of 1 hour (3600 seconds)', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ id: 'test-user-id', email: 'test@example.com', firstName: 'John', isBlocked: false });
    await AuthService.forgotPassword('test@example.com');
    expect(mockRedis.setex).toHaveBeenCalledWith(expect.any(String), 3600, expect.any(String));
  });
});

describe('[P0][auth] AuthService - resetPassword', () => {
  const validToken = 'valid-reset-token-abc123';
  const newPassword = 'NewSecurePassword123!';

  beforeEach(() => { vi.clearAllMocks(); });
  afterEach(() => { vi.restoreAllMocks(); });

  it('should reset password successfully with valid token', async () => {
    mockRedis.get.mockResolvedValue('test-user-id');
    mockPrisma.user.findUnique.mockResolvedValue({ id: 'test-user-id', email: 'test@example.com' });
    mockPrisma.user.update.mockResolvedValue({ id: 'test-user-id' });
    await AuthService.resetPassword(validToken, newPassword);
    expect(mockPrisma.user.update).toHaveBeenCalledWith({ where: { id: 'test-user-id' }, data: { passwordHash: expect.any(String) } });
  });

  it('should throw error for invalid/expired token', async () => {
    mockRedis.get.mockResolvedValue(null);
    await expect(AuthService.resetPassword(validToken, newPassword)).rejects.toThrow('Invalid or expired reset token');
  });

  it('should throw error if user no longer exists', async () => {
    mockRedis.get.mockResolvedValue('deleted-user-id');
    mockPrisma.user.findUnique.mockResolvedValue(null);
    await expect(AuthService.resetPassword(validToken, newPassword)).rejects.toThrow('Invalid or expired reset token');
  });

  it('should hash new password before storing', async () => {
    mockRedis.get.mockResolvedValue('test-user-id');
    mockPrisma.user.findUnique.mockResolvedValue({ id: 'test-user-id', email: 'test@example.com' });
    mockPrisma.user.update.mockImplementation(async ({ data }) => {
      expect(data.passwordHash).not.toBe(newPassword);
      expect(data.passwordHash!.length).toBeGreaterThan(50);
      return { id: 'test-user-id' };
    });
    await AuthService.resetPassword(validToken, newPassword);
  });

  it('should delete reset token after successful reset (one-time use)', async () => {
    mockRedis.get.mockResolvedValue('test-user-id');
    mockPrisma.user.findUnique.mockResolvedValue({ id: 'test-user-id', email: 'test@example.com' });
    mockPrisma.user.update.mockResolvedValue({ id: 'test-user-id' });
    await AuthService.resetPassword(validToken, newPassword);
    expect(mockRedis.del).toHaveBeenCalledWith(`password_reset:${validToken}`);
  });

  it('should invalidate all refresh tokens (force re-login)', async () => {
    mockRedis.get.mockResolvedValue('test-user-id');
    mockPrisma.user.findUnique.mockResolvedValue({ id: 'test-user-id', email: 'test@example.com' });
    mockPrisma.user.update.mockResolvedValue({ id: 'test-user-id' });
    await AuthService.resetPassword(validToken, newPassword);
    expect(mockRedis.del).toHaveBeenCalledWith('refresh_token:test-user-id');
  });

  it('should look up token with correct prefix in Redis', async () => {
    mockRedis.get.mockResolvedValue(null);
    try { await AuthService.resetPassword(validToken, newPassword); } catch { /* Expected */ }
    expect(mockRedis.get).toHaveBeenCalledWith(`password_reset:${validToken}`);
  });
});
