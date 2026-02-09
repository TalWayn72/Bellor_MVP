/**
 * Reports Admin Controller
 * Handles admin-only report operations (review, user reports, statistics)
 */

import { FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { ReportsService } from '../../services/reports.service.js';
import {
  reviewReportBodySchema,
  reportIdParamsSchema,
  reportUserParamsSchema,
  ReviewReportBody,
  ReportIdParams,
  ReportUserParams,
} from './reports-schemas.js';
import { securityLogger } from '../../security/logger.js';

function zodError(reply: FastifyReply, error: z.ZodError) {
  return reply.status(400).send({ error: 'Validation failed', details: error.errors });
}

export const ReportsAdminController = {
  /** PATCH /api/v1/reports/:id/review (admin only) */
  async reviewReport(
    request: FastifyRequest<{ Params: ReportIdParams; Body: ReviewReportBody }>,
    reply: FastifyReply
  ) {
    try {
      const user = request.user as unknown as { id: string; isAdmin?: boolean } | undefined;
      if (!user?.isAdmin) {
        securityLogger.accessDenied(request, 'reports.reviewReport');
        return reply.status(403).send({ error: 'Admin access required' });
      }
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
      if (!user?.isAdmin) {
        securityLogger.accessDenied(request, 'reports.getReportsForUser');
        return reply.status(403).send({ error: 'Admin access required' });
      }
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
      if (!user?.isAdmin) {
        securityLogger.accessDenied(request, 'reports.getStatistics');
        return reply.status(403).send({ error: 'Admin access required' });
      }
      const statistics = await ReportsService.getStatistics();
      return reply.send({ statistics });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return reply.status(500).send({ error: message });
    }
  },
};
