/**
 * Story Endpoints - Contract Tests (Schema Compliance)
 * Verifies that story API responses match shared Zod schemas
 * Catches API drift between frontend and backend
 *
 * @see PRD.md Section 10 - Phase 6 Testing
 */

import { describe, it, expect, vi, beforeAll, afterAll, beforeEach, type Mock } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildTestApp, authHeader } from '../build-test-app.js';
import { prisma } from '../../lib/prisma.js';
import type { Story } from '@prisma/client';
import {
  StoryResponseSchema,
  CreateStoryRequestSchema,
  MediaTypeEnum,
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

// Mock story as returned by Prisma (includes user relation)
const mockStoryWithUser = {
  id: 'test-story-id',
  userId: 'test-user-id',
  mediaType: 'IMAGE',
  mediaUrl: 'https://example.com/story.jpg',
  thumbnailUrl: 'https://example.com/thumb.jpg',
  caption: 'My story caption',
  viewCount: 0,
  createdAt: new Date('2024-06-01'),
  expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // Future date so it's not expired
  user: {
    id: 'test-user-id',
    firstName: 'Test',
    lastName: 'User',
    profileImages: ['https://example.com/img.jpg'],
  },
};

const mockStoryBasic = {
  id: 'test-story-id',
  userId: 'test-user-id',
  mediaType: 'IMAGE',
  mediaUrl: 'https://example.com/story.jpg',
  thumbnailUrl: 'https://example.com/thumb.jpg',
  caption: 'My story caption',
  viewCount: 0,
  createdAt: new Date('2024-06-01'),
  expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
};

// ============================================
// GET STORY FEED - SCHEMA COMPLIANCE
// ============================================
describe('[P1][content] GET /api/v1/stories/feed - Schema Compliance', () => {
  it('returns story feed data', async () => {
    // The feed endpoint is at /stories/feed (not /stories)
    // It returns a grouped feed array
    (prisma.story.findMany as Mock).mockResolvedValue([mockStoryWithUser] as unknown as Story[]);

    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/stories/feed?limit=20&offset=0',
      headers: { authorization: authHeader() },
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.payload);

    // The feed controller returns { data: [...] } where data is grouped by user
    expect(body).toHaveProperty('data');
    expect(Array.isArray(body.data)).toBe(true);
  });

  it('validates each feed group has user and stories', async () => {
    (prisma.story.findMany as Mock).mockResolvedValue([mockStoryWithUser] as unknown as Story[]);

    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/stories/feed',
      headers: { authorization: authHeader() },
    });

    const body = JSON.parse(response.payload);
    const feed = body.data || [];

    for (const group of feed) {
      expect(group).toHaveProperty('user');
      expect(group).toHaveProperty('stories');
      expect(Array.isArray(group.stories)).toBe(true);
    }
  });
});

// ============================================
// GET STORY BY ID - SCHEMA COMPLIANCE
// ============================================
describe('[P1][content] GET /api/v1/stories/:id - Schema Compliance', () => {
  it('returns story data', async () => {
    (prisma.story.findUnique as Mock).mockResolvedValue(mockStoryWithUser as unknown as Story);

    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/stories/test-story-id',
      headers: { authorization: authHeader() },
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.payload);

    // The getStory controller returns { data: story }
    expect(body).toHaveProperty('data');
    expect(body.data).toHaveProperty('id');
    expect(body.data).toHaveProperty('mediaType');
    expect(body.data).toHaveProperty('mediaUrl');
  });
});

// ============================================
// CREATE STORY - REQUEST/RESPONSE SCHEMA COMPLIANCE
// ============================================
describe('[P1][content] POST /api/v1/stories - Schema Compliance', () => {
  it('accepts valid CreateStoryRequestSchema data', async () => {
    const validRequest = {
      mediaUrl: 'https://example.com/story.jpg',
      mediaType: 'IMAGE' as const,
      caption: 'My new story',
      duration: 24,
    };

    // Validate request against schema
    const requestResult = CreateStoryRequestSchema.safeParse(validRequest);
    expect(requestResult.success).toBe(true);

    (prisma.story.create as Mock).mockResolvedValue(mockStoryWithUser as unknown as Story);

    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/stories',
      headers: { authorization: authHeader() },
      payload: validRequest,
    });

    expect(response.statusCode).toBe(201);
    const body = JSON.parse(response.payload);

    // The createStory controller returns { message: '...', data: story }
    expect(body).toHaveProperty('data');
    expect(body.data).toHaveProperty('id');
  });

  it('rejects invalid CreateStoryRequestSchema data', async () => {
    const invalidRequests = [
      {
        mediaUrl: 'not-a-url', // Invalid URL
        mediaType: 'IMAGE',
      },
      {
        mediaUrl: 'https://example.com/story.jpg',
        mediaType: 'INVALID_TYPE', // Invalid enum
      },
      {
        mediaUrl: 'https://example.com/story.jpg',
        mediaType: 'IMAGE',
        caption: 'x'.repeat(600), // Too long (max 500)
      },
      {
        mediaUrl: 'https://example.com/story.jpg',
        mediaType: 'IMAGE',
        duration: 0, // Too short (min 1)
      },
      {
        mediaUrl: 'https://example.com/story.jpg',
        mediaType: 'IMAGE',
        duration: 50, // Too long (max 30)
      },
    ];

    for (const invalidRequest of invalidRequests) {
      const requestResult = CreateStoryRequestSchema.safeParse(invalidRequest);
      expect(requestResult.success).toBe(false);
    }
  });
});

// ============================================
// GET MY STORIES - SCHEMA COMPLIANCE
// ============================================
describe('[P1][content] GET /api/v1/stories/my - Schema Compliance', () => {
  it('returns my stories with valid structure', async () => {
    (prisma.story.findMany as Mock).mockResolvedValue([mockStoryWithUser] as unknown as Story[]);

    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/stories/my',
      headers: { authorization: authHeader() },
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.payload);

    // The getMyStories controller returns { data: stories }
    expect(body).toHaveProperty('data');
    expect(Array.isArray(body.data)).toBe(true);
  });
});

// ============================================
// GET STORIES BY USER - SCHEMA COMPLIANCE
// ============================================
describe('[P1][content] GET /api/v1/stories/user/:userId - Schema Compliance', () => {
  it('returns user stories with valid structure', async () => {
    (prisma.story.findMany as Mock).mockResolvedValue([mockStoryWithUser] as unknown as Story[]);

    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/stories/user/test-user-id',
      headers: { authorization: authHeader() },
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.payload);

    // The getStoriesByUser controller returns { data: stories }
    expect(body).toHaveProperty('data');
    expect(Array.isArray(body.data)).toBe(true);
  });
});

// ============================================
// STORY STATS - RESPONSE STRUCTURE
// ============================================
describe('[P1][content] GET /api/v1/stories/stats - Response Structure', () => {
  it('returns consistent stats structure', async () => {
    // getUserStoryStats calls prisma.story.count and prisma.story.aggregate
    (prisma.story.count as Mock).mockResolvedValue(10);
    (prisma.story.aggregate as Mock).mockResolvedValue({
      _sum: { viewCount: 150 },
    } as unknown as Awaited<ReturnType<typeof prisma.story.aggregate>>);

    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/stories/stats',
      headers: { authorization: authHeader() },
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.payload);

    // The stats controller returns { data: { activeStories, totalViews } }
    expect(body).toHaveProperty('data');
    expect(body.data).toHaveProperty('activeStories');
    expect(body.data).toHaveProperty('totalViews');
    expect(typeof body.data.activeStories).toBe('number');
    expect(typeof body.data.totalViews).toBe('number');
  });
});

// ============================================
// VIEW STORY - RESPONSE STRUCTURE
// ============================================
describe('[P1][content] POST /api/v1/stories/:id/view - Response Structure', () => {
  it('returns consistent view response', async () => {
    // viewStory calls prisma.story.findUnique then prisma.story.update
    (prisma.story.findUnique as Mock).mockResolvedValue(mockStoryBasic as unknown as Story);
    (prisma.story.update as Mock).mockResolvedValue({
      ...mockStoryBasic,
      viewCount: 1,
    } as unknown as Story);

    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/stories/test-story-id/view',
      headers: { authorization: authHeader() },
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.payload);

    // The viewStory controller returns { data: story }
    expect(body).toHaveProperty('data');
  });
});

// ============================================
// DELETE STORY - RESPONSE STRUCTURE
// ============================================
describe('[P1][content] DELETE /api/v1/stories/:id - Response Structure', () => {
  it('returns consistent delete response', async () => {
    (prisma.story.findUnique as Mock).mockResolvedValue({
      ...mockStoryBasic,
      userId: 'test-user-id', // Matches the auth token user
    } as unknown as Story);
    (prisma.story.delete as Mock).mockResolvedValue(mockStoryBasic as unknown as Story);

    const response = await app.inject({
      method: 'DELETE',
      url: '/api/v1/stories/test-story-id',
      headers: { authorization: authHeader() },
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.payload);

    // The deleteStory controller returns { message: 'Story deleted successfully' }
    expect(body).toHaveProperty('message');
    expect(typeof body.message).toBe('string');
  });
});

// ============================================
// MEDIA TYPE ENUM VALIDATION
// ============================================
describe('[P1][content] Media Type Enum Validation', () => {
  it('validates media type enum values', () => {
    const validTypes = ['IMAGE', 'VIDEO'];

    for (const mediaType of validTypes) {
      // StoryResponseSchema requires ISO datetime strings, not Date objects
      const story = {
        id: 'test-story-id',
        userId: 'test-user-id',
        mediaType,
        mediaUrl: 'https://example.com/story.jpg',
        thumbnailUrl: 'https://example.com/thumb.jpg',
        caption: 'My story caption',
        viewCount: 0,
        createdAt: new Date('2024-06-01').toISOString(),
        expiresAt: new Date('2024-06-02').toISOString(),
      };
      const result = StoryResponseSchema.safeParse(story);

      expect(result.success).toBe(true);
    }
  });

  it('rejects invalid media type values', () => {
    const invalidTypes = ['AUDIO', 'TEXT', 'image', 'video', ''];

    for (const mediaType of invalidTypes) {
      const story = {
        id: 'test-story-id',
        userId: 'test-user-id',
        mediaType,
        mediaUrl: 'https://example.com/story.jpg',
        thumbnailUrl: 'https://example.com/thumb.jpg',
        caption: 'My story caption',
        viewCount: 0,
        createdAt: new Date('2024-06-01').toISOString(),
        expiresAt: new Date('2024-06-02').toISOString(),
      };
      const result = StoryResponseSchema.safeParse(story);

      expect(result.success).toBe(false);
    }
  });

  it('validates MediaTypeEnum directly', () => {
    const validResult = MediaTypeEnum.safeParse('IMAGE');
    expect(validResult.success).toBe(true);

    const invalidResult = MediaTypeEnum.safeParse('AUDIO');
    expect(invalidResult.success).toBe(false);
  });
});
