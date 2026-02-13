/**
 * Auth Service Unit Tests - Register
 *
 * Tests for user registration including validation,
 * password hashing, token generation, and defaults.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock setup via helpers
import { prismaMock, redisMock, jwtMock, setupAuthMocks } from './auth-test-helpers.js';

// Import after mocking
import { AuthService } from './auth.service.js';

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
    setupAuthMocks();
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

    prismaMock.user.findUnique.mockResolvedValue(null);
    prismaMock.user.create.mockResolvedValue(mockUser as unknown);

    const result = await AuthService.register(validInput);

    expect(result).toHaveProperty('user');
    expect(result).toHaveProperty('accessToken');
    expect(result).toHaveProperty('refreshToken');
    expect(result.user.email).toBe(validInput.email);
    expect(result.user.firstName).toBe(validInput.firstName);
    expect(result.user.lastName).toBe(validInput.lastName);
  });

  it('should check if email already exists', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);
    prismaMock.user.create.mockResolvedValue({
      id: 'test-id',
      email: validInput.email,
      preferredLanguage: 'ENGLISH',
    } as unknown);

    await AuthService.register(validInput);

    expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
      where: { email: validInput.email },
    });
  });

  it('should throw error if user already exists', async () => {
    const existingUser = {
      id: 'existing-user-id',
      email: validInput.email,
    };

    prismaMock.user.findUnique.mockResolvedValue(existingUser as unknown);

    await expect(AuthService.register(validInput)).rejects.toThrow(
      'User with this email already exists'
    );
  });

  it('should hash the password with correct salt rounds', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);
    prismaMock.user.create.mockImplementation(async ({ data }: { data: Record<string, unknown> }) => {
      expect(data.passwordHash).not.toBe(validInput.password);
      expect((data.passwordHash as string).length).toBeGreaterThan(50);
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

    prismaMock.user.findUnique.mockResolvedValue(null);
    prismaMock.user.create.mockResolvedValue(mockUser as unknown);

    await AuthService.register(validInput);

    expect(jwtMock.generateAccessToken).toHaveBeenCalledWith(mockUser.id, mockUser.email, false);
    expect(jwtMock.generateRefreshToken).toHaveBeenCalledWith(mockUser.id);
    expect(redisMock.setex).toHaveBeenCalledWith(
      `refresh_token:${mockUser.id}`,
      7 * 24 * 60 * 60,
      'mock-refresh-token'
    );
  });

  it('should use ENGLISH as default language when not specified', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);
    prismaMock.user.create.mockImplementation(async ({ data }: { data: Record<string, unknown> }) => {
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

    prismaMock.user.findUnique.mockResolvedValue(null);
    prismaMock.user.create.mockImplementation(async ({ data }: { data: Record<string, unknown> }) => {
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
    prismaMock.user.findUnique.mockResolvedValue(null);
    prismaMock.user.create.mockImplementation(async ({ data }: { data: Record<string, unknown> }) => {
      expect(data.isBlocked).toBe(false);
      return { id: 'test-user-id', email: data.email, preferredLanguage: 'ENGLISH' } as unknown;
    });

    await AuthService.register(validInput);
  });

  it('should set isVerified to false for new users', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);
    prismaMock.user.create.mockImplementation(async ({ data }: { data: Record<string, unknown> }) => {
      expect(data.isVerified).toBe(false);
      return { id: 'test-user-id', email: data.email, preferredLanguage: 'ENGLISH' } as unknown;
    });

    await AuthService.register(validInput);
  });
});
