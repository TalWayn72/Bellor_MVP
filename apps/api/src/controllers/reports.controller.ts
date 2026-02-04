/**
 * Reports Controller
 * Handles HTTP requests for reports and moderation
 */

import { FastifyRequest, FastifyReply } from 'fastify';
import { ReportsService } from '../services/reports.service.js';
import { ReportReason, ReportStatus, ContentType } from '@prisma/client';

interface CreateReportBody {
  reportedUserId: string;
  reason: ReportReason;
  description?: string;
  contentType?: ContentType;
  contentId?: string;
}

interface ListReportsQuery {
  status?: ReportStatus;
  reason?: ReportReason;
  limit?: number;
  offset?: number;
}

interface ReviewReportBody {
  status: ReportStatus;
  reviewNotes?: string;
  blockUser?: boolean;
}

export const ReportsController = {
  /**
   * Create a new report
   * POST /api/v1/reports
   */
  async createReport(
    request: FastifyRequest<{ Body: CreateReportBody }>,
    reply: FastifyReply
  ) {
    try {
      const userId = (request as any).user?.id;
      if (!userId) {
        return reply.status(401).send({ error: 'Unauthorized' });
      }

      const { reportedUserId, reason, description, contentType, contentId } = request.body;

      // Can't report yourself
      if (userId === reportedUserId) {
        return reply.status(400).send({ error: 'Cannot report yourself' });
      }

      const report = await ReportsService.createReport({
        reporterId: userId,
        reportedUserId,
        reason,
        description,
        contentType,
        contentId,
      });

      return reply.status(201).send({
        message: 'Report submitted successfully',
        report,
      });
    } catch (error: any) {
      return reply.status(400).send({ error: error.message });
    }
  },

  /**
   * Get report by ID (admin only)
   * GET /api/v1/reports/:id
   */
  async getReport(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) {
    try {
      const user = (request as any).user;
      if (!user?.isAdmin) {
        return reply.status(403).send({ error: 'Admin access required' });
      }

      const report = await ReportsService.getReportById(request.params.id);
      return reply.send({ report });
    } catch (error: any) {
      return reply.status(404).send({ error: error.message });
    }
  },

  /**
   * List reports (admin only)
   * GET /api/v1/reports
   */
  async listReports(
    request: FastifyRequest<{ Querystring: ListReportsQuery }>,
    reply: FastifyReply
  ) {
    try {
      const user = (request as any).user;
      if (!user?.isAdmin) {
        return reply.status(403).send({ error: 'Admin access required' });
      }

      const { status, reason, limit, offset } = request.query;

      const result = await ReportsService.listReports({
        status,
        reason,
        limit: limit ? parseInt(String(limit)) : undefined,
        offset: offset ? parseInt(String(offset)) : undefined,
      });

      return reply.send(result);
    } catch (error: any) {
      return reply.status(500).send({ error: error.message });
    }
  },

  /**
   * Get pending reports count (admin only)
   * GET /api/v1/reports/pending/count
   */
  async getPendingCount(
    request: FastifyRequest,
    reply: FastifyReply
  ) {
    try {
      const user = (request as any).user;
      if (!user?.isAdmin) {
        return reply.status(403).send({ error: 'Admin access required' });
      }

      const count = await ReportsService.getPendingCount();
      return reply.send({ count });
    } catch (error: any) {
      return reply.status(500).send({ error: error.message });
    }
  },

  /**
   * Review a report (admin only)
   * PATCH /api/v1/reports/:id/review
   */
  async reviewReport(
    request: FastifyRequest<{ Params: { id: string }; Body: ReviewReportBody }>,
    reply: FastifyReply
  ) {
    try {
      const user = (request as any).user;
      if (!user?.isAdmin) {
        return reply.status(403).send({ error: 'Admin access required' });
      }

      const { status, reviewNotes, blockUser } = request.body;

      const report = await ReportsService.reviewReport(request.params.id, {
        reviewerId: user.id,
        status,
        reviewNotes,
        blockUser,
      });

      return reply.send({
        message: 'Report reviewed successfully',
        report,
      });
    } catch (error: any) {
      return reply.status(400).send({ error: error.message });
    }
  },

  /**
   * Get reports for a specific user (admin only)
   * GET /api/v1/reports/user/:userId
   */
  async getReportsForUser(
    request: FastifyRequest<{ Params: { userId: string } }>,
    reply: FastifyReply
  ) {
    try {
      const user = (request as any).user;
      if (!user?.isAdmin) {
        return reply.status(403).send({ error: 'Admin access required' });
      }

      const reports = await ReportsService.getReportsForUser(request.params.userId);
      return reply.send({ reports });
    } catch (error: any) {
      return reply.status(500).send({ error: error.message });
    }
  },

  /**
   * Get report statistics (admin only)
   * GET /api/v1/reports/statistics
   */
  async getStatistics(
    request: FastifyRequest,
    reply: FastifyReply
  ) {
    try {
      const user = (request as any).user;
      if (!user?.isAdmin) {
        return reply.status(403).send({ error: 'Admin access required' });
      }

      const statistics = await ReportsService.getStatistics();
      return reply.send({ statistics });
    } catch (error: any) {
      return reply.status(500).send({ error: error.message });
    }
  },
};
