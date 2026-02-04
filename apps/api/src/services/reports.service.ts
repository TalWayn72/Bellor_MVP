/**
 * Reports Service
 * Handles user reports and moderation
 */

import { prisma } from '../lib/prisma.js';
import { ReportReason, ReportStatus, ContentType } from '@prisma/client';

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

// Auto-block threshold - if a user receives this many reports, auto-block them
const AUTO_BLOCK_THRESHOLD = 5;

export const ReportsService = {
  /**
   * Create a new report
   */
  async createReport(input: CreateReportInput) {
    const { reporterId, reportedUserId, reason, description, contentType, contentId } = input;

    // Check if reporter already reported this user for the same reason recently
    const existingReport = await prisma.report.findFirst({
      where: {
        reporterId,
        reportedUserId,
        reason,
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
        },
      },
    });

    if (existingReport) {
      throw new Error('You have already reported this user for this reason recently');
    }

    // Calculate priority based on reason
    const priority = this.calculatePriority(reason);

    // Create the report
    const report = await prisma.report.create({
      data: {
        reporterId,
        reportedUserId,
        reason,
        description,
        reportedContentType: contentType,
        reportedContentId: contentId,
        priority,
      },
      include: {
        reporter: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        reportedUser: {
          select: { id: true, firstName: true, lastName: true, email: true, isBlocked: true },
        },
      },
    });

    // Check if user should be auto-blocked
    await this.checkAutoBlock(reportedUserId);

    return report;
  },

  /**
   * Get a report by ID
   */
  async getReportById(reportId: string) {
    const report = await prisma.report.findUnique({
      where: { id: reportId },
      include: {
        reporter: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        reportedUser: {
          select: { id: true, firstName: true, lastName: true, email: true, isBlocked: true },
        },
      },
    });

    if (!report) {
      throw new Error('Report not found');
    }

    return report;
  },

  /**
   * List reports with filters and pagination
   */
  async listReports(params: ListReportsParams) {
    const { status, reason, limit = 20, offset = 0 } = params;

    const where: any = {};
    if (status) where.status = status;
    if (reason) where.reason = reason;

    const [reports, total] = await Promise.all([
      prisma.report.findMany({
        where,
        include: {
          reporter: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
          reportedUser: {
            select: { id: true, firstName: true, lastName: true, email: true, isBlocked: true },
          },
        },
        orderBy: [
          { priority: 'desc' },
          { createdAt: 'desc' },
        ],
        skip: offset,
        take: limit,
      }),
      prisma.report.count({ where }),
    ]);

    return {
      reports,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + reports.length < total,
      },
    };
  },

  /**
   * Get pending reports count (for admin dashboard)
   */
  async getPendingCount() {
    const count = await prisma.report.count({
      where: { status: ReportStatus.PENDING },
    });
    return count;
  },

  /**
   * Review a report (admin action)
   */
  async reviewReport(reportId: string, input: ReviewReportInput) {
    const { reviewerId, status, reviewNotes, blockUser } = input;

    const report = await prisma.report.findUnique({
      where: { id: reportId },
    });

    if (!report) {
      throw new Error('Report not found');
    }

    // Update the report
    const updatedReport = await prisma.report.update({
      where: { id: reportId },
      data: {
        status,
        reviewedBy: reviewerId,
        reviewNotes,
        reviewedAt: new Date(),
      },
      include: {
        reporter: {
          select: { id: true, firstName: true, lastName: true },
        },
        reportedUser: {
          select: { id: true, firstName: true, lastName: true, isBlocked: true },
        },
      },
    });

    // Block user if requested
    if (blockUser && status === ReportStatus.ACTION_TAKEN) {
      await prisma.user.update({
        where: { id: report.reportedUserId },
        data: { isBlocked: true },
      });
    }

    return updatedReport;
  },

  /**
   * Get reports for a specific user
   */
  async getReportsForUser(userId: string) {
    const reports = await prisma.report.findMany({
      where: { reportedUserId: userId },
      include: {
        reporter: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return reports;
  },

  /**
   * Get report statistics
   */
  async getStatistics() {
    const [
      total,
      pending,
      reviewed,
      actionTaken,
      dismissed,
      byReason,
    ] = await Promise.all([
      prisma.report.count(),
      prisma.report.count({ where: { status: ReportStatus.PENDING } }),
      prisma.report.count({ where: { status: ReportStatus.REVIEWED } }),
      prisma.report.count({ where: { status: ReportStatus.ACTION_TAKEN } }),
      prisma.report.count({ where: { status: ReportStatus.DISMISSED } }),
      prisma.report.groupBy({
        by: ['reason'],
        _count: { reason: true },
      }),
    ]);

    return {
      total,
      byStatus: {
        pending,
        reviewed,
        actionTaken,
        dismissed,
      },
      byReason: byReason.reduce((acc, item) => {
        acc[item.reason] = item._count.reason;
        return acc;
      }, {} as Record<string, number>),
    };
  },

  /**
   * Calculate priority based on report reason
   */
  calculatePriority(reason: ReportReason): number {
    switch (reason) {
      case ReportReason.UNDERAGE:
        return 5; // Highest priority
      case ReportReason.HARASSMENT:
        return 4;
      case ReportReason.INAPPROPRIATE_CONTENT:
        return 3;
      case ReportReason.FAKE_PROFILE:
        return 2;
      case ReportReason.SPAM:
        return 1;
      default:
        return 1;
    }
  },

  /**
   * Check if a user should be auto-blocked based on report count
   */
  async checkAutoBlock(userId: string) {
    const recentReportsCount = await prisma.report.count({
      where: {
        reportedUserId: userId,
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
        },
      },
    });

    if (recentReportsCount >= AUTO_BLOCK_THRESHOLD) {
      await prisma.user.update({
        where: { id: userId },
        data: { isBlocked: true },
      });

      // Update all pending reports for this user
      await prisma.report.updateMany({
        where: {
          reportedUserId: userId,
          status: ReportStatus.PENDING,
        },
        data: {
          status: ReportStatus.ACTION_TAKEN,
          reviewNotes: `Auto-blocked after ${AUTO_BLOCK_THRESHOLD} reports`,
          reviewedAt: new Date(),
        },
      });

      return true;
    }

    return false;
  },
};
