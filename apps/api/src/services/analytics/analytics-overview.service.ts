/** Analytics - Dashboard overview and user growth metrics */
import { prisma } from '../../lib/prisma.js';

export interface DateRange {
  startDate: Date;
  endDate: Date;
}

export interface DailyMetric {
  date: string;
  count: number;
}

export const AnalyticsOverview = {
  /** Get overview dashboard metrics */
  async getDashboardOverview() {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const lastMonth = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalUsers, activeUsersToday, activeUsersWeek, newUsersToday, newUsersWeek, newUsersMonth,
      premiumUsers, blockedUsers, totalChats, totalMessages, totalResponses, totalStories,
      activeStories, pendingReports, totalMissions,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { lastActiveAt: { gte: today } } }),
      prisma.user.count({ where: { lastActiveAt: { gte: lastWeek } } }),
      prisma.user.count({ where: { createdAt: { gte: today } } }),
      prisma.user.count({ where: { createdAt: { gte: lastWeek } } }),
      prisma.user.count({ where: { createdAt: { gte: lastMonth } } }),
      prisma.user.count({ where: { isPremium: true } }),
      prisma.user.count({ where: { isBlocked: true } }),
      prisma.chat.count(), prisma.message.count(), prisma.response.count(),
      prisma.story.count(), prisma.story.count({ where: { expiresAt: { gt: now } } }),
      prisma.report.count({ where: { status: 'PENDING' } }),
      prisma.mission.count(),
    ]);

    const previousDayUsers = await prisma.user.count({ where: { createdAt: { gte: yesterday, lt: today } } });
    const userGrowthRate = previousDayUsers > 0
      ? ((newUsersToday - previousDayUsers) / previousDayUsers) * 100
      : newUsersToday > 0 ? 100 : 0;

    return {
      users: {
        total: totalUsers, activeToday: activeUsersToday, activeThisWeek: activeUsersWeek,
        newToday: newUsersToday, newThisWeek: newUsersWeek, newThisMonth: newUsersMonth,
        premium: premiumUsers, blocked: blockedUsers, growthRate: Math.round(userGrowthRate * 100) / 100,
      },
      content: { totalChats, totalMessages, totalResponses, totalStories, activeStories, totalMissions },
      moderation: { pendingReports },
      timestamp: now.toISOString(),
    };
  },

  /** Get user registration metrics over time */
  async getUserGrowthMetrics(range: DateRange): Promise<DailyMetric[]> {
    const { startDate, endDate } = range;
    const users = await prisma.user.findMany({
      where: { createdAt: { gte: startDate, lte: endDate } },
      select: { createdAt: true }, orderBy: { createdAt: 'asc' },
    });

    const dailyCounts = new Map<string, number>();
    users.forEach(user => {
      const dateKey = user.createdAt.toISOString().split('T')[0];
      dailyCounts.set(dateKey, (dailyCounts.get(dateKey) || 0) + 1);
    });

    const result: DailyMetric[] = [];
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const dateKey = currentDate.toISOString().split('T')[0];
      result.push({ date: dateKey, count: dailyCounts.get(dateKey) || 0 });
      currentDate.setDate(currentDate.getDate() + 1);
    }
    return result;
  },

  /** Get user activity metrics (DAU) */
  async getUserActivityMetrics(range: DateRange) {
    const { startDate, endDate } = range;
    const activeUsers = await prisma.user.findMany({
      where: { lastActiveAt: { gte: startDate, lte: endDate } },
      select: { lastActiveAt: true },
    });

    const dailyActiveMap = new Map<string, Set<string>>();
    activeUsers.forEach(user => {
      if (user.lastActiveAt) {
        const dateKey = user.lastActiveAt.toISOString().split('T')[0];
        if (!dailyActiveMap.has(dateKey)) dailyActiveMap.set(dateKey, new Set());
        dailyActiveMap.get(dateKey)!.add(user.lastActiveAt.toISOString());
      }
    });

    const dauMetrics: DailyMetric[] = [];
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const dateKey = currentDate.toISOString().split('T')[0];
      dauMetrics.push({ date: dateKey, count: dailyActiveMap.get(dateKey)?.size || 0 });
      currentDate.setDate(currentDate.getDate() + 1);
    }
    return { dailyActiveUsers: dauMetrics };
  },
};
