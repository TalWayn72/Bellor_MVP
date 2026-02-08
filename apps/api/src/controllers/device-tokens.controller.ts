/**
 * Device Tokens Controller
 * HTTP handlers for push notification device registration
 */

import { FastifyRequest, FastifyReply } from 'fastify';
import { PushNotificationsService } from '../services/push-notifications.service.js';
import { Platform } from '@prisma/client';

interface RegisterDeviceBody {
  token: string;
  platform: Platform;
  deviceId?: string;
  deviceName?: string;
}

interface UnregisterDeviceBody {
  token: string;
}

interface SendTestNotificationBody {
  title: string;
  body: string;
}

export const DeviceTokensController = {
  /**
   * Register device for push notifications
   * POST /device-tokens/register
   */
  async registerDevice(
    request: FastifyRequest<{ Body: RegisterDeviceBody }>,
    reply: FastifyReply
  ) {
    const userId = request.user!.id;
    const { token, platform, deviceId, deviceName } = request.body;

    if (!token || !platform) {
      return reply.status(400).send({
        error: 'Missing required fields: token, platform',
      });
    }

    if (!['IOS', 'ANDROID', 'WEB'].includes(platform)) {
      return reply.status(400).send({
        error: 'Invalid platform. Must be IOS, ANDROID, or WEB',
      });
    }

    try {
      const deviceToken = await PushNotificationsService.registerDevice({
        userId,
        token,
        platform,
        deviceId,
        deviceName,
      });

      return reply.status(201).send({ deviceToken });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return reply.status(500).send({ error: message });
    }
  },

  /**
   * Unregister device from push notifications
   * POST /device-tokens/unregister
   */
  async unregisterDevice(
    request: FastifyRequest<{ Body: UnregisterDeviceBody }>,
    reply: FastifyReply
  ) {
    const { token } = request.body;

    if (!token) {
      return reply.status(400).send({ error: 'Missing required field: token' });
    }

    try {
      const result = await PushNotificationsService.unregisterDevice(token);
      return reply.send(result);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return reply.status(500).send({ error: message });
    }
  },

  /**
   * Get current user's registered devices
   * GET /device-tokens/my
   */
  async getMyDevices(
    request: FastifyRequest,
    reply: FastifyReply
  ) {
    const userId = request.user!.id;

    try {
      const devices = await PushNotificationsService.getUserDeviceTokens(userId);
      return reply.send({
        devices: devices.map(d => ({
          id: d.id,
          platform: d.platform,
          deviceId: d.deviceId,
          deviceName: d.deviceName,
          isActive: d.isActive,
          lastUsedAt: d.lastUsedAt,
          createdAt: d.createdAt,
        })),
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return reply.status(500).send({ error: message });
    }
  },

  /**
   * Send test notification to current user
   * POST /device-tokens/test (for development)
   */
  async sendTestNotification(
    request: FastifyRequest<{ Body: SendTestNotificationBody }>,
    reply: FastifyReply
  ) {
    const userId = request.user!.id;
    const { title = 'Test Notification', body = 'This is a test notification' } =
      request.body || {};

    try {
      const result = await PushNotificationsService.sendToUser({
        userId,
        title,
        body,
        data: { test: 'true' },
      });

      return reply.send({
        success: true,
        ...result,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return reply.status(500).send({ error: message });
    }
  },

  /**
   * Admin: Send broadcast notification to all users
   * POST /device-tokens/broadcast (admin only)
   */
  async sendBroadcast(
    request: FastifyRequest<{ Body: { title: string; body: string } }>,
    reply: FastifyReply
  ) {
    const user = request.user as Record<string, unknown> | undefined;

    if (!user || !(user as Record<string, unknown>).isAdmin) {
      return reply.status(403).send({ error: 'Admin access required' });
    }

    const { title, body } = request.body;

    if (!title || !body) {
      return reply.status(400).send({
        error: 'Missing required fields: title, body',
      });
    }

    try {
      const result = await PushNotificationsService.sendBroadcast(title, body);
      return reply.send({
        success: true,
        ...result,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return reply.status(500).send({ error: message });
    }
  },

  /**
   * Admin: Cleanup inactive tokens
   * POST /device-tokens/cleanup (admin only)
   */
  async cleanupInactiveTokens(
    request: FastifyRequest<{ Body: { daysOld?: number } }>,
    reply: FastifyReply
  ) {
    const user = request.user as Record<string, unknown> | undefined;

    if (!user || !(user as Record<string, unknown>).isAdmin) {
      return reply.status(403).send({ error: 'Admin access required' });
    }

    const { daysOld = 30 } = request.body || {};

    try {
      const result = await PushNotificationsService.cleanupInactiveTokens(daysOld);
      return reply.send({
        success: true,
        ...result,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return reply.status(500).send({ error: message });
    }
  },
};
