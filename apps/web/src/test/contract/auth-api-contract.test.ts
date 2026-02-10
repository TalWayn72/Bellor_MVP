/**
 * Frontend Auth Service - Contract Tests
 * Verifies that frontend auth service parses API responses correctly
 * and validates them against shared Zod schemas
 *
 * @see PRD.md Section 10 - Phase 6 Testing
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  RegisterResponseSchema,
  LoginResponseSchema,
  UserResponseSchema,
  RegisterRequestSchema,
  LoginRequestSchema,
} from '@bellor/shared/schemas';
import { authService } from '../../api/services/authService';
import { apiClient } from '../../api/client/apiClient';
import { tokenStorage } from '../../api/client/tokenStorage';

vi.mock('../../api/client/apiClient');
vi.mock('../../api/client/tokenStorage');

beforeEach(() => {
  vi.clearAllMocks();
});

const mockUser = {
  id: 'test-user-id',
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User',
  nickname: 'testuser',
  bio: null,
  birthDate: '1990-01-01T00:00:00.000Z',
  gender: 'MALE',
  profileImages: [],
  drawingUrl: null,
  sketchMethod: null,
  location: null,
  phone: null,
  occupation: null,
  education: null,
  interests: [],
  preferredLanguage: 'ENGLISH',
  lookingFor: [],
  ageRangeMin: 18,
  ageRangeMax: 35,
  maxDistance: 50,
  showOnline: true,
  showDistance: true,
  showAge: true,
  privateProfile: false,
  doNotSell: false,
  notifyNewMatches: true,
  notifyNewMessages: true,
  notifyChatRequests: true,
  notifyDailyMissions: true,
  notifyEmail: true,
  isVerified: false,
  isBlocked: false,
  isPremium: false,
  isAdmin: false,
  premiumExpiresAt: null,
  lastActiveAt: '2024-06-01T00:00:00.000Z',
  responseCount: 0,
  chatCount: 0,
  missionCompletedCount: 0,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
};

const mockAuthResponse = {
  user: mockUser,
  accessToken: 'mock-access-token',
  refreshToken: 'mock-refresh-token',
};

// ============================================
// REGISTER - REQUEST/RESPONSE VALIDATION
// ============================================
describe('[P0][auth] register() - Request/Response Validation', () => {
  it('validates request data against RegisterRequestSchema', async () => {
    const registerData = {
      email: 'newuser@example.com',
      password: 'SecureP@ssw0rd',
      firstName: 'New',
      lastName: 'User',
      preferredLanguage: 'ENGLISH',
    };

    // Validate request against schema
    const requestResult = RegisterRequestSchema.safeParse({
      ...registerData,
      birthDate: '1990-01-01',
      gender: 'MALE',
    });
    expect(requestResult.success).toBe(true);

    vi.mocked(apiClient.post).mockResolvedValue({
      data: mockAuthResponse,
    } as any);

    const result = await authService.register(registerData);

    // Validate response against schema
    const responseResult = RegisterResponseSchema.safeParse(result);

    if (!responseResult.success) {
      // eslint-disable-next-line no-console
      console.error('Register response schema errors:', responseResult.error.errors);
    }

    expect(responseResult.success).toBe(true);
    expect(result.accessToken).toBe('mock-access-token');
    expect(result.refreshToken).toBe('mock-refresh-token');

    // Validate nested user object
    const userResult = UserResponseSchema.safeParse(result.user);
    expect(userResult.success).toBe(true);
  });

  it('rejects invalid register request data', async () => {
    const invalidRequests = [
      {
        email: 'not-an-email',
        password: 'SecureP@ssw0rd',
        firstName: 'Test',
        lastName: 'User',
        birthDate: '1990-01-01',
        gender: 'MALE',
      },
      {
        email: 'test@example.com',
        password: 'weak', // Too weak
        firstName: 'Test',
        lastName: 'User',
        birthDate: '1990-01-01',
        gender: 'MALE',
      },
      {
        email: 'test@example.com',
        password: 'SecureP@ssw0rd',
        firstName: '', // Empty
        lastName: 'User',
        birthDate: '1990-01-01',
        gender: 'MALE',
      },
    ];

    for (const invalidData of invalidRequests) {
      const requestResult = RegisterRequestSchema.safeParse(invalidData);
      expect(requestResult.success).toBe(false);
    }
  });

  it('rejects invalid register response data', async () => {
    const invalidResponse = {
      user: {
        id: 123, // Should be string
        email: 'not-an-email', // Invalid email
      },
      accessToken: 'token',
      refreshToken: 'refresh',
    };

    const responseResult = RegisterResponseSchema.safeParse(invalidResponse);
    expect(responseResult.success).toBe(false);
  });
});

// ============================================
// LOGIN - REQUEST/RESPONSE VALIDATION
// ============================================
describe('login() - Request/Response Validation', () => {
  it('validates request data against LoginRequestSchema', async () => {
    const loginData = {
      email: 'test@example.com',
      password: 'SecureP@ssw0rd',
    };

    // Validate request against schema
    const requestResult = LoginRequestSchema.safeParse(loginData);
    expect(requestResult.success).toBe(true);

    vi.mocked(apiClient.post).mockResolvedValue({
      data: mockAuthResponse,
    } as any);

    const result = await authService.login(loginData);

    // Validate response against schema
    const responseResult = LoginResponseSchema.safeParse(result);

    if (!responseResult.success) {
      // eslint-disable-next-line no-console
      console.error('Login response schema errors:', responseResult.error.errors);
    }

    expect(responseResult.success).toBe(true);
    expect(result.accessToken).toBe('mock-access-token');
    expect(result.refreshToken).toBe('mock-refresh-token');

    // Validate nested user object
    const userResult = UserResponseSchema.safeParse(result.user);
    expect(userResult.success).toBe(true);
  });

  it('rejects invalid login request data', async () => {
    const invalidRequests = [
      {
        email: 'not-an-email',
        password: 'password',
      },
      {
        email: 'test@example.com',
        password: '', // Empty
      },
    ];

    for (const invalidData of invalidRequests) {
      const requestResult = LoginRequestSchema.safeParse(invalidData);
      expect(requestResult.success).toBe(false);
    }
  });

  it('stores tokens after successful login', async () => {
    vi.mocked(apiClient.post).mockResolvedValue({
      data: mockAuthResponse,
    } as any);

    await authService.login({
      email: 'test@example.com',
      password: 'SecureP@ssw0rd',
    });

    expect(tokenStorage.setTokens).toHaveBeenCalledWith(
      'mock-access-token',
      'mock-refresh-token'
    );
    expect(tokenStorage.setUser).toHaveBeenCalledWith(mockUser);
  });
});

// ============================================
// GET CURRENT USER - RESPONSE VALIDATION
// ============================================
describe('getCurrentUser() - Response Validation', () => {
  it('validates response against UserResponseSchema', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      data: { data: mockUser },
    } as any);

    const user = await authService.getCurrentUser();

    // Validate against schema
    const schemaResult = UserResponseSchema.safeParse(user);

    if (!schemaResult.success) {
      // eslint-disable-next-line no-console
      console.error('User schema validation errors:', schemaResult.error.errors);
    }

    expect(schemaResult.success).toBe(true);
    expect(user.id).toBe('test-user-id');
    expect(user.email).toBe('test@example.com');
  });

  it('stores user after fetching', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      data: { data: mockUser },
    } as any);

    await authService.getCurrentUser();

    expect(tokenStorage.setUser).toHaveBeenCalledWith(mockUser);
  });
});

// ============================================
// REFRESH TOKEN - RESPONSE VALIDATION
// ============================================
describe('refreshToken() - Response Validation', () => {
  it('validates response and updates access token', async () => {
    vi.mocked(tokenStorage.getRefreshToken).mockReturnValue('mock-refresh-token');
    vi.mocked(apiClient.post).mockResolvedValue({
      data: { accessToken: 'new-access-token' },
    } as any);

    const result = await authService.refreshToken();

    expect(result.accessToken).toBe('new-access-token');
    expect(tokenStorage.setAccessToken).toHaveBeenCalledWith('new-access-token');
  });

  it('throws error when no refresh token available', async () => {
    vi.mocked(tokenStorage.getRefreshToken).mockReturnValue(null);

    await expect(authService.refreshToken()).rejects.toThrow('No refresh token available');
  });
});

// ============================================
// LOGOUT - CLEANUP VALIDATION
// ============================================
describe('logout() - Cleanup Validation', () => {
  it('clears tokens after logout', async () => {
    vi.mocked(apiClient.post).mockResolvedValue({} as any);

    await authService.logout();

    expect(tokenStorage.clearTokens).toHaveBeenCalled();
  });
});

// ============================================
// PASSWORD VALIDATION
// ============================================
describe('Password Validation', () => {
  it('enforces strong password requirements in register', () => {
    const weakPasswords = [
      'short', // Too short
      'alllowercase123!', // No uppercase
      'ALLUPPERCASE123!', // No lowercase
      'NoNumbers!', // No numbers
      'NoSpecialChar123', // No special characters
    ];

    for (const password of weakPasswords) {
      const result = RegisterRequestSchema.safeParse({
        email: 'test@example.com',
        password,
        firstName: 'Test',
        lastName: 'User',
        birthDate: '1990-01-01',
        gender: 'MALE',
      });

      expect(result.success).toBe(false);
    }
  });

  it('accepts strong passwords in register', () => {
    const strongPasswords = [
      'SecureP@ssw0rd',
      'MyP@ssw0rd123',
      'C0mpl3x!Pass',
    ];

    for (const password of strongPasswords) {
      const result = RegisterRequestSchema.safeParse({
        email: 'test@example.com',
        password,
        firstName: 'Test',
        lastName: 'User',
        birthDate: '1990-01-01',
        gender: 'MALE',
      });

      expect(result.success).toBe(true);
    }
  });
});

// ============================================
// ENUM VALIDATION
// ============================================
describe('Enum Validation', () => {
  it('validates gender enum in registration', () => {
    const validGenders = ['MALE', 'FEMALE', 'NON_BINARY', 'OTHER'];

    for (const gender of validGenders) {
      const result = RegisterRequestSchema.safeParse({
        email: 'test@example.com',
        password: 'SecureP@ssw0rd',
        firstName: 'Test',
        lastName: 'User',
        birthDate: '1990-01-01',
        gender,
      });

      expect(result.success).toBe(true);
    }
  });

  it('validates language enum in registration', () => {
    const validLanguages = ['ENGLISH', 'HEBREW', 'SPANISH', 'GERMAN', 'FRENCH'];

    for (const language of validLanguages) {
      const result = RegisterRequestSchema.safeParse({
        email: 'test@example.com',
        password: 'SecureP@ssw0rd',
        firstName: 'Test',
        lastName: 'User',
        birthDate: '1990-01-01',
        gender: 'MALE',
        preferredLanguage: language,
      });

      expect(result.success).toBe(true);
    }
  });
});

// ============================================
// FIELD NAMING CONSISTENCY
// ============================================
describe('Field Naming Consistency', () => {
  it('uses camelCase for all auth response fields', async () => {
    vi.mocked(apiClient.post).mockResolvedValue({
      data: mockAuthResponse,
    } as any);

    const result = await authService.login({
      email: 'test@example.com',
      password: 'SecureP@ssw0rd',
    });

    // Check that response has camelCase keys
    expect(result).toHaveProperty('accessToken');
    expect(result).toHaveProperty('refreshToken');
    expect(result.user).toHaveProperty('firstName');
    expect(result.user).toHaveProperty('lastName');

    // Check that response does NOT have snake_case keys
    expect(result).not.toHaveProperty('access_token');
    expect(result).not.toHaveProperty('refresh_token');
    expect(result.user).not.toHaveProperty('first_name');
    expect(result.user).not.toHaveProperty('last_name');
  });
});

// ============================================
// ERROR HANDLING
// ============================================
describe('Error Handling', () => {
  it('handles API errors in login', async () => {
    vi.mocked(apiClient.post).mockRejectedValue(new Error('Invalid credentials'));

    await expect(
      authService.login({
        email: 'test@example.com',
        password: 'wrong-password',
      })
    ).rejects.toThrow('Invalid credentials');
  });

  it('handles API errors in register', async () => {
    vi.mocked(apiClient.post).mockRejectedValue(new Error('Email already exists'));

    await expect(
      authService.register({
        email: 'existing@example.com',
        password: 'SecureP@ssw0rd',
        firstName: 'Test',
        lastName: 'User',
      })
    ).rejects.toThrow('Email already exists');
  });

  it('handles network errors', async () => {
    vi.mocked(apiClient.post).mockRejectedValue(new Error('Network error'));

    await expect(
      authService.login({
        email: 'test@example.com',
        password: 'SecureP@ssw0rd',
      })
    ).rejects.toThrow('Network error');
  });
});
