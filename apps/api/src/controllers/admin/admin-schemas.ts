/**
 * Admin Controller - Zod Validation Schemas
 */

import { z } from 'zod';

export const userActionSchema = z.object({
  userId: z.string().cuid(),
  action: z.enum(['block', 'unblock', 'make_admin', 'remove_admin', 'make_premium', 'remove_premium']),
  reason: z.string().optional(),
});

export const reportActionSchema = z.object({
  reportId: z.string().cuid(),
  action: z.enum(['review', 'action_taken', 'dismiss']),
  notes: z.string().optional(),
});

export const adminDeleteMessageSchema = z.object({
  messageId: z.string().cuid(),
});

export const createAchievementSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().min(1).max(500),
  iconUrl: z.string().url().optional(),
  requirement: z.object({
    type: z.enum(['response_count', 'chat_count', 'mission_count', 'premium', 'days_active']),
    value: z.number().int().positive(),
  }),
  xpReward: z.number().int().positive().default(50),
});
