/**
 * Analytics Service
 * Provides metrics and reporting for admin dashboard
 */

import { prisma } from '../lib/prisma.js';
import type { ReportStatus as _ReportStatus } from '@prisma/client';

interface DateRange {
  startDate: Date;
  endDate: Date;
}

interface DailyMetric {
  date: string;
  count: number;
}

export const AnalyticsService = {
  /**
   * Get overview dashboard metrics
   */
  async getDashboardOverview() {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const lastMonth = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      activeUsersToday,
      activeUsersWeek,
      newUsersToday,
      newUsersWeek,
      newUsersMonth,
      premiumUsers,
      blockedUsers,
      totalChats,
      totalMessages,
      totalResponses,
      totalStories,
      activeStories,
      pendingReports,
      totalMissions,
    ] = await Promise.all([
      // User counts
      prisma.user.count(),
      prisma.user.count({
        where: { lastActiveAt: { gte: today } },
      }),
      prisma.user.count({
        where: { lastActiveAt: { gte: lastWeek } },
      }),
      prisma.user.count({
        where: { createdAt: { gte: today } },
      }),
      prisma.user.count({
        where: { createdAt: { gte: lastWeek } },
      }),
      prisma.user.count({
        where: { createdAt: { gte: lastMonth } },
      }),
      prisma.user.count({
        where: { isPremium: true },
      }),
      prisma.user.count({
        where: { isBlocked: true },
      }),

      // Content counts
      prisma.chat.count(),
      prisma.message.count(),
      prisma.response.count(),
      prisma.story.count(),
      prisma.story.count({
        where: { expiresAt: { gt: now } },
      }),

      // Moderation
      prisma.report.count({
        where: { status: 'PENDING' },
      }),

      // Missions
      prisma.mission.count(),
    ]);

    // Calculate growth rates
    const previousDayUsers = await prisma.user.count({
      where: {
        createdAt: { gte: yesterday, lt: today },
      },
    });

    const userGrowthRate = previousDayUsers > 0
      ? ((newUsersToday - previousDayUsers) / previousDayUsers) * 100
      : newUsersToday > 0 ? 100 : 0;

    return {
      users: {
        total: totalUsers,
        activeToday: activeUsersToday,
        activeThisWeek: activeUsersWeek,
        newToday: newUsersToday,
        newThisWeek: newUsersWeek,
        newThisMonth: newUsersMonth,
        premium: premiumUsers,
        blocked: blockedUsers,
        growthRate: Math.round(userGrowthRate * 100) / 100,
      },
      content: {
        totalChats,
        totalMessages,
        totalResponses,
        totalStories,
        activeStories,
        totalMissions,
      },
      moderation: {
        pendingReports,
      },
      timestamp: now.toISOString(),
    };
  },

  /**
   * Get user registration metrics over time
   */
  async getUserGrowthMetrics(range: DateRange): Promise<DailyMetric[]> {
    const { startDate, endDate } = range;

    const users = await prisma.user.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    // Group by date
    const dailyCounts = new Map<string, number>();

    users.forEach(user => {
      const dateKey = user.createdAt.toISOString().split('T')[0];
      dailyCounts.set(dateKey, (dailyCounts.get(dateKey) || 0) + 1);
    });

    // Fill in missing dates with 0
    const result: DailyMetric[] = [];
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const dateKey = currentDate.toISOString().split('T')[0];
      result.push({
        date: dateKey,
        count: dailyCounts.get(dateKey) || 0,
      });
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return result;
  },

  /**
   * Get user activity metrics
   */
  async getUserActivityMetrics(range: DateRange) {
    const { startDate, endDate } = range;

    // Daily active users (DAU)
    const activeUsers = await prisma.user.findMany({
      where: {
        lastActiveAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        lastActiveAt: true,
      },
    });

    const dailyActiveMap = new Map<string, Set<string>>();

    activeUsers.forEach(user => {
      if (user.lastActiveAt) {
        const dateKey = user.lastActiveAt.toISOString().split('T')[0];
        if (!dailyActiveMap.has(dateKey)) {
          dailyActiveMap.set(dateKey, new Set());
        }
        dailyActiveMap.get(dateKey)!.add(user.lastActiveAt.toISOString());
      }
    });

    const dauMetrics: DailyMetric[] = [];
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const dateKey = currentDate.toISOString().split('T')[0];
      dauMetrics.push({
        date: dateKey,
        count: dailyActiveMap.get(dateKey)?.size || 0,
      });
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return {
      dailyActiveUsers: dauMetrics,
    };
  },

  /**
   * Get content metrics
   */
  async getContentMetrics(range: DateRange) {
    const { startDate, endDate } = range;

    const [messages, responses, stories] = await Promise.all([
      prisma.message.findMany({
        where: {
          createdAt: { gte: startDate, lte: endDate },
        },
        select: { createdAt: true },
      }),
      prisma.response.findMany({
        where: {
          createdAt: { gte: startDate, lte: endDate },
        },
        select: { createdAt: true },
      }),
      prisma.story.findMany({
        where: {
          createdAt: { gte: startDate, lte: endDate },
        },
        select: { createdAt: true },
      }),
    ]);

    // Group by date
    const groupByDate = (items: { createdAt: Date }[]) => {
      const counts = new Map<string, number>();
      items.forEach(item => {
        const dateKey = item.createdAt.toISOString().split('T')[0];
        counts.set(dateKey, (counts.get(dateKey) || 0) + 1);
      });
      return counts;
    };

    const messageCounts = groupByDate(messages);
    const responseCounts = groupByDate(responses);
    const storyCounts = groupByDate(stories);

    const result: { date: string; messages: number; responses: number; stories: number }[] = [];
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const dateKey = currentDate.toISOString().split('T')[0];
      result.push({
        date: dateKey,
        messages: messageCounts.get(dateKey) || 0,
        responses: responseCounts.get(dateKey) || 0,
        stories: storyCounts.get(dateKey) || 0,
      });
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return result;
  },

  /**
   * Get moderation metrics
   */
  async getModerationMetrics() {
    const [
      pendingReports,
      reviewedReports,
      actionTakenReports,
      dismissedReports,
      reportsByReason,
      recentReports,
    ] = await Promise.all([
      prisma.report.count({ where: { status: 'PENDING' } }),
      prisma.report.count({ where: { status: 'REVIEWED' } }),
      prisma.report.count({ where: { status: 'ACTION_TAKEN' } }),
      prisma.report.count({ where: { status: 'DISMISSED' } }),
      prisma.report.groupBy({
        by: ['reason'],
        _count: { id: true },
      }),
      prisma.report.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          reporter: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
          reportedUser: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      }),
    ]);

    return {
      summary: {
        pending: pendingReports,
        reviewed: reviewedReports,
        actionTaken: actionTakenReports,
        dismissed: dismissedReports,
        total: pendingReports + reviewedReports + actionTakenReports + dismissedReports,
      },
      byReason: reportsByReason.map(r => ({
        reason: r.reason,
        count: r._count.id,
      })),
      recentReports,
    };
  },

  /**
   * Get top users by activity
   */
  async getTopUsers(limit: number = 10) {
    const [
      topByResponses,
      topByChats,
      topByMissions,
    ] = await Promise.all([
      prisma.user.findMany({
        take: limit,
        orderBy: { responseCount: 'desc' },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          profileImages: true,
          responseCount: true,
          isPremium: true,
        },
      }),
      prisma.user.findMany({
        take: limit,
        orderBy: { chatCount: 'desc' },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          profileImages: true,
          chatCount: true,
          isPremium: true,
        },
      }),
      prisma.user.findMany({
        take: limit,
        orderBy: { missionCompletedCount: 'desc' },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          profileImages: true,
          missionCompletedCount: true,
          isPremium: true,
        },
      }),
    ]);

    return {
      topByResponses,
      topByChats,
      topByMissions,
    };
  },

  /**
   * Get retention metrics
   */
  async getRetentionMetrics() {
    const now = new Date();
    const day1 = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const day7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const day30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Users who signed up X days ago and were active since
    const [
      signedUp1DayAgo,
      signedUp7DaysAgo,
      signedUp30DaysAgo,
      active1Day,
      active7Day,
      active30Day,
    ] = await Promise.all([
      prisma.user.count({
        where: {
          createdAt: { gte: day1 },
        },
      }),
      prisma.user.count({
        where: {
          createdAt: { gte: day7, lt: day1 },
        },
      }),
      prisma.user.count({
        where: {
          createdAt: { gte: day30, lt: day7 },
        },
      }),
      prisma.user.count({
        where: {
          createdAt: { gte: day1 },
          lastActiveAt: { gte: day1 },
        },
      }),
      prisma.user.count({
        where: {
          createdAt: { gte: day7, lt: day1 },
          lastActiveAt: { gte: day1 },
        },
      }),
      prisma.user.count({
        where: {
          createdAt: { gte: day30, lt: day7 },
          lastActiveAt: { gte: day7 },
        },
      }),
    ]);

    return {
      day1Retention: signedUp1DayAgo > 0 ? Math.round((active1Day / signedUp1DayAgo) * 100) : 0,
      day7Retention: signedUp7DaysAgo > 0 ? Math.round((active7Day / signedUp7DaysAgo) * 100) : 0,
      day30Retention: signedUp30DaysAgo > 0 ? Math.round((active30Day / signedUp30DaysAgo) * 100) : 0,
      raw: {
        signedUp1DayAgo,
        signedUp7DaysAgo,
        signedUp30DaysAgo,
        active1Day,
        active7Day,
        active30Day,
      },
    };
  },

  /**
   * Get system health metrics
   */
  async getSystemHealth() {
    const now = new Date();
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

    // Check database connectivity
    let dbStatus = 'healthy';
    let dbLatency = 0;

    try {
      const start = Date.now();
      await prisma.$queryRaw`SELECT 1`;
      dbLatency = Date.now() - start;
    } catch (error) {
      dbStatus = 'unhealthy';
    }

    // Recent activity as health indicator
    const [recentMessages, recentUsers] = await Promise.all([
      prisma.message.count({
        where: { createdAt: { gte: fiveMinutesAgo } },
      }),
      prisma.user.count({
        where: { lastActiveAt: { gte: fiveMinutesAgo } },
      }),
    ]);

    return {
      database: {
        status: dbStatus,
        latencyMs: dbLatency,
      },
      activity: {
        recentMessages,
        activeUsersLast5Min: recentUsers,
      },
      timestamp: now.toISOString(),
    };
  },

  /**
   * Export data for reporting (CSV format)
   */
  async exportUsersReport(range: DateRange) {
    const users = await prisma.user.findMany({
      where: {
        createdAt: {
          gte: range.startDate,
          lte: range.endDate,
        },
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        gender: true,
        isPremium: true,
        isVerified: true,
        isBlocked: true,
        responseCount: true,
        chatCount: true,
        missionCompletedCount: true,
        createdAt: true,
        lastActiveAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return users;
  },
};
