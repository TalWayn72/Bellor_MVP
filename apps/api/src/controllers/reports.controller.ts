/**
 * Reports Controller
 * Handles HTTP requests for reports and moderation
 */

import { FastifyRequest, FastifyReply } from 'fastify';
import { ReportsService } from '../services/reports.service.js';
import { CreateReportBody, ListReportsQuery, ReviewReportBody } from './reports/reports-schemas.js';

export const ReportsController = {
  /** POST /api/v1/reports */
  async createReport(request: FastifyRequest<{ Body: CreateReportBody }>, reply: FastifyReply) {
    try {
      const userId = request.user?.id;
      if (!userId) return reply.status(401).send({ error: 'Unauthorized' });
      const { reportedUserId, reason, description, contentType, contentId } = request.body;
      if (userId === reportedUserId) return reply.status(400).send({ error: 'Cannot report yourself' });

      const report = await ReportsService.createReport({
        reporterId: userId, reportedUserId, reason, description, contentType, contentId,
      });
      return reply.status(201).send({ message: 'Report submitted successfully', report });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return reply.status(400).send({ error: message });
    }
  },

  /** GET /api/v1/reports/:id (admin only) */
  async getReport(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      const user = request.user as unknown as { id: string; isAdmin?: boolean } | undefined;
      if (!user?.isAdmin) return reply.status(403).send({ error: 'Admin access required' });
      const report = await ReportsService.getReportById(request.params.id);
      return reply.send({ report });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return reply.status(404).send({ error: message });
    }
  },

  /** GET /api/v1/reports (admin only) */
  async listReports(request: FastifyRequest<{ Querystring: ListReportsQuery }>, reply: FastifyReply) {
    try {
      const user = request.user as unknown as { isAdmin?: boolean } | undefined;
      if (!user?.isAdmin) return reply.status(403).send({ error: 'Admin access required' });
      const { status, reason, limit, offset } = request.query;
      const result = await ReportsService.listReports({
        status, reason,
        limit: limit ? parseInt(String(limit)) : undefined,
        offset: offset ? parseInt(String(offset)) : undefined,
      });
      return reply.send(result);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return reply.status(500).send({ error: message });
    }
  },

  /** GET /api/v1/reports/pending/count (admin only) */
  async getPendingCount(request: FastifyRequest, reply: FastifyReply) {
    try {
      const user = request.user as unknown as { isAdmin?: boolean } | undefined;
      if (!user?.isAdmin) return reply.status(403).send({ error: 'Admin access required' });
      const count = await ReportsService.getPendingCount();
      return reply.send({ count });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return reply.status(500).send({ error: message });
    }
  },

  /** PATCH /api/v1/reports/:id/review (admin only) */
  async reviewReport(
    request: FastifyRequest<{ Params: { id: string }; Body: ReviewReportBody }>,
    reply: FastifyReply
  ) {
    try {
      const user = request.user as unknown as { id: string; isAdmin?: boolean } | undefined;
      if (!user?.isAdmin) return reply.status(403).send({ error: 'Admin access required' });
      const { status, reviewNotes, blockUser } = request.body;
      const report = await ReportsService.reviewReport(request.params.id, {
        reviewerId: user.id, status, reviewNotes, blockUser,
      });
      return reply.send({ message: 'Report reviewed successfully', report });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return reply.status(400).send({ error: message });
    }
  },

  /** GET /api/v1/reports/user/:userId (admin only) */
  async getReportsForUser(request: FastifyRequest<{ Params: { userId: string } }>, reply: FastifyReply) {
    try {
      const user = request.user as unknown as { isAdmin?: boolean } | undefined;
      if (!user?.isAdmin) return reply.status(403).send({ error: 'Admin access required' });
      const reports = await ReportsService.getReportsForUser(request.params.userId);
      return reply.send({ reports });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return reply.status(500).send({ error: message });
    }
  },

  /** GET /api/v1/reports/statistics (admin only) */
  async getStatistics(request: FastifyRequest, reply: FastifyReply) {
    try {
      const user = request.user as unknown as { isAdmin?: boolean } | undefined;
      if (!user?.isAdmin) return reply.status(403).send({ error: 'Admin access required' });
      const statistics = await ReportsService.getStatistics();
      return reply.send({ statistics });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return reply.status(500).send({ error: message });
    }
  },
};
