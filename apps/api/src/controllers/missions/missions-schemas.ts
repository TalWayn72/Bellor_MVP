/**
 * Missions Schemas
 * Zod validation schemas for missions endpoints
 */

import { z } from 'zod';

export const createMissionSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(1000),
  missionType: z.enum(['DAILY', 'WEEKLY', 'SPECIAL', 'ICE_BREAKER']),
  difficulty: z.number().int().min(1).max(5).optional().default(1),
  xpReward: z.number().int().min(0).optional().default(10),
  activeFrom: z.string().datetime().optional().transform(s => s ? new Date(s) : undefined),
  activeUntil: z.string().datetime().optional().transform(s => s ? new Date(s) : undefined),
});

export const updateMissionSchema = createMissionSchema.partial();

export const listMissionsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  offset: z.coerce.number().int().min(0).optional().default(0),
  type: z.enum(['DAILY', 'WEEKLY', 'SPECIAL', 'ICE_BREAKER']).optional(),
  isActive: z.coerce.boolean().optional(),
});
