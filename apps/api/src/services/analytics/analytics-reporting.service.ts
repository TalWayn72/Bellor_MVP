/** Analytics - Engagement, content, revenue, and reporting metrics */
import { prisma } from '../../lib/prisma.js';
import type { DateRange } from './analytics-overview.service.js';

export const AnalyticsReporting = {
  /** Get content metrics (messages, responses, stories by date) */
  async getContentMetrics(range: DateRange) {
    const { startDate, endDate } = range;
    const [messages, responses, stories] = await Promise.all([
      prisma.message.findMany({ where: { createdAt: { gte: startDate, lte: endDate } }, select: { createdAt: true } }),
      prisma.response.findMany({ where: { createdAt: { gte: startDate, lte: endDate } }, select: { createdAt: true } }),
      prisma.story.findMany({ where: { createdAt: { gte: startDate, lte: endDate } }, select: { createdAt: true } }),
    ]);

    const groupByDate = (items: { createdAt: Date }[]) => {
      const counts = new Map<string, number>();
      items.forEach(item => { const k = item.createdAt.toISOString().split('T')[0]; counts.set(k, (counts.get(k) || 0) + 1); });
      return counts;
    };
    const mc = groupByDate(messages), rc = groupByDate(responses), sc = groupByDate(stories);
    const result: { date: string; messages: number; responses: number; stories: number }[] = [];
    const cur = new Date(startDate);
    while (cur <= endDate) {
      const k = cur.toISOString().split('T')[0];
      result.push({ date: k, messages: mc.get(k) || 0, responses: rc.get(k) || 0, stories: sc.get(k) || 0 });
      cur.setDate(cur.getDate() + 1);
    }
    return result;
  },

  /** Get moderation metrics */
  async getModerationMetrics() {
    const [pending, reviewed, actionTaken, dismissed, byReason, recentReports] = await Promise.all([
      prisma.report.count({ where: { status: 'PENDING' } }),
      prisma.report.count({ where: { status: 'REVIEWED' } }),
      prisma.report.count({ where: { status: 'ACTION_TAKEN' } }),
      prisma.report.count({ where: { status: 'DISMISSED' } }),
      prisma.report.groupBy({ by: ['reason'], _count: { id: true } }),
      prisma.report.findMany({
        take: 10, orderBy: { createdAt: 'desc' },
        include: {
          reporter: { select: { id: true, firstName: true, lastName: true } },
          reportedUser: { select: { id: true, firstName: true, lastName: true } },
        },
      }),
    ]);
    return {
      summary: { pending, reviewed, actionTaken, dismissed, total: pending + reviewed + actionTaken + dismissed },
      byReason: byReason.map(r => ({ reason: r.reason, count: r._count.id })),
      recentReports,
    };
  },

  /** Get top users by activity */
  async getTopUsers(limit: number = 10) {
    const sel = { id: true, firstName: true, lastName: true, email: true, profileImages: true, isPremium: true };
    const [topByResponses, topByChats, topByMissions] = await Promise.all([
      prisma.user.findMany({ take: limit, orderBy: { responseCount: 'desc' }, select: { ...sel, responseCount: true } }),
      prisma.user.findMany({ take: limit, orderBy: { chatCount: 'desc' }, select: { ...sel, chatCount: true } }),
      prisma.user.findMany({ take: limit, orderBy: { missionCompletedCount: 'desc' }, select: { ...sel, missionCompletedCount: true } }),
    ]);
    return { topByResponses, topByChats, topByMissions };
  },

  /** Get retention metrics */
  async getRetentionMetrics() {
    const now = new Date();
    const d1 = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const d7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const d30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [su1, su7, su30, a1, a7, a30] = await Promise.all([
      prisma.user.count({ where: { createdAt: { gte: d1 } } }),
      prisma.user.count({ where: { createdAt: { gte: d7, lt: d1 } } }),
      prisma.user.count({ where: { createdAt: { gte: d30, lt: d7 } } }),
      prisma.user.count({ where: { createdAt: { gte: d1 }, lastActiveAt: { gte: d1 } } }),
      prisma.user.count({ where: { createdAt: { gte: d7, lt: d1 }, lastActiveAt: { gte: d1 } } }),
      prisma.user.count({ where: { createdAt: { gte: d30, lt: d7 }, lastActiveAt: { gte: d7 } } }),
    ]);
    return {
      day1Retention: su1 > 0 ? Math.round((a1 / su1) * 100) : 0,
      day7Retention: su7 > 0 ? Math.round((a7 / su7) * 100) : 0,
      day30Retention: su30 > 0 ? Math.round((a30 / su30) * 100) : 0,
      raw: { signedUp1DayAgo: su1, signedUp7DaysAgo: su7, signedUp30DaysAgo: su30, active1Day: a1, active7Day: a7, active30Day: a30 },
    };
  },

  /** Get system health metrics */
  async getSystemHealth() {
    const now = new Date();
    const fiveMinAgo = new Date(now.getTime() - 5 * 60 * 1000);
    let dbStatus = 'healthy', dbLatency = 0;
    try { const s = Date.now(); await prisma.$queryRaw`SELECT 1`; dbLatency = Date.now() - s; } catch { dbStatus = 'unhealthy'; }
    const [recentMessages, recentUsers] = await Promise.all([
      prisma.message.count({ where: { createdAt: { gte: fiveMinAgo } } }),
      prisma.user.count({ where: { lastActiveAt: { gte: fiveMinAgo } } }),
    ]);
    return { database: { status: dbStatus, latencyMs: dbLatency }, activity: { recentMessages, activeUsersLast5Min: recentUsers }, timestamp: now.toISOString() };
  },

  /** Export data for reporting */
  async exportUsersReport(range: DateRange) {
    return prisma.user.findMany({
      where: { createdAt: { gte: range.startDate, lte: range.endDate } },
      select: {
        id: true, email: true, firstName: true, lastName: true, gender: true,
        isPremium: true, isVerified: true, isBlocked: true, responseCount: true,
        chatCount: true, missionCompletedCount: true, createdAt: true, lastActiveAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  },
};
