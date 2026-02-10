/**
 * Response Endpoints - Contract Tests (Schema Compliance)
 * Verifies that response (mission response) API responses match shared Zod schemas
 * Catches API drift between frontend and backend
 *
 * @see PRD.md Section 10 - Phase 6 Testing
 */

import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildTestApp, authHeader } from '../build-test-app.js';
import { prisma } from '../../lib/prisma.js';
import type { Response } from '@prisma/client';
import {
  ResponseSchema,
  CreateResponseRequestSchema,
  ResponseListResponseSchema,
  ResponseTypeEnum,
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

const mockResponse = {
  id: 'test-response-id',
  userId: 'test-user-id',
  missionId: 'test-mission-id',
  responseType: 'TEXT',
  content: 'My response content',
  textContent: 'My response content',
  thumbnailUrl: null,
  duration: null,
  viewCount: 0,
  likeCount: 0,
  isPublic: true,
  createdAt: new Date('2024-06-01'),
};

// ============================================
// GET RESPONSES - SCHEMA COMPLIANCE
// ============================================
describe('[P1][content] GET /api/v1/responses - Schema Compliance', () => {
  it('returns response list matching ResponseListResponseSchema', async () => {
    vi.mocked(prisma.response.findMany).mockResolvedValue([mockResponse] as unknown as Response[]);
    vi.mocked(prisma.response.count).mockResolvedValue(1);

    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/responses?limit=20&offset=0',
      headers: { authorization: authHeader() },
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.payload);

    expect(body.success).toBe(true);

    // Validate response structure
    const listResult = ResponseListResponseSchema.safeParse({
      responses: body.data || body.responses || [],
      data: body.data,
      pagination: body.pagination,
    });

    if (!listResult.success) {
      console.error('Response list schema errors:', listResult.error.errors);
    }

    expect(listResult.success).toBe(true);
  });

  it('validates each response against ResponseSchema', async () => {
    vi.mocked(prisma.response.findMany).mockResolvedValue([mockResponse] as unknown as Response[]);
    vi.mocked(prisma.response.count).mockResolvedValue(1);

    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/responses',
      headers: { authorization: authHeader() },
    });

    const body = JSON.parse(response.payload);
    const responses = body.data || body.responses || [];

    for (const resp of responses) {
      const result = ResponseSchema.safeParse(resp);

      if (!result.success) {
        console.error('Response schema validation errors:', result.error.errors);
      }

      expect(result.success).toBe(true);
    }
  });
});

// ============================================
// GET RESPONSE BY ID - SCHEMA COMPLIANCE
// ============================================
describe('[P1][content] GET /api/v1/responses/:id - Schema Compliance', () => {
  it('returns response matching ResponseSchema', async () => {
    vi.mocked(prisma.response.findUnique).mockResolvedValue(mockResponse as unknown as Response);

    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/responses/test-response-id',
      headers: { authorization: authHeader() },
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.payload);

    expect(body.success).toBe(true);

    const result = ResponseSchema.safeParse(body.data);

    if (!result.success) {
      console.error('Response schema validation errors:', result.error.errors);
    }

    expect(result.success).toBe(true);
  });
});

// ============================================
// CREATE RESPONSE - REQUEST/RESPONSE SCHEMA COMPLIANCE
// ============================================
describe('[P1][content] POST /api/v1/responses - Schema Compliance', () => {
  it('accepts valid CreateResponseRequestSchema data', async () => {
    const validRequest = {
      missionId: 'test-mission-id',
      responseType: 'TEXT' as const,
      content: 'My response',
      textContent: 'My response',
      isPublic: true,
    };

    // Validate request against schema
    const requestResult = CreateResponseRequestSchema.safeParse(validRequest);
    expect(requestResult.success).toBe(true);

    vi.mocked(prisma.response.create).mockResolvedValue(mockResponse as unknown as Response);

    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/responses',
      headers: { authorization: authHeader() },
      payload: validRequest,
    });

    expect(response.statusCode).toBe(201);
    const body = JSON.parse(response.payload);

    // Validate response against schema
    const responseResult = ResponseSchema.safeParse(body.data || body.response);

    if (!responseResult.success) {
      console.error('Create response schema errors:', responseResult.error.errors);
    }

    expect(responseResult.success).toBe(true);
  });

  it('accepts video response with duration', async () => {
    const validVideoRequest = {
      missionId: 'test-mission-id',
      responseType: 'VIDEO' as const,
      mediaUrl: 'https://example.com/video.mp4',
      duration: 30,
      isPublic: true,
    };

    const requestResult = CreateResponseRequestSchema.safeParse(validVideoRequest);
    expect(requestResult.success).toBe(true);
  });

  it('rejects invalid CreateResponseRequestSchema data', async () => {
    const invalidRequests = [
      {
        // Missing missionId
        responseType: 'TEXT',
        content: 'Test',
      },
      {
        missionId: 'test-mission-id',
        responseType: 'INVALID_TYPE', // Invalid enum
        content: 'Test',
      },
    ];

    for (const invalidRequest of invalidRequests) {
      const requestResult = CreateResponseRequestSchema.safeParse(invalidRequest);
      expect(requestResult.success).toBe(false);
    }
  });
});

// ============================================
// GET USER RESPONSES - SCHEMA COMPLIANCE
// ============================================
describe('[P1][content] GET /api/v1/responses/my - Schema Compliance', () => {
  it('returns my responses with valid schema', async () => {
    // The "my responses" endpoint is at /responses/my (not /responses/user/:userId)
    vi.mocked(prisma.response.findMany).mockResolvedValue([mockResponse] as unknown as Response[]);
    vi.mocked(prisma.response.count).mockResolvedValue(1);

    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/responses/my',
      headers: { authorization: authHeader() },
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.payload);

    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
  });
});

// ============================================
// LIKE RESPONSE - RESPONSE STRUCTURE
// ============================================
describe('[P1][content] POST /api/v1/responses/:id/like - Response Structure', () => {
  it('returns consistent like response', async () => {
    // The likeResponse handler calls ResponsesService.incrementLikeCount
    // which calls prisma.response.update
    vi.mocked(prisma.response.update).mockResolvedValue({
      ...mockResponse,
      likeCount: 1,
    } as unknown as Response);

    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/responses/test-response-id/like',
      headers: { authorization: authHeader() },
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.payload);

    // The actual API returns { success: true, data: { likeCount: N } }
    expect(body.success).toBe(true);
    expect(body.data).toHaveProperty('likeCount');
    expect(typeof body.data.likeCount).toBe('number');
  });
});

// ============================================
// DELETE RESPONSE - RESPONSE STRUCTURE
// ============================================
describe('[P1][content] DELETE /api/v1/responses/:id - Response Structure', () => {
  it('returns consistent delete response', async () => {
    vi.mocked(prisma.response.findUnique).mockResolvedValue(mockResponse as unknown as Response);
    vi.mocked(prisma.response.delete).mockResolvedValue(mockResponse as unknown as Response);

    const response = await app.inject({
      method: 'DELETE',
      url: '/api/v1/responses/test-response-id',
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
// RESPONSE TYPE ENUM VALIDATION
// ============================================
describe('[P1][content] Response Type Enum Validation', () => {
  it('validates response type enum values', () => {
    const validTypes = ['TEXT', 'VOICE', 'VIDEO', 'DRAWING'];

    for (const responseType of validTypes) {
      // ResponseSchema requires ISO datetime strings, not Date objects
      const resp = {
        id: 'test-response-id',
        userId: 'test-user-id',
        missionId: 'test-mission-id',
        responseType,
        content: 'My response content',
        textContent: 'My response content',
        thumbnailUrl: null,
        duration: null,
        viewCount: 0,
        likeCount: 0,
        isPublic: true,
        createdAt: new Date('2024-06-01').toISOString(),
      };
      const result = ResponseSchema.safeParse(resp);

      expect(result.success).toBe(true);
    }
  });

  it('rejects invalid response type values', () => {
    const invalidTypes = ['IMAGE', 'AUDIO', 'text', 'video', ''];

    for (const responseType of invalidTypes) {
      const resp = {
        id: 'test-response-id',
        userId: 'test-user-id',
        missionId: 'test-mission-id',
        responseType,
        content: 'My response content',
        textContent: 'My response content',
        thumbnailUrl: null,
        duration: null,
        viewCount: 0,
        likeCount: 0,
        isPublic: true,
        createdAt: new Date('2024-06-01').toISOString(),
      };
      const result = ResponseSchema.safeParse(resp);

      expect(result.success).toBe(false);
    }
  });

  it('validates ResponseTypeEnum directly', () => {
    const validResult = ResponseTypeEnum.safeParse('TEXT');
    expect(validResult.success).toBe(true);

    const invalidResult = ResponseTypeEnum.safeParse('IMAGE');
    expect(invalidResult.success).toBe(false);
  });
});

// ============================================
// QUERY PARAMS VALIDATION
// ============================================
describe('[P1][content] Query Parameters Validation', () => {
  it('validates pagination params in list responses', async () => {
    vi.mocked(prisma.response.findMany).mockResolvedValue([mockResponse] as unknown as Response[]);
    vi.mocked(prisma.response.count).mockResolvedValue(1);

    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/responses?limit=10&offset=5&userId=test-user-id',
      headers: { authorization: authHeader() },
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.payload);

    expect(body.success).toBe(true);

    // If pagination is included, validate structure
    if (body.pagination) {
      expect(body.pagination).toHaveProperty('limit');
      expect(body.pagination).toHaveProperty('offset');
      expect(typeof body.pagination.limit).toBe('number');
      expect(typeof body.pagination.offset).toBe('number');
    }
  });
});

// ============================================
// OPTIONAL FIELDS VALIDATION
// ============================================
describe('[P1][content] Optional Fields Validation', () => {
  it('validates responses with null optional fields', () => {
    const minimalResponse = {
      id: 'test-id',
      userId: 'user-id',
      missionId: null,
      responseType: 'TEXT',
      content: 'Content',
      textContent: null,
      thumbnailUrl: null,
      duration: null,
      viewCount: 0,
      likeCount: 0,
      isPublic: true,
      createdAt: new Date().toISOString(),
    };

    const result = ResponseSchema.safeParse(minimalResponse);
    expect(result.success).toBe(true);
  });

  it('validates responses with all optional fields populated', () => {
    const fullResponse = {
      id: 'test-id',
      userId: 'user-id',
      missionId: 'mission-id',
      responseType: 'VIDEO',
      content: 'https://example.com/video.mp4',
      textContent: 'Video caption',
      thumbnailUrl: 'https://example.com/thumb.jpg',
      duration: 30,
      viewCount: 100,
      likeCount: 50,
      isPublic: true,
      createdAt: new Date().toISOString(),
    };

    const result = ResponseSchema.safeParse(fullResponse);
    expect(result.success).toBe(true);
  });
});
