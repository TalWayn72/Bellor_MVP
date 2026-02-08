/**
 * Reports Controller
 * Handles HTTP requests for reports and moderation with Zod validation
 */

import { FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { ReportsService } from '../services/reports.service.js';
import {
  createReportBodySchema,
  listReportsQuerySchema,
  reviewReportBodySchema,
  reportIdParamsSchema,
  reportUserParamsSchema,
  CreateReportBody,
  ListReportsQuery,
  ReviewReportBody,
  ReportIdParams,
  ReportUserParams,
} from './reports/reports-schemas.js';

function zodError(reply: FastifyReply, error: z.ZodError) {
  return reply.status(400).send({ error: 'Validation failed', details: error.errors });
}

export const ReportsController = {
  /** POST /api/v1/reports */
  async createReport(request: FastifyRequest<{ Body: CreateReportBody }>, reply: FastifyReply) {
    try {
      const userId = request.user?.id;
      if (!userId) return reply.status(401).send({ error: 'Unauthorized' });
      const body = createReportBodySchema.parse(request.body);
      if (userId === body.reportedUserId) return reply.status(400).send({ error: 'Cannot report yourself' });

      const report = await ReportsService.createReport({
        reporterId: userId, reportedUserId: body.reportedUserId,
        reason: body.reason, description: body.description,
        contentType: body.contentType, contentId: body.contentId,
      });
      return reply.status(201).send({ message: 'Report submitted successfully', report });
    } catch (error: unknown) {
      if (error instanceof z.ZodError) return zodError(reply, error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      return reply.status(400).send({ error: message });
    }
  },

  /** GET /api/v1/reports/:id (admin only) */
  async getReport(request: FastifyRequest<{ Params: ReportIdParams }>, reply: FastifyReply) {
    try {
      const user = request.user as unknown as { id: string; isAdmin?: boolean } | undefined;
      if (!user?.isAdmin) return reply.status(403).send({ error: 'Admin access required' });
      const params = reportIdParamsSchema.parse(request.params);
      const report = await ReportsService.getReportById(params.id);
      return reply.send({ report });
    } catch (error: unknown) {
      if (error instanceof z.ZodError) return zodError(reply, error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      return reply.status(404).send({ error: message });
    }
  },

  /** GET /api/v1/reports (admin only) */
  async listReports(request: FastifyRequest<{ Querystring: ListReportsQuery }>, reply: FastifyReply) {
    try {
      const user = request.user as unknown as { isAdmin?: boolean } | undefined;
      if (!user?.isAdmin) return reply.status(403).send({ error: 'Admin access required' });
      const query = listReportsQuerySchema.parse(request.query);
      const result = await ReportsService.listReports({
        status: query.status, reason: query.reason,
        limit: query.limit, offset: query.offset,
      });
      return reply.send(result);
    } catch (error: unknown) {
      if (error instanceof z.ZodError) return zodError(reply, error);
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
    request: FastifyRequest<{ Params: ReportIdParams; Body: ReviewReportBody }>,
    reply: FastifyReply
  ) {
    try {
      const user = request.user as unknown as { id: string; isAdmin?: boolean } | undefined;
      if (!user?.isAdmin) return reply.status(403).send({ error: 'Admin access required' });
      const params = reportIdParamsSchema.parse(request.params);
      const body = reviewReportBodySchema.parse(request.body);
      const report = await ReportsService.reviewReport(params.id, {
        reviewerId: user.id, status: body.status,
        reviewNotes: body.reviewNotes, blockUser: body.blockUser,
      });
      return reply.send({ message: 'Report reviewed successfully', report });
    } catch (error: unknown) {
      if (error instanceof z.ZodError) return zodError(reply, error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      return reply.status(400).send({ error: message });
    }
  },

  /** GET /api/v1/reports/user/:userId (admin only) */
  async getReportsForUser(request: FastifyRequest<{ Params: ReportUserParams }>, reply: FastifyReply) {
    try {
      const user = request.user as unknown as { isAdmin?: boolean } | undefined;
      if (!user?.isAdmin) return reply.status(403).send({ error: 'Admin access required' });
      const params = reportUserParamsSchema.parse(request.params);
      const reports = await ReportsService.getReportsForUser(params.userId);
      return reply.send({ reports });
    } catch (error: unknown) {
      if (error instanceof z.ZodError) return zodError(reply, error);
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
