/**
 * Device Tokens Schemas
 * Zod validation schemas for device token endpoints
 */

import { z } from 'zod';

export const registerDeviceBodySchema = z.object({
  token: z.string().min(1, 'token is required'),
  platform: z.enum(['IOS', 'ANDROID', 'WEB']),
  deviceId: z.string().optional(),
  deviceName: z.string().max(100).optional(),
});

export const unregisterDeviceBodySchema = z.object({
  token: z.string().min(1, 'token is required'),
});

export const sendTestNotificationBodySchema = z.object({
  title: z.string().min(1).max(200).optional().default('Test Notification'),
  body: z.string().min(1).max(500).optional().default('This is a test notification'),
});

export const sendBroadcastBodySchema = z.object({
  title: z.string().min(1, 'title is required').max(200),
  body: z.string().min(1, 'body is required').max(500),
});

export const cleanupTokensBodySchema = z.object({
  daysOld: z.number().int().min(1).max(365).optional().default(30),
});

// Inferred types
export type RegisterDeviceBody = z.infer<typeof registerDeviceBodySchema>;
export type UnregisterDeviceBody = z.infer<typeof unregisterDeviceBodySchema>;
export type SendTestNotificationBody = z.infer<typeof sendTestNotificationBodySchema>;
export type SendBroadcastBody = z.infer<typeof sendBroadcastBodySchema>;
export type CleanupTokensBody = z.infer<typeof cleanupTokensBodySchema>;
