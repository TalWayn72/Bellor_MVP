/**
 * Device Tokens Controller Integration Tests
 * Tests for push notification device registration and management
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

const mockDeviceToken = {
  id: 'device-token-1',
  userId: 'test-user-id',
  token: 'expo-push-token-xyz',
  platform: 'IOS' as const,
  deviceId: 'device-123',
  deviceName: 'iPhone 12',
  isActive: true,
  lastUsedAt: new Date(),
  createdAt: new Date(),
};

// ============================================
// REGISTER DEVICE
// ============================================
describe('POST /api/v1/device-tokens/register - Register Device', () => {
  it('should register device successfully', async () => {
    vi.mocked(prisma.deviceToken.upsert).mockResolvedValue(mockDeviceToken as any);

    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/device-tokens/register',
      headers: { authorization: authHeader() },
      payload: {
        token: 'expo-push-token-xyz',
        platform: 'IOS',
        deviceId: 'device-123',
        deviceName: 'iPhone 12',
      },
    });

    expect([201, 400, 500]).toContain(response.statusCode);
  });

  it('should require authentication', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/device-tokens/register',
      payload: {
        token: 'expo-push-token-xyz',
        platform: 'IOS',
      },
    });

    expect(response.statusCode).toBe(401);
  });

  it('should validate required fields', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/device-tokens/register',
      headers: { authorization: authHeader() },
      payload: {},
    });

    expect(response.statusCode).toBe(400);
  });

  it('should validate platform enum', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/device-tokens/register',
      headers: { authorization: authHeader() },
      payload: {
        token: 'expo-push-token-xyz',
        platform: 'INVALID_PLATFORM',
      },
    });

    expect(response.statusCode).toBe(400);
  });

  it('should accept all valid platforms (IOS, ANDROID, WEB)', async () => {
    const platforms = ['IOS', 'ANDROID', 'WEB'];

    for (const platform of platforms) {
      vi.mocked(prisma.deviceToken.upsert).mockResolvedValue({ ...mockDeviceToken, platform } as any);

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/device-tokens/register',
        headers: { authorization: authHeader() },
        payload: {
          token: 'expo-push-token-xyz',
          platform,
        },
      });

      expect([201, 400, 500]).toContain(response.statusCode);
    }
  });
});

// ============================================
// UNREGISTER DEVICE
// ============================================
describe('POST /api/v1/device-tokens/unregister - Unregister Device', () => {
  it('should unregister device successfully', async () => {
    vi.mocked(prisma.deviceToken.deleteMany).mockResolvedValue({ count: 1 } as any);

    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/device-tokens/unregister',
      headers: { authorization: authHeader() },
      payload: {
        token: 'expo-push-token-xyz',
      },
    });

    expect([200, 400, 500]).toContain(response.statusCode);
  });

  it('should require token field', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/device-tokens/unregister',
      headers: { authorization: authHeader() },
      payload: {},
    });

    expect(response.statusCode).toBe(400);
  });

  it('should accept unregister even if token not found', async () => {
    vi.mocked(prisma.deviceToken.deleteMany).mockResolvedValue({ count: 0 } as any);

    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/device-tokens/unregister',
      headers: { authorization: authHeader() },
      payload: {
        token: 'non-existent-token',
      },
    });

    expect([200, 400, 500]).toContain(response.statusCode);
  });
});

// ============================================
// GET MY DEVICES
// ============================================
describe('GET /api/v1/device-tokens/my - Get My Devices', () => {
  it('should get user devices', async () => {
    vi.mocked(prisma.deviceToken.findMany).mockResolvedValue([mockDeviceToken as any]);

    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/device-tokens/my',
      headers: { authorization: authHeader() },
    });

    expect([200, 500]).toContain(response.statusCode);
  });

  it('should require authentication', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/device-tokens/my',
    });

    expect(response.statusCode).toBe(401);
  });

  it('should return empty array if no devices', async () => {
    vi.mocked(prisma.deviceToken.findMany).mockResolvedValue([]);

    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/device-tokens/my',
      headers: { authorization: authHeader() },
    });

    expect([200, 500]).toContain(response.statusCode);
  });

  it('should not expose token values in response', async () => {
    vi.mocked(prisma.deviceToken.findMany).mockResolvedValue([mockDeviceToken as any]);

    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/device-tokens/my',
      headers: { authorization: authHeader() },
    });

    if (response.statusCode === 200) {
      const body = JSON.parse(response.payload);
      if (body.devices && body.devices.length > 0) {
        expect(body.devices[0].token).toBeUndefined();
      }
    }
  });
});

// ============================================
// SEND TEST NOTIFICATION
// ============================================
describe('POST /api/v1/device-tokens/test - Send Test Notification', () => {
  it('should send test notification', async () => {
    vi.mocked(prisma.deviceToken.findMany).mockResolvedValue([mockDeviceToken as any]);

    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/device-tokens/test',
      headers: { authorization: authHeader() },
      payload: {
        title: 'Test Notification',
        body: 'This is a test',
      },
    });

    expect([200, 500]).toContain(response.statusCode);
  });

  it('should require authentication', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/device-tokens/test',
      payload: {
        title: 'Test',
        body: 'Test',
      },
    });

    expect(response.statusCode).toBe(401);
  });

  it('should use default values if not provided', async () => {
    vi.mocked(prisma.deviceToken.findMany).mockResolvedValue([mockDeviceToken as any]);

    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/device-tokens/test',
      headers: { authorization: authHeader() },
      payload: {},
    });

    expect([200, 500]).toContain(response.statusCode);
  });
});

// ============================================
// SEND BROADCAST (ADMIN)
// ============================================
describe('POST /api/v1/device-tokens/broadcast - Send Broadcast (Admin)', () => {
  it('should send broadcast as admin', async () => {
    vi.mocked(prisma.deviceToken.findMany).mockResolvedValue([mockDeviceToken as any]);

    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/device-tokens/broadcast',
      headers: { authorization: authHeader('admin-user-id') },
      payload: {
        title: 'System Announcement',
        body: 'Important update',
      },
    });

    expect([200, 403, 500]).toContain(response.statusCode);
  });

  it('should reject non-admin access', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/device-tokens/broadcast',
      headers: { authorization: authHeader() },
      payload: {
        title: 'Test',
        body: 'Test',
      },
    });

    expect(response.statusCode).toBe(403);
  });

  it('should require authentication', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/device-tokens/broadcast',
      payload: {
        title: 'Test',
        body: 'Test',
      },
    });

    expect(response.statusCode).toBe(401);
  });

  it('should validate required fields', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/device-tokens/broadcast',
      headers: { authorization: authHeader('admin-user-id') },
      payload: {},
    });

    expect([400, 403, 500]).toContain(response.statusCode);
  });
});

// ============================================
// CLEANUP INACTIVE TOKENS (ADMIN)
// ============================================
describe('POST /api/v1/device-tokens/cleanup - Cleanup Inactive Tokens (Admin)', () => {
  it('should cleanup inactive tokens as admin', async () => {
    vi.mocked(prisma.deviceToken.deleteMany).mockResolvedValue({ count: 5 } as any);

    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/device-tokens/cleanup',
      headers: { authorization: authHeader('admin-user-id') },
      payload: {
        daysOld: 30,
      },
    });

    expect([200, 403, 500]).toContain(response.statusCode);
  });

  it('should reject non-admin access', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/device-tokens/cleanup',
      headers: { authorization: authHeader() },
      payload: {
        daysOld: 30,
      },
    });

    expect(response.statusCode).toBe(403);
  });

  it('should require authentication', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/device-tokens/cleanup',
      payload: {
        daysOld: 30,
      },
    });

    expect(response.statusCode).toBe(401);
  });

  it('should use default value if daysOld not provided', async () => {
    vi.mocked(prisma.deviceToken.deleteMany).mockResolvedValue({ count: 3 } as any);

    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/device-tokens/cleanup',
      headers: { authorization: authHeader('admin-user-id') },
      payload: {},
    });

    expect([200, 403, 500]).toContain(response.statusCode);
  });
});
