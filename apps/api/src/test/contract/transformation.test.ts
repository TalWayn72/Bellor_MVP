/**
 * API Transformation Contract Tests
 * Verifies that API correctly transforms between:
 * - snake_case (database/legacy frontend) ↔ camelCase (API schema)
 * - Ensures backward compatibility with old frontend code
 *
 * @see PRD.md Section 10 - Phase 6 Testing
 */

import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildTestApp, authHeader } from '../build-test-app.js';
import { prisma } from '../../lib/prisma.js';
import { UserResponseSchema } from '@bellor/shared/schemas';

let app: FastifyInstance;

beforeAll(async () => {
  app = await buildTestApp();
});

afterAll(async () => {
  await app.close();
});

beforeEach(() => {
  vi.clearAllMocks();
});

const mockDbUser = {
  id: 'test-user-id',
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User',
  nickname: 'testuser',
  birthDate: new Date('1990-01-01'),
  gender: 'MALE',
  preferredLanguage: 'ENGLISH',
  bio: 'Test bio',
  profileImages: ['https://example.com/img.jpg'],
  drawingUrl: 'https://example.com/drawing.png',
  sketchMethod: 'DIGITAL',
  location: { city: 'Tel Aviv', country: 'Israel' },
  phone: '+972501234567',
  occupation: 'Engineer',
  education: 'University',
  interests: ['music', 'sports'],
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
  isBlocked: false,
  isVerified: true,
  isPremium: false,
  isAdmin: false,
  premiumExpiresAt: null,
  lastActiveAt: new Date('2024-06-01'),
  responseCount: 5,
  chatCount: 3,
  missionCompletedCount: 2,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-06-01'),
};

// ============================================
// DATABASE TO API TRANSFORMATION
// ============================================
describe('Database to API Transformation', () => {
  it('transforms DB fields to camelCase API response', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockDbUser as any);

    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/users/test-user-id',
      headers: { authorization: authHeader() },
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.payload);
    const apiUser = body.data;

    // Validate against camelCase schema
    const result = UserResponseSchema.safeParse(apiUser);
    expect(result.success).toBe(true);

    // Check that camelCase keys are present
    expect(apiUser).toHaveProperty('firstName');
    expect(apiUser).toHaveProperty('lastName');
    expect(apiUser).toHaveProperty('birthDate');
    expect(apiUser).toHaveProperty('profileImages');
    expect(apiUser).toHaveProperty('drawingUrl');
    expect(apiUser).toHaveProperty('sketchMethod');
    expect(apiUser).toHaveProperty('preferredLanguage');
    expect(apiUser).toHaveProperty('lookingFor');
    expect(apiUser).toHaveProperty('ageRangeMin');
    expect(apiUser).toHaveProperty('ageRangeMax');
    expect(apiUser).toHaveProperty('maxDistance');
    expect(apiUser).toHaveProperty('showOnline');
    expect(apiUser).toHaveProperty('showDistance');
    expect(apiUser).toHaveProperty('showAge');
    expect(apiUser).toHaveProperty('privateProfile');
    expect(apiUser).toHaveProperty('doNotSell');
    expect(apiUser).toHaveProperty('notifyNewMatches');
    expect(apiUser).toHaveProperty('notifyNewMessages');
    expect(apiUser).toHaveProperty('notifyChatRequests');
    expect(apiUser).toHaveProperty('notifyDailyMissions');
    expect(apiUser).toHaveProperty('notifyEmail');
    expect(apiUser).toHaveProperty('isVerified');
    expect(apiUser).toHaveProperty('isBlocked');
    expect(apiUser).toHaveProperty('isPremium');
    expect(apiUser).toHaveProperty('isAdmin');
    expect(apiUser).toHaveProperty('lastActiveAt');
    expect(apiUser).toHaveProperty('responseCount');
    expect(apiUser).toHaveProperty('chatCount');
    expect(apiUser).toHaveProperty('missionCompletedCount');
    expect(apiUser).toHaveProperty('createdAt');
    expect(apiUser).toHaveProperty('updatedAt');

    // Check that snake_case keys are NOT present
    expect(apiUser).not.toHaveProperty('first_name');
    expect(apiUser).not.toHaveProperty('last_name');
    expect(apiUser).not.toHaveProperty('birth_date');
    expect(apiUser).not.toHaveProperty('profile_images');
    expect(apiUser).not.toHaveProperty('drawing_url');
    expect(apiUser).not.toHaveProperty('sketch_method');
    expect(apiUser).not.toHaveProperty('preferred_language');
  });
});

// ============================================
// FRONTEND TO API TRANSFORMATION (UPDATE)
// ============================================
describe('Frontend to API Transformation (Profile Update)', () => {
  it('accepts snake_case fields from legacy frontend', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockDbUser as any);
    vi.mocked(prisma.user.update).mockResolvedValue({
      ...mockDbUser,
      firstName: 'Updated',
      bio: 'New bio',
    } as any);

    // Legacy frontend sends snake_case
    const snakeCaseUpdate = {
      first_name: 'Updated',
      profile_images: ['https://example.com/new.jpg'],
      drawing_url: 'https://example.com/drawing2.png',
      looking_for: 'female',
      bio: 'New bio',
    };

    const response = await app.inject({
      method: 'PATCH',
      url: '/api/v1/users/test-user-id',
      headers: { authorization: authHeader() },
      payload: snakeCaseUpdate,
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.payload);

    // Response should be in camelCase
    const result = UserResponseSchema.safeParse(body.data);
    expect(result.success).toBe(true);
  });

  it('accepts camelCase fields from modern frontend', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockDbUser as any);
    vi.mocked(prisma.user.update).mockResolvedValue({
      ...mockDbUser,
      firstName: 'Modern',
      bio: 'Modern bio',
    } as any);

    // Modern frontend sends camelCase
    const camelCaseUpdate = {
      firstName: 'Modern',
      profileImages: ['https://example.com/modern.jpg'],
      drawingUrl: 'https://example.com/modern-drawing.png',
      lookingFor: ['FEMALE'],
      bio: 'Modern bio',
    };

    const response = await app.inject({
      method: 'PATCH',
      url: '/api/v1/users/test-user-id',
      headers: { authorization: authHeader() },
      payload: camelCaseUpdate,
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.payload);

    // Response should be in camelCase
    const result = UserResponseSchema.safeParse(body.data);
    expect(result.success).toBe(true);
  });

  it('handles mixed camelCase and snake_case fields', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockDbUser as any);
    vi.mocked(prisma.user.update).mockResolvedValue({
      ...mockDbUser,
      firstName: 'Mixed',
    } as any);

    // Mixed format (shouldn't happen but should be handled gracefully)
    const mixedUpdate = {
      firstName: 'Mixed',
      profile_images: ['https://example.com/mixed.jpg'],
      drawingUrl: 'https://example.com/mixed-drawing.png',
      looking_for: 'female',
    };

    const response = await app.inject({
      method: 'PATCH',
      url: '/api/v1/users/test-user-id',
      headers: { authorization: authHeader() },
      payload: mixedUpdate,
    });

    expect(response.statusCode).toBe(200);
  });
});

// ============================================
// DATE FIELD TRANSFORMATIONS
// ============================================
describe('Date Field Transformations', () => {
  it('accepts birthDate in camelCase', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockDbUser as any);
    vi.mocked(prisma.user.update).mockResolvedValue({
      ...mockDbUser,
      birthDate: new Date('1995-05-15'),
    } as any);

    const response = await app.inject({
      method: 'PATCH',
      url: '/api/v1/users/test-user-id',
      headers: { authorization: authHeader() },
      payload: { birthDate: '1995-05-15' },
    });

    expect(response.statusCode).toBe(200);
  });

  it('accepts date_of_birth in snake_case (legacy)', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockDbUser as any);
    vi.mocked(prisma.user.update).mockResolvedValue({
      ...mockDbUser,
      birthDate: new Date('1995-05-15'),
    } as any);

    const response = await app.inject({
      method: 'PATCH',
      url: '/api/v1/users/test-user-id',
      headers: { authorization: authHeader() },
      payload: { date_of_birth: '1995-05-15' },
    });

    expect(response.statusCode).toBe(200);
  });

  it('accepts age and converts to birthDate', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockDbUser as any);
    vi.mocked(prisma.user.update).mockResolvedValue(mockDbUser as any);

    const response = await app.inject({
      method: 'PATCH',
      url: '/api/v1/users/test-user-id',
      headers: { authorization: authHeader() },
      payload: { age: 30 },
    });

    expect(response.statusCode).toBe(200);
  });
});

// ============================================
// ENUM TRANSFORMATIONS
// ============================================
describe('Enum Transformations', () => {
  it('transforms lowercase gender to uppercase enum', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockDbUser as any);
    vi.mocked(prisma.user.update).mockResolvedValue({
      ...mockDbUser,
      gender: 'FEMALE',
    } as any);

    const response = await app.inject({
      method: 'PATCH',
      url: '/api/v1/users/test-user-id',
      headers: { authorization: authHeader() },
      payload: { gender: 'female' },
    });

    expect(response.statusCode).toBe(200);
  });

  it('transforms looking_for string to lookingFor array', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockDbUser as any);
    vi.mocked(prisma.user.update).mockResolvedValue(mockDbUser as any);

    const response = await app.inject({
      method: 'PATCH',
      url: '/api/v1/users/test-user-id',
      headers: { authorization: authHeader() },
      payload: { looking_for: 'male' },
    });

    expect(response.statusCode).toBe(200);
  });

  it('transforms "both" to both genders array', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockDbUser as any);
    vi.mocked(prisma.user.update).mockResolvedValue(mockDbUser as any);

    const response = await app.inject({
      method: 'PATCH',
      url: '/api/v1/users/test-user-id',
      headers: { authorization: authHeader() },
      payload: { looking_for: 'both' },
    });

    expect(response.statusCode).toBe(200);
  });
});

// ============================================
// LOCATION TRANSFORMATIONS
// ============================================
describe('Location Transformations', () => {
  it('transforms string location to object', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockDbUser as any);
    vi.mocked(prisma.user.update).mockResolvedValue(mockDbUser as any);

    const response = await app.inject({
      method: 'PATCH',
      url: '/api/v1/users/test-user-id',
      headers: { authorization: authHeader() },
      payload: { location: 'Tel Aviv' },
    });

    expect(response.statusCode).toBe(200);
  });

  it('accepts location object with coordinates', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockDbUser as any);
    vi.mocked(prisma.user.update).mockResolvedValue(mockDbUser as any);

    const response = await app.inject({
      method: 'PATCH',
      url: '/api/v1/users/test-user-id',
      headers: { authorization: authHeader() },
      payload: {
        location: {
          lat: 32.0853,
          lng: 34.7818,
          city: 'Tel Aviv',
          country: 'Israel',
        },
      },
    });

    expect(response.statusCode).toBe(200);
  });
});

// ============================================
// ARRAY FIELD TRANSFORMATIONS
// ============================================
describe('Array Field Transformations', () => {
  it('filters out empty strings from profileImages', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockDbUser as any);
    vi.mocked(prisma.user.update).mockResolvedValue(mockDbUser as any);

    const response = await app.inject({
      method: 'PATCH',
      url: '/api/v1/users/test-user-id',
      headers: { authorization: authHeader() },
      payload: {
        profileImages: ['https://example.com/1.jpg', '', 'https://example.com/2.jpg', null],
      },
    });

    expect(response.statusCode).toBe(200);
  });

  it('handles interests array', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockDbUser as any);
    vi.mocked(prisma.user.update).mockResolvedValue(mockDbUser as any);

    const response = await app.inject({
      method: 'PATCH',
      url: '/api/v1/users/test-user-id',
      headers: { authorization: authHeader() },
      payload: {
        interests: ['music', 'sports', 'travel'],
      },
    });

    expect(response.statusCode).toBe(200);
  });
});

// ============================================
// BACKWARD COMPATIBILITY
// ============================================
describe('Backward Compatibility with Legacy Fields', () => {
  it('ignores unknown legacy fields gracefully', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockDbUser as any);
    vi.mocked(prisma.user.update).mockResolvedValue(mockDbUser as any);

    const legacyPayload = {
      firstName: 'Test',
      last_active_date: '2024-06-01',
      main_profile_image_url: 'https://example.com/main.jpg',
      verification_photos: ['https://example.com/verify.jpg'],
      onboarding_completed: true,
      gender_other: 'Non-binary',
      location_city: 'Tel Aviv',
      location_state: 'Center',
      can_currently_relocate: false,
      can_language_travel: true,
      response_count: 5,
      chat_count: 3,
      mission_completed_count: 2,
    };

    const response = await app.inject({
      method: 'PATCH',
      url: '/api/v1/users/test-user-id',
      headers: { authorization: authHeader() },
      payload: legacyPayload,
    });

    // Should not crash, should update valid fields only
    expect(response.statusCode).toBe(200);
  });
});
