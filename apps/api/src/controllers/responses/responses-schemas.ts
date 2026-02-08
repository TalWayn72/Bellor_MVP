/**
 * Responses Schemas
 * Zod validation schemas for responses endpoints
 */

import { z } from 'zod';

export const createResponseSchema = z.object({
  missionId: z.string().optional(),
  responseType: z.enum(['TEXT', 'VOICE', 'VIDEO', 'DRAWING']),
  content: z.string().min(1),
  textContent: z.string().optional(),
  thumbnailUrl: z.string().url().optional(),
  duration: z.number().int().min(0).optional(),
  isPublic: z.boolean().optional().default(true),
});

export const listResponsesQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(1000).optional().default(20),
  offset: z.coerce.number().int().min(0).optional().default(0),
  userId: z.string().optional(),
  missionId: z.string().optional(),
  responseType: z.enum(['TEXT', 'VOICE', 'VIDEO', 'DRAWING']).optional(),
  isPublic: z.coerce.boolean().optional(),
});
