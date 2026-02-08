/**
 * Notifications Controller
 * HTTP handlers for notifications API with Zod validation
 */

import { FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { NotificationsService } from '../services/notifications.service.js';
import {
  listNotificationsQuerySchema,
  notificationIdParamsSchema,
  ListNotificationsQuery,
  NotificationIdParams,
} from './notifications/notifications-schemas.js';

function zodError(reply: FastifyReply, error: z.ZodError) {
  return reply.status(400).send({ error: 'Validation failed', details: error.errors });
}

export const NotificationsController = {
  /** GET /notifications */
  async getNotifications(
    request: FastifyRequest<{ Querystring: ListNotificationsQuery }>,
    reply: FastifyReply
  ) {
    try {
      const userId = request.user!.id;
      const query = listNotificationsQuerySchema.parse(request.query);

      const result = await NotificationsService.getNotifications(userId, {
        limit: query.limit,
        offset: query.offset,
        isRead: query.isRead !== undefined ? query.isRead === 'true' : undefined,
        type: query.type,
      });
      return reply.send(result);
    } catch (error: unknown) {
      if (error instanceof z.ZodError) return zodError(reply, error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      return reply.status(500).send({ error: message });
    }
  },

  /** GET /notifications/unread-count */
  async getUnreadCount(request: FastifyRequest, reply: FastifyReply) {
    const userId = request.user!.id;
    try {
      const count = await NotificationsService.getUnreadCount(userId);
      return reply.send({ unreadCount: count });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return reply.status(500).send({ error: message });
    }
  },

  /** PATCH /notifications/:id/read */
  async markAsRead(
    request: FastifyRequest<{ Params: NotificationIdParams }>,
    reply: FastifyReply
  ) {
    try {
      const userId = request.user!.id;
      const params = notificationIdParamsSchema.parse(request.params);

      const notification = await NotificationsService.markAsRead(params.id, userId);
      return reply.send({ notification });
    } catch (error: unknown) {
      if (error instanceof z.ZodError) return zodError(reply, error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      return reply.status(404).send({ error: message });
    }
  },

  /** POST /notifications/read-all */
  async markAllAsRead(request: FastifyRequest, reply: FastifyReply) {
    const userId = request.user!.id;
    try {
      const result = await NotificationsService.markAllAsRead(userId);
      return reply.send(result);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return reply.status(500).send({ error: message });
    }
  },

  /** DELETE /notifications/:id */
  async deleteNotification(
    request: FastifyRequest<{ Params: NotificationIdParams }>,
    reply: FastifyReply
  ) {
    try {
      const userId = request.user!.id;
      const params = notificationIdParamsSchema.parse(request.params);

      const result = await NotificationsService.deleteNotification(params.id, userId);
      return reply.send(result);
    } catch (error: unknown) {
      if (error instanceof z.ZodError) return zodError(reply, error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      return reply.status(404).send({ error: message });
    }
  },

  /** DELETE /notifications/read */
  async deleteReadNotifications(request: FastifyRequest, reply: FastifyReply) {
    const userId = request.user!.id;
    try {
      const result = await NotificationsService.deleteReadNotifications(userId);
      return reply.send(result);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return reply.status(500).send({ error: message });
    }
  },
};
