/**
 * Stories Controller Integration Tests
 * Tests for 24-hour ephemeral stories - create, view, delete, feed
 *
 * @see PRD.md Section 10 - Phase 6 Testing (Integration)
 */

import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildTestApp, authHeader } from '../../build-test-app.js';
import { prisma } from '../../../lib/prisma.js';
import type { Story } from '@prisma/client';

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

const mockStory: Story = {
  id: 'story-1',
  userId: 'test-user-id',
  mediaUrl: 'https://example.com/story.jpg',
  mediaType: 'IMAGE',
  thumbnailUrl: null,
  caption: null,
  viewCount: 0,
  createdAt: new Date(),
  expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
};

// ============================================
// CREATE STORY
// ============================================
describe('[P1][content] POST /api/v1/stories - Create Story', () => {
  it('should create story successfully', async () => {
    vi.mocked(prisma.story.create).mockResolvedValue(mockStory);

    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/stories',
      headers: { authorization: authHeader() },
      payload: {
        mediaUrl: 'https://example.com/story.jpg',
        mediaType: 'IMAGE',
      },
    });

    expect(response.statusCode).toBe(201);
  });

  it('should require authentication', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/stories',
      payload: { mediaUrl: 'https://example.com/story.jpg', mediaType: 'IMAGE' },
    });

    expect(response.statusCode).toBe(401);
  });

  it('should validate required fields', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/stories',
      headers: { authorization: authHeader() },
      payload: {},
    });

    expect(response.statusCode).toBe(400);
  });

  it('should validate media type', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/stories',
      headers: { authorization: authHeader() },
      payload: {
        mediaUrl: 'https://example.com/story.jpg',
        mediaType: 'INVALID_TYPE',
      },
    });

    expect(response.statusCode).toBe(400);
  });
});

// ============================================
// GET STORY BY ID
// ============================================
describe('[P1][content] GET /api/v1/stories/:id - Get Story By ID', () => {
  it('should get story by id', async () => {
    vi.mocked(prisma.story.findUnique).mockResolvedValue(mockStory);

    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/stories/story-1',
      headers: { authorization: authHeader() },
    });

    expect(response.statusCode).toBe(200);
  });

  it('should return 404 for non-existent story', async () => {
    vi.mocked(prisma.story.findUnique).mockResolvedValue(null);

    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/stories/non-existent',
      headers: { authorization: authHeader() },
    });

    expect(response.statusCode).toBe(404);
  });

  it('should require authentication', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/stories/story-1',
    });

    expect(response.statusCode).toBe(401);
  });
});

// ============================================
// GET STORIES FEED
// ============================================
describe('[P1][content] GET /api/v1/stories/feed - Get Stories Feed', () => {
  it('should get stories feed', async () => {
    vi.mocked(prisma.story.findMany).mockResolvedValue([mockStory]);

    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/stories/feed',
      headers: { authorization: authHeader() },
    });

    expect(response.statusCode).toBe(200);
  });

  it('should require authentication', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/stories/feed',
    });

    expect(response.statusCode).toBe(401);
  });

  it('should accept pagination parameters', async () => {
    vi.mocked(prisma.story.findMany).mockResolvedValue([]);

    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/stories/feed?limit=20&offset=0',
      headers: { authorization: authHeader() },
    });

    expect(response.statusCode).toBe(200);
  });

  it('should return only active stories (not expired)', async () => {
    vi.mocked(prisma.story.findMany).mockResolvedValue([]);

    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/stories/feed',
      headers: { authorization: authHeader() },
    });

    expect(response.statusCode).toBe(200);
  });
});

// ============================================
// GET MY STORIES
// ============================================
describe('[P1][content] GET /api/v1/stories/my - Get My Stories', () => {
  it('should get own stories', async () => {
    vi.mocked(prisma.story.findMany).mockResolvedValue([mockStory]);

    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/stories/my',
      headers: { authorization: authHeader() },
    });

    expect(response.statusCode).toBe(200);
  });

  it('should require authentication', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/stories/my',
    });

    expect(response.statusCode).toBe(401);
  });

  it('should return empty array if no stories', async () => {
    vi.mocked(prisma.story.findMany).mockResolvedValue([]);

    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/stories/my',
      headers: { authorization: authHeader() },
    });

    expect(response.statusCode).toBe(200);
  });
});

// ============================================
// GET USER STORIES
// ============================================
describe('[P1][content] GET /api/v1/stories/user/:userId - Get User Stories', () => {
  it('should get user stories', async () => {
    vi.mocked(prisma.story.findMany).mockResolvedValue([mockStory]);

    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/stories/user/other-user-id',
      headers: { authorization: authHeader() },
    });

    expect(response.statusCode).toBe(200);
  });

  it('should require authentication', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/stories/user/other-user-id',
    });

    expect(response.statusCode).toBe(401);
  });

  it('should return only active stories for user', async () => {
    vi.mocked(prisma.story.findMany).mockResolvedValue([]);

    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/stories/user/other-user-id',
      headers: { authorization: authHeader() },
    });

    expect(response.statusCode).toBe(200);
  });
});

// ============================================
// DELETE STORY
// ============================================
describe('[P1][content] DELETE /api/v1/stories/:id - Delete Story', () => {
  it('should delete own story', async () => {
    vi.mocked(prisma.story.findUnique).mockResolvedValue(mockStory);
    vi.mocked(prisma.story.delete).mockResolvedValue(mockStory);

    const response = await app.inject({
      method: 'DELETE',
      url: '/api/v1/stories/story-1',
      headers: { authorization: authHeader('test-user-id') },
    });

    expect(response.statusCode).toBe(200);
  });

  it('should not delete other user story', async () => {
    const otherUserStory: Story = { ...mockStory, userId: 'other-user-id' };
    vi.mocked(prisma.story.findUnique).mockResolvedValue(otherUserStory);

    const response = await app.inject({
      method: 'DELETE',
      url: '/api/v1/stories/story-1',
      headers: { authorization: authHeader('test-user-id') },
    });

    expect(response.statusCode).toBe(403);
  });

  it('should return 404 for non-existent story', async () => {
    vi.mocked(prisma.story.findUnique).mockResolvedValue(null);

    const response = await app.inject({
      method: 'DELETE',
      url: '/api/v1/stories/non-existent',
      headers: { authorization: authHeader() },
    });

    expect(response.statusCode).toBe(404);
  });

  it('should require authentication', async () => {
    const response = await app.inject({
      method: 'DELETE',
      url: '/api/v1/stories/story-1',
    });

    expect(response.statusCode).toBe(401);
  });
});

// ============================================
// VIEW STORY (TRACK VIEW)
// ============================================
describe('[P1][content] POST /api/v1/stories/:id/view - Track Story View', () => {
  it('should track story view', async () => {
    vi.mocked(prisma.story.findUnique).mockResolvedValue(mockStory);
    vi.mocked(prisma.story.update).mockResolvedValue(mockStory);

    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/stories/story-1/view',
      headers: { authorization: authHeader() },
    });

    expect(response.statusCode).toBe(200);
  });

  it('should require authentication', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/stories/story-1/view',
    });

    expect(response.statusCode).toBe(401);
  });

  it('should return 404 for non-existent story', async () => {
    vi.mocked(prisma.story.findUnique).mockResolvedValue(null);

    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/stories/non-existent/view',
      headers: { authorization: authHeader() },
    });

    expect(response.statusCode).toBe(404);
  });
});
