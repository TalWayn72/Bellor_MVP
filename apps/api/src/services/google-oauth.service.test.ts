/**
 * Google OAuth Service Unit Tests
 *
 * Comprehensive tests for the Google OAuth authentication flow,
 * covering configuration checks, authorization URL generation,
 * and the full callback handling pipeline.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ============================================
// Mock Setup - must come before service import
// ============================================

// Mock google-auth-library
const mockGenerateAuthUrl = vi.fn();
const mockGetToken = vi.fn();
const mockSetCredentials = vi.fn();

const mockOAuth2ClientInstance = {
  generateAuthUrl: mockGenerateAuthUrl,
  getToken: mockGetToken,
  setCredentials: mockSetCredentials,
};

vi.mock('google-auth-library', () => ({
  OAuth2Client: vi.fn(),
}));

// Mock env config
vi.mock('../config/env.js', () => ({
  env: {
    GOOGLE_CLIENT_ID: 'test-client-id',
    GOOGLE_CLIENT_SECRET: 'test-client-secret',
    GOOGLE_REDIRECT_URI: 'http://localhost:3000/api/v1/oauth/google/callback',
  },
}));

// Mock prisma
vi.mock('../lib/prisma.js', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  },
}));

// Mock redis
vi.mock('../lib/redis.js', () => ({
  redis: {
    setex: vi.fn().mockResolvedValue('OK'),
    get: vi.fn().mockResolvedValue(null),
    del: vi.fn().mockResolvedValue(1),
  },
}));

// Mock JWT utils
vi.mock('../utils/jwt.util.js', () => ({
  generateAccessToken: vi.fn().mockReturnValue('mock-access-token'),
  generateRefreshToken: vi.fn().mockReturnValue('mock-refresh-token'),
}));

// Mock global fetch for Google userinfo API calls
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

// Import after mocking
import { GoogleOAuthService } from './google-oauth.service.js';
import { OAuth2Client } from 'google-auth-library';
import { env } from '../config/env.js';
import { prisma } from '../lib/prisma.js';
import { redis } from '../lib/redis.js';
import { generateAccessToken, generateRefreshToken } from '../utils/jwt.util.js';

// ============================================
// Shared Test Fixtures
// ============================================

const createGoogleUserInfo = (overrides: Partial<GoogleUserInfoFixture> = {}): GoogleUserInfoFixture => ({
  id: 'google-user-123',
  email: 'testuser@gmail.com',
  verified_email: true,
  name: 'Test User',
  given_name: 'Test',
  family_name: 'User',
  picture: 'https://lh3.googleusercontent.com/photo.jpg',
  ...overrides,
});

interface GoogleUserInfoFixture {
  id: string;
  email: string;
  verified_email: boolean;
  name: string;
  given_name: string;
  family_name: string;
  picture: string;
}

const createMockDbUser = (overrides: Record<string, unknown> = {}) => ({
  id: 'db-user-id-1',
  email: 'testuser@gmail.com',
  firstName: 'Test',
  lastName: 'User',
  googleId: 'google-user-123',
  isBlocked: false,
  isVerified: true,
  isAdmin: false,
  preferredLanguage: 'ENGLISH',
  profileImages: ['https://lh3.googleusercontent.com/photo.jpg'],
  lastActiveAt: new Date(),
  ...overrides,
});

/**
 * Helper: configure mockFetch to return a Google userinfo response
 */
function mockGoogleUserInfoResponse(userInfo: GoogleUserInfoFixture): void {
  mockFetch.mockResolvedValueOnce({
    ok: true,
    json: () => Promise.resolve(userInfo),
  });
}

/**
 * Helper: configure mockGetToken to return tokens from Google
 */
function mockGoogleTokenExchange(): void {
  mockGetToken.mockResolvedValueOnce({
    tokens: {
      access_token: 'google-access-token-xyz',
      refresh_token: 'google-refresh-token-xyz',
      id_token: 'google-id-token-xyz',
    },
  });
}

// ============================================
// Tests
// ============================================

describe('[P0][auth] GoogleOAuthService', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Reset the static client to ensure fresh OAuth2Client per test
     
    (GoogleOAuthService as Record<string, unknown>)['client'] = null;

    // Re-establish OAuth2Client constructor mock after clearAllMocks
    vi.mocked(OAuth2Client).mockImplementation(() => mockOAuth2ClientInstance as unknown as OAuth2Client);

    // Reset default mock return values after clearAllMocks
    vi.mocked(generateAccessToken).mockReturnValue('mock-access-token');
    vi.mocked(generateRefreshToken).mockReturnValue('mock-refresh-token');
    vi.mocked(redis.setex).mockResolvedValue('OK' as never);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ==========================================
  // isConfigured
  // ==========================================

  describe('isConfigured', () => {
    it('should return true when all OAuth env vars are set', () => {
      // env is already mocked with all values set
      const result = GoogleOAuthService.isConfigured();
      expect(result).toBe(true);
    });

    it('should return false when GOOGLE_CLIENT_ID is missing', () => {
      const originalId = env.GOOGLE_CLIENT_ID;
      // Temporarily clear the value
      Object.defineProperty(env, 'GOOGLE_CLIENT_ID', {
        value: '',
        writable: true,
        configurable: true,
      });

      const result = GoogleOAuthService.isConfigured();
      expect(result).toBe(false);

      // Restore
      Object.defineProperty(env, 'GOOGLE_CLIENT_ID', {
        value: originalId,
        writable: true,
        configurable: true,
      });
    });

    it('should return false when GOOGLE_CLIENT_SECRET is missing', () => {
      const originalSecret = env.GOOGLE_CLIENT_SECRET;
      Object.defineProperty(env, 'GOOGLE_CLIENT_SECRET', {
        value: '',
        writable: true,
        configurable: true,
      });

      const result = GoogleOAuthService.isConfigured();
      expect(result).toBe(false);

      Object.defineProperty(env, 'GOOGLE_CLIENT_SECRET', {
        value: originalSecret,
        writable: true,
        configurable: true,
      });
    });

    it('should return false when GOOGLE_REDIRECT_URI is missing', () => {
      const originalUri = env.GOOGLE_REDIRECT_URI;
      Object.defineProperty(env, 'GOOGLE_REDIRECT_URI', {
        value: '',
        writable: true,
        configurable: true,
      });

      const result = GoogleOAuthService.isConfigured();
      expect(result).toBe(false);

      Object.defineProperty(env, 'GOOGLE_REDIRECT_URI', {
        value: originalUri,
        writable: true,
        configurable: true,
      });
    });

    it('should return false when GOOGLE_CLIENT_ID is undefined', () => {
      const originalId = env.GOOGLE_CLIENT_ID;
      Object.defineProperty(env, 'GOOGLE_CLIENT_ID', {
        value: undefined,
        writable: true,
        configurable: true,
      });

      const result = GoogleOAuthService.isConfigured();
      expect(result).toBe(false);

      Object.defineProperty(env, 'GOOGLE_CLIENT_ID', {
        value: originalId,
        writable: true,
        configurable: true,
      });
    });
  });

  // ==========================================
  // getAuthorizationUrl
  // ==========================================

  describe('getAuthorizationUrl', () => {
    it('should return a valid Google OAuth URL', () => {
      const mockUrl = 'https://accounts.google.com/o/oauth2/v2/auth?client_id=test';
      mockGenerateAuthUrl.mockReturnValue(mockUrl);

      const url = GoogleOAuthService.getAuthorizationUrl();

      expect(url).toBe(mockUrl);
      expect(mockGenerateAuthUrl).toHaveBeenCalledOnce();
    });

    it('should include required scopes for email and profile', () => {
      mockGenerateAuthUrl.mockReturnValue('https://accounts.google.com/auth');

      GoogleOAuthService.getAuthorizationUrl();

      expect(mockGenerateAuthUrl).toHaveBeenCalledWith(
        expect.objectContaining({
          scope: [
            'https://www.googleapis.com/auth/userinfo.email',
            'https://www.googleapis.com/auth/userinfo.profile',
          ],
        })
      );
    });

    it('should include access_type offline for refresh tokens', () => {
      mockGenerateAuthUrl.mockReturnValue('https://accounts.google.com/auth');

      GoogleOAuthService.getAuthorizationUrl();

      expect(mockGenerateAuthUrl).toHaveBeenCalledWith(
        expect.objectContaining({
          access_type: 'offline',
        })
      );
    });

    it('should include prompt consent to force re-authorization', () => {
      mockGenerateAuthUrl.mockReturnValue('https://accounts.google.com/auth');

      GoogleOAuthService.getAuthorizationUrl();

      expect(mockGenerateAuthUrl).toHaveBeenCalledWith(
        expect.objectContaining({
          prompt: 'consent',
        })
      );
    });

    it('should pass state parameter when provided', () => {
      mockGenerateAuthUrl.mockReturnValue('https://accounts.google.com/auth');

      GoogleOAuthService.getAuthorizationUrl('custom-state-value');

      expect(mockGenerateAuthUrl).toHaveBeenCalledWith(
        expect.objectContaining({
          state: 'custom-state-value',
        })
      );
    });

    it('should pass empty string as state when no state provided', () => {
      mockGenerateAuthUrl.mockReturnValue('https://accounts.google.com/auth');

      GoogleOAuthService.getAuthorizationUrl();

      expect(mockGenerateAuthUrl).toHaveBeenCalledWith(
        expect.objectContaining({
          state: '',
        })
      );
    });
  });

  // ==========================================
  // handleCallback
  // ==========================================

  describe('handleCallback', () => {
    // ------------------------------------------
    // Successful new user creation
    // ------------------------------------------

    describe('new user creation', () => {
      it('should create a new user when Google email is not in the system', async () => {
        const googleUser = createGoogleUserInfo();
        const createdUser = createMockDbUser({ id: 'new-user-id' });

        mockGoogleTokenExchange();
        mockGoogleUserInfoResponse(googleUser);
        vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
        vi.mocked(prisma.user.create).mockResolvedValue(createdUser as never);

        const result = await GoogleOAuthService.handleCallback('auth-code-123');

        expect(result.isNewUser).toBe(true);
        expect(result.user.email).toBe(googleUser.email);
        expect(result.user.id).toBe('new-user-id');
        expect(prisma.user.create).toHaveBeenCalledWith({
          data: expect.objectContaining({
            email: googleUser.email,
            firstName: googleUser.given_name,
            lastName: googleUser.family_name,
            googleId: googleUser.id,
            isVerified: true,
            isBlocked: false,
            preferredLanguage: 'ENGLISH',
            gender: 'OTHER',
          }),
        });
      });

      it('should use Google profile picture for new user', async () => {
        const googleUser = createGoogleUserInfo();

        mockGoogleTokenExchange();
        mockGoogleUserInfoResponse(googleUser);
        vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
        vi.mocked(prisma.user.create).mockResolvedValue(createMockDbUser() as never);

        await GoogleOAuthService.handleCallback('auth-code-123');

        expect(prisma.user.create).toHaveBeenCalledWith({
          data: expect.objectContaining({
            profileImages: [googleUser.picture],
          }),
        });
      });

      it('should set empty profileImages when Google provides no picture', async () => {
        const googleUser = createGoogleUserInfo({ picture: '' });

        mockGoogleTokenExchange();
        mockGoogleUserInfoResponse(googleUser);
        vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
        vi.mocked(prisma.user.create).mockResolvedValue(
          createMockDbUser({ profileImages: [] }) as never
        );

        await GoogleOAuthService.handleCallback('auth-code-123');

        expect(prisma.user.create).toHaveBeenCalledWith({
          data: expect.objectContaining({
            profileImages: [],
          }),
        });
      });

      it('should set default birthDate for new users (to be updated in onboarding)', async () => {
        const googleUser = createGoogleUserInfo();

        mockGoogleTokenExchange();
        mockGoogleUserInfoResponse(googleUser);
        vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
        vi.mocked(prisma.user.create).mockResolvedValue(createMockDbUser() as never);

        await GoogleOAuthService.handleCallback('auth-code-123');

        expect(prisma.user.create).toHaveBeenCalledWith({
          data: expect.objectContaining({
            birthDate: new Date('1990-01-01'),
          }),
        });
      });

      it('should parse name into firstName and lastName when given_name/family_name are missing', async () => {
        const googleUser = createGoogleUserInfo({
          given_name: '',
          family_name: '',
          name: 'John Michael Doe',
        });

        mockGoogleTokenExchange();
        mockGoogleUserInfoResponse(googleUser);
        vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
        vi.mocked(prisma.user.create).mockResolvedValue(createMockDbUser() as never);

        await GoogleOAuthService.handleCallback('auth-code-123');

        expect(prisma.user.create).toHaveBeenCalledWith({
          data: expect.objectContaining({
            firstName: 'John',
            lastName: 'Michael Doe',
          }),
        });
      });
    });

    // ------------------------------------------
    // Existing user linking
    // ------------------------------------------

    describe('existing user linking', () => {
      it('should link Google account to existing user with same email', async () => {
        const googleUser = createGoogleUserInfo();
        const existingUser = createMockDbUser({ googleId: null });
        const updatedUser = createMockDbUser();

        mockGoogleTokenExchange();
        mockGoogleUserInfoResponse(googleUser);
        vi.mocked(prisma.user.findUnique).mockResolvedValue(existingUser as never);
        vi.mocked(prisma.user.update).mockResolvedValue(updatedUser as never);

        const result = await GoogleOAuthService.handleCallback('auth-code-123');

        expect(result.isNewUser).toBe(false);
        // Should update the user with Google ID
        expect(prisma.user.update).toHaveBeenCalledWith({
          where: { id: existingUser.id },
          data: {
            googleId: googleUser.id,
            isVerified: true,
          },
        });
      });

      it('should not overwrite existing googleId if already set', async () => {
        const googleUser = createGoogleUserInfo();
        const existingUser = createMockDbUser({ googleId: 'already-linked-google-id' });

        mockGoogleTokenExchange();
        mockGoogleUserInfoResponse(googleUser);
        vi.mocked(prisma.user.findUnique).mockResolvedValue(existingUser as never);
        vi.mocked(prisma.user.update).mockResolvedValue(existingUser as never);

        await GoogleOAuthService.handleCallback('auth-code-123');

        // Should only update lastActiveAt, NOT the googleId
        expect(prisma.user.update).toHaveBeenCalledWith({
          where: { id: existingUser.id },
          data: { lastActiveAt: expect.any(Date) },
        });
        // Should NOT have been called with googleId update
        expect(prisma.user.update).not.toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({ googleId: googleUser.id }),
          })
        );
      });

      it('should update lastActiveAt for returning users', async () => {
        const googleUser = createGoogleUserInfo();
        const existingUser = createMockDbUser({ googleId: 'existing-google-id' });

        mockGoogleTokenExchange();
        mockGoogleUserInfoResponse(googleUser);
        vi.mocked(prisma.user.findUnique).mockResolvedValue(existingUser as never);
        vi.mocked(prisma.user.update).mockResolvedValue(existingUser as never);

        await GoogleOAuthService.handleCallback('auth-code-123');

        expect(prisma.user.update).toHaveBeenCalledWith({
          where: { id: existingUser.id },
          data: { lastActiveAt: expect.any(Date) },
        });
      });

      it('should preserve existing isVerified=true even if Google returns unverified', async () => {
        const googleUser = createGoogleUserInfo({ verified_email: false });
        const existingUser = createMockDbUser({
          googleId: null,
          isVerified: true,
        });
        const updatedUser = createMockDbUser({ isVerified: true });

        mockGoogleTokenExchange();
        mockGoogleUserInfoResponse(googleUser);
        vi.mocked(prisma.user.findUnique).mockResolvedValue(existingUser as never);
        vi.mocked(prisma.user.update).mockResolvedValue(updatedUser as never);

        await GoogleOAuthService.handleCallback('auth-code-123');

        // isVerified should be true (existing || google) = true || false = true
        expect(prisma.user.update).toHaveBeenCalledWith({
          where: { id: existingUser.id },
          data: expect.objectContaining({
            isVerified: true,
          }),
        });
      });
    });

    // ------------------------------------------
    // Token generation
    // ------------------------------------------

    describe('token generation', () => {
      it('should return access and refresh tokens on success', async () => {
        const googleUser = createGoogleUserInfo();
        const dbUser = createMockDbUser();

        mockGoogleTokenExchange();
        mockGoogleUserInfoResponse(googleUser);
        vi.mocked(prisma.user.findUnique).mockResolvedValue(dbUser as never);
        vi.mocked(prisma.user.update).mockResolvedValue(dbUser as never);

        const result = await GoogleOAuthService.handleCallback('auth-code-123');

        expect(result.accessToken).toBe('mock-access-token');
        expect(result.refreshToken).toBe('mock-refresh-token');
      });

      it('should generate access token with user ID, email, and admin status', async () => {
        const googleUser = createGoogleUserInfo();
        const dbUser = createMockDbUser({ isAdmin: true });

        mockGoogleTokenExchange();
        mockGoogleUserInfoResponse(googleUser);
        vi.mocked(prisma.user.findUnique).mockResolvedValue(dbUser as never);
        vi.mocked(prisma.user.update).mockResolvedValue(dbUser as never);

        await GoogleOAuthService.handleCallback('auth-code-123');

        expect(generateAccessToken).toHaveBeenCalledWith(
          dbUser.id,
          dbUser.email,
          true
        );
      });

      it('should generate refresh token with user ID', async () => {
        const googleUser = createGoogleUserInfo();
        const dbUser = createMockDbUser();

        mockGoogleTokenExchange();
        mockGoogleUserInfoResponse(googleUser);
        vi.mocked(prisma.user.findUnique).mockResolvedValue(dbUser as never);
        vi.mocked(prisma.user.update).mockResolvedValue(dbUser as never);

        await GoogleOAuthService.handleCallback('auth-code-123');

        expect(generateRefreshToken).toHaveBeenCalledWith(dbUser.id);
      });

      it('should store refresh token in Redis with 7-day TTL', async () => {
        const googleUser = createGoogleUserInfo();
        const dbUser = createMockDbUser();

        mockGoogleTokenExchange();
        mockGoogleUserInfoResponse(googleUser);
        vi.mocked(prisma.user.findUnique).mockResolvedValue(dbUser as never);
        vi.mocked(prisma.user.update).mockResolvedValue(dbUser as never);

        await GoogleOAuthService.handleCallback('auth-code-123');

        const SEVEN_DAYS_IN_SECONDS = 7 * 24 * 60 * 60;
        expect(redis.setex).toHaveBeenCalledWith(
          `refresh_token:${dbUser.id}`,
          SEVEN_DAYS_IN_SECONDS,
          'mock-refresh-token'
        );
      });
    });

    // ------------------------------------------
    // Response shape
    // ------------------------------------------

    describe('response shape', () => {
      it('should return correct user shape with all required fields', async () => {
        const googleUser = createGoogleUserInfo();
        const dbUser = createMockDbUser();

        mockGoogleTokenExchange();
        mockGoogleUserInfoResponse(googleUser);
        vi.mocked(prisma.user.findUnique).mockResolvedValue(dbUser as never);
        vi.mocked(prisma.user.update).mockResolvedValue(dbUser as never);

        const result = await GoogleOAuthService.handleCallback('auth-code-123');

        expect(result.user).toEqual({
          id: dbUser.id,
          email: dbUser.email,
          firstName: dbUser.firstName,
          lastName: dbUser.lastName,
          preferredLanguage: dbUser.preferredLanguage,
        });
      });

      it('should return empty strings for null firstName/lastName', async () => {
        const googleUser = createGoogleUserInfo();
        const dbUser = createMockDbUser({ firstName: null, lastName: null });

        mockGoogleTokenExchange();
        mockGoogleUserInfoResponse(googleUser);
        vi.mocked(prisma.user.findUnique).mockResolvedValue(dbUser as never);
        vi.mocked(prisma.user.update).mockResolvedValue(dbUser as never);

        const result = await GoogleOAuthService.handleCallback('auth-code-123');

        expect(result.user.firstName).toBe('');
        expect(result.user.lastName).toBe('');
      });
    });

    // ------------------------------------------
    // Error handling
    // ------------------------------------------

    describe('error handling', () => {
      it('should reject when Google returns no email', async () => {
        const googleUser = createGoogleUserInfo({ email: '' });

        mockGoogleTokenExchange();
        mockGoogleUserInfoResponse(googleUser);

        await expect(
          GoogleOAuthService.handleCallback('auth-code-123')
        ).rejects.toThrow('Email not provided by Google');
      });

      it('should reject when user account is deactivated/blocked', async () => {
        const googleUser = createGoogleUserInfo();
        const blockedUser = createMockDbUser({
          isBlocked: true,
          googleId: 'existing-google-id',
        });

        mockGoogleTokenExchange();
        mockGoogleUserInfoResponse(googleUser);
        vi.mocked(prisma.user.findUnique).mockResolvedValue(blockedUser as never);
        vi.mocked(prisma.user.update).mockResolvedValue(blockedUser as never);

        await expect(
          GoogleOAuthService.handleCallback('auth-code-123')
        ).rejects.toThrow('Account is deactivated');
      });

      it('should reject when Google token exchange fails', async () => {
        mockGetToken.mockRejectedValueOnce(new Error('invalid_grant: Code expired'));

        await expect(
          GoogleOAuthService.handleCallback('expired-code')
        ).rejects.toThrow('invalid_grant: Code expired');
      });

      it('should reject when Google userinfo API returns non-OK response', async () => {
        mockGoogleTokenExchange();
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 401,
          json: () => Promise.resolve({ error: 'Unauthorized' }),
        });

        await expect(
          GoogleOAuthService.handleCallback('auth-code-123')
        ).rejects.toThrow('Failed to get user info from Google');
      });

      it('should reject when Google userinfo API fetch throws network error', async () => {
        mockGoogleTokenExchange();
        mockFetch.mockRejectedValueOnce(new Error('Network error'));

        await expect(
          GoogleOAuthService.handleCallback('auth-code-123')
        ).rejects.toThrow('Network error');
      });

      it('should reject when Prisma user creation fails', async () => {
        const googleUser = createGoogleUserInfo();

        mockGoogleTokenExchange();
        mockGoogleUserInfoResponse(googleUser);
        vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
        vi.mocked(prisma.user.create).mockRejectedValue(
          new Error('Unique constraint violation')
        );

        await expect(
          GoogleOAuthService.handleCallback('auth-code-123')
        ).rejects.toThrow('Unique constraint violation');
      });

      it('should reject blocked user even if newly linking Google account', async () => {
        const googleUser = createGoogleUserInfo();
        const blockedUserNoGoogle = createMockDbUser({
          isBlocked: true,
          googleId: null,
        });
        const blockedUserLinked = createMockDbUser({
          isBlocked: true,
          googleId: googleUser.id,
        });

        mockGoogleTokenExchange();
        mockGoogleUserInfoResponse(googleUser);
        vi.mocked(prisma.user.findUnique).mockResolvedValue(blockedUserNoGoogle as never);
        vi.mocked(prisma.user.update).mockResolvedValue(blockedUserLinked as never);

        await expect(
          GoogleOAuthService.handleCallback('auth-code-123')
        ).rejects.toThrow('Account is deactivated');
      });
    });

    // ------------------------------------------
    // Token exchange flow
    // ------------------------------------------

    describe('Google token exchange flow', () => {
      it('should exchange authorization code with Google', async () => {
        const googleUser = createGoogleUserInfo();
        const dbUser = createMockDbUser();

        mockGoogleTokenExchange();
        mockGoogleUserInfoResponse(googleUser);
        vi.mocked(prisma.user.findUnique).mockResolvedValue(dbUser as never);
        vi.mocked(prisma.user.update).mockResolvedValue(dbUser as never);

        await GoogleOAuthService.handleCallback('my-auth-code');

        expect(mockGetToken).toHaveBeenCalledWith('my-auth-code');
      });

      it('should set credentials on the OAuth client after token exchange', async () => {
        const googleUser = createGoogleUserInfo();
        const dbUser = createMockDbUser();
        const mockTokens = {
          access_token: 'google-access-token-xyz',
          refresh_token: 'google-refresh-token-xyz',
          id_token: 'google-id-token-xyz',
        };

        mockGetToken.mockResolvedValueOnce({ tokens: mockTokens });
        mockGoogleUserInfoResponse(googleUser);
        vi.mocked(prisma.user.findUnique).mockResolvedValue(dbUser as never);
        vi.mocked(prisma.user.update).mockResolvedValue(dbUser as never);

        await GoogleOAuthService.handleCallback('auth-code-123');

        expect(mockSetCredentials).toHaveBeenCalledWith(mockTokens);
      });

      it('should call Google userinfo API with the exchanged access token', async () => {
        const googleUser = createGoogleUserInfo();
        const dbUser = createMockDbUser();

        mockGoogleTokenExchange();
        mockGoogleUserInfoResponse(googleUser);
        vi.mocked(prisma.user.findUnique).mockResolvedValue(dbUser as never);
        vi.mocked(prisma.user.update).mockResolvedValue(dbUser as never);

        await GoogleOAuthService.handleCallback('auth-code-123');

        expect(mockFetch).toHaveBeenCalledWith(
          'https://www.googleapis.com/oauth2/v2/userinfo',
          {
            headers: {
              Authorization: 'Bearer google-access-token-xyz',
            },
          }
        );
      });
    });

    // ------------------------------------------
    // Edge cases
    // ------------------------------------------

    describe('edge cases', () => {
      it('should handle user with only a first name (no family name from Google)', async () => {
        const googleUser = createGoogleUserInfo({
          given_name: 'Madonna',
          family_name: '',
          name: 'Madonna',
        });

        mockGoogleTokenExchange();
        mockGoogleUserInfoResponse(googleUser);
        vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
        vi.mocked(prisma.user.create).mockResolvedValue(
          createMockDbUser({ firstName: 'Madonna', lastName: '' }) as never
        );

        const result = await GoogleOAuthService.handleCallback('auth-code-123');

        expect(prisma.user.create).toHaveBeenCalledWith({
          data: expect.objectContaining({
            firstName: 'Madonna',
            lastName: '',
          }),
        });
        expect(result.isNewUser).toBe(true);
      });

      it('should not generate tokens if user is blocked (tokens should never be issued)', async () => {
        const googleUser = createGoogleUserInfo();
        const blockedUser = createMockDbUser({
          isBlocked: true,
          googleId: 'existing-google-id',
        });

        mockGoogleTokenExchange();
        mockGoogleUserInfoResponse(googleUser);
        vi.mocked(prisma.user.findUnique).mockResolvedValue(blockedUser as never);
        vi.mocked(prisma.user.update).mockResolvedValue(blockedUser as never);

        await expect(
          GoogleOAuthService.handleCallback('auth-code-123')
        ).rejects.toThrow();

        // Tokens should NEVER have been generated for blocked users
        expect(generateAccessToken).not.toHaveBeenCalled();
        expect(generateRefreshToken).not.toHaveBeenCalled();
        expect(redis.setex).not.toHaveBeenCalled();
      });

      it('should handle Redis failure during refresh token storage gracefully', async () => {
        const googleUser = createGoogleUserInfo();
        const dbUser = createMockDbUser();

        mockGoogleTokenExchange();
        mockGoogleUserInfoResponse(googleUser);
        vi.mocked(prisma.user.findUnique).mockResolvedValue(dbUser as never);
        vi.mocked(prisma.user.update).mockResolvedValue(dbUser as never);
        vi.mocked(redis.setex).mockRejectedValue(new Error('Redis connection lost'));

        await expect(
          GoogleOAuthService.handleCallback('auth-code-123')
        ).rejects.toThrow('Redis connection lost');
      });

      it('should set isVerified based on Google verified_email for new users', async () => {
        const googleUser = createGoogleUserInfo({ verified_email: false });

        mockGoogleTokenExchange();
        mockGoogleUserInfoResponse(googleUser);
        vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
        vi.mocked(prisma.user.create).mockResolvedValue(
          createMockDbUser({ isVerified: false }) as never
        );

        await GoogleOAuthService.handleCallback('auth-code-123');

        expect(prisma.user.create).toHaveBeenCalledWith({
          data: expect.objectContaining({
            isVerified: false,
          }),
        });
      });
    });
  });
});
