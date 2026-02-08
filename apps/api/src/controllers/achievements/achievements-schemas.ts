/**
 * Achievements Schemas
 * Zod validation schemas for achievements endpoints
 */

import { z } from 'zod';

export const listAchievementsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional(),
  offset: z.coerce.number().int().min(0).optional(),
});

export const achievementIdParamsSchema = z.object({
  id: z.string().min(1, 'Achievement ID is required'),
});

export const achievementUserParamsSchema = z.object({
  userId: z.string().min(1, 'userId is required'),
});

// Inferred types
export type ListAchievementsQuery = z.infer<typeof listAchievementsQuerySchema>;
export type AchievementIdParams = z.infer<typeof achievementIdParamsSchema>;
export type AchievementUserParams = z.infer<typeof achievementUserParamsSchema>;
