/**
 * Device Tokens Controller
 * HTTP handlers for push notification device registration
 */

import { FastifyRequest, FastifyReply } from 'fastify';
import { ZodError } from 'zod';
import { PushNotificationsService } from '../services/push-notifications.service.js';
import {
  registerDeviceBodySchema,
  unregisterDeviceBodySchema,
  sendTestNotificationBodySchema,
  sendBroadcastBodySchema,
  cleanupTokensBodySchema,
} from './device-tokens/device-tokens-schemas.js';
import { securityLogger } from '../security/logger.js';

function handleError(error: unknown, reply: FastifyReply) {
  if (error instanceof ZodError) {
    return reply.status(400).send({ error: error.errors[0]?.message || 'Validation error' });
  }
  const message = error instanceof Error ? error.message : 'Unknown error';
  return reply.status(500).send({ error: message });
}

export const DeviceTokensController = {
  /** POST /device-tokens/register */
  async registerDevice(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = request.user!.id;
      const body = registerDeviceBodySchema.parse(request.body);
      const deviceToken = await PushNotificationsService.registerDevice({
        userId, token: body.token, platform: body.platform,
        deviceId: body.deviceId, deviceName: body.deviceName,
      });
      return reply.status(201).send({ deviceToken });
    } catch (error: unknown) {
      return handleError(error, reply);
    }
  },

  /** POST /device-tokens/unregister */
  async unregisterDevice(request: FastifyRequest, reply: FastifyReply) {
    try {
      const body = unregisterDeviceBodySchema.parse(request.body);
      const result = await PushNotificationsService.unregisterDevice(body.token);
      return reply.send(result);
    } catch (error: unknown) {
      return handleError(error, reply);
    }
  },

  /** GET /device-tokens/my */
  async getMyDevices(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = request.user!.id;
      const devices = await PushNotificationsService.getUserDeviceTokens(userId);
      return reply.send({
        devices: devices.map(d => ({
          id: d.id, platform: d.platform, deviceId: d.deviceId,
          deviceName: d.deviceName, isActive: d.isActive,
          lastUsedAt: d.lastUsedAt, createdAt: d.createdAt,
        })),
      });
    } catch (error: unknown) {
      return handleError(error, reply);
    }
  },

  /** POST /device-tokens/test */
  async sendTestNotification(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = request.user!.id;
      const body = sendTestNotificationBodySchema.parse(request.body || {});
      const result = await PushNotificationsService.sendToUser({
        userId, title: body.title, body: body.body, data: { test: 'true' },
      });
      return reply.send({ success: true, ...result });
    } catch (error: unknown) {
      return handleError(error, reply);
    }
  },

  /** POST /device-tokens/broadcast (admin only) */
  async sendBroadcast(request: FastifyRequest, reply: FastifyReply) {
    const user = request.user as Record<string, unknown> | undefined;
    if (!user || !(user as Record<string, unknown>).isAdmin) {
      securityLogger.accessDenied(request, 'deviceTokens.sendBroadcast');
      return reply.status(403).send({ error: 'Admin access required' });
    }
    try {
      const body = sendBroadcastBodySchema.parse(request.body);
      const result = await PushNotificationsService.sendBroadcast(body.title, body.body);
      return reply.send({ success: true, ...result });
    } catch (error: unknown) {
      return handleError(error, reply);
    }
  },

  /** POST /device-tokens/cleanup (admin only) */
  async cleanupInactiveTokens(request: FastifyRequest, reply: FastifyReply) {
    const user = request.user as Record<string, unknown> | undefined;
    if (!user || !(user as Record<string, unknown>).isAdmin) {
      securityLogger.accessDenied(request, 'deviceTokens.cleanupInactiveTokens');
      return reply.status(403).send({ error: 'Admin access required' });
    }
    try {
      const body = cleanupTokensBodySchema.parse(request.body || {});
      const result = await PushNotificationsService.cleanupInactiveTokens(body.daysOld);
      return reply.send({ success: true, ...result });
    } catch (error: unknown) {
      return handleError(error, reply);
    }
  },
};
