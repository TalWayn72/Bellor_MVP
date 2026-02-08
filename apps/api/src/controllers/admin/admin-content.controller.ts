/**
 * Admin Controller - Reports, Achievements, Content, Jobs Handlers
 */

import { FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { Prisma, ReportStatus, ReportReason } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';
import { StoriesService } from '../../services/stories.service.js';
import { AchievementsService } from '../../services/achievements.service.js';
import { getJobsStatus, runJobManually } from '../../jobs/index.js';
import { reportActionSchema, createAchievementSchema } from './admin-schemas.js';

export async function listReports(
  request: FastifyRequest<{ Querystring: { limit?: string; offset?: string; status?: string; reason?: string } }>,
  reply: FastifyReply
) {
  try {
    const { limit = '20', offset = '0', status, reason } = request.query;
    const where: Prisma.ReportWhereInput = {};
    if (status) where.status = status as ReportStatus;
    if (reason) where.reason = reason as ReportReason;

    const [reports, total] = await Promise.all([
      prisma.report.findMany({
        where, skip: parseInt(offset), take: parseInt(limit),
        orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
        include: {
          reporter: { select: { id: true, firstName: true, lastName: true, email: true, profileImages: true } },
          reportedUser: { select: { id: true, firstName: true, lastName: true, email: true, profileImages: true, isBlocked: true } },
        },
      }),
      prisma.report.count({ where }),
    ]);

    return reply.send({
      success: true,
      data: { reports, pagination: { total, limit: parseInt(limit), offset: parseInt(offset), hasMore: parseInt(offset) + reports.length < total } },
    });
  } catch (error) {
    return reply.code(500).send({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to list reports' } });
  }
}

export async function reportAction(request: FastifyRequest<{ Body: unknown }>, reply: FastifyReply) {
  try {
    const data = reportActionSchema.parse(request.body);
    const adminId = request.user?.id;

    const report = await prisma.report.findUnique({ where: { id: data.reportId } });
    if (!report) {
      return reply.code(404).send({ success: false, error: { code: 'REPORT_NOT_FOUND', message: 'Report not found' } });
    }

    let status: 'REVIEWED' | 'ACTION_TAKEN' | 'DISMISSED';
    switch (data.action) {
      case 'review': status = 'REVIEWED'; break;
      case 'action_taken': status = 'ACTION_TAKEN'; break;
      case 'dismiss': status = 'DISMISSED'; break;
    }

    const updatedReport = await prisma.report.update({
      where: { id: data.reportId },
      data: { status, reviewedBy: adminId, reviewNotes: data.notes, reviewedAt: new Date() },
      include: {
        reporter: { select: { id: true, firstName: true, lastName: true } },
        reportedUser: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    return reply.send({ success: true, data: { report: updatedReport, action: data.action } });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return reply.code(400).send({ success: false, error: { code: 'VALIDATION_ERROR', details: error.errors } });
    }
    return reply.code(500).send({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to process report action' } });
  }
}

export async function createAchievement(request: FastifyRequest<{ Body: unknown }>, reply: FastifyReply) {
  try {
    const data = createAchievementSchema.parse(request.body);
    const achievement = await AchievementsService.createAchievement({
      name: data.name, description: data.description,
      iconUrl: data.iconUrl, requirement: data.requirement, xpReward: data.xpReward,
    });
    return reply.code(201).send({ success: true, data: achievement });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return reply.code(400).send({ success: false, error: { code: 'VALIDATION_ERROR', details: error.errors } });
    }
    return reply.code(500).send({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to create achievement' } });
  }
}

export async function cleanupStories(_request: FastifyRequest, reply: FastifyReply) {
  try {
    const result = await StoriesService.cleanupExpiredStories();
    return reply.send({ success: true, data: { message: 'Story cleanup completed', deletedCount: result.deletedCount } });
  } catch (error) {
    return reply.code(500).send({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to cleanup stories' } });
  }
}

export async function getJobs(_request: FastifyRequest, reply: FastifyReply) {
  try {
    const jobs = getJobsStatus();
    return reply.send({ success: true, data: { jobs, timestamp: new Date().toISOString() } });
  } catch (error) {
    return reply.code(500).send({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to get jobs status' } });
  }
}

export async function runJob(request: FastifyRequest<{ Body: { jobName: string } }>, reply: FastifyReply) {
  try {
    const { jobName } = request.body as { jobName: string };
    if (!jobName) {
      return reply.code(400).send({ success: false, error: { code: 'VALIDATION_ERROR', message: 'jobName is required' } });
    }
    const result = await runJobManually(jobName);
    return reply.send({ success: result.success, data: { message: result.message, timestamp: new Date().toISOString() } });
  } catch (error) {
    return reply.code(500).send({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to run job' } });
  }
}
