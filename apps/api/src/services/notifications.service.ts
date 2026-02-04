/**
 * Notifications Service
 * Handles user notifications
 */

import { prisma } from '../lib/prisma.js';
import { NotificationType, ContentType } from '@prisma/client';

interface CreateNotificationInput {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  relatedUserId?: string;
  relatedContentType?: ContentType;
  relatedContentId?: string;
}

interface ListNotificationsParams {
  limit?: number;
  offset?: number;
  isRead?: boolean;
  type?: NotificationType;
}

export const NotificationsService = {
  /**
   * Create a notification
   */
  async createNotification(data: CreateNotificationInput) {
    return prisma.notification.create({
      data: {
        userId: data.userId,
        type: data.type,
        title: data.title,
        message: data.message,
        relatedUserId: data.relatedUserId,
        relatedContentType: data.relatedContentType,
        relatedContentId: data.relatedContentId,
      },
    });
  },

  /**
   * Get user's notifications
   */
  async getNotifications(userId: string, params: ListNotificationsParams = {}) {
    const { limit = 50, offset = 0, isRead, type } = params;

    const where: any = { userId };
    if (isRead !== undefined) {
      where.isRead = isRead;
    }
    if (type) {
      where.type = type;
    }

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        skip: offset,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.notification.count({ where }),
    ]);

    return {
      notifications,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + notifications.length < total,
      },
    };
  },

  /**
   * Get unread count
   */
  async getUnreadCount(userId: string): Promise<number> {
    return prisma.notification.count({
      where: {
        userId,
        isRead: false,
      },
    });
  },

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string, userId: string) {
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) {
      throw new Error('Notification not found');
    }

    if (notification.userId !== userId) {
      throw new Error('Unauthorized');
    }

    return prisma.notification.update({
      where: { id: notificationId },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });
  },

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(userId: string) {
    await prisma.notification.updateMany({
      where: {
        userId,
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    return { success: true };
  },

  /**
   * Delete a notification
   */
  async deleteNotification(notificationId: string, userId: string) {
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) {
      throw new Error('Notification not found');
    }

    if (notification.userId !== userId) {
      throw new Error('Unauthorized');
    }

    await prisma.notification.delete({
      where: { id: notificationId },
    });

    return { success: true };
  },

  /**
   * Delete all read notifications
   */
  async deleteReadNotifications(userId: string) {
    const result = await prisma.notification.deleteMany({
      where: {
        userId,
        isRead: true,
      },
    });

    return { deletedCount: result.count };
  },

  /**
   * Create system notification for all users
   */
  async createSystemNotification(title: string, message: string) {
    const users = await prisma.user.findMany({
      where: { isBlocked: false },
      select: { id: true },
    });

    const notifications = users.map(user => ({
      userId: user.id,
      type: 'SYSTEM' as NotificationType,
      title,
      message,
    }));

    await prisma.notification.createMany({
      data: notifications,
    });

    return { sentCount: users.length };
  },
};
