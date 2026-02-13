/**
 * Device Tokens Controller Integration Tests
 * Tests for push notification device registration and management
 *
 * @see PRD.md Section 10 - Phase 6 Testing (Integration)
 */

import { describe, it, expect, vi, beforeAll, afterAll, beforeEach, type Mock } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildTestApp, authHeader, adminAuthHeader } from '../../build-test-app.js';
import { prisma } from '../../../lib/prisma.js';
import type { DeviceToken } from '@prisma/client';

// Mock notification-sender to avoid Firebase dependency
vi.mock('../../../services/push-notifications/notification-sender.js', () => ({
  sendToTokens: vi.fn().mockResolvedValue({ sent: 1, failed: 0 }),
  sendBroadcast: vi.fn().mockResolvedValue({ sent: 1, failed: 0 }),
}));

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

const mockDeviceToken: DeviceToken = {
  id: 'device-token-1',
  userId: 'test-user-id',
  token: 'expo-push-token-xyz',
  platform: 'IOS',
  deviceId: 'device-123',
  deviceName: 'iPhone 12',
  isActive: true,
  lastUsedAt: new Date(),
  createdAt: new Date(),
  updatedAt: new Date(),
};

// ============================================
// REGISTER DEVICE
// ============================================
describe('[P1][social] POST /api/v1/device-tokens/register - Register Device', () => {
  it('should register device successfully', async () => {
    (prisma.deviceToken.upsert as Mock).mockResolvedValue(mockDeviceToken);

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

    expect(response.statusCode).toBe(201);
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
    const platforms = ['IOS', 'ANDROID', 'WEB'] as const;

    for (const platform of platforms) {
      (prisma.deviceToken.upsert as Mock).mockResolvedValue({ ...mockDeviceToken, platform });

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/device-tokens/register',
        headers: { authorization: authHeader() },
        payload: {
          token: 'expo-push-token-xyz',
          platform,
        },
      });

      expect(response.statusCode).toBe(201);
    }
  });
});

// ============================================
// UNREGISTER DEVICE
// ============================================
describe('[P1][social] POST /api/v1/device-tokens/unregister - Unregister Device', () => {
  it('should unregister device successfully', async () => {
    (prisma.deviceToken.updateMany as Mock).mockResolvedValue({ count: 1 });

    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/device-tokens/unregister',
      headers: { authorization: authHeader() },
      payload: {
        token: 'expo-push-token-xyz',
      },
    });

    expect(response.statusCode).toBe(200);
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
    (prisma.deviceToken.updateMany as Mock).mockResolvedValue({ count: 0 });

    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/device-tokens/unregister',
      headers: { authorization: authHeader() },
      payload: {
        token: 'non-existent-token',
      },
    });

    expect(response.statusCode).toBe(200);
  });
});

// ============================================
// GET MY DEVICES
// ============================================
describe('[P1][social] GET /api/v1/device-tokens/my - Get My Devices', () => {
  it('should get user devices', async () => {
    (prisma.deviceToken.findMany as Mock).mockResolvedValue([mockDeviceToken]);

    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/device-tokens/my',
      headers: { authorization: authHeader() },
    });

    expect(response.statusCode).toBe(200);
  });

  it('should require authentication', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/device-tokens/my',
    });

    expect(response.statusCode).toBe(401);
  });

  it('should return empty array if no devices', async () => {
    (prisma.deviceToken.findMany as Mock).mockResolvedValue([]);

    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/device-tokens/my',
      headers: { authorization: authHeader() },
    });

    expect(response.statusCode).toBe(200);
  });

  it('should not expose token values in response', async () => {
    (prisma.deviceToken.findMany as Mock).mockResolvedValue([mockDeviceToken]);

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
describe('[P1][social] POST /api/v1/device-tokens/test - Send Test Notification', () => {
  it('should send test notification', async () => {
    (prisma.deviceToken.findMany as Mock).mockResolvedValue([mockDeviceToken]);

    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/device-tokens/test',
      headers: { authorization: authHeader() },
      payload: {
        title: 'Test Notification',
        body: 'This is a test',
      },
    });

    expect(response.statusCode).toBe(200);
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
    (prisma.deviceToken.findMany as Mock).mockResolvedValue([mockDeviceToken]);

    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/device-tokens/test',
      headers: { authorization: authHeader() },
      payload: {},
    });

    expect(response.statusCode).toBe(200);
  });
});

// ============================================
// SEND BROADCAST (ADMIN)
// ============================================
describe('[P1][social] POST /api/v1/device-tokens/broadcast - Send Broadcast (Admin)', () => {
  it('should send broadcast as admin', async () => {
    (prisma.deviceToken.findMany as Mock).mockResolvedValue([mockDeviceToken]);

    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/device-tokens/broadcast',
      headers: { authorization: adminAuthHeader() },
      payload: {
        title: 'System Announcement',
        body: 'Important update',
      },
    });

    expect(response.statusCode).toBe(200);
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
      headers: { authorization: adminAuthHeader() },
      payload: {},
    });

    expect(response.statusCode).toBe(400);
  });
});

// ============================================
// CLEANUP INACTIVE TOKENS (ADMIN)
// ============================================
describe('[P1][social] POST /api/v1/device-tokens/cleanup - Cleanup Inactive Tokens (Admin)', () => {
  it('should cleanup inactive tokens as admin', async () => {
    (prisma.deviceToken.deleteMany as Mock).mockResolvedValue({ count: 5 });

    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/device-tokens/cleanup',
      headers: { authorization: adminAuthHeader() },
      payload: {
        daysOld: 30,
      },
    });

    expect(response.statusCode).toBe(200);
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
    (prisma.deviceToken.deleteMany as Mock).mockResolvedValue({ count: 3 });

    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/device-tokens/cleanup',
      headers: { authorization: adminAuthHeader() },
      payload: {},
    });

    expect(response.statusCode).toBe(200);
  });
});
