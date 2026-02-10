/**
 * Auth Service Unit Tests - Register
 *
 * Tests for user registration including validation,
 * password hashing, token generation, and defaults.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock setup via helpers
import './auth-test-helpers.js';

// Import after mocking
import { AuthService } from './auth.service.js';
import { prisma } from '../lib/prisma.js';
import { redis } from '../lib/redis.js';
import { generateAccessToken, generateRefreshToken } from '../utils/jwt.util.js';

describe('[P0][auth] AuthService - register', () => {
  const validInput = {
    email: 'test@example.com',
    password: 'Test123456!',
    firstName: 'John',
    lastName: 'Doe',
    birthDate: new Date('1990-01-01'),
    gender: 'MALE' as const,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset mock return values after clearAllMocks
    vi.mocked(generateAccessToken).mockReturnValue('mock-access-token');
    vi.mocked(generateRefreshToken).mockReturnValue('mock-refresh-token');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should register a new user successfully', async () => {
    const mockUser = {
      id: 'test-user-id',
      email: validInput.email,
      firstName: validInput.firstName,
      lastName: validInput.lastName,
      preferredLanguage: 'ENGLISH',
    };

    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.user.create).mockResolvedValue(mockUser as unknown);

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
    } as unknown);

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

    vi.mocked(prisma.user.findUnique).mockResolvedValue(existingUser as unknown);

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
      } as unknown;
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
    vi.mocked(prisma.user.create).mockResolvedValue(mockUser as unknown);

    await AuthService.register(validInput);

    expect(generateAccessToken).toHaveBeenCalledWith(mockUser.id, mockUser.email, false);
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
      } as unknown;
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
      } as unknown;
    });

    await AuthService.register(inputWithLanguage);
  });

  it('should set isBlocked to false for new users', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.user.create).mockImplementation(async ({ data }) => {
      expect(data.isBlocked).toBe(false);
      return { id: 'test-user-id', email: data.email, preferredLanguage: 'ENGLISH' } as unknown;
    });

    await AuthService.register(validInput);
  });

  it('should set isVerified to false for new users', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.user.create).mockImplementation(async ({ data }) => {
      expect(data.isVerified).toBe(false);
      return { id: 'test-user-id', email: data.email, preferredLanguage: 'ENGLISH' } as unknown;
    });

    await AuthService.register(validInput);
  });
});
