/**
 * Push Notifications Service Tests
 * Tests for Firebase Cloud Messaging integration
 */

import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { PushNotificationsService } from './push-notifications.service.js';
import { prisma } from '../lib/prisma.js';

// Mock Prisma - define mock inside factory to avoid hoisting issues
vi.mock('../lib/prisma.js', () => ({
  prisma: {
    deviceToken: {
      findMany: vi.fn(),
      upsert: vi.fn(),
      updateMany: vi.fn(),
      deleteMany: vi.fn(),
    },
    notification: {
      create: vi.fn(),
      createMany: vi.fn(),
    },
    user: {
      findMany: vi.fn(),
    },
  },
}));

// Access mocked prisma through the imported module
const mockPrisma = (prisma as Mock);

// Mock Firebase Admin (FCM will be skipped in tests)
vi.mock('firebase-admin', () => ({
  default: {
    initializeApp: vi.fn(),
    credential: {
      cert: vi.fn(),
    },
    messaging: vi.fn().mockReturnValue({
      sendEachForMulticast: vi.fn().mockResolvedValue({
        successCount: 1,
        failureCount: 0,
        responses: [{ success: true }],
      }),
    }),
  },
}));

describe('[P1][social] PushNotificationsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('registerDevice', () => {
    it('should register new device token', async () => {
      const input = {
        userId: 'user-1',
        token: 'device-token-123',
        platform: 'IOS' as const,
        deviceId: 'device-id-123',
        deviceName: 'iPhone 15',
      };

      const mockDevice = {
        id: 'dt-1',
        ...input,
        isActive: true,
        lastUsedAt: new Date(),
      };

      mockPrisma.deviceToken.upsert.mockResolvedValue(mockDevice);

      const result = await PushNotificationsService.registerDevice(input);

      expect(mockPrisma.deviceToken.upsert).toHaveBeenCalledWith({
        where: { token: input.token },
        update: {
          userId: input.userId,
          platform: input.platform,
          deviceId: input.deviceId,
          deviceName: input.deviceName,
          isActive: true,
          lastUsedAt: expect.any(Date),
        },
        create: {
          userId: input.userId,
          token: input.token,
          platform: input.platform,
          deviceId: input.deviceId,
          deviceName: input.deviceName,
          isActive: true,
        },
      });

      expect(result).toEqual(mockDevice);
    });
  });

  describe('unregisterDevice', () => {
    it('should deactivate device token', async () => {
      mockPrisma.deviceToken.updateMany.mockResolvedValue({ count: 1 });

      const result = await PushNotificationsService.unregisterDevice('token-123');

      expect(mockPrisma.deviceToken.updateMany).toHaveBeenCalledWith({
        where: { token: 'token-123' },
        data: { isActive: false },
      });

      expect(result).toEqual({ success: true });
    });
  });

  describe('getUserDeviceTokens', () => {
    it('should return active device tokens for user', async () => {
      const mockTokens = [
        { id: 'dt-1', token: 'token-1', platform: 'IOS', isActive: true },
        { id: 'dt-2', token: 'token-2', platform: 'ANDROID', isActive: true },
      ];

      mockPrisma.deviceToken.findMany.mockResolvedValue(mockTokens);

      const result = await PushNotificationsService.getUserDeviceTokens('user-1');

      expect(mockPrisma.deviceToken.findMany).toHaveBeenCalledWith({
        where: {
          userId: 'user-1',
          isActive: true,
        },
      });

      expect(result).toEqual(mockTokens);
    });

    it('should return empty array when user has no devices', async () => {
      mockPrisma.deviceToken.findMany.mockResolvedValue([]);

      const result = await PushNotificationsService.getUserDeviceTokens('user-1');

      expect(result).toEqual([]);
    });
  });

  describe('sendToUser', () => {
    it('should return 0 sent when user has no devices', async () => {
      mockPrisma.deviceToken.findMany.mockResolvedValue([]);

      const result = await PushNotificationsService.sendToUser({
        userId: 'user-1',
        title: 'Test',
        body: 'Test message',
      });

      expect(result).toEqual({ sent: 0, failed: 0 });
    });
  });

  describe('sendToUsers', () => {
    it('should return 0 sent when no users have devices', async () => {
      mockPrisma.deviceToken.findMany.mockResolvedValue([]);

      const result = await PushNotificationsService.sendToUsers({
        userIds: ['user-1', 'user-2'],
        title: 'Test',
        body: 'Test message',
      });

      expect(result).toEqual({ sent: 0, failed: 0 });
    });
  });

  describe('cleanupInactiveTokens', () => {
    it('should delete inactive tokens older than specified days', async () => {
      mockPrisma.deviceToken.deleteMany.mockResolvedValue({ count: 5 });

      const result = await PushNotificationsService.cleanupInactiveTokens(30);

      expect(mockPrisma.deviceToken.deleteMany).toHaveBeenCalled();
      expect(result).toEqual({ deletedCount: 5 });
    });
  });

  describe('sendForNotificationType', () => {
    it('should create in-app notification and send push', async () => {
      mockPrisma.notification.create.mockResolvedValue({
        id: 'notif-1',
        userId: 'user-1',
        type: 'NEW_MESSAGE',
        title: 'New Message',
        message: 'You have a new message',
      });

      mockPrisma.deviceToken.findMany.mockResolvedValue([]);

      const result = await PushNotificationsService.sendForNotificationType(
        'user-1',
        'NEW_MESSAGE',
        'New Message',
        'You have a new message'
      );

      expect(mockPrisma.notification.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-1',
          type: 'NEW_MESSAGE',
          title: 'New Message',
          message: 'You have a new message',
          relatedUserId: undefined,
          relatedContentType: undefined,
          relatedContentId: undefined,
        },
      });

      expect(result).toEqual({ sent: 0, failed: 0 });
    });
  });

  describe('sendBroadcast', () => {
    it('should return early when no device tokens exist', async () => {
      mockPrisma.deviceToken.findMany.mockResolvedValue([]);

      const result = await PushNotificationsService.sendBroadcast(
        'System Update',
        'New features available!'
      );

      // Should return early without creating notifications when no devices exist
      expect(result).toEqual({ sent: 0, failed: 0 });
      expect(mockPrisma.notification.createMany).not.toHaveBeenCalled();
    });
  });
});
