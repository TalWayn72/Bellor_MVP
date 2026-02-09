/**
 * User Endpoints - Contract Tests (Schema Compliance)
 * Verifies that API responses match shared Zod schemas
 * Catches API drift between frontend and backend
 *
 * @see PRD.md Section 10 - Phase 6 Testing
 */

import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildTestApp, authHeader } from '../build-test-app.js';
import { prisma } from '../../lib/prisma.js';
import {
  UserResponseSchema,
  ListUsersQuery,
  UpdateProfileSchema,
  SearchUsersQuery,
} from '@bellor/shared/schemas';

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

const mockUser = {
  id: 'test-user-id',
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User',
  birthDate: new Date('1990-01-01'),
  gender: 'MALE',
  preferredLanguage: 'ENGLISH',
  bio: 'Test bio',
  profileImages: ['https://example.com/img.jpg'],
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
// GET USER BY ID - SCHEMA COMPLIANCE
// ============================================
describe('GET /api/v1/users/:id - Schema Compliance', () => {
  it('returns data matching UserResponseSchema', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);

    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/users/test-user-id',
      headers: { authorization: authHeader() },
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.payload);
    expect(body.success).toBe(true);

    // Validate against shared schema
    const result = UserResponseSchema.safeParse(body.data);

    if (!result.success) {
      // eslint-disable-next-line no-console
      console.error('Schema validation errors:', result.error.errors);
    }

    expect(result.success).toBe(true);
  });

  it('rejects invalid user data that violates schema', async () => {
    const invalidUser = {
      ...mockUser,
      email: 'not-an-email', // Invalid email
      gender: 'INVALID_GENDER', // Invalid enum
    };

    vi.mocked(prisma.user.findUnique).mockResolvedValue(invalidUser as any);

    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/users/test-user-id',
      headers: { authorization: authHeader() },
    });

    const body = JSON.parse(response.payload);
    const result = UserResponseSchema.safeParse(body.data);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors.length).toBeGreaterThan(0);
    }
  });
});

// ============================================
// LIST USERS - SCHEMA COMPLIANCE
// ============================================
describe('GET /api/v1/users - Schema Compliance', () => {
  it('returns paginated list matching UserResponseSchema', async () => {
    vi.mocked(prisma.user.findMany).mockResolvedValue([mockUser] as any);
    vi.mocked(prisma.user.count).mockResolvedValue(1);

    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/users?limit=20&offset=0',
      headers: { authorization: authHeader() },
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.payload);

    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);

    // Validate each user against schema
    for (const user of body.data) {
      const result = UserResponseSchema.safeParse(user);

      if (!result.success) {
        // eslint-disable-next-line no-console
        console.error('User schema validation errors:', result.error.errors);
      }

      expect(result.success).toBe(true);
    }

    // Validate pagination structure
    expect(body.pagination).toHaveProperty('total');
    expect(body.pagination).toHaveProperty('limit');
    expect(body.pagination).toHaveProperty('offset');
  });
});

// ============================================
// UPDATE PROFILE - REQUEST SCHEMA COMPLIANCE
// ============================================
describe('PATCH /api/v1/users/:id - Request Schema Compliance', () => {
  it('accepts valid UpdateProfileSchema data', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);
    vi.mocked(prisma.user.update).mockResolvedValue({
      ...mockUser,
      firstName: 'Updated',
    } as any);

    const validUpdate = {
      firstName: 'Updated',
      bio: 'New bio',
      ageRangeMin: 20,
      ageRangeMax: 30,
    };

    // Validate request data against schema
    const schemaResult = UpdateProfileSchema.safeParse(validUpdate);
    expect(schemaResult.success).toBe(true);

    const response = await app.inject({
      method: 'PATCH',
      url: '/api/v1/users/test-user-id',
      headers: { authorization: authHeader() },
      payload: validUpdate,
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.payload);

    // Validate response against schema
    const responseResult = UserResponseSchema.safeParse(body.data);
    expect(responseResult.success).toBe(true);
  });

  it('rejects invalid UpdateProfileSchema data', async () => {
    const invalidUpdate = {
      firstName: '', // Too short (min 1)
      ageRangeMin: 10, // Too young (min 18)
      bio: 'x'.repeat(600), // Too long (max 500)
    };

    // Validate request data against schema
    const schemaResult = UpdateProfileSchema.safeParse(invalidUpdate);
    expect(schemaResult.success).toBe(false);
  });
});

// ============================================
// SEARCH USERS - QUERY SCHEMA COMPLIANCE
// ============================================
describe('GET /api/v1/users/search - Query Schema Compliance', () => {
  it('accepts valid SearchUsersQuery params', async () => {
    vi.mocked(prisma.user.findMany).mockResolvedValue([mockUser] as any);
    vi.mocked(prisma.user.count).mockResolvedValue(1);

    const validQuery: SearchUsersQuery = {
      q: 'Test',
      limit: 10,
      offset: 0,
    };

    const response = await app.inject({
      method: 'GET',
      url: `/api/v1/users/search?q=${validQuery.q}&limit=${validQuery.limit}&offset=${validQuery.offset}`,
      headers: { authorization: authHeader() },
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.payload);

    // Validate each result against schema
    for (const user of body.data || []) {
      const result = UserResponseSchema.safeParse(user);
      expect(result.success).toBe(true);
    }
  });
});

// ============================================
// USER STATS - RESPONSE STRUCTURE
// ============================================
describe('GET /api/v1/users/:id/stats - Response Structure', () => {
  it('returns consistent stats structure', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: 'test-user-id',
      isPremium: false,
      createdAt: new Date('2024-01-01'),
      lastActiveAt: new Date('2024-06-01'),
      _count: {
        sentMessages: 50,
        chatsAsUser1: 3,
        chatsAsUser2: 2,
      },
    } as any);

    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/users/test-user-id/stats',
      headers: { authorization: authHeader() },
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.payload);

    expect(body.success).toBe(true);
    expect(body.data).toHaveProperty('messagesCount');
    expect(body.data).toHaveProperty('chatsCount');
    expect(typeof body.data.messagesCount).toBe('number');
    expect(typeof body.data.chatsCount).toBe('number');
  });
});

// ============================================
// GDPR EXPORT - DATA STRUCTURE
// ============================================
describe('GET /api/v1/users/:id/export - Data Structure', () => {
  it('returns consistent GDPR export structure', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      ...mockUser,
      location: { city: 'Tel Aviv' },
      sentMessages: [],
      responses: [],
      stories: [],
      achievements: [],
    } as any);

    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/users/test-user-id/export',
      headers: { authorization: authHeader() },
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.payload);

    expect(body.success).toBe(true);
    expect(body.data).toHaveProperty('personalInformation');
    expect(body.data).toHaveProperty('preferences');
    expect(body.data).toHaveProperty('content');

    // Validate structure of nested objects
    expect(body.data.personalInformation).toHaveProperty('id');
    expect(body.data.personalInformation).toHaveProperty('email');
    expect(body.data.preferences).toHaveProperty('language');
    expect(body.data.content).toHaveProperty('messages');
    expect(body.data.content).toHaveProperty('responses');
    expect(body.data.content).toHaveProperty('stories');
  });
});
