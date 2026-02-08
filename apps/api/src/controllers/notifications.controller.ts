/**
 * Notifications Controller
 * HTTP handlers for notifications API
 */

import { FastifyRequest, FastifyReply } from 'fastify';
import { NotificationsService } from '../services/notifications.service.js';
import { NotificationType } from '@prisma/client';

interface ListNotificationsQuery {
  limit?: number;
  offset?: number;
  isRead?: string;
  type?: NotificationType;
}

export const NotificationsController = {
  /**
   * Get my notifications
   * GET /notifications
   */
  async getNotifications(
    request: FastifyRequest<{ Querystring: ListNotificationsQuery }>,
    reply: FastifyReply
  ) {
    const userId = request.user!.id;
    const { limit, offset, isRead, type } = request.query;

    try {
      const result = await NotificationsService.getNotifications(userId, {
        limit: limit ? Number(limit) : undefined,
        offset: offset ? Number(offset) : undefined,
        isRead: isRead !== undefined ? isRead === 'true' : undefined,
        type,
      });
      return reply.send(result);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return reply.status(500).send({ error: message });
    }
  },

  /**
   * Get unread count
   * GET /notifications/unread-count
   */
  async getUnreadCount(
    request: FastifyRequest,
    reply: FastifyReply
  ) {
    const userId = request.user!.id;

    try {
      const count = await NotificationsService.getUnreadCount(userId);
      return reply.send({ unreadCount: count });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return reply.status(500).send({ error: message });
    }
  },

  /**
   * Mark notification as read
   * PATCH /notifications/:id/read
   */
  async markAsRead(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) {
    const userId = request.user!.id;
    const { id } = request.params;

    try {
      const notification = await NotificationsService.markAsRead(id, userId);
      return reply.send({ notification });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return reply.status(404).send({ error: message });
    }
  },

  /**
   * Mark all notifications as read
   * POST /notifications/read-all
   */
  async markAllAsRead(
    request: FastifyRequest,
    reply: FastifyReply
  ) {
    const userId = request.user!.id;

    try {
      const result = await NotificationsService.markAllAsRead(userId);
      return reply.send(result);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return reply.status(500).send({ error: message });
    }
  },

  /**
   * Delete a notification
   * DELETE /notifications/:id
   */
  async deleteNotification(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) {
    const userId = request.user!.id;
    const { id } = request.params;

    try {
      const result = await NotificationsService.deleteNotification(id, userId);
      return reply.send(result);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return reply.status(404).send({ error: message });
    }
  },

  /**
   * Delete all read notifications
   * DELETE /notifications/read
   */
  async deleteReadNotifications(
    request: FastifyRequest,
    reply: FastifyReply
  ) {
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
