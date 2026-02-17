/**
 * Admin Controller - Dashboard & Analytics Handlers
 */

import { FastifyRequest, FastifyReply } from 'fastify';
import { AnalyticsService } from '../../services/analytics.service.js';

export async function getDashboard(_request: FastifyRequest, reply: FastifyReply) {
  try {
    const overview = await AnalyticsService.getDashboardOverview();
    return reply.send({ success: true, data: overview });
  } catch {
    return reply.code(500).send({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch dashboard data' } });
  }
}

export async function getUserAnalytics(
  request: FastifyRequest<{ Querystring: { startDate?: string; endDate?: string } }>,
  reply: FastifyReply
) {
  try {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000);
    const startDate = request.query.startDate ? new Date(request.query.startDate) : thirtyDaysAgo;
    const endDate = request.query.endDate ? new Date(request.query.endDate) : now;

    const [growth, activity, retention] = await Promise.all([
      AnalyticsService.getUserGrowthMetrics({ startDate, endDate }),
      AnalyticsService.getUserActivityMetrics({ startDate, endDate }),
      AnalyticsService.getRetentionMetrics(),
    ]);

    return reply.send({ success: true, data: { growth, activity, retention } });
  } catch {
    return reply.code(500).send({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch user analytics' } });
  }
}

export async function getContentAnalytics(
  request: FastifyRequest<{ Querystring: { startDate?: string; endDate?: string } }>,
  reply: FastifyReply
) {
  try {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000);
    const startDate = request.query.startDate ? new Date(request.query.startDate) : thirtyDaysAgo;
    const endDate = request.query.endDate ? new Date(request.query.endDate) : now;

    const content = await AnalyticsService.getContentMetrics({ startDate, endDate });
    return reply.send({ success: true, data: content });
  } catch {
    return reply.code(500).send({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch content analytics' } });
  }
}

export async function getModerationAnalytics(_request: FastifyRequest, reply: FastifyReply) {
  try {
    const moderation = await AnalyticsService.getModerationMetrics();
    return reply.send({ success: true, data: moderation });
  } catch {
    return reply.code(500).send({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch moderation analytics' } });
  }
}

export async function getTopUsers(
  request: FastifyRequest<{ Querystring: { limit?: string } }>,
  reply: FastifyReply
) {
  try {
    const limit = request.query.limit ? parseInt(request.query.limit) : 10;
    const topUsers = await AnalyticsService.getTopUsers(limit);
    return reply.send({ success: true, data: topUsers });
  } catch {
    return reply.code(500).send({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch top users' } });
  }
}

export async function getSystemHealth(_request: FastifyRequest, reply: FastifyReply) {
  try {
    const health = await AnalyticsService.getSystemHealth();
    return reply.send({ success: true, data: health });
  } catch {
    return reply.code(500).send({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch system health' } });
  }
}

export async function exportUsers(
  request: FastifyRequest<{ Querystring: { startDate?: string; endDate?: string; format?: string } }>,
  reply: FastifyReply
) {
  try {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000);
    const startDate = request.query.startDate ? new Date(request.query.startDate) : thirtyDaysAgo;
    const endDate = request.query.endDate ? new Date(request.query.endDate) : now;
    const format = request.query.format || 'json';

    const users = await AnalyticsService.exportUsersReport({ startDate, endDate });

    if (format === 'csv') {
      const headers = ['id', 'email', 'firstName', 'lastName', 'gender', 'isPremium', 'isVerified', 'isBlocked', 'responseCount', 'chatCount', 'missionCompletedCount', 'createdAt', 'lastActiveAt'];
      const csvRows = [headers.join(',')];
      for (const user of users) {
        csvRows.push([user.id, user.email, user.firstName || '', user.lastName || '', user.gender || '', user.isPremium, user.isVerified, user.isBlocked, user.responseCount, user.chatCount, user.missionCompletedCount, user.createdAt.toISOString(), user.lastActiveAt?.toISOString() || ''].join(','));
      }
      reply.header('Content-Type', 'text/csv');
      reply.header('Content-Disposition', `attachment; filename=users-export-${startDate.toISOString().split('T')[0]}.csv`);
      return reply.send(csvRows.join('\n'));
    }

    return reply.send({
      success: true,
      data: { users, exportedAt: now.toISOString(), range: { startDate: startDate.toISOString(), endDate: endDate.toISOString() } },
    });
  } catch {
    return reply.code(500).send({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to export users' } });
  }
}
