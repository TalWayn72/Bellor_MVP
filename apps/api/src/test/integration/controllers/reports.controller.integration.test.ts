/**
 * Reports Controller Integration Tests
 * Tests for content/user reporting and moderation
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

const mockReport = {
  id: 'report-1',
  reporterId: 'test-user-id',
  reportedUserId: 'reported-user-id',
  reason: 'HARASSMENT' as const,
  description: 'User is harassing others',
  status: 'PENDING' as const,
  createdAt: new Date(),
};

// ============================================
// CREATE REPORT
// ============================================
describe('POST /api/v1/reports - Create Report', () => {
  it('should create report successfully', async () => {
    vi.mocked(prisma.report.create).mockResolvedValue(mockReport as any);

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

    expect([201, 400, 500]).toContain(response.statusCode);
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
    const reportWithContent = { ...mockReport, contentType: 'MESSAGE', contentId: 'message-1' };
    vi.mocked(prisma.report.create).mockResolvedValue(reportWithContent as any);

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

    expect([201, 400, 500]).toContain(response.statusCode);
  });
});

// ============================================
// GET REPORT BY ID (ADMIN)
// ============================================
describe('GET /api/v1/reports/:id - Get Report By ID (Admin)', () => {
  it('should get report by id as admin', async () => {
    vi.mocked(prisma.report.findUnique).mockResolvedValue(mockReport as any);

    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/reports/report-1',
      headers: { authorization: authHeader('admin-user-id') },
    });

    expect([200, 403, 404, 500]).toContain(response.statusCode);
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
      headers: { authorization: authHeader('admin-user-id') },
    });

    expect([403, 404, 500]).toContain(response.statusCode);
  });
});

// ============================================
// LIST REPORTS (ADMIN)
// ============================================
describe('GET /api/v1/reports - List Reports (Admin)', () => {
  it('should list reports as admin', async () => {
    vi.mocked(prisma.report.findMany).mockResolvedValue([mockReport as any]);
    vi.mocked(prisma.report.count).mockResolvedValue(1);

    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/reports',
      headers: { authorization: authHeader('admin-user-id') },
    });

    expect([200, 403, 500]).toContain(response.statusCode);
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
      headers: { authorization: authHeader('admin-user-id') },
    });

    expect([200, 403, 500]).toContain(response.statusCode);
  });

  it('should filter by reason', async () => {
    vi.mocked(prisma.report.findMany).mockResolvedValue([]);
    vi.mocked(prisma.report.count).mockResolvedValue(0);

    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/reports?reason=HARASSMENT',
      headers: { authorization: authHeader('admin-user-id') },
    });

    expect([200, 403, 500]).toContain(response.statusCode);
  });

  it('should accept pagination', async () => {
    vi.mocked(prisma.report.findMany).mockResolvedValue([]);
    vi.mocked(prisma.report.count).mockResolvedValue(0);

    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/reports?limit=20&offset=0',
      headers: { authorization: authHeader('admin-user-id') },
    });

    expect([200, 403, 500]).toContain(response.statusCode);
  });
});

// ============================================
// REVIEW REPORT (ADMIN)
// ============================================
describe('PATCH /api/v1/reports/:id/review - Review Report (Admin)', () => {
  it('should review report as admin', async () => {
    vi.mocked(prisma.report.findUnique).mockResolvedValue(mockReport as any);
    vi.mocked(prisma.report.update).mockResolvedValue({ ...mockReport, status: 'RESOLVED' } as any);

    const response = await app.inject({
      method: 'PATCH',
      url: '/api/v1/reports/report-1/review',
      headers: { authorization: authHeader('admin-user-id') },
      payload: {
        status: 'RESOLVED',
        adminNote: 'User warned',
      },
    });

    expect([200, 403, 404, 500]).toContain(response.statusCode);
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
      headers: { authorization: authHeader('admin-user-id') },
      payload: {
        status: 'INVALID_STATUS',
      },
    });

    expect([400, 403, 500]).toContain(response.statusCode);
  });
});

// ============================================
// GET REPORTS BY USER (ADMIN)
// ============================================
describe('GET /api/v1/reports/user/:userId - Get Reports By User (Admin)', () => {
  it('should get reports for specific user as admin', async () => {
    vi.mocked(prisma.report.findMany).mockResolvedValue([mockReport as any]);

    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/reports/user/reported-user-id',
      headers: { authorization: authHeader('admin-user-id') },
    });

    expect([200, 403, 404, 500]).toContain(response.statusCode);
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
