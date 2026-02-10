/**
 * Analytics Service Unit Tests
 *
 * Tests for dashboard overview, user growth, user activity,
 * content metrics, moderation, top users, retention, system health,
 * and export functionality.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock prisma before importing services
vi.mock('../lib/prisma.js', () => ({
  prisma: {
    user: { count: vi.fn(), findMany: vi.fn() },
    chat: { count: vi.fn() },
    message: { count: vi.fn(), findMany: vi.fn() },
    response: { count: vi.fn(), findMany: vi.fn() },
    story: { count: vi.fn(), findMany: vi.fn() },
    report: { count: vi.fn(), groupBy: vi.fn(), findMany: vi.fn() },
    mission: { count: vi.fn() },
    $queryRaw: vi.fn(),
  },
}));

import { AnalyticsService } from './analytics.service.js';
import { AnalyticsOverview } from './analytics/analytics-overview.service.js';
import { AnalyticsReporting } from './analytics/analytics-reporting.service.js';
import { prisma } from '../lib/prisma.js';

// ---------------------------------------------------------------------------
// getDashboardOverview
// ---------------------------------------------------------------------------
describe('[P2][admin] AnalyticsOverview - getDashboardOverview', () => {
  beforeEach(() => { vi.clearAllMocks(); });
  afterEach(() => { vi.restoreAllMocks(); });

  it('should return overview with all expected sections', async () => {
    // Arrange - mock all 15 parallel count calls + 1 follow-up
    vi.mocked(prisma.user.count).mockResolvedValue(0);
    vi.mocked(prisma.chat.count).mockResolvedValue(0);
    vi.mocked(prisma.message.count).mockResolvedValue(0);
    vi.mocked(prisma.response.count).mockResolvedValue(0);
    vi.mocked(prisma.story.count).mockResolvedValue(0);
    vi.mocked(prisma.report.count).mockResolvedValue(0);
    vi.mocked(prisma.mission.count).mockResolvedValue(0);

    // Act
    const result = await AnalyticsOverview.getDashboardOverview();

    // Assert
    expect(result).toHaveProperty('users');
    expect(result).toHaveProperty('content');
    expect(result).toHaveProperty('moderation');
    expect(result).toHaveProperty('timestamp');
  });

  it('should return correct user metrics when data exists', async () => {
    // Arrange - user.count is called many times with different wheres
    // We mock it sequentially: totalUsers=100, activeToday=20, activeWeek=50,
    // newToday=5, newWeek=15, newMonth=40, premium=10, blocked=3
    // Then the follow-up: previousDayUsers=4
    vi.mocked(prisma.user.count)
      .mockResolvedValueOnce(100)  // totalUsers
      .mockResolvedValueOnce(20)   // activeUsersToday
      .mockResolvedValueOnce(50)   // activeUsersWeek
      .mockResolvedValueOnce(5)    // newUsersToday
      .mockResolvedValueOnce(15)   // newUsersWeek
      .mockResolvedValueOnce(40)   // newUsersMonth
      .mockResolvedValueOnce(10)   // premiumUsers
      .mockResolvedValueOnce(3)    // blockedUsers
      .mockResolvedValueOnce(4);   // previousDayUsers

    vi.mocked(prisma.chat.count).mockResolvedValue(200);
    vi.mocked(prisma.message.count).mockResolvedValue(500);
    vi.mocked(prisma.response.count).mockResolvedValue(300);
    vi.mocked(prisma.story.count)
      .mockResolvedValueOnce(80)   // totalStories
      .mockResolvedValueOnce(25);  // activeStories
    vi.mocked(prisma.report.count).mockResolvedValue(7);
    vi.mocked(prisma.mission.count).mockResolvedValue(60);

    // Act
    const result = await AnalyticsOverview.getDashboardOverview();

    // Assert - users section
    expect(result.users.total).toBe(100);
    expect(result.users.activeToday).toBe(20);
    expect(result.users.activeThisWeek).toBe(50);
    expect(result.users.newToday).toBe(5);
    expect(result.users.newThisWeek).toBe(15);
    expect(result.users.newThisMonth).toBe(40);
    expect(result.users.premium).toBe(10);
    expect(result.users.blocked).toBe(3);

    // Assert - content section
    expect(result.content.totalChats).toBe(200);
    expect(result.content.totalMessages).toBe(500);
    expect(result.content.totalResponses).toBe(300);
    expect(result.content.totalStories).toBe(80);
    expect(result.content.activeStories).toBe(25);
    expect(result.content.totalMissions).toBe(60);

    // Assert - moderation section
    expect(result.moderation.pendingReports).toBe(7);
  });

  it('should compute growthRate correctly with previous day users > 0', async () => {
    // newUsersToday=10, previousDayUsers=5 => growthRate = ((10-5)/5)*100 = 100
    vi.mocked(prisma.user.count)
      .mockResolvedValueOnce(0)    // totalUsers
      .mockResolvedValueOnce(0)    // activeUsersToday
      .mockResolvedValueOnce(0)    // activeUsersWeek
      .mockResolvedValueOnce(10)   // newUsersToday
      .mockResolvedValueOnce(0)    // newUsersWeek
      .mockResolvedValueOnce(0)    // newUsersMonth
      .mockResolvedValueOnce(0)    // premiumUsers
      .mockResolvedValueOnce(0)    // blockedUsers
      .mockResolvedValueOnce(5);   // previousDayUsers
    vi.mocked(prisma.chat.count).mockResolvedValue(0);
    vi.mocked(prisma.message.count).mockResolvedValue(0);
    vi.mocked(prisma.response.count).mockResolvedValue(0);
    vi.mocked(prisma.story.count).mockResolvedValue(0);
    vi.mocked(prisma.report.count).mockResolvedValue(0);
    vi.mocked(prisma.mission.count).mockResolvedValue(0);

    const result = await AnalyticsOverview.getDashboardOverview();

    expect(result.users.growthRate).toBe(100);
  });

  it('should return growthRate 100 when previousDay is 0 but newToday > 0', async () => {
    vi.mocked(prisma.user.count)
      .mockResolvedValueOnce(0)    // totalUsers
      .mockResolvedValueOnce(0)    // activeUsersToday
      .mockResolvedValueOnce(0)    // activeUsersWeek
      .mockResolvedValueOnce(3)    // newUsersToday > 0
      .mockResolvedValueOnce(0)    // newUsersWeek
      .mockResolvedValueOnce(0)    // newUsersMonth
      .mockResolvedValueOnce(0)    // premiumUsers
      .mockResolvedValueOnce(0)    // blockedUsers
      .mockResolvedValueOnce(0);   // previousDayUsers = 0
    vi.mocked(prisma.chat.count).mockResolvedValue(0);
    vi.mocked(prisma.message.count).mockResolvedValue(0);
    vi.mocked(prisma.response.count).mockResolvedValue(0);
    vi.mocked(prisma.story.count).mockResolvedValue(0);
    vi.mocked(prisma.report.count).mockResolvedValue(0);
    vi.mocked(prisma.mission.count).mockResolvedValue(0);

    const result = await AnalyticsOverview.getDashboardOverview();

    expect(result.users.growthRate).toBe(100);
  });

  it('should return growthRate 0 when both previousDay and newToday are 0', async () => {
    vi.mocked(prisma.user.count).mockResolvedValue(0);
    vi.mocked(prisma.chat.count).mockResolvedValue(0);
    vi.mocked(prisma.message.count).mockResolvedValue(0);
    vi.mocked(prisma.response.count).mockResolvedValue(0);
    vi.mocked(prisma.story.count).mockResolvedValue(0);
    vi.mocked(prisma.report.count).mockResolvedValue(0);
    vi.mocked(prisma.mission.count).mockResolvedValue(0);

    const result = await AnalyticsOverview.getDashboardOverview();

    expect(result.users.growthRate).toBe(0);
  });

  it('should include ISO timestamp string', async () => {
    vi.mocked(prisma.user.count).mockResolvedValue(0);
    vi.mocked(prisma.chat.count).mockResolvedValue(0);
    vi.mocked(prisma.message.count).mockResolvedValue(0);
    vi.mocked(prisma.response.count).mockResolvedValue(0);
    vi.mocked(prisma.story.count).mockResolvedValue(0);
    vi.mocked(prisma.report.count).mockResolvedValue(0);
    vi.mocked(prisma.mission.count).mockResolvedValue(0);

    const result = await AnalyticsOverview.getDashboardOverview();

    expect(typeof result.timestamp).toBe('string');
    // Should parse as valid ISO date
    expect(new Date(result.timestamp).toISOString()).toBe(result.timestamp);
  });
});

// ---------------------------------------------------------------------------
// getUserGrowthMetrics
// ---------------------------------------------------------------------------
describe('[P2][admin] AnalyticsOverview - getUserGrowthMetrics', () => {
  beforeEach(() => { vi.clearAllMocks(); });
  afterEach(() => { vi.restoreAllMocks(); });

  it('should return daily metrics for date range with data', async () => {
    const startDate = new Date('2024-01-01');
    const endDate = new Date('2024-01-03');

    vi.mocked(prisma.user.findMany).mockResolvedValue([
      { createdAt: new Date('2024-01-01T10:00:00Z') },
      { createdAt: new Date('2024-01-01T14:00:00Z') },
      { createdAt: new Date('2024-01-03T08:00:00Z') },
    ] as never);

    const result = await AnalyticsOverview.getUserGrowthMetrics({ startDate, endDate });

    expect(result).toHaveLength(3);
    expect(result[0]).toEqual({ date: '2024-01-01', count: 2 });
    expect(result[1]).toEqual({ date: '2024-01-02', count: 0 });
    expect(result[2]).toEqual({ date: '2024-01-03', count: 1 });
  });

  it('should return all zeros when no users exist in range', async () => {
    const startDate = new Date('2024-02-01');
    const endDate = new Date('2024-02-03');

    vi.mocked(prisma.user.findMany).mockResolvedValue([]);

    const result = await AnalyticsOverview.getUserGrowthMetrics({ startDate, endDate });

    expect(result).toHaveLength(3);
    result.forEach(metric => expect(metric.count).toBe(0));
  });

  it('should return single day entry when start equals end', async () => {
    const date = new Date('2024-03-15');

    vi.mocked(prisma.user.findMany).mockResolvedValue([]);

    const result = await AnalyticsOverview.getUserGrowthMetrics({ startDate: date, endDate: date });

    expect(result).toHaveLength(1);
    expect(result[0].date).toBe('2024-03-15');
    expect(result[0].count).toBe(0);
  });

  it('should call prisma.user.findMany with correct where and orderBy', async () => {
    const startDate = new Date('2024-01-01');
    const endDate = new Date('2024-01-02');

    vi.mocked(prisma.user.findMany).mockResolvedValue([]);

    await AnalyticsOverview.getUserGrowthMetrics({ startDate, endDate });

    expect(prisma.user.findMany).toHaveBeenCalledWith({
      where: { createdAt: { gte: startDate, lte: endDate } },
      select: { createdAt: true },
      orderBy: { createdAt: 'asc' },
    });
  });
});

// ---------------------------------------------------------------------------
// getUserActivityMetrics
// ---------------------------------------------------------------------------
describe('[P2][admin] AnalyticsOverview - getUserActivityMetrics', () => {
  beforeEach(() => { vi.clearAllMocks(); });
  afterEach(() => { vi.restoreAllMocks(); });

  it('should return daily active user counts', async () => {
    const startDate = new Date('2024-01-01');
    const endDate = new Date('2024-01-02');

    vi.mocked(prisma.user.findMany).mockResolvedValue([
      { lastActiveAt: new Date('2024-01-01T09:00:00Z') },
      { lastActiveAt: new Date('2024-01-01T15:00:00Z') },
      { lastActiveAt: new Date('2024-01-02T12:00:00Z') },
    ] as never);

    const result = await AnalyticsOverview.getUserActivityMetrics({ startDate, endDate });

    expect(result).toHaveProperty('dailyActiveUsers');
    expect(result.dailyActiveUsers).toHaveLength(2);
    expect(result.dailyActiveUsers[0].date).toBe('2024-01-01');
    expect(result.dailyActiveUsers[0].count).toBe(2);
    expect(result.dailyActiveUsers[1].date).toBe('2024-01-02');
    expect(result.dailyActiveUsers[1].count).toBe(1);
  });

  it('should skip users with null lastActiveAt', async () => {
    const startDate = new Date('2024-01-01');
    const endDate = new Date('2024-01-01');

    vi.mocked(prisma.user.findMany).mockResolvedValue([
      { lastActiveAt: null },
      { lastActiveAt: new Date('2024-01-01T12:00:00Z') },
    ] as never);

    const result = await AnalyticsOverview.getUserActivityMetrics({ startDate, endDate });

    expect(result.dailyActiveUsers[0].count).toBe(1);
  });

  it('should return zeros when no active users', async () => {
    const startDate = new Date('2024-05-01');
    const endDate = new Date('2024-05-03');

    vi.mocked(prisma.user.findMany).mockResolvedValue([]);

    const result = await AnalyticsOverview.getUserActivityMetrics({ startDate, endDate });

    expect(result.dailyActiveUsers).toHaveLength(3);
    result.dailyActiveUsers.forEach(d => expect(d.count).toBe(0));
  });
});

// ---------------------------------------------------------------------------
// getContentMetrics
// ---------------------------------------------------------------------------
describe('[P2][admin] AnalyticsReporting - getContentMetrics', () => {
  beforeEach(() => { vi.clearAllMocks(); });
  afterEach(() => { vi.restoreAllMocks(); });

  it('should aggregate messages, responses, stories by date', async () => {
    const startDate = new Date('2024-06-01');
    const endDate = new Date('2024-06-02');

    vi.mocked(prisma.message.findMany).mockResolvedValue([
      { createdAt: new Date('2024-06-01T10:00:00Z') },
      { createdAt: new Date('2024-06-01T11:00:00Z') },
    ] as never);
    vi.mocked(prisma.response.findMany).mockResolvedValue([
      { createdAt: new Date('2024-06-02T08:00:00Z') },
    ] as never);
    vi.mocked(prisma.story.findMany).mockResolvedValue([
      { createdAt: new Date('2024-06-01T09:00:00Z') },
      { createdAt: new Date('2024-06-02T15:00:00Z') },
    ] as never);

    const result = await AnalyticsReporting.getContentMetrics({ startDate, endDate });

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ date: '2024-06-01', messages: 2, responses: 0, stories: 1 });
    expect(result[1]).toEqual({ date: '2024-06-02', messages: 0, responses: 1, stories: 1 });
  });

  it('should return all zeros when no content exists', async () => {
    const startDate = new Date('2024-07-01');
    const endDate = new Date('2024-07-01');

    vi.mocked(prisma.message.findMany).mockResolvedValue([]);
    vi.mocked(prisma.response.findMany).mockResolvedValue([]);
    vi.mocked(prisma.story.findMany).mockResolvedValue([]);

    const result = await AnalyticsReporting.getContentMetrics({ startDate, endDate });

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({ date: '2024-07-01', messages: 0, responses: 0, stories: 0 });
  });
});

// ---------------------------------------------------------------------------
// getModerationMetrics
// ---------------------------------------------------------------------------
describe('[P2][admin] AnalyticsReporting - getModerationMetrics', () => {
  beforeEach(() => { vi.clearAllMocks(); });
  afterEach(() => { vi.restoreAllMocks(); });

  it('should return moderation summary, byReason, and recentReports', async () => {
    vi.mocked(prisma.report.count)
      .mockResolvedValueOnce(5)   // pending
      .mockResolvedValueOnce(10)  // reviewed
      .mockResolvedValueOnce(3)   // actionTaken
      .mockResolvedValueOnce(2);  // dismissed

    vi.mocked(prisma.report.groupBy).mockResolvedValue([
      { reason: 'SPAM', _count: { id: 4 } },
      { reason: 'HARASSMENT', _count: { id: 6 } },
    ] as never);

    const mockReports = [
      { id: 'r1', reporter: { id: 'u1', firstName: 'John', lastName: 'Doe' }, reportedUser: { id: 'u2', firstName: 'Jane', lastName: 'Doe' } },
    ];
    vi.mocked(prisma.report.findMany).mockResolvedValue(mockReports as never);

    const result = await AnalyticsReporting.getModerationMetrics();

    expect(result.summary).toEqual({
      pending: 5,
      reviewed: 10,
      actionTaken: 3,
      dismissed: 2,
      total: 20,
    });
    expect(result.byReason).toEqual([
      { reason: 'SPAM', count: 4 },
      { reason: 'HARASSMENT', count: 6 },
    ]);
    expect(result.recentReports).toEqual(mockReports);
  });

  it('should return empty results when no reports exist', async () => {
    vi.mocked(prisma.report.count).mockResolvedValue(0);
    vi.mocked(prisma.report.groupBy).mockResolvedValue([] as never);
    vi.mocked(prisma.report.findMany).mockResolvedValue([]);

    const result = await AnalyticsReporting.getModerationMetrics();

    expect(result.summary.total).toBe(0);
    expect(result.byReason).toEqual([]);
    expect(result.recentReports).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// getTopUsers
// ---------------------------------------------------------------------------
describe('[P2][admin] AnalyticsReporting - getTopUsers', () => {
  beforeEach(() => { vi.clearAllMocks(); });
  afterEach(() => { vi.restoreAllMocks(); });

  it('should return topByResponses, topByChats, topByMissions', async () => {
    const mockUserResponse = [{ id: 'u1', firstName: 'A', lastName: 'B', responseCount: 50 }];
    const mockUserChat = [{ id: 'u2', firstName: 'C', lastName: 'D', chatCount: 30 }];
    const mockUserMission = [{ id: 'u3', firstName: 'E', lastName: 'F', missionCompletedCount: 20 }];

    vi.mocked(prisma.user.findMany)
      .mockResolvedValueOnce(mockUserResponse as never)
      .mockResolvedValueOnce(mockUserChat as never)
      .mockResolvedValueOnce(mockUserMission as never);

    const result = await AnalyticsReporting.getTopUsers();

    expect(result.topByResponses).toEqual(mockUserResponse);
    expect(result.topByChats).toEqual(mockUserChat);
    expect(result.topByMissions).toEqual(mockUserMission);
  });

  it('should respect custom limit parameter', async () => {
    vi.mocked(prisma.user.findMany).mockResolvedValue([] as never);

    await AnalyticsReporting.getTopUsers(5);

    const calls = vi.mocked(prisma.user.findMany).mock.calls;
    expect(calls).toHaveLength(3);
    calls.forEach(call => {
      expect((call[0] as { take: number }).take).toBe(5);
    });
  });

  it('should default to limit 10', async () => {
    vi.mocked(prisma.user.findMany).mockResolvedValue([] as never);

    await AnalyticsReporting.getTopUsers();

    const calls = vi.mocked(prisma.user.findMany).mock.calls;
    calls.forEach(call => {
      expect((call[0] as { take: number }).take).toBe(10);
    });
  });
});

// ---------------------------------------------------------------------------
// getRetentionMetrics
// ---------------------------------------------------------------------------
describe('[P2][admin] AnalyticsReporting - getRetentionMetrics', () => {
  beforeEach(() => { vi.clearAllMocks(); });
  afterEach(() => { vi.restoreAllMocks(); });

  it('should compute retention percentages correctly', async () => {
    // su1=10, su7=20, su30=50, a1=8, a7=10, a30=25
    vi.mocked(prisma.user.count)
      .mockResolvedValueOnce(10)   // su1
      .mockResolvedValueOnce(20)   // su7
      .mockResolvedValueOnce(50)   // su30
      .mockResolvedValueOnce(8)    // a1
      .mockResolvedValueOnce(10)   // a7
      .mockResolvedValueOnce(25);  // a30

    const result = await AnalyticsReporting.getRetentionMetrics();

    expect(result.day1Retention).toBe(80);    // 8/10 * 100
    expect(result.day7Retention).toBe(50);    // 10/20 * 100
    expect(result.day30Retention).toBe(50);   // 25/50 * 100
    expect(result.raw).toEqual({
      signedUp1DayAgo: 10,
      signedUp7DaysAgo: 20,
      signedUp30DaysAgo: 50,
      active1Day: 8,
      active7Day: 10,
      active30Day: 25,
    });
  });

  it('should return 0 retention when no sign-ups for a cohort', async () => {
    vi.mocked(prisma.user.count).mockResolvedValue(0);

    const result = await AnalyticsReporting.getRetentionMetrics();

    expect(result.day1Retention).toBe(0);
    expect(result.day7Retention).toBe(0);
    expect(result.day30Retention).toBe(0);
  });

  it('should round retention percentages to whole numbers', async () => {
    // su1=3, a1=1 => 33.33... => rounded to 33
    vi.mocked(prisma.user.count)
      .mockResolvedValueOnce(3)    // su1
      .mockResolvedValueOnce(0)    // su7
      .mockResolvedValueOnce(0)    // su30
      .mockResolvedValueOnce(1)    // a1
      .mockResolvedValueOnce(0)    // a7
      .mockResolvedValueOnce(0);   // a30

    const result = await AnalyticsReporting.getRetentionMetrics();

    expect(result.day1Retention).toBe(33);
  });
});

// ---------------------------------------------------------------------------
// getSystemHealth
// ---------------------------------------------------------------------------
describe('[P2][admin] AnalyticsReporting - getSystemHealth', () => {
  beforeEach(() => { vi.clearAllMocks(); });
  afterEach(() => { vi.restoreAllMocks(); });

  it('should return healthy status when DB responds', async () => {
    vi.mocked(prisma.$queryRaw).mockResolvedValue([{ '?column?': 1 }]);
    vi.mocked(prisma.message.count).mockResolvedValue(12);
    vi.mocked(prisma.user.count).mockResolvedValue(3);

    const result = await AnalyticsReporting.getSystemHealth();

    expect(result.database.status).toBe('healthy');
    expect(result.database.latencyMs).toBeGreaterThanOrEqual(0);
    expect(result.activity.recentMessages).toBe(12);
    expect(result.activity.activeUsersLast5Min).toBe(3);
    expect(typeof result.timestamp).toBe('string');
  });

  it('should return unhealthy status when DB query fails', async () => {
    vi.mocked(prisma.$queryRaw).mockRejectedValue(new Error('DB connection failed'));
    vi.mocked(prisma.message.count).mockResolvedValue(0);
    vi.mocked(prisma.user.count).mockResolvedValue(0);

    const result = await AnalyticsReporting.getSystemHealth();

    expect(result.database.status).toBe('unhealthy');
  });
});

// ---------------------------------------------------------------------------
// exportUsersReport
// ---------------------------------------------------------------------------
describe('[P2][admin] AnalyticsReporting - exportUsersReport', () => {
  beforeEach(() => { vi.clearAllMocks(); });
  afterEach(() => { vi.restoreAllMocks(); });

  it('should query users within date range with correct select fields', async () => {
    const startDate = new Date('2024-01-01');
    const endDate = new Date('2024-01-31');
    const mockUsers = [
      {
        id: 'u1', email: 'a@b.com', firstName: 'A', lastName: 'B', gender: 'MALE',
        isPremium: false, isVerified: true, isBlocked: false, responseCount: 5,
        chatCount: 3, missionCompletedCount: 1, createdAt: new Date(), lastActiveAt: new Date(),
      },
    ];

    vi.mocked(prisma.user.findMany).mockResolvedValue(mockUsers as never);

    const result = await AnalyticsReporting.exportUsersReport({ startDate, endDate });

    expect(result).toEqual(mockUsers);
    expect(prisma.user.findMany).toHaveBeenCalledWith({
      where: { createdAt: { gte: startDate, lte: endDate } },
      select: {
        id: true, email: true, firstName: true, lastName: true, gender: true,
        isPremium: true, isVerified: true, isBlocked: true, responseCount: true,
        chatCount: true, missionCompletedCount: true, createdAt: true, lastActiveAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  });

  it('should return empty array when no users in range', async () => {
    vi.mocked(prisma.user.findMany).mockResolvedValue([]);

    const result = await AnalyticsReporting.exportUsersReport({
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-01-02'),
    });

    expect(result).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// AnalyticsService barrel - verify delegation
// ---------------------------------------------------------------------------
describe('[P2][admin] AnalyticsService barrel', () => {
  it('should delegate getDashboardOverview to AnalyticsOverview', () => {
    expect(AnalyticsService.getDashboardOverview).toBe(AnalyticsOverview.getDashboardOverview);
  });

  it('should delegate getUserGrowthMetrics to AnalyticsOverview', () => {
    expect(AnalyticsService.getUserGrowthMetrics).toBe(AnalyticsOverview.getUserGrowthMetrics);
  });

  it('should delegate getUserActivityMetrics to AnalyticsOverview', () => {
    expect(AnalyticsService.getUserActivityMetrics).toBe(AnalyticsOverview.getUserActivityMetrics);
  });

  it('should delegate getContentMetrics to AnalyticsReporting', () => {
    expect(AnalyticsService.getContentMetrics).toBe(AnalyticsReporting.getContentMetrics);
  });

  it('should delegate getModerationMetrics to AnalyticsReporting', () => {
    expect(AnalyticsService.getModerationMetrics).toBe(AnalyticsReporting.getModerationMetrics);
  });

  it('should delegate getTopUsers to AnalyticsReporting', () => {
    expect(AnalyticsService.getTopUsers).toBe(AnalyticsReporting.getTopUsers);
  });

  it('should delegate getRetentionMetrics to AnalyticsReporting', () => {
    expect(AnalyticsService.getRetentionMetrics).toBe(AnalyticsReporting.getRetentionMetrics);
  });

  it('should delegate getSystemHealth to AnalyticsReporting', () => {
    expect(AnalyticsService.getSystemHealth).toBe(AnalyticsReporting.getSystemHealth);
  });

  it('should delegate exportUsersReport to AnalyticsReporting', () => {
    expect(AnalyticsService.exportUsersReport).toBe(AnalyticsReporting.exportUsersReport);
  });
});
