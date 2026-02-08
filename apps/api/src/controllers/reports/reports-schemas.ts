/**
 * Reports Schemas
 * Zod validation schemas for reports endpoints
 */

import { z } from 'zod';

export const createReportBodySchema = z.object({
  reportedUserId: z.string().min(1, 'reportedUserId is required'),
  reason: z.enum([
    'SPAM', 'HARASSMENT', 'INAPPROPRIATE_CONTENT',
    'FAKE_PROFILE', 'UNDERAGE', 'OTHER',
  ]),
  description: z.string().max(1000).optional(),
  contentType: z.enum(['MESSAGE', 'RESPONSE', 'STORY', 'PROFILE']).optional(),
  contentId: z.string().optional(),
});

export const listReportsQuerySchema = z.object({
  status: z.enum(['PENDING', 'REVIEWED', 'ACTION_TAKEN', 'DISMISSED']).optional(),
  reason: z.enum([
    'SPAM', 'HARASSMENT', 'INAPPROPRIATE_CONTENT',
    'FAKE_PROFILE', 'UNDERAGE', 'OTHER',
  ]).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  offset: z.coerce.number().int().min(0).optional(),
});

export const reviewReportBodySchema = z.object({
  status: z.enum(['PENDING', 'REVIEWED', 'ACTION_TAKEN', 'DISMISSED']),
  reviewNotes: z.string().max(1000).optional(),
  blockUser: z.boolean().optional(),
});

export const reportIdParamsSchema = z.object({
  id: z.string().min(1, 'Report ID is required'),
});

export const reportUserParamsSchema = z.object({
  userId: z.string().min(1, 'userId is required'),
});

// Inferred types
export type CreateReportBody = z.infer<typeof createReportBodySchema>;
export type ListReportsQuery = z.infer<typeof listReportsQuerySchema>;
export type ReviewReportBody = z.infer<typeof reviewReportBodySchema>;
export type ReportIdParams = z.infer<typeof reportIdParamsSchema>;
export type ReportUserParams = z.infer<typeof reportUserParamsSchema>;
