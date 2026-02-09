/**
 * Story Endpoints - Contract Tests (Schema Compliance)
 * Verifies that story API responses match shared Zod schemas
 * Catches API drift between frontend and backend
 *
 * @see PRD.md Section 10 - Phase 6 Testing
 */

import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildTestApp, authHeader } from '../build-test-app.js';
import { prisma } from '../../lib/prisma.js';
import {
  StoryResponseSchema,
  CreateStoryRequestSchema,
  StoryFeedResponseSchema,
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

const mockStory = {
  id: 'test-story-id',
  userId: 'test-user-id',
  mediaType: 'IMAGE',
  mediaUrl: 'https://example.com/story.jpg',
  thumbnailUrl: 'https://example.com/thumb.jpg',
  caption: 'My story caption',
  viewCount: 0,
  createdAt: new Date('2024-06-01'),
  expiresAt: new Date('2024-06-02'),
};

// ============================================
// GET STORY FEED - SCHEMA COMPLIANCE
// ============================================
describe('GET /api/v1/stories - Schema Compliance', () => {
  it('returns story feed matching StoryFeedResponseSchema', async () => {
    vi.mocked(prisma.story.findMany).mockResolvedValue([mockStory] as any);

    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/stories?limit=20&offset=0',
      headers: { authorization: authHeader() },
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.payload);

    expect(body.success).toBe(true);

    // Validate response structure
    const feedResult = StoryFeedResponseSchema.safeParse({
      stories: body.data || body.stories || [],
      pagination: body.pagination,
    });

    if (!feedResult.success) {
      // eslint-disable-next-line no-console
      console.error('Story feed schema errors:', feedResult.error.errors);
    }

    expect(feedResult.success).toBe(true);
  });

  it('validates each story against StoryResponseSchema', async () => {
    vi.mocked(prisma.story.findMany).mockResolvedValue([mockStory] as any);

    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/stories',
      headers: { authorization: authHeader() },
    });

    const body = JSON.parse(response.payload);
    const stories = body.data || body.stories || [];

    for (const story of stories) {
      const result = StoryResponseSchema.safeParse(story);

      if (!result.success) {
        // eslint-disable-next-line no-console
        console.error('Story schema validation errors:', result.error.errors);
      }

      expect(result.success).toBe(true);
    }
  });
});

// ============================================
// GET STORY BY ID - SCHEMA COMPLIANCE
// ============================================
describe('GET /api/v1/stories/:id - Schema Compliance', () => {
  it('returns story matching StoryResponseSchema', async () => {
    vi.mocked(prisma.story.findUnique).mockResolvedValue(mockStory as any);

    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/stories/test-story-id',
      headers: { authorization: authHeader() },
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.payload);

    expect(body.success).toBe(true);

    const result = StoryResponseSchema.safeParse(body.data || body.story);

    if (!result.success) {
      // eslint-disable-next-line no-console
      console.error('Story schema validation errors:', result.error.errors);
    }

    expect(result.success).toBe(true);
  });
});

// ============================================
// CREATE STORY - REQUEST/RESPONSE SCHEMA COMPLIANCE
// ============================================
describe('POST /api/v1/stories - Schema Compliance', () => {
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

    vi.mocked(prisma.story.create).mockResolvedValue(mockStory as any);

    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/stories',
      headers: { authorization: authHeader() },
      payload: validRequest,
    });

    expect(response.statusCode).toBe(201);
    const body = JSON.parse(response.payload);

    // Validate response against schema
    const responseResult = StoryResponseSchema.safeParse(body.data || body.story);

    if (!responseResult.success) {
      // eslint-disable-next-line no-console
      console.error('Create story response schema errors:', responseResult.error.errors);
    }

    expect(responseResult.success).toBe(true);
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
describe('GET /api/v1/stories/me - Schema Compliance', () => {
  it('returns my stories with valid schema', async () => {
    vi.mocked(prisma.story.findMany).mockResolvedValue([mockStory] as any);

    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/stories/me',
      headers: { authorization: authHeader() },
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.payload);

    expect(body.success).toBe(true);
    expect(Array.isArray(body.data || body.stories)).toBe(true);

    const stories = body.data || body.stories || [];
    for (const story of stories) {
      const result = StoryResponseSchema.safeParse(story);
      expect(result.success).toBe(true);
    }
  });
});

// ============================================
// GET STORIES BY USER - SCHEMA COMPLIANCE
// ============================================
describe('GET /api/v1/stories/user/:userId - Schema Compliance', () => {
  it('returns user stories with valid schema', async () => {
    vi.mocked(prisma.story.findMany).mockResolvedValue([mockStory] as any);

    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/stories/user/test-user-id',
      headers: { authorization: authHeader() },
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.payload);

    expect(body.success).toBe(true);
    expect(Array.isArray(body.data || body.stories)).toBe(true);

    const stories = body.data || body.stories || [];
    for (const story of stories) {
      const result = StoryResponseSchema.safeParse(story);
      expect(result.success).toBe(true);
    }
  });
});

// ============================================
// STORY STATS - RESPONSE STRUCTURE
// ============================================
describe('GET /api/v1/stories/stats - Response Structure', () => {
  it('returns consistent stats structure', async () => {
    vi.mocked(prisma.story.count).mockResolvedValue(10);
    vi.mocked(prisma.story.aggregate).mockResolvedValue({
      _sum: { viewCount: 150 },
    } as any);

    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/stories/stats',
      headers: { authorization: authHeader() },
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.payload);

    expect(body.success).toBe(true);
    expect(body.data).toHaveProperty('stats');
    expect(body.data.stats).toHaveProperty('totalStories');
    expect(body.data.stats).toHaveProperty('totalViews');
    expect(body.data.stats).toHaveProperty('activeStories');
    expect(typeof body.data.stats.totalStories).toBe('number');
    expect(typeof body.data.stats.totalViews).toBe('number');
    expect(typeof body.data.stats.activeStories).toBe('number');
  });
});

// ============================================
// VIEW STORY - RESPONSE STRUCTURE
// ============================================
describe('POST /api/v1/stories/:id/view - Response Structure', () => {
  it('returns consistent view response', async () => {
    vi.mocked(prisma.story.findUnique).mockResolvedValue(mockStory as any);
    vi.mocked(prisma.story.update).mockResolvedValue({
      ...mockStory,
      viewCount: 1,
    } as any);

    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/stories/test-story-id/view',
      headers: { authorization: authHeader() },
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.payload);

    expect(body.success).toBe(true);
    expect(body).toHaveProperty('message');
    expect(typeof body.message).toBe('string');
  });
});

// ============================================
// DELETE STORY - RESPONSE STRUCTURE
// ============================================
describe('DELETE /api/v1/stories/:id - Response Structure', () => {
  it('returns consistent delete response', async () => {
    vi.mocked(prisma.story.findUnique).mockResolvedValue(mockStory as any);
    vi.mocked(prisma.story.delete).mockResolvedValue(mockStory as any);

    const response = await app.inject({
      method: 'DELETE',
      url: '/api/v1/stories/test-story-id',
      headers: { authorization: authHeader() },
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.payload);

    expect(body.success).toBe(true);
    expect(body).toHaveProperty('message');
    expect(typeof body.message).toBe('string');
  });
});

// ============================================
// MEDIA TYPE ENUM VALIDATION
// ============================================
describe('Media Type Enum Validation', () => {
  it('validates media type enum values', () => {
    const validTypes = ['IMAGE', 'VIDEO'];

    for (const mediaType of validTypes) {
      const story = { ...mockStory, mediaType };
      const result = StoryResponseSchema.safeParse(story);

      expect(result.success).toBe(true);
    }
  });

  it('rejects invalid media type values', () => {
    const invalidTypes = ['AUDIO', 'TEXT', 'image', 'video', ''];

    for (const mediaType of invalidTypes) {
      const story = { ...mockStory, mediaType };
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
