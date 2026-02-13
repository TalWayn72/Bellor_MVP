/**
 * Subscriptions Zod Validation Schemas
 */
import { z } from 'zod';

export const createCheckoutBodySchema = z.object({
  planId: z.string().min(1, 'planId is required'),
  billingCycle: z.enum(['MONTHLY', 'YEARLY']).optional().default('MONTHLY'),
  successUrl: z.string().url('Invalid successUrl'),
  cancelUrl: z.string().url('Invalid cancelUrl'),
});

export const createPortalBodySchema = z.object({
  returnUrl: z.string().url('Invalid returnUrl'),
});

export const cancelSubscriptionBodySchema = z.object({
  cancelAtPeriodEnd: z.boolean().optional().default(true),
});

export const paymentHistoryQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional().default(10),
});

export type CreateCheckoutBody = z.infer<typeof createCheckoutBodySchema>;
export type CreatePortalBody = z.infer<typeof createPortalBodySchema>;
export type CancelSubscriptionBody = z.infer<typeof cancelSubscriptionBodySchema>;
