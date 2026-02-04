/**
 * Admin Controller
 * Handles admin dashboard and management operations
 */

import { FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { AnalyticsService } from '../services/analytics.service.js';
import { StoriesService } from '../services/stories.service.js';
import { AchievementsService } from '../services/achievements.service.js';
import { getJobsStatus, runJobManually } from '../jobs/index.js';

// Validation schemas
const userActionSchema = z.object({
  userId: z.string().cuid(),
  action: z.enum(['block', 'unblock', 'make_admin', 'remove_admin', 'make_premium', 'remove_premium']),
  reason: z.string().optional(),
});

const reportActionSchema = z.object({
  reportId: z.string().cuid(),
  action: z.enum(['review', 'action_taken', 'dismiss']),
  notes: z.string().optional(),
});

const createAchievementSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().min(1).max(500),
  iconUrl: z.string().url().optional(),
  requirement: z.object({
    type: z.enum(['response_count', 'chat_count', 'mission_count', 'premium', 'days_active']),
    value: z.number().int().positive(),
  }),
  xpReward: z.number().int().positive().default(50),
});

export const AdminController = {
  /**
   * GET /admin/dashboard
   * Get dashboard overview
   */
  async getDashboard(_request: FastifyRequest, reply: FastifyReply) {
    try {
      const overview = await AnalyticsService.getDashboardOverview();

      return reply.send({
        success: true,
        data: overview,
      });
    } catch (error) {
      return reply.code(500).send({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch dashboard data',
        },
      });
    }
  },

  /**
   * GET /admin/analytics/users
   * Get user growth metrics
   */
  async getUserAnalytics(
    request: FastifyRequest<{ Querystring: { startDate?: string; endDate?: string } }>,
    reply: FastifyReply
  ) {
    try {
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      const startDate = request.query.startDate
        ? new Date(request.query.startDate)
        : thirtyDaysAgo;
      const endDate = request.query.endDate
        ? new Date(request.query.endDate)
        : now;

      const [growth, activity, retention] = await Promise.all([
        AnalyticsService.getUserGrowthMetrics({ startDate, endDate }),
        AnalyticsService.getUserActivityMetrics({ startDate, endDate }),
        AnalyticsService.getRetentionMetrics(),
      ]);

      return reply.send({
        success: true,
        data: {
          growth,
          activity,
          retention,
        },
      });
    } catch (error) {
      return reply.code(500).send({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch user analytics',
        },
      });
    }
  },

  /**
   * GET /admin/analytics/content
   * Get content metrics
   */
  async getContentAnalytics(
    request: FastifyRequest<{ Querystring: { startDate?: string; endDate?: string } }>,
    reply: FastifyReply
  ) {
    try {
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      const startDate = request.query.startDate
        ? new Date(request.query.startDate)
        : thirtyDaysAgo;
      const endDate = request.query.endDate
        ? new Date(request.query.endDate)
        : now;

      const content = await AnalyticsService.getContentMetrics({ startDate, endDate });

      return reply.send({
        success: true,
        data: content,
      });
    } catch (error) {
      return reply.code(500).send({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch content analytics',
        },
      });
    }
  },

  /**
   * GET /admin/analytics/moderation
   * Get moderation metrics
   */
  async getModerationAnalytics(_request: FastifyRequest, reply: FastifyReply) {
    try {
      const moderation = await AnalyticsService.getModerationMetrics();

      return reply.send({
        success: true,
        data: moderation,
      });
    } catch (error) {
      return reply.code(500).send({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch moderation analytics',
        },
      });
    }
  },

  /**
   * GET /admin/analytics/top-users
   * Get top users by activity
   */
  async getTopUsers(
    request: FastifyRequest<{ Querystring: { limit?: string } }>,
    reply: FastifyReply
  ) {
    try {
      const limit = request.query.limit ? parseInt(request.query.limit) : 10;
      const topUsers = await AnalyticsService.getTopUsers(limit);

      return reply.send({
        success: true,
        data: topUsers,
      });
    } catch (error) {
      return reply.code(500).send({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch top users',
        },
      });
    }
  },

  /**
   * GET /admin/health
   * Get system health status
   */
  async getSystemHealth(_request: FastifyRequest, reply: FastifyReply) {
    try {
      const health = await AnalyticsService.getSystemHealth();

      return reply.send({
        success: true,
        data: health,
      });
    } catch (error) {
      return reply.code(500).send({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch system health',
        },
      });
    }
  },

  /**
   * GET /admin/users
   * List all users with filters (admin view)
   */
  async listUsers(
    request: FastifyRequest<{
      Querystring: {
        limit?: string;
        offset?: string;
        search?: string;
        isBlocked?: string;
        isPremium?: string;
        isAdmin?: string;
        sortBy?: string;
        sortOrder?: string;
      };
    }>,
    reply: FastifyReply
  ) {
    try {
      const {
        limit = '20',
        offset = '0',
        search,
        isBlocked,
        isPremium,
        isAdmin,
        sortBy = 'createdAt',
        sortOrder = 'desc',
      } = request.query;

      const where: any = {};

      if (search) {
        where.OR = [
          { email: { contains: search, mode: 'insensitive' } },
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
        ];
      }

      if (isBlocked !== undefined) {
        where.isBlocked = isBlocked === 'true';
      }

      if (isPremium !== undefined) {
        where.isPremium = isPremium === 'true';
      }

      if (isAdmin !== undefined) {
        where.isAdmin = isAdmin === 'true';
      }

      const [users, total] = await Promise.all([
        prisma.user.findMany({
          where,
          skip: parseInt(offset),
          take: parseInt(limit),
          orderBy: { [sortBy]: sortOrder },
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            profileImages: true,
            gender: true,
            isVerified: true,
            isBlocked: true,
            isPremium: true,
            isAdmin: true,
            responseCount: true,
            chatCount: true,
            missionCompletedCount: true,
            createdAt: true,
            lastActiveAt: true,
          },
        }),
        prisma.user.count({ where }),
      ]);

      return reply.send({
        success: true,
        data: {
          users,
          pagination: {
            total,
            limit: parseInt(limit),
            offset: parseInt(offset),
            hasMore: parseInt(offset) + users.length < total,
          },
        },
      });
    } catch (error) {
      return reply.code(500).send({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to list users',
        },
      });
    }
  },

  /**
   * POST /admin/users/action
   * Perform action on user (block, unblock, make admin, etc.)
   */
  async userAction(
    request: FastifyRequest<{ Body: unknown }>,
    reply: FastifyReply
  ) {
    try {
      const data = userActionSchema.parse(request.body);
      const adminId = request.user?.id;

      const user = await prisma.user.findUnique({
        where: { id: data.userId },
      });

      if (!user) {
        return reply.code(404).send({
          success: false,
          error: {
            code: 'USER_NOT_FOUND',
            message: 'User not found',
          },
        });
      }

      let updateData: any = {};

      switch (data.action) {
        case 'block':
          updateData.isBlocked = true;
          break;
        case 'unblock':
          updateData.isBlocked = false;
          break;
        case 'make_admin':
          updateData.isAdmin = true;
          break;
        case 'remove_admin':
          updateData.isAdmin = false;
          break;
        case 'make_premium':
          updateData.isPremium = true;
          updateData.premiumExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
          break;
        case 'remove_premium':
          updateData.isPremium = false;
          updateData.premiumExpiresAt = null;
          break;
      }

      const updatedUser = await prisma.user.update({
        where: { id: data.userId },
        data: updateData,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          isBlocked: true,
          isPremium: true,
          isAdmin: true,
        },
      });

      return reply.send({
        success: true,
        data: {
          user: updatedUser,
          action: data.action,
          performedBy: adminId,
        },
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            details: error.errors,
          },
        });
      }

      return reply.code(500).send({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to perform user action',
        },
      });
    }
  },

  /**
   * GET /admin/reports
   * List all reports for moderation
   */
  async listReports(
    request: FastifyRequest<{
      Querystring: {
        limit?: string;
        offset?: string;
        status?: string;
        reason?: string;
      };
    }>,
    reply: FastifyReply
  ) {
    try {
      const {
        limit = '20',
        offset = '0',
        status,
        reason,
      } = request.query;

      const where: any = {};

      if (status) {
        where.status = status;
      }

      if (reason) {
        where.reason = reason;
      }

      const [reports, total] = await Promise.all([
        prisma.report.findMany({
          where,
          skip: parseInt(offset),
          take: parseInt(limit),
          orderBy: [
            { priority: 'desc' },
            { createdAt: 'desc' },
          ],
          include: {
            reporter: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                profileImages: true,
              },
            },
            reportedUser: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                profileImages: true,
                isBlocked: true,
              },
            },
          },
        }),
        prisma.report.count({ where }),
      ]);

      return reply.send({
        success: true,
        data: {
          reports,
          pagination: {
            total,
            limit: parseInt(limit),
            offset: parseInt(offset),
            hasMore: parseInt(offset) + reports.length < total,
          },
        },
      });
    } catch (error) {
      return reply.code(500).send({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to list reports',
        },
      });
    }
  },

  /**
   * POST /admin/reports/action
   * Take action on a report
   */
  async reportAction(
    request: FastifyRequest<{ Body: unknown }>,
    reply: FastifyReply
  ) {
    try {
      const data = reportActionSchema.parse(request.body);
      const adminId = request.user?.id;

      const report = await prisma.report.findUnique({
        where: { id: data.reportId },
      });

      if (!report) {
        return reply.code(404).send({
          success: false,
          error: {
            code: 'REPORT_NOT_FOUND',
            message: 'Report not found',
          },
        });
      }

      let status: 'REVIEWED' | 'ACTION_TAKEN' | 'DISMISSED';

      switch (data.action) {
        case 'review':
          status = 'REVIEWED';
          break;
        case 'action_taken':
          status = 'ACTION_TAKEN';
          break;
        case 'dismiss':
          status = 'DISMISSED';
          break;
      }

      const updatedReport = await prisma.report.update({
        where: { id: data.reportId },
        data: {
          status,
          reviewedBy: adminId,
          reviewNotes: data.notes,
          reviewedAt: new Date(),
        },
        include: {
          reporter: {
            select: { id: true, firstName: true, lastName: true },
          },
          reportedUser: {
            select: { id: true, firstName: true, lastName: true },
          },
        },
      });

      return reply.send({
        success: true,
        data: {
          report: updatedReport,
          action: data.action,
        },
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            details: error.errors,
          },
        });
      }

      return reply.code(500).send({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to process report action',
        },
      });
    }
  },

  /**
   * POST /admin/achievements
   * Create a new achievement
   */
  async createAchievement(
    request: FastifyRequest<{ Body: unknown }>,
    reply: FastifyReply
  ) {
    try {
      const data = createAchievementSchema.parse(request.body);

      const achievement = await AchievementsService.createAchievement({
        name: data.name,
        description: data.description,
        iconUrl: data.iconUrl,
        requirement: data.requirement,
        xpReward: data.xpReward,
      });

      return reply.code(201).send({
        success: true,
        data: achievement,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            details: error.errors,
          },
        });
      }

      return reply.code(500).send({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to create achievement',
        },
      });
    }
  },

  /**
   * POST /admin/cleanup/stories
   * Manually trigger story cleanup
   */
  async cleanupStories(_request: FastifyRequest, reply: FastifyReply) {
    try {
      const result = await StoriesService.cleanupExpiredStories();

      return reply.send({
        success: true,
        data: {
          message: 'Story cleanup completed',
          deletedCount: result.deletedCount,
        },
      });
    } catch (error) {
      return reply.code(500).send({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to cleanup stories',
        },
      });
    }
  },

  /**
   * GET /admin/export/users
   * Export users data
   */
  async exportUsers(
    request: FastifyRequest<{
      Querystring: { startDate?: string; endDate?: string; format?: string };
    }>,
    reply: FastifyReply
  ) {
    try {
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      const startDate = request.query.startDate
        ? new Date(request.query.startDate)
        : thirtyDaysAgo;
      const endDate = request.query.endDate
        ? new Date(request.query.endDate)
        : now;
      const format = request.query.format || 'json';

      const users = await AnalyticsService.exportUsersReport({ startDate, endDate });

      if (format === 'csv') {
        // Generate CSV
        const headers = [
          'id', 'email', 'firstName', 'lastName', 'gender',
          'isPremium', 'isVerified', 'isBlocked',
          'responseCount', 'chatCount', 'missionCompletedCount',
          'createdAt', 'lastActiveAt'
        ];

        const csvRows = [headers.join(',')];

        for (const user of users) {
          const row = [
            user.id,
            user.email,
            user.firstName || '',
            user.lastName || '',
            user.gender || '',
            user.isPremium,
            user.isVerified,
            user.isBlocked,
            user.responseCount,
            user.chatCount,
            user.missionCompletedCount,
            user.createdAt.toISOString(),
            user.lastActiveAt?.toISOString() || '',
          ];
          csvRows.push(row.join(','));
        }

        reply.header('Content-Type', 'text/csv');
        reply.header('Content-Disposition', `attachment; filename=users-export-${startDate.toISOString().split('T')[0]}.csv`);

        return reply.send(csvRows.join('\n'));
      }

      return reply.send({
        success: true,
        data: {
          users,
          exportedAt: now.toISOString(),
          range: {
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
          },
        },
      });
    } catch (error) {
      return reply.code(500).send({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to export users',
        },
      });
    }
  },

  /**
   * GET /admin/jobs
   * Get status of all background jobs
   */
  async getJobs(_request: FastifyRequest, reply: FastifyReply) {
    try {
      const jobs = getJobsStatus();

      return reply.send({
        success: true,
        data: {
          jobs,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      return reply.code(500).send({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to get jobs status',
        },
      });
    }
  },

  /**
   * POST /admin/jobs/run
   * Manually run a specific job
   */
  async runJob(
    request: FastifyRequest<{ Body: { jobName: string } }>,
    reply: FastifyReply
  ) {
    try {
      const { jobName } = request.body as { jobName: string };

      if (!jobName) {
        return reply.code(400).send({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'jobName is required',
          },
        });
      }

      const result = await runJobManually(jobName);

      return reply.send({
        success: result.success,
        data: {
          message: result.message,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      return reply.code(500).send({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to run job',
        },
      });
    }
  },
};
