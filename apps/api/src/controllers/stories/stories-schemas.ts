/**
 * Stories Schemas
 * Zod validation schemas for stories endpoints
 */

import { z } from 'zod';

export const createStoryBodySchema = z.object({
  mediaType: z.enum(['IMAGE', 'VIDEO']),
  mediaUrl: z.string().min(1, 'mediaUrl is required'),
  thumbnailUrl: z.string().optional(),
  caption: z.string().max(500).optional(),
});

export const listStoriesQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional(),
  offset: z.coerce.number().int().min(0).optional(),
});

export const storyIdParamsSchema = z.object({
  id: z.string().min(1, 'Story ID is required'),
});

export const storyUserParamsSchema = z.object({
  userId: z.string().min(1, 'userId is required'),
});

// Inferred types
export type CreateStoryBody = z.infer<typeof createStoryBodySchema>;
export type ListStoriesQuery = z.infer<typeof listStoriesQuerySchema>;
export type StoryIdParams = z.infer<typeof storyIdParamsSchema>;
export type StoryUserParams = z.infer<typeof storyUserParamsSchema>;
