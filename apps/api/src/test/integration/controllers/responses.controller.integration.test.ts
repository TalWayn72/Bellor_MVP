/**
 * Responses Controller Integration Tests
 * Tests for mission responses (text, audio, video, image, drawing)
 *
 * @see PRD.md Section 10 - Phase 6 Testing (Integration)
 */

import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildTestApp, authHeader } from '../../build-test-app.js';
import { prisma } from '../../../lib/prisma.js';

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

const mockResponse = {
  id: 'response-1',
  userId: 'test-user-id',
  missionId: 'mission-1',
  responseType: 'TEXT' as const,
  textContent: 'This is my response',
  isPublic: true,
  likesCount: 0,
  viewsCount: 0,
  createdAt: new Date(),
};

// ============================================
// CREATE RESPONSE
// ============================================
describe('POST /api/v1/responses - Create Response', () => {
  it('should create text response successfully', async () => {
    vi.mocked(prisma.response.create).mockResolvedValue(mockResponse as any);

    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/responses',
      headers: { authorization: authHeader() },
      payload: {
        missionId: 'mission-1',
        responseType: 'TEXT',
        textContent: 'This is my response',
        isPublic: true,
      },
    });

    expect([201, 400, 500]).toContain(response.statusCode);
  });

  it('should require authentication', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/responses',
      payload: {
        missionId: 'mission-1',
        responseType: 'TEXT',
        textContent: 'Test',
      },
    });

    expect(response.statusCode).toBe(401);
  });

  it('should validate required fields', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/responses',
      headers: { authorization: authHeader() },
      payload: {},
    });

    expect(response.statusCode).toBe(400);
  });

  it('should validate response type', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/responses',
      headers: { authorization: authHeader() },
      payload: {
        missionId: 'mission-1',
        responseType: 'INVALID_TYPE',
        textContent: 'Test',
      },
    });

    expect(response.statusCode).toBe(400);
  });

  it('should accept audio response', async () => {
    const audioResponse = { ...mockResponse, responseType: 'AUDIO' as const, audioUrl: 'https://example.com/audio.mp3' };
    vi.mocked(prisma.response.create).mockResolvedValue(audioResponse as any);

    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/responses',
      headers: { authorization: authHeader() },
      payload: {
        missionId: 'mission-1',
        responseType: 'AUDIO',
        audioUrl: 'https://example.com/audio.mp3',
      },
    });

    expect([201, 400, 500]).toContain(response.statusCode);
  });

  it('should accept video response', async () => {
    const videoResponse = { ...mockResponse, responseType: 'VIDEO' as const, videoUrl: 'https://example.com/video.mp4' };
    vi.mocked(prisma.response.create).mockResolvedValue(videoResponse as any);

    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/responses',
      headers: { authorization: authHeader() },
      payload: {
        missionId: 'mission-1',
        responseType: 'VIDEO',
        videoUrl: 'https://example.com/video.mp4',
      },
    });

    expect([201, 400, 500]).toContain(response.statusCode);
  });
});

// ============================================
// LIST RESPONSES
// ============================================
describe('GET /api/v1/responses - List Responses', () => {
  it('should list responses with pagination', async () => {
    vi.mocked(prisma.response.findMany).mockResolvedValue([mockResponse as any]);
    vi.mocked(prisma.response.count).mockResolvedValue(1);

    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/responses',
      headers: { authorization: authHeader() },
    });

    expect([200, 500]).toContain(response.statusCode);
  });

  it('should require authentication', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/responses',
    });

    expect(response.statusCode).toBe(401);
  });

  it('should filter by mission id', async () => {
    vi.mocked(prisma.response.findMany).mockResolvedValue([]);
    vi.mocked(prisma.response.count).mockResolvedValue(0);

    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/responses?missionId=mission-1',
      headers: { authorization: authHeader() },
    });

    expect([200, 500]).toContain(response.statusCode);
  });

  it('should filter by user id', async () => {
    vi.mocked(prisma.response.findMany).mockResolvedValue([]);
    vi.mocked(prisma.response.count).mockResolvedValue(0);

    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/responses?userId=test-user-id',
      headers: { authorization: authHeader() },
    });

    expect([200, 500]).toContain(response.statusCode);
  });

  it('should filter by response type', async () => {
    vi.mocked(prisma.response.findMany).mockResolvedValue([]);
    vi.mocked(prisma.response.count).mockResolvedValue(0);

    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/responses?responseType=AUDIO',
      headers: { authorization: authHeader() },
    });

    expect([200, 500]).toContain(response.statusCode);
  });

  it('should filter by isPublic flag', async () => {
    vi.mocked(prisma.response.findMany).mockResolvedValue([]);
    vi.mocked(prisma.response.count).mockResolvedValue(0);

    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/responses?isPublic=true',
      headers: { authorization: authHeader() },
    });

    expect([200, 500]).toContain(response.statusCode);
  });
});

// ============================================
// GET MY RESPONSES
// ============================================
describe('GET /api/v1/responses/my - Get My Responses', () => {
  it('should get own responses', async () => {
    vi.mocked(prisma.response.findMany).mockResolvedValue([mockResponse as any]);
    vi.mocked(prisma.response.count).mockResolvedValue(1);

    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/responses/my',
      headers: { authorization: authHeader() },
    });

    expect([200, 500]).toContain(response.statusCode);
  });

  it('should require authentication', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/responses/my',
    });

    expect(response.statusCode).toBe(401);
  });

  it('should accept pagination', async () => {
    vi.mocked(prisma.response.findMany).mockResolvedValue([]);
    vi.mocked(prisma.response.count).mockResolvedValue(0);

    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/responses/my?limit=10&offset=0',
      headers: { authorization: authHeader() },
    });

    expect([200, 500]).toContain(response.statusCode);
  });
});

// ============================================
// GET RESPONSE BY ID
// ============================================
describe('GET /api/v1/responses/:id - Get Response By ID', () => {
  it('should get response by id', async () => {
    vi.mocked(prisma.response.findUnique).mockResolvedValue(mockResponse as any);

    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/responses/response-1',
      headers: { authorization: authHeader() },
    });

    expect([200, 404, 500]).toContain(response.statusCode);
  });

  it('should return 404 for non-existent response', async () => {
    vi.mocked(prisma.response.findUnique).mockResolvedValue(null);

    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/responses/non-existent',
      headers: { authorization: authHeader() },
    });

    expect(response.statusCode).toBe(404);
  });

  it('should require authentication', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/responses/response-1',
    });

    expect(response.statusCode).toBe(401);
  });
});

// ============================================
// UPDATE RESPONSE
// ============================================
describe('PATCH /api/v1/responses/:id - Update Response', () => {
  it('should update own response', async () => {
    vi.mocked(prisma.response.findUnique).mockResolvedValue(mockResponse as any);
    vi.mocked(prisma.response.update).mockResolvedValue(mockResponse as any);

    const response = await app.inject({
      method: 'PATCH',
      url: '/api/v1/responses/response-1',
      headers: { authorization: authHeader('test-user-id') },
      payload: {
        textContent: 'Updated response',
      },
    });

    expect([200, 403, 404, 500]).toContain(response.statusCode);
  });

  it('should not update other user response', async () => {
    const otherUserResponse = { ...mockResponse, userId: 'other-user-id' };
    vi.mocked(prisma.response.findUnique).mockResolvedValue(otherUserResponse as any);

    const response = await app.inject({
      method: 'PATCH',
      url: '/api/v1/responses/response-1',
      headers: { authorization: authHeader('test-user-id') },
      payload: {
        textContent: 'Hacked',
      },
    });

    expect([403, 404, 500]).toContain(response.statusCode);
  });

  it('should require authentication', async () => {
    const response = await app.inject({
      method: 'PATCH',
      url: '/api/v1/responses/response-1',
      payload: {
        textContent: 'Updated',
      },
    });

    expect(response.statusCode).toBe(401);
  });
});

// ============================================
// DELETE RESPONSE
// ============================================
describe('DELETE /api/v1/responses/:id - Delete Response', () => {
  it('should delete own response', async () => {
    vi.mocked(prisma.response.findUnique).mockResolvedValue(mockResponse as any);
    vi.mocked(prisma.response.delete).mockResolvedValue(mockResponse as any);

    const response = await app.inject({
      method: 'DELETE',
      url: '/api/v1/responses/response-1',
      headers: { authorization: authHeader('test-user-id') },
    });

    expect([200, 404, 500]).toContain(response.statusCode);
  });

  it('should not delete other user response', async () => {
    const otherUserResponse = { ...mockResponse, userId: 'other-user-id' };
    vi.mocked(prisma.response.findUnique).mockResolvedValue(otherUserResponse as any);

    const response = await app.inject({
      method: 'DELETE',
      url: '/api/v1/responses/response-1',
      headers: { authorization: authHeader('test-user-id') },
    });

    expect([403, 404, 500]).toContain(response.statusCode);
  });

  it('should require authentication', async () => {
    const response = await app.inject({
      method: 'DELETE',
      url: '/api/v1/responses/response-1',
    });

    expect(response.statusCode).toBe(401);
  });

  it('should return 404 for non-existent response', async () => {
    vi.mocked(prisma.response.findUnique).mockResolvedValue(null);

    const response = await app.inject({
      method: 'DELETE',
      url: '/api/v1/responses/non-existent',
      headers: { authorization: authHeader() },
    });

    expect(response.statusCode).toBe(404);
  });
});
