/**
 * Notifications Service Tests
 * Tests for user notifications operations
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NotificationsService } from './notifications.service.js';
import { prisma } from '../lib/prisma.js';
import { NotificationType, ContentType } from '@prisma/client';

// Type the mocked prisma
const mockPrisma = prisma as unknown as {
  notification: {
    findUnique: ReturnType<typeof vi.fn>;
    findMany: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    createMany: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    updateMany: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
    deleteMany: ReturnType<typeof vi.fn>;
    count: ReturnType<typeof vi.fn>;
  };
  user: {
    findMany: ReturnType<typeof vi.fn>;
  };
};

// Test data factories
const createMockNotification = (overrides: Record<string, unknown> = {}) => ({
  id: 'notification-1',
  userId: 'user-1',
  type: NotificationType.NEW_LIKE,
  title: 'New Like',
  message: 'Someone liked you!',
  relatedUserId: 'user-2',
  relatedContentType: null,
  relatedContentId: null,
  isRead: false,
  createdAt: new Date('2024-01-01'),
  readAt: null,
  ...overrides,
});

describe('NotificationsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ==================== createNotification ====================
  describe('createNotification', () => {
    it('should create a notification', async () => {
      const mockNotification = createMockNotification();
      mockPrisma.notification.create.mockResolvedValue(mockNotification);

      const result = await NotificationsService.createNotification({
        userId: 'user-1',
        type: NotificationType.NEW_LIKE,
        title: 'New Like',
        message: 'Someone liked you!',
        relatedUserId: 'user-2',
      });

      expect(mockPrisma.notification.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-1',
          type: NotificationType.NEW_LIKE,
          title: 'New Like',
          message: 'Someone liked you!',
          relatedUserId: 'user-2',
          relatedContentType: undefined,
          relatedContentId: undefined,
        },
      });
      expect(result).toEqual(mockNotification);
    });

    it('should create notification with content reference', async () => {
      const mockNotification = createMockNotification({
        relatedContentType: ContentType.MESSAGE,
        relatedContentId: 'message-1',
      });
      mockPrisma.notification.create.mockResolvedValue(mockNotification);

      await NotificationsService.createNotification({
        userId: 'user-1',
        type: NotificationType.NEW_MESSAGE,
        title: 'New Message',
        message: 'You have a new message',
        relatedContentType: ContentType.MESSAGE,
        relatedContentId: 'message-1',
      });

      expect(mockPrisma.notification.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          relatedContentType: ContentType.MESSAGE,
          relatedContentId: 'message-1',
        }),
      });
    });
  });

  // ==================== getNotifications ====================
  describe('getNotifications', () => {
    it('should return notifications with pagination', async () => {
      const mockNotifications = [
        createMockNotification({ id: 'notification-1' }),
        createMockNotification({ id: 'notification-2' }),
      ];
      mockPrisma.notification.findMany.mockResolvedValue(mockNotifications);
      mockPrisma.notification.count.mockResolvedValue(2);

      const result = await NotificationsService.getNotifications('user-1');

      expect(result.notifications).toHaveLength(2);
      expect(result.pagination.total).toBe(2);
      expect(mockPrisma.notification.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 'user-1' },
          take: 50,
          skip: 0,
        })
      );
    });

    it('should filter by isRead when specified', async () => {
      mockPrisma.notification.findMany.mockResolvedValue([]);
      mockPrisma.notification.count.mockResolvedValue(0);

      await NotificationsService.getNotifications('user-1', { isRead: false });

      expect(mockPrisma.notification.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 'user-1', isRead: false },
        })
      );
    });

    it('should filter by type when specified', async () => {
      mockPrisma.notification.findMany.mockResolvedValue([]);
      mockPrisma.notification.count.mockResolvedValue(0);

      await NotificationsService.getNotifications('user-1', { type: NotificationType.NEW_MATCH });

      expect(mockPrisma.notification.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 'user-1', type: NotificationType.NEW_MATCH },
        })
      );
    });

    it('should use custom pagination values', async () => {
      mockPrisma.notification.findMany.mockResolvedValue([]);
      mockPrisma.notification.count.mockResolvedValue(0);

      await NotificationsService.getNotifications('user-1', { limit: 10, offset: 20 });

      expect(mockPrisma.notification.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 10,
          skip: 20,
        })
      );
    });

    it('should calculate hasMore correctly', async () => {
      mockPrisma.notification.findMany.mockResolvedValue([createMockNotification()]);
      mockPrisma.notification.count.mockResolvedValue(10);

      const result = await NotificationsService.getNotifications('user-1', { limit: 5 });

      expect(result.pagination.hasMore).toBe(true);
    });

    it('should return hasMore false when all items fetched', async () => {
      const notifications = [createMockNotification()];
      mockPrisma.notification.findMany.mockResolvedValue(notifications);
      mockPrisma.notification.count.mockResolvedValue(1);

      const result = await NotificationsService.getNotifications('user-1', { limit: 5 });

      expect(result.pagination.hasMore).toBe(false);
    });
  });

  // ==================== getUnreadCount ====================
  describe('getUnreadCount', () => {
    it('should return unread count', async () => {
      mockPrisma.notification.count.mockResolvedValue(5);

      const result = await NotificationsService.getUnreadCount('user-1');

      expect(result).toBe(5);
      expect(mockPrisma.notification.count).toHaveBeenCalledWith({
        where: {
          userId: 'user-1',
          isRead: false,
        },
      });
    });

    it('should return 0 when no unread notifications', async () => {
      mockPrisma.notification.count.mockResolvedValue(0);

      const result = await NotificationsService.getUnreadCount('user-1');

      expect(result).toBe(0);
    });
  });

  // ==================== markAsRead ====================
  describe('markAsRead', () => {
    it('should mark notification as read', async () => {
      const mockNotification = createMockNotification();
      const updatedNotification = { ...mockNotification, isRead: true, readAt: new Date() };

      mockPrisma.notification.findUnique.mockResolvedValue(mockNotification);
      mockPrisma.notification.update.mockResolvedValue(updatedNotification);

      const result = await NotificationsService.markAsRead('notification-1', 'user-1');

      expect(mockPrisma.notification.update).toHaveBeenCalledWith({
        where: { id: 'notification-1' },
        data: {
          isRead: true,
          readAt: expect.any(Date),
        },
      });
      expect(result.isRead).toBe(true);
    });

    it('should throw error when notification not found', async () => {
      mockPrisma.notification.findUnique.mockResolvedValue(null);

      await expect(
        NotificationsService.markAsRead('non-existent', 'user-1')
      ).rejects.toThrow('Notification not found');
    });

    it('should throw error when user is not owner', async () => {
      const mockNotification = createMockNotification({ userId: 'user-2' });
      mockPrisma.notification.findUnique.mockResolvedValue(mockNotification);

      await expect(
        NotificationsService.markAsRead('notification-1', 'user-1')
      ).rejects.toThrow('Unauthorized');
      expect(mockPrisma.notification.update).not.toHaveBeenCalled();
    });
  });

  // ==================== markAllAsRead ====================
  describe('markAllAsRead', () => {
    it('should mark all unread notifications as read', async () => {
      mockPrisma.notification.updateMany.mockResolvedValue({ count: 5 });

      const result = await NotificationsService.markAllAsRead('user-1');

      expect(mockPrisma.notification.updateMany).toHaveBeenCalledWith({
        where: {
          userId: 'user-1',
          isRead: false,
        },
        data: {
          isRead: true,
          readAt: expect.any(Date),
        },
      });
      expect(result).toEqual({ success: true });
    });

    it('should succeed even when no unread notifications', async () => {
      mockPrisma.notification.updateMany.mockResolvedValue({ count: 0 });

      const result = await NotificationsService.markAllAsRead('user-1');

      expect(result).toEqual({ success: true });
    });
  });

  // ==================== deleteNotification ====================
  describe('deleteNotification', () => {
    it('should delete notification', async () => {
      const mockNotification = createMockNotification();
      mockPrisma.notification.findUnique.mockResolvedValue(mockNotification);
      mockPrisma.notification.delete.mockResolvedValue(mockNotification);

      const result = await NotificationsService.deleteNotification('notification-1', 'user-1');

      expect(mockPrisma.notification.delete).toHaveBeenCalledWith({
        where: { id: 'notification-1' },
      });
      expect(result).toEqual({ success: true });
    });

    it('should throw error when notification not found', async () => {
      mockPrisma.notification.findUnique.mockResolvedValue(null);

      await expect(
        NotificationsService.deleteNotification('non-existent', 'user-1')
      ).rejects.toThrow('Notification not found');
    });

    it('should throw error when user is not owner', async () => {
      const mockNotification = createMockNotification({ userId: 'user-2' });
      mockPrisma.notification.findUnique.mockResolvedValue(mockNotification);

      await expect(
        NotificationsService.deleteNotification('notification-1', 'user-1')
      ).rejects.toThrow('Unauthorized');
      expect(mockPrisma.notification.delete).not.toHaveBeenCalled();
    });
  });

  // ==================== deleteReadNotifications ====================
  describe('deleteReadNotifications', () => {
    it('should delete all read notifications', async () => {
      mockPrisma.notification.deleteMany.mockResolvedValue({ count: 10 });

      const result = await NotificationsService.deleteReadNotifications('user-1');

      expect(mockPrisma.notification.deleteMany).toHaveBeenCalledWith({
        where: {
          userId: 'user-1',
          isRead: true,
        },
      });
      expect(result).toEqual({ deletedCount: 10 });
    });

    it('should return 0 when no read notifications', async () => {
      mockPrisma.notification.deleteMany.mockResolvedValue({ count: 0 });

      const result = await NotificationsService.deleteReadNotifications('user-1');

      expect(result).toEqual({ deletedCount: 0 });
    });
  });

  // ==================== createSystemNotification ====================
  describe('createSystemNotification', () => {
    it('should create system notification for all active users', async () => {
      const mockUsers = [{ id: 'user-1' }, { id: 'user-2' }, { id: 'user-3' }];
      mockPrisma.user.findMany.mockResolvedValue(mockUsers);
      mockPrisma.notification.createMany.mockResolvedValue({ count: 3 });

      const result = await NotificationsService.createSystemNotification(
        'System Update',
        'Please update your app'
      );

      expect(mockPrisma.user.findMany).toHaveBeenCalledWith({
        where: { isBlocked: false },
        select: { id: true },
      });
      expect(mockPrisma.notification.createMany).toHaveBeenCalledWith({
        data: [
          { userId: 'user-1', type: 'SYSTEM', title: 'System Update', message: 'Please update your app' },
          { userId: 'user-2', type: 'SYSTEM', title: 'System Update', message: 'Please update your app' },
          { userId: 'user-3', type: 'SYSTEM', title: 'System Update', message: 'Please update your app' },
        ],
      });
      expect(result).toEqual({ sentCount: 3 });
    });

    it('should return 0 when no active users', async () => {
      mockPrisma.user.findMany.mockResolvedValue([]);
      mockPrisma.notification.createMany.mockResolvedValue({ count: 0 });

      const result = await NotificationsService.createSystemNotification(
        'System Update',
        'Please update your app'
      );

      expect(result).toEqual({ sentCount: 0 });
    });
  });
});
