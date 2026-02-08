/**
 * Reports Service
 * Core CRUD: create, get, update, list
 * Moderation logic delegated to reports/reports-moderation.service.ts
 */

import { prisma } from '../lib/prisma.js';
import { ReportReason, ReportStatus, ContentType, Prisma } from '@prisma/client';
import {
  calculatePriority,
  checkAutoBlock,
  getStatistics,
  getReportsForUser,
  getPendingCount,
} from './reports/reports-moderation.service.js';

interface CreateReportInput {
  reporterId: string;
  reportedUserId: string;
  reason: ReportReason;
  description?: string;
  contentType?: ContentType;
  contentId?: string;
}

interface ListReportsParams {
  status?: ReportStatus;
  reason?: ReportReason;
  limit?: number;
  offset?: number;
}

interface ReviewReportInput {
  reviewerId: string;
  status: ReportStatus;
  reviewNotes?: string;
  blockUser?: boolean;
}

export const ReportsService = {
  /**
   * Create a new report
   */
  async createReport(input: CreateReportInput) {
    const { reporterId, reportedUserId, reason, description, contentType, contentId } = input;

    const existingReport = await prisma.report.findFirst({
      where: {
        reporterId, reportedUserId, reason,
        createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      },
    });

    if (existingReport) {
      throw new Error('You have already reported this user for this reason recently');
    }

    const priority = this.calculatePriority(reason);

    const report = await prisma.report.create({
      data: {
        reporterId, reportedUserId, reason, description,
        reportedContentType: contentType, reportedContentId: contentId, priority,
      },
      include: {
        reporter: { select: { id: true, firstName: true, lastName: true, email: true } },
        reportedUser: { select: { id: true, firstName: true, lastName: true, email: true, isBlocked: true } },
      },
    });

    await checkAutoBlock(reportedUserId);
    return report;
  },

  /**
   * Get a report by ID
   */
  async getReportById(reportId: string) {
    const report = await prisma.report.findUnique({
      where: { id: reportId },
      include: {
        reporter: { select: { id: true, firstName: true, lastName: true, email: true } },
        reportedUser: { select: { id: true, firstName: true, lastName: true, email: true, isBlocked: true } },
      },
    });

    if (!report) throw new Error('Report not found');
    return report;
  },

  /**
   * List reports with filters and pagination
   */
  async listReports(params: ListReportsParams) {
    const { status, reason, limit = 20, offset = 0 } = params;

    const where: Prisma.ReportWhereInput = {};
    if (status) where.status = status;
    if (reason) where.reason = reason;

    const [reports, total] = await Promise.all([
      prisma.report.findMany({
        where,
        include: {
          reporter: { select: { id: true, firstName: true, lastName: true, email: true } },
          reportedUser: { select: { id: true, firstName: true, lastName: true, email: true, isBlocked: true } },
        },
        orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
        skip: offset, take: limit,
      }),
      prisma.report.count({ where }),
    ]);

    return {
      reports,
      pagination: { total, limit, offset, hasMore: offset + reports.length < total },
    };
  },

  /**
   * Review a report (admin action)
   */
  async reviewReport(reportId: string, input: ReviewReportInput) {
    const { reviewerId, status, reviewNotes, blockUser } = input;

    const report = await prisma.report.findUnique({ where: { id: reportId } });
    if (!report) throw new Error('Report not found');

    const updatedReport = await prisma.report.update({
      where: { id: reportId },
      data: { status, reviewedBy: reviewerId, reviewNotes, reviewedAt: new Date() },
      include: {
        reporter: { select: { id: true, firstName: true, lastName: true } },
        reportedUser: { select: { id: true, firstName: true, lastName: true, isBlocked: true } },
      },
    });

    if (blockUser && status === ReportStatus.ACTION_TAKEN) {
      await prisma.user.update({ where: { id: report.reportedUserId }, data: { isBlocked: true } });
    }

    return updatedReport;
  },

  // Delegated methods
  calculatePriority,
  checkAutoBlock,
  getStatistics,
  getReportsForUser,
  getPendingCount,
};
