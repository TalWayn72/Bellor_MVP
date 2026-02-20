/**
 * Frontend User Service - Contract Tests
 * Verifies that frontend user service parses API responses correctly
 * and validates them against shared Zod schemas
 *
 * @see PRD.md Section 10 - Phase 6 Testing
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { UserResponseSchema } from '@bellor/shared/schemas';
import { userService } from '../../api/services/userService';
import { apiClient } from '../../api/client/apiClient';

beforeEach(() => {
  vi.spyOn(apiClient, 'get').mockResolvedValue({ data: {} } as any);
  vi.spyOn(apiClient, 'patch').mockResolvedValue({ data: {} } as any);
});

afterEach(() => {
  vi.restoreAllMocks();
});

const mockUserResponse = {
  id: 'test-user-id',
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User',
  nickname: 'testuser',
  bio: 'Test bio',
  birthDate: '1990-01-01T00:00:00.000Z',
  gender: 'MALE',
  profileImages: ['https://example.com/img.jpg'],
  drawingUrl: 'https://example.com/drawing.png',
  sketchMethod: 'DIGITAL',
  location: { city: 'Tel Aviv', country: 'Israel' },
  phone: '+972501234567',
  occupation: 'Engineer',
  education: 'University',
  interests: ['music', 'sports'],
  preferredLanguage: 'ENGLISH',
  lookingFor: ['FEMALE'],
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
  isVerified: true,
  isBlocked: false,
  isPremium: false,
  isAdmin: false,
  premiumExpiresAt: null,
  lastActiveAt: '2024-06-01T00:00:00.000Z',
  responseCount: 5,
  chatCount: 3,
  missionCompletedCount: 2,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-06-01T00:00:00.000Z',
};

// ============================================
// GET USER BY ID - SCHEMA VALIDATION
// ============================================
describe('[P2][profile] getUserById() - Schema Validation', () => {
  it('parses response matching UserResponseSchema', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      data: { data: mockUserResponse },
    } as any);

    const result = await userService.getUserById('test-user-id');
    const user = result.user;

    // Validate against shared schema
    const schemaResult = UserResponseSchema.safeParse(user);

    if (!schemaResult.success) {
      // eslint-disable-next-line no-console
      console.error('Schema validation errors:', schemaResult.error.errors);
    }

    expect(schemaResult.success).toBe(true);
    expect(user.id).toBe('test-user-id');
    expect(user.email).toBe('test@example.com');
  });

  it('rejects data that violates UserResponseSchema', async () => {
    const invalidResponse = {
      id: 123, // Should be string
      email: 'not-an-email', // Invalid email
      firstName: 'Test',
    };

    vi.mocked(apiClient.get).mockResolvedValue({
      data: { data: invalidResponse },
    } as any);

    const result = await userService.getUserById('test-user-id');
    const user = result.user;

    // Should fail schema validation
    const schemaResult = UserResponseSchema.safeParse(user);
    expect(schemaResult.success).toBe(false);

    if (!schemaResult.success) {
      expect(schemaResult.error.errors.length).toBeGreaterThan(0);
    }
  });

  it('handles missing optional fields', async () => {
    const minimalResponse = {
      id: 'test-user-id',
      email: 'test@example.com',
      firstName: null,
      lastName: null,
      nickname: null,
      bio: null,
      birthDate: null,
      gender: null,
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
      ageRangeMin: null,
      ageRangeMax: null,
      maxDistance: null,
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
      lastActiveAt: null,
      responseCount: 0,
      chatCount: 0,
      missionCompletedCount: 0,
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    };

    vi.mocked(apiClient.get).mockResolvedValue({
      data: { data: minimalResponse },
    } as any);

    const result = await userService.getUserById('test-user-id');
    const user = result.user;

    const schemaResult = UserResponseSchema.safeParse(user);
    expect(schemaResult.success).toBe(true);
  });
});

// ============================================
// SEARCH USERS - SCHEMA VALIDATION
// ============================================
describe('searchUsers() - Schema Validation', () => {
  it('validates each user in search results', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      data: {
        data: [mockUserResponse],
        pagination: { total: 1, limit: 20, offset: 0 },
      },
    } as any);

    const result = await userService.searchUsers({ search: 'test' });

    expect(Array.isArray(result.users)).toBe(true);

    for (const user of result.users) {
      const schemaResult = UserResponseSchema.safeParse(user);

      if (!schemaResult.success) {
        // eslint-disable-next-line no-console
        console.error('User schema validation errors:', schemaResult.error.errors);
      }

      expect(schemaResult.success).toBe(true);
    }
  });

  it('handles empty search results', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      data: {
        data: [],
        pagination: { total: 0, limit: 20, offset: 0 },
      },
    } as any);

    const result = await userService.searchUsers({ search: 'nonexistent' });

    expect(Array.isArray(result.users)).toBe(true);
    expect(result.users.length).toBe(0);
    expect(result.total).toBe(0);
  });
});

// ============================================
// UPDATE PROFILE - REQUEST/RESPONSE VALIDATION
// ============================================
describe('updateProfile() - Request/Response Validation', () => {
  it('sends valid update data and receives valid response', async () => {
    const updateData = {
      firstName: 'Updated',
      bio: 'New bio',
      ageRangeMin: 20,
      ageRangeMax: 30,
    };

    vi.mocked(apiClient.patch).mockResolvedValue({
      data: {
        data: {
          ...mockUserResponse,
          firstName: 'Updated',
          bio: 'New bio',
        },
      },
    } as any);

    const result = await userService.updateProfile('test-user-id', updateData);

    // Validate response data
    if (result && typeof result === 'object' && 'data' in result) {
      const schemaResult = UserResponseSchema.safeParse((result as any).data);
      expect(schemaResult.success).toBe(true);
    }
  });

  it('handles profile images update', async () => {
    const updateData = {
      profileImages: ['https://example.com/new1.jpg', 'https://example.com/new2.jpg'],
    };

    vi.mocked(apiClient.patch).mockResolvedValue({
      data: {
        data: {
          ...mockUserResponse,
          profileImages: updateData.profileImages,
        },
      },
    } as any);

    await userService.updateProfile('test-user-id', updateData);

    expect(apiClient.patch).toHaveBeenCalledWith(
      '/users/test-user-id',
      expect.objectContaining(updateData)
    );
  });
});

// ============================================
// FIELD NAMING CONSISTENCY
// ============================================
describe('Field Naming Consistency', () => {
  it('uses camelCase for all fields', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      data: { data: mockUserResponse },
    } as any);

    const result = await userService.getUserById('test-user-id');
    const user = result.user;

    // Check that response has camelCase keys
    expect(user).toHaveProperty('firstName');
    expect(user).toHaveProperty('lastName');
    expect(user).toHaveProperty('birthDate');
    expect(user).toHaveProperty('profileImages');
    expect(user).toHaveProperty('preferredLanguage');

    // Check that response does NOT have snake_case keys
    expect(user).not.toHaveProperty('first_name');
    expect(user).not.toHaveProperty('last_name');
    expect(user).not.toHaveProperty('birth_date');
    expect(user).not.toHaveProperty('profile_images');
    expect(user).not.toHaveProperty('preferred_language');
  });
});

// ============================================
// ENUM VALIDATION
// ============================================
describe('Enum Validation', () => {
  it('validates gender enum values', async () => {
    const validGenders = ['MALE', 'FEMALE', 'NON_BINARY', 'OTHER'];

    for (const gender of validGenders) {
      const response = { ...mockUserResponse, gender };

      vi.mocked(apiClient.get).mockResolvedValue({
        data: { data: response },
      } as any);

      const result = await userService.getUserById('test-user-id');
      const schemaResult = UserResponseSchema.safeParse(result.user);

      expect(schemaResult.success).toBe(true);
    }
  });

  it('validates language enum values', async () => {
    const validLanguages = ['ENGLISH', 'HEBREW', 'SPANISH', 'GERMAN', 'FRENCH'];

    for (const language of validLanguages) {
      const response = { ...mockUserResponse, preferredLanguage: language };

      vi.mocked(apiClient.get).mockResolvedValue({
        data: { data: response },
      } as any);

      const result = await userService.getUserById('test-user-id');
      const schemaResult = UserResponseSchema.safeParse(result.user);

      expect(schemaResult.success).toBe(true);
    }
  });
});

// ============================================
// ERROR HANDLING
// ============================================
describe('Error Handling', () => {
  it('throws error for invalid user ID', async () => {
    await expect(userService.getUserById('')).rejects.toThrow();
  });

  it('throws error for invalid update data', async () => {
    await expect(userService.updateProfile('test-user-id', null as any)).rejects.toThrow();
  });

  it('handles API errors gracefully', async () => {
    vi.mocked(apiClient.get).mockRejectedValue(new Error('Network error'));

    await expect(userService.getUserById('test-user-id')).rejects.toThrow('Network error');
  });
});

// ============================================
// DATE FORMAT VALIDATION
// ============================================
describe('Date Format Validation', () => {
  it('validates ISO datetime format for dates', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      data: { data: mockUserResponse },
    } as any);

    const result = await userService.getUserById('test-user-id');
    const user = result.user;

    const schemaResult = UserResponseSchema.safeParse(user);
    expect(schemaResult.success).toBe(true);

    // Check that dates are ISO strings if present
    if (user.birthDate) {
      expect(typeof user.birthDate).toBe('string');
      expect(user.birthDate).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    }

    if (user.createdAt) {
      expect(typeof user.createdAt).toBe('string');
      expect(user.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    }
  });
});
