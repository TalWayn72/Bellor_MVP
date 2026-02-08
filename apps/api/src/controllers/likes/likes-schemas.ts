/**
 * Likes Schemas
 * Zod validation schemas for likes endpoints
 */

import { z } from 'zod';

export const likeUserBodySchema = z.object({
  targetUserId: z.string().min(1, 'targetUserId is required'),
  likeType: z.enum(['ROMANTIC', 'POSITIVE', 'SUPER']).optional(),
});

export const likeResponseBodySchema = z.object({
  responseId: z.string().min(1, 'responseId is required'),
});

export const listLikesQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional(),
  offset: z.coerce.number().int().min(0).optional(),
  likeType: z.enum(['ROMANTIC', 'POSITIVE', 'SUPER']).optional(),
});

export const targetUserParamsSchema = z.object({
  targetUserId: z.string().min(1, 'targetUserId is required'),
});

export const responseIdParamsSchema = z.object({
  responseId: z.string().min(1, 'responseId is required'),
});

// Inferred types
export type LikeUserBody = z.infer<typeof likeUserBodySchema>;
export type LikeResponseBody = z.infer<typeof likeResponseBodySchema>;
export type ListLikesQuery = z.infer<typeof listLikesQuerySchema>;
export type TargetUserParams = z.infer<typeof targetUserParamsSchema>;
export type ResponseIdParams = z.infer<typeof responseIdParamsSchema>;
