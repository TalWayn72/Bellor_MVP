/**
 * Reports Controller Integration Tests
 * Tests for content/user reporting and moderation
 *
 * @see PRD.md Section 10 - Phase 6 Testing (Integration)
 */

import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildTestApp, authHeader, adminAuthHeader } from '../../build-test-app.js';
import { prisma } from '../../../lib/prisma.js';
import type { Report } from '@prisma/client';

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

const mockReport: Report = {
  id: 'report-1',
  reporterId: 'test-user-id',
  reportedUserId: 'reported-user-id',
  reportedContentType: null,
  reportedContentId: null,
  reason: 'HARASSMENT',
  description: 'User is harassing others',
  priority: 1,
  status: 'PENDING',
  reviewedBy: null,
  reviewNotes: null,
  createdAt: new Date(),
  reviewedAt: null,
};

// ============================================
// CREATE REPORT
// ============================================
describe('[P0][safety] POST /api/v1/reports - Create Report', () => {
  it('should create report successfully', async () => {
    vi.mocked(prisma.report.create).mockResolvedValue(mockReport);

    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/reports',
      headers: { authorization: authHeader() },
      payload: {
        reportedUserId: 'reported-user-id',
        reason: 'HARASSMENT',
        description: 'User is harassing others',
      },
    });

    expect(response.statusCode).toBe(201);
  });

  it('should require authentication', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/reports',
      payload: {
        reportedUserId: 'reported-user-id',
        reason: 'HARASSMENT',
      },
    });

    expect(response.statusCode).toBe(401);
  });

  it('should reject reporting self', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/reports',
      headers: { authorization: authHeader('test-user-id') },
      payload: {
        reportedUserId: 'test-user-id',
        reason: 'HARASSMENT',
      },
    });

    expect(response.statusCode).toBe(400);
  });

  it('should validate required fields', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/reports',
      headers: { authorization: authHeader() },
      payload: {},
    });

    expect(response.statusCode).toBe(400);
  });

  it('should validate reason enum', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/reports',
      headers: { authorization: authHeader() },
      payload: {
        reportedUserId: 'reported-user-id',
        reason: 'INVALID_REASON',
      },
    });

    expect(response.statusCode).toBe(400);
  });

  it('should accept content type and id', async () => {
    const reportWithContent: Report = {
      ...mockReport,
      reportedContentType: 'MESSAGE',
      reportedContentId: 'message-1',
    };
    vi.mocked(prisma.report.create).mockResolvedValue(reportWithContent);

    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/reports',
      headers: { authorization: authHeader() },
      payload: {
        reportedUserId: 'reported-user-id',
        reason: 'INAPPROPRIATE_CONTENT',
        contentType: 'MESSAGE',
        contentId: 'message-1',
      },
    });

    expect(response.statusCode).toBe(201);
  });
});

// ============================================
// GET REPORT BY ID (ADMIN)
// ============================================
describe('[P0][safety] GET /api/v1/reports/:id - Get Report By ID (Admin)', () => {
  it('should get report by id as admin', async () => {
    vi.mocked(prisma.report.findUnique).mockResolvedValue(mockReport);

    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/reports/report-1',
      headers: { authorization: adminAuthHeader() },
    });

    expect(response.statusCode).toBe(200);
  });

  it('should reject non-admin access', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/reports/report-1',
      headers: { authorization: authHeader() },
    });

    expect(response.statusCode).toBe(403);
  });

  it('should require authentication', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/reports/report-1',
    });

    expect(response.statusCode).toBe(401);
  });

  it('should return 404 for non-existent report', async () => {
    vi.mocked(prisma.report.findUnique).mockResolvedValue(null);

    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/reports/non-existent',
      headers: { authorization: adminAuthHeader() },
    });

    expect(response.statusCode).toBe(404);
  });
});

// ============================================
// LIST REPORTS (ADMIN)
// ============================================
describe('[P0][safety] GET /api/v1/reports - List Reports (Admin)', () => {
  it('should list reports as admin', async () => {
    vi.mocked(prisma.report.findMany).mockResolvedValue([mockReport]);
    vi.mocked(prisma.report.count).mockResolvedValue(1);

    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/reports',
      headers: { authorization: adminAuthHeader() },
    });

    expect(response.statusCode).toBe(200);
  });

  it('should reject non-admin access', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/reports',
      headers: { authorization: authHeader() },
    });

    expect(response.statusCode).toBe(403);
  });

  it('should require authentication', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/reports',
    });

    expect(response.statusCode).toBe(401);
  });

  it('should filter by status', async () => {
    vi.mocked(prisma.report.findMany).mockResolvedValue([]);
    vi.mocked(prisma.report.count).mockResolvedValue(0);

    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/reports?status=PENDING',
      headers: { authorization: adminAuthHeader() },
    });

    expect(response.statusCode).toBe(200);
  });

  it('should filter by reason', async () => {
    vi.mocked(prisma.report.findMany).mockResolvedValue([]);
    vi.mocked(prisma.report.count).mockResolvedValue(0);

    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/reports?reason=HARASSMENT',
      headers: { authorization: adminAuthHeader() },
    });

    expect(response.statusCode).toBe(200);
  });

  it('should accept pagination', async () => {
    vi.mocked(prisma.report.findMany).mockResolvedValue([]);
    vi.mocked(prisma.report.count).mockResolvedValue(0);

    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/reports?limit=20&offset=0',
      headers: { authorization: adminAuthHeader() },
    });

    expect(response.statusCode).toBe(200);
  });
});

// ============================================
// REVIEW REPORT (ADMIN)
// ============================================
describe('[P0][safety] PATCH /api/v1/reports/:id/review - Review Report (Admin)', () => {
  it('should review report as admin', async () => {
    vi.mocked(prisma.report.findUnique).mockResolvedValue(mockReport);
    vi.mocked(prisma.report.update).mockResolvedValue({ ...mockReport, status: 'REVIEWED' });

    const response = await app.inject({
      method: 'PATCH',
      url: '/api/v1/reports/report-1/review',
      headers: { authorization: adminAuthHeader() },
      payload: {
        status: 'REVIEWED',
        reviewNotes: 'User warned',
      },
    });

    expect(response.statusCode).toBe(200);
  });

  it('should reject non-admin access', async () => {
    const response = await app.inject({
      method: 'PATCH',
      url: '/api/v1/reports/report-1/review',
      headers: { authorization: authHeader() },
      payload: {
        status: 'RESOLVED',
      },
    });

    expect(response.statusCode).toBe(403);
  });

  it('should require authentication', async () => {
    const response = await app.inject({
      method: 'PATCH',
      url: '/api/v1/reports/report-1/review',
      payload: {
        status: 'RESOLVED',
      },
    });

    expect(response.statusCode).toBe(401);
  });

  it('should validate status value', async () => {
    const response = await app.inject({
      method: 'PATCH',
      url: '/api/v1/reports/report-1/review',
      headers: { authorization: adminAuthHeader() },
      payload: {
        status: 'INVALID_STATUS',
      },
    });

    expect(response.statusCode).toBe(400);
  });
});

// ============================================
// GET REPORTS BY USER (ADMIN)
// ============================================
describe('[P0][safety] GET /api/v1/reports/user/:userId - Get Reports By User (Admin)', () => {
  it('should get reports for specific user as admin', async () => {
    vi.mocked(prisma.report.findMany).mockResolvedValue([mockReport]);

    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/reports/user/reported-user-id',
      headers: { authorization: adminAuthHeader() },
    });

    expect(response.statusCode).toBe(200);
  });

  it('should reject non-admin access', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/reports/user/reported-user-id',
      headers: { authorization: authHeader() },
    });

    expect(response.statusCode).toBe(403);
  });

  it('should require authentication', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/reports/user/reported-user-id',
    });

    expect(response.statusCode).toBe(401);
  });
});
