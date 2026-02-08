/**
 * Notification Builders
 * Type definitions and bulk notification operations
 */

import { prisma } from '../../lib/prisma.js';
import { NotificationType, ContentType } from '@prisma/client';

export interface CreateNotificationInput {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  relatedUserId?: string;
  relatedContentType?: ContentType;
  relatedContentId?: string;
}

export interface ListNotificationsParams {
  limit?: number;
  offset?: number;
  isRead?: boolean;
  type?: NotificationType;
}

/**
 * Create a single notification
 */
export async function createNotification(data: CreateNotificationInput) {
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
}

/**
 * Create system notification for all users
 */
export async function createSystemNotification(title: string, message: string) {
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
}

/**
 * Delete all read notifications for a user
 */
export async function deleteReadNotifications(userId: string) {
  const result = await prisma.notification.deleteMany({
    where: {
      userId,
      isRead: true,
    },
  });

  return { deletedCount: result.count };
}
