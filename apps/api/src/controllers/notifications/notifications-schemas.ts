/**
 * Notifications Schemas
 * Zod validation schemas for notifications endpoints
 */

import { z } from 'zod';

export const listNotificationsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional(),
  offset: z.coerce.number().int().min(0).optional(),
  isRead: z.enum(['true', 'false']).optional(),
  type: z.enum([
    'NEW_MESSAGE', 'NEW_MATCH', 'NEW_LIKE', 'NEW_FOLLOW',
    'MISSION_REMINDER', 'ACHIEVEMENT_UNLOCKED', 'CHAT_REQUEST',
    'STORY_VIEW', 'SYSTEM',
  ]).optional(),
});

export const notificationIdParamsSchema = z.object({
  id: z.string().min(1, 'Notification ID is required'),
});

// Inferred types
export type ListNotificationsQuery = z.infer<typeof listNotificationsQuerySchema>;
export type NotificationIdParams = z.infer<typeof notificationIdParamsSchema>;
