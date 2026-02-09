import { z } from 'zod';
import { PaginationParamsSchema, PaginationResponseSchema } from './common.schema.js';

export const MediaTypeEnum = z.enum(['IMAGE', 'VIDEO']);

export const StoryDbSchema = z.object({
  id: z.string(),
  userId: z.string(),
  mediaType: MediaTypeEnum,
  mediaUrl: z.string(),
  thumbnailUrl: z.string().optional().nullable(),
  caption: z.string().optional().nullable(),
  viewCount: z.number().int(),
  createdAt: z.string().datetime(),
  expiresAt: z.string().datetime(),
});

export const StoryResponseSchema = z.object({
  id: z.string(),
  userId: z.string(),
  mediaType: MediaTypeEnum,
  mediaUrl: z.string(),
  thumbnailUrl: z.string().optional().nullable(),
  caption: z.string().optional().nullable(),
  viewCount: z.number().int(),
  createdAt: z.string().datetime(),
  expiresAt: z.string().datetime(),
});

export const CreateStoryRequestSchema = z.object({
  mediaUrl: z.string().url('Invalid media URL'),
  mediaType: MediaTypeEnum,
  caption: z.string().max(500).optional(),
  duration: z.number().int().min(1).max(30).optional(),
});

export const GetStoryFeedQuerySchema = PaginationParamsSchema;

export const StoryFeedResponseSchema = z.object({
  stories: z.array(StoryResponseSchema),
  pagination: PaginationResponseSchema.optional(),
});

export const MyStoriesResponseSchema = z.object({
  stories: z.array(StoryResponseSchema),
});

export const StoryStatsResponseSchema = z.object({
  stats: z.object({
    totalStories: z.number().int(),
    totalViews: z.number().int(),
    activeStories: z.number().int(),
  }),
});

export const CreateStoryResponseSchema = z.object({
  story: StoryResponseSchema,
});

export const StoriesByUserResponseSchema = z.object({
  stories: z.array(StoryResponseSchema),
});

export const StoryByIdResponseSchema = z.object({
  story: StoryResponseSchema,
});

export const ViewStoryResponseSchema = z.object({
  message: z.string(),
});

export const DeleteStoryResponseSchema = z.object({
  message: z.string(),
});

export const CleanupStoriesResponseSchema = z.object({
  deletedCount: z.number().int(),
});

export type MediaType = z.infer<typeof MediaTypeEnum>;
export type StoryDb = z.infer<typeof StoryDbSchema>;
export type StoryResponse = z.infer<typeof StoryResponseSchema>;
export type CreateStoryRequest = z.infer<typeof CreateStoryRequestSchema>;
export type GetStoryFeedQuery = z.infer<typeof GetStoryFeedQuerySchema>;
export type StoryFeedResponse = z.infer<typeof StoryFeedResponseSchema>;
export type MyStoriesResponse = z.infer<typeof MyStoriesResponseSchema>;
export type StoryStatsResponse = z.infer<typeof StoryStatsResponseSchema>;
export type CreateStoryResponse = z.infer<typeof CreateStoryResponseSchema>;
export type StoriesByUserResponse = z.infer<typeof StoriesByUserResponseSchema>;
export type StoryByIdResponse = z.infer<typeof StoryByIdResponseSchema>;
export type ViewStoryResponse = z.infer<typeof ViewStoryResponseSchema>;
export type DeleteStoryResponse = z.infer<typeof DeleteStoryResponseSchema>;
export type CleanupStoriesResponse = z.infer<typeof CleanupStoriesResponseSchema>;
