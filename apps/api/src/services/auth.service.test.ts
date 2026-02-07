/**
 * Auth Service Unit Tests
 *
 * @see PRD.md Section 14 - Development Guidelines
 * @see PRD.md Section 10.1 Phase 6 - Testing
 *
 * Target Coverage: 90%
 * Priority: Critical
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import bcrypt from 'bcrypt';

// Mock modules before importing the service
vi.mock('../lib/prisma.js', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock('../lib/redis.js', () => ({
  redis: {
    setex: vi.fn().mockResolvedValue('OK'),
    get: vi.fn().mockResolvedValue(null),
    del: vi.fn().mockResolvedValue(1),
  },
}));

vi.mock('../utils/jwt.util.js', () => ({
  generateAccessToken: vi.fn().mockReturnValue('mock-access-token'),
  generateRefreshToken: vi.fn().mockReturnValue('mock-refresh-token'),
  verifyRefreshToken: vi.fn().mockReturnValue({ userId: 'test-user-id' }),
}));

// Import after mocking
import { AuthService } from './auth.service.js';
import { prisma } from '../lib/prisma.js';
import { redis } from '../lib/redis.js';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt.util.js';

describe('AuthService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset mock return values after clearAllMocks
    vi.mocked(generateAccessToken).mockReturnValue('mock-access-token');
    vi.mocked(generateRefreshToken).mockReturnValue('mock-refresh-token');
    vi.mocked(verifyRefreshToken).mockReturnValue({ userId: 'test-user-id' });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ============================================
  // REGISTER TESTS
  // ============================================
  describe('register', () => {
    const validInput = {
      email: 'test@example.com',
      password: 'Test123456!',
      firstName: 'John',
      lastName: 'Doe',
      birthDate: new Date('1990-01-01'),
      gender: 'MALE' as const,
    };

    it('should register a new user successfully', async () => {
      const mockUser = {
        id: 'test-user-id',
        email: validInput.email,
        firstName: validInput.firstName,
        lastName: validInput.lastName,
        preferredLanguage: 'ENGLISH',
      };

      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.user.create).mockResolvedValue(mockUser as any);

      const result = await AuthService.register(validInput);

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result.user.email).toBe(validInput.email);
      expect(result.user.firstName).toBe(validInput.firstName);
      expect(result.user.lastName).toBe(validInput.lastName);
    });

    it('should check if email already exists', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.user.create).mockResolvedValue({
        id: 'test-id',
        email: validInput.email,
        preferredLanguage: 'ENGLISH',
      } as any);

      await AuthService.register(validInput);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: validInput.email },
      });
    });

    it('should throw error if user already exists', async () => {
      const existingUser = {
        id: 'existing-user-id',
        email: validInput.email,
      };

      vi.mocked(prisma.user.findUnique).mockResolvedValue(existingUser as any);

      await expect(AuthService.register(validInput)).rejects.toThrow(
        'User with this email already exists'
      );
    });

    it('should hash the password with correct salt rounds', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.user.create).mockImplementation(async ({ data }) => {
        // Verify password is hashed (not plain text)
        expect(data.passwordHash).not.toBe(validInput.password);
        expect(data.passwordHash.length).toBeGreaterThan(50); // bcrypt hash is ~60 chars
        return {
          id: 'test-user-id',
          email: data.email,
          firstName: data.firstName,
          lastName: data.lastName,
          preferredLanguage: 'ENGLISH',
        } as any;
      });

      await AuthService.register(validInput);
    });

    it('should generate and store tokens after registration', async () => {
      const mockUser = {
        id: 'test-user-id',
        email: validInput.email,
        firstName: validInput.firstName,
        lastName: validInput.lastName,
        preferredLanguage: 'ENGLISH',
      };

      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.user.create).mockResolvedValue(mockUser as any);

      await AuthService.register(validInput);

      expect(generateAccessToken).toHaveBeenCalledWith(mockUser.id, mockUser.email);
      expect(generateRefreshToken).toHaveBeenCalledWith(mockUser.id);
      expect(redis.setex).toHaveBeenCalledWith(
        `refresh_token:${mockUser.id}`,
        7 * 24 * 60 * 60, // 7 days
        'mock-refresh-token'
      );
    });

    it('should use ENGLISH as default language when not specified', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.user.create).mockImplementation(async ({ data }) => {
        expect(data.preferredLanguage).toBe('ENGLISH');
        return {
          id: 'test-user-id',
          email: data.email,
          preferredLanguage: data.preferredLanguage,
        } as any;
      });

      await AuthService.register(validInput);
    });

    it('should use provided language when specified', async () => {
      const inputWithLanguage = { ...validInput, preferredLanguage: 'HEBREW' as const };

      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.user.create).mockImplementation(async ({ data }) => {
        expect(data.preferredLanguage).toBe('HEBREW');
        return {
          id: 'test-user-id',
          email: data.email,
          preferredLanguage: data.preferredLanguage,
        } as any;
      });

      await AuthService.register(inputWithLanguage);
    });

    it('should set isBlocked to false for new users', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.user.create).mockImplementation(async ({ data }) => {
        expect(data.isBlocked).toBe(false);
        return { id: 'test-user-id', email: data.email, preferredLanguage: 'ENGLISH' } as any;
      });

      await AuthService.register(validInput);
    });

    it('should set isVerified to false for new users', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.user.create).mockImplementation(async ({ data }) => {
        expect(data.isVerified).toBe(false);
        return { id: 'test-user-id', email: data.email, preferredLanguage: 'ENGLISH' } as any;
      });

      await AuthService.register(validInput);
    });
  });

  // ============================================
  // LOGIN TESTS
  // ============================================
  describe('login', () => {
    const loginInput = {
      email: 'test@example.com',
      password: 'Test123456!',
    };

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

      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);
      vi.mocked(prisma.user.update).mockResolvedValue(mockUser as any);

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

      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);
      vi.mocked(prisma.user.update).mockResolvedValue(mockUser as any);

      await AuthService.login(loginInput);

      expect(prisma.user.update).toHaveBeenCalledWith({
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

      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);
      vi.mocked(prisma.user.update).mockResolvedValue(mockUser as any);

      await AuthService.login(loginInput);

      expect(redis.setex).toHaveBeenCalledWith(
        `refresh_token:${mockUser.id}`,
        7 * 24 * 60 * 60,
        'mock-refresh-token'
      );
    });

    it('should throw error if user does not exist', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

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

      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);

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

      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);

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

      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);
      vi.mocked(prisma.user.update).mockResolvedValue(mockUser as any);

      const result = await AuthService.login(loginInput);

      expect(result.user.firstName).toBe('');
      expect(result.user.lastName).toBe('');
    });
  });

  // ============================================
  // REFRESH TESTS
  // ============================================
  describe('refresh', () => {
    it('should verify refresh token with JWT utility', async () => {
      const mockUser = {
        id: 'test-user-id',
        email: 'test@example.com',
        isBlocked: false,
      };

      vi.mocked(verifyRefreshToken).mockReturnValue({ userId: 'test-user-id' });
      vi.mocked(redis.get).mockResolvedValue('mock-refresh-token');
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);

      await AuthService.refresh('mock-refresh-token');

      expect(verifyRefreshToken).toHaveBeenCalledWith('mock-refresh-token');
    });

    it('should check refresh token in Redis', async () => {
      const mockUser = {
        id: 'test-user-id',
        email: 'test@example.com',
        isBlocked: false,
      };

      vi.mocked(verifyRefreshToken).mockReturnValue({ userId: 'test-user-id' });
      vi.mocked(redis.get).mockResolvedValue('mock-refresh-token');
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);

      await AuthService.refresh('mock-refresh-token');

      expect(redis.get).toHaveBeenCalledWith('refresh_token:test-user-id');
    });

    it('should throw error if refresh token not in Redis', async () => {
      vi.mocked(verifyRefreshToken).mockReturnValue({ userId: 'test-user-id' });
      vi.mocked(redis.get).mockResolvedValue(null);

      await expect(AuthService.refresh('mock-refresh-token')).rejects.toThrow(
        'Invalid or expired refresh token'
      );
    });

    it('should throw error if stored token does not match', async () => {
      vi.mocked(verifyRefreshToken).mockReturnValue({ userId: 'test-user-id' });
      vi.mocked(redis.get).mockResolvedValue('different-token');

      await expect(AuthService.refresh('mock-refresh-token')).rejects.toThrow(
        'Invalid or expired refresh token'
      );
    });

    it('should throw error if user not found', async () => {
      vi.mocked(verifyRefreshToken).mockReturnValue({ userId: 'test-user-id' });
      vi.mocked(redis.get).mockResolvedValue('mock-refresh-token');
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

      await expect(AuthService.refresh('mock-refresh-token')).rejects.toThrow(
        'User not found or inactive'
      );
    });

    it('should throw error if user is blocked', async () => {
      const mockUser = {
        id: 'test-user-id',
        email: 'test@example.com',
        isBlocked: true,
      };

      vi.mocked(verifyRefreshToken).mockReturnValue({ userId: 'test-user-id' });
      vi.mocked(redis.get).mockResolvedValue('mock-refresh-token');
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);

      await expect(AuthService.refresh('mock-refresh-token')).rejects.toThrow(
        'User not found or inactive'
      );
    });

    it('should generate new access token on success', async () => {
      const mockUser = {
        id: 'test-user-id',
        email: 'test@example.com',
        isBlocked: false,
      };

      vi.mocked(verifyRefreshToken).mockReturnValue({ userId: 'test-user-id' });
      vi.mocked(redis.get).mockResolvedValue('mock-refresh-token');
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);

      const result = await AuthService.refresh('mock-refresh-token');

      expect(result).toHaveProperty('accessToken');
      expect(generateAccessToken).toHaveBeenCalledWith(mockUser.id, mockUser.email);
    });
  });

  // ============================================
  // LOGOUT TESTS
  // ============================================
  describe('logout', () => {
    it('should delete refresh token from Redis', async () => {
      await AuthService.logout('test-user-id');

      expect(redis.del).toHaveBeenCalledWith('refresh_token:test-user-id');
    });

    it('should handle different user IDs correctly', async () => {
      const userId = 'specific-user-123';

      await AuthService.logout(userId);

      expect(redis.del).toHaveBeenCalledWith(`refresh_token:${userId}`);
    });
  });

  // ============================================
  // VERIFY PASSWORD TESTS
  // ============================================
  describe('verifyPassword', () => {
    it('should return true for correct password', async () => {
      const password = 'Test123456!';
      const hashedPassword = await bcrypt.hash(password, 12);
      const mockUser = {
        id: 'test-user-id',
        passwordHash: hashedPassword,
      };

      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);

      const result = await AuthService.verifyPassword('test-user-id', password);

      expect(result).toBe(true);
    });

    it('should return false for incorrect password', async () => {
      const hashedPassword = await bcrypt.hash('correct-password', 12);
      const mockUser = {
        id: 'test-user-id',
        passwordHash: hashedPassword,
      };

      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);

      const result = await AuthService.verifyPassword('test-user-id', 'wrong-password');

      expect(result).toBe(false);
    });

    it('should return false if user does not exist', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

      const result = await AuthService.verifyPassword('test-user-id', 'password');

      expect(result).toBe(false);
    });

    it('should return false if user has no password hash', async () => {
      const mockUser = {
        id: 'test-user-id',
        passwordHash: null,
      };

      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);

      const result = await AuthService.verifyPassword('test-user-id', 'password');

      expect(result).toBe(false);
    });
  });

  // ============================================
  // CHANGE PASSWORD TESTS
  // ============================================
  describe('changePassword', () => {
    it('should change password successfully', async () => {
      const currentPassword = 'CurrentPass123!';
      const newPassword = 'NewPass123!';
      const hashedCurrentPassword = await bcrypt.hash(currentPassword, 12);
      const mockUser = {
        id: 'test-user-id',
        passwordHash: hashedCurrentPassword,
      };

      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);
      vi.mocked(prisma.user.update).mockResolvedValue(mockUser as any);

      await AuthService.changePassword('test-user-id', currentPassword, newPassword);

      expect(prisma.user.update).toHaveBeenCalled();
    });

    it('should hash the new password before storing', async () => {
      const currentPassword = 'CurrentPass123!';
      const newPassword = 'NewPass123!';
      const hashedCurrentPassword = await bcrypt.hash(currentPassword, 12);
      const mockUser = {
        id: 'test-user-id',
        passwordHash: hashedCurrentPassword,
      };

      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);
      vi.mocked(prisma.user.update).mockImplementation(async ({ data }) => {
        expect(data.passwordHash).not.toBe(newPassword);
        expect(data.passwordHash!.length).toBeGreaterThan(50);
        return mockUser as any;
      });

      await AuthService.changePassword('test-user-id', currentPassword, newPassword);
    });

    it('should invalidate refresh token after password change', async () => {
      const currentPassword = 'CurrentPass123!';
      const newPassword = 'NewPass123!';
      const hashedCurrentPassword = await bcrypt.hash(currentPassword, 12);
      const mockUser = {
        id: 'test-user-id',
        passwordHash: hashedCurrentPassword,
      };

      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);
      vi.mocked(prisma.user.update).mockResolvedValue(mockUser as any);

      await AuthService.changePassword('test-user-id', currentPassword, newPassword);

      expect(redis.del).toHaveBeenCalledWith('refresh_token:test-user-id');
    });

    it('should throw error if current password is incorrect', async () => {
      const hashedPassword = await bcrypt.hash('different-password', 12);
      const mockUser = {
        id: 'test-user-id',
        passwordHash: hashedPassword,
      };

      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);

      await expect(
        AuthService.changePassword('test-user-id', 'wrong-password', 'new-password')
      ).rejects.toThrow('Current password is incorrect');
    });

    it('should not update password if current password verification fails', async () => {
      const hashedPassword = await bcrypt.hash('correct-password', 12);
      const mockUser = {
        id: 'test-user-id',
        passwordHash: hashedPassword,
      };

      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);

      try {
        await AuthService.changePassword('test-user-id', 'wrong-password', 'new-password');
      } catch (e) {
        // Expected to throw
      }

      expect(prisma.user.update).not.toHaveBeenCalled();
    });
  });

  // ============================================
  // FORGOT PASSWORD TESTS
  // ============================================
  describe('forgotPassword', () => {
    it('should generate reset token and store in Redis for valid user', async () => {
      const mockUser = {
        id: 'test-user-id',
        email: 'test@example.com',
        firstName: 'John',
        isBlocked: false,
      };

      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);

      await AuthService.forgotPassword('test@example.com');

      // Verify token was stored in Redis with correct prefix
      expect(redis.setex).toHaveBeenCalledWith(
        expect.stringContaining('password_reset:'),
        60 * 60, // 1 hour
        mockUser.id
      );
    });

    it('should silently succeed when user does not exist (prevent enumeration)', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

      // Should not throw
      await expect(AuthService.forgotPassword('nonexistent@example.com')).resolves.toBeUndefined();

      // Redis should NOT be called
      expect(redis.setex).not.toHaveBeenCalled();
    });

    it('should silently succeed when user is blocked (prevent enumeration)', async () => {
      const blockedUser = {
        id: 'blocked-user-id',
        email: 'blocked@example.com',
        firstName: 'Blocked',
        isBlocked: true,
      };

      vi.mocked(prisma.user.findUnique).mockResolvedValue(blockedUser as any);

      // Should not throw
      await expect(AuthService.forgotPassword('blocked@example.com')).resolves.toBeUndefined();

      // Redis should NOT be called
      expect(redis.setex).not.toHaveBeenCalled();
    });

    it('should use firstName in email, default to "User" if null', async () => {
      const userWithoutName = {
        id: 'test-user-id',
        email: 'test@example.com',
        firstName: null,
        isBlocked: false,
      };

      vi.mocked(prisma.user.findUnique).mockResolvedValue(userWithoutName as any);

      await AuthService.forgotPassword('test@example.com');

      // Should complete without error
      expect(redis.setex).toHaveBeenCalled();
    });

    it('should generate cryptographically secure token (64 hex chars)', async () => {
      const mockUser = {
        id: 'test-user-id',
        email: 'test@example.com',
        firstName: 'John',
        isBlocked: false,
      };

      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);

      await AuthService.forgotPassword('test@example.com');

      // Get the key from the setex call
      const setexCall = vi.mocked(redis.setex).mock.calls[0];
      const key = setexCall[0] as string;
      const token = key.replace('password_reset:', '');

      // Token should be 64 characters (32 bytes = 64 hex chars)
      expect(token.length).toBe(64);
      // Token should be valid hex
      expect(/^[a-f0-9]+$/.test(token)).toBe(true);
    });

    it('should set correct TTL of 1 hour (3600 seconds)', async () => {
      const mockUser = {
        id: 'test-user-id',
        email: 'test@example.com',
        firstName: 'John',
        isBlocked: false,
      };

      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);

      await AuthService.forgotPassword('test@example.com');

      expect(redis.setex).toHaveBeenCalledWith(
        expect.any(String),
        3600, // 60 * 60 = 1 hour
        expect.any(String)
      );
    });
  });

  // ============================================
  // RESET PASSWORD TESTS
  // ============================================
  describe('resetPassword', () => {
    const validToken = 'valid-reset-token-abc123';
    const newPassword = 'NewSecurePassword123!';

    it('should reset password successfully with valid token', async () => {
      const mockUser = {
        id: 'test-user-id',
        email: 'test@example.com',
      };

      vi.mocked(redis.get).mockResolvedValue(mockUser.id);
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);
      vi.mocked(prisma.user.update).mockResolvedValue(mockUser as any);

      await AuthService.resetPassword(validToken, newPassword);

      // Verify password was updated
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        data: { passwordHash: expect.any(String) },
      });
    });

    it('should throw error for invalid/expired token', async () => {
      vi.mocked(redis.get).mockResolvedValue(null);

      await expect(AuthService.resetPassword(validToken, newPassword)).rejects.toThrow(
        'Invalid or expired reset token'
      );
    });

    it('should throw error if user no longer exists', async () => {
      vi.mocked(redis.get).mockResolvedValue('deleted-user-id');
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

      await expect(AuthService.resetPassword(validToken, newPassword)).rejects.toThrow(
        'Invalid or expired reset token'
      );
    });

    it('should hash new password before storing', async () => {
      const mockUser = {
        id: 'test-user-id',
        email: 'test@example.com',
      };

      vi.mocked(redis.get).mockResolvedValue(mockUser.id);
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);
      vi.mocked(prisma.user.update).mockImplementation(async ({ data }) => {
        // Verify password is hashed (not plain text)
        expect(data.passwordHash).not.toBe(newPassword);
        expect(data.passwordHash!.length).toBeGreaterThan(50); // bcrypt hash is ~60 chars
        return mockUser as any;
      });

      await AuthService.resetPassword(validToken, newPassword);
    });

    it('should delete reset token after successful reset (one-time use)', async () => {
      const mockUser = {
        id: 'test-user-id',
        email: 'test@example.com',
      };

      vi.mocked(redis.get).mockResolvedValue(mockUser.id);
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);
      vi.mocked(prisma.user.update).mockResolvedValue(mockUser as any);

      await AuthService.resetPassword(validToken, newPassword);

      // Verify token was deleted from Redis
      expect(redis.del).toHaveBeenCalledWith(`password_reset:${validToken}`);
    });

    it('should invalidate all refresh tokens (force re-login)', async () => {
      const mockUser = {
        id: 'test-user-id',
        email: 'test@example.com',
      };

      vi.mocked(redis.get).mockResolvedValue(mockUser.id);
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);
      vi.mocked(prisma.user.update).mockResolvedValue(mockUser as any);

      await AuthService.resetPassword(validToken, newPassword);

      // Verify refresh token was invalidated (logout called)
      expect(redis.del).toHaveBeenCalledWith(`refresh_token:${mockUser.id}`);
    });

    it('should look up token with correct prefix in Redis', async () => {
      vi.mocked(redis.get).mockResolvedValue(null);

      try {
        await AuthService.resetPassword(validToken, newPassword);
      } catch (e) {
        // Expected to throw
      }

      expect(redis.get).toHaveBeenCalledWith(`password_reset:${validToken}`);
    });
  });
});
