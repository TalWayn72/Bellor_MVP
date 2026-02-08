/**
 * Reports Moderation Service
 * Auto-moderation, content scanning, priority calculation
 */

import { prisma } from '../../lib/prisma.js';
import { ReportReason, ReportStatus } from '@prisma/client';

// Auto-block threshold - if a user receives this many reports, auto-block them
export const AUTO_BLOCK_THRESHOLD = 5;

/**
 * Calculate priority based on report reason
 */
export function calculatePriority(reason: ReportReason): number {
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
}

/**
 * Check if a user should be auto-blocked based on report count
 */
export async function checkAutoBlock(userId: string) {
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
}

/**
 * Get report statistics
 */
export async function getStatistics() {
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
    byStatus: { pending, reviewed, actionTaken, dismissed },
    byReason: byReason.reduce((acc, item) => {
      acc[item.reason] = item._count.reason;
      return acc;
    }, {} as Record<string, number>),
  };
}

/**
 * Get reports for a specific user
 */
export async function getReportsForUser(userId: string) {
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
}

/**
 * Get pending reports count (for admin dashboard)
 */
export async function getPendingCount() {
  const count = await prisma.report.count({
    where: { status: ReportStatus.PENDING },
  });
  return count;
}
