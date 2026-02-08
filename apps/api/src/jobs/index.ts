/**
 * Background Jobs Scheduler
 * startJobs, stopJobs, getJobsStatus, engagement jobs
 * Cleanup jobs delegated to cleanup-jobs.ts
 */

import { AchievementsService } from '../services/achievements.service.js';
import { prisma } from '../lib/prisma.js';
import { logger } from '../lib/logger.js';
import {
  storyCleanupJob,
  chatCleanupJob,
  premiumExpirationJob,
  databaseHealthJob,
} from './cleanup-jobs.js';

// Job configuration
interface JobConfig {
  name: string;
  intervalMs: number;
  handler: () => Promise<void>;
  enabled: boolean;
}

// Store interval references for cleanup
const intervals: NodeJS.Timeout[] = [];

/**
 * Inactive User Reminder Job
 */
async function inactiveUserReminderJob(): Promise<void> {
  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const eightDaysAgo = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000);

    const inactiveUsers = await prisma.user.findMany({
      where: {
        isBlocked: false,
        lastActiveAt: { lt: sevenDaysAgo, gt: eightDaysAgo },
      },
      select: { id: true },
    });

    for (const user of inactiveUsers) {
      await prisma.notification.create({
        data: {
          userId: user.id,
          type: 'SYSTEM',
          title: 'We miss you!',
          message: 'It\'s been a while since you last visited. Check out what\'s new!',
        },
      });
    }

    if (inactiveUsers.length > 0) {
      logger.info('JOBS', `Inactive reminder: notified ${inactiveUsers.length} users`);
    }
  } catch (error) {
    logger.error('JOBS', 'Inactive user reminder failed', error instanceof Error ? error : undefined);
  }
}

/**
 * Achievement Check Job
 */
async function achievementCheckJob(): Promise<void> {
  try {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    const activeUsers = await prisma.user.findMany({
      where: { lastActiveAt: { gte: oneHourAgo }, isBlocked: false },
      select: { id: true },
      take: 100,
    });

    let totalUnlocked = 0;
    for (const user of activeUsers) {
      const unlocked = await AchievementsService.checkAndUnlockAchievements(user.id);
      totalUnlocked += unlocked.length;
    }

    if (totalUnlocked > 0) {
      logger.info('JOBS', `Achievement check: unlocked ${totalUnlocked} achievements for ${activeUsers.length} users`);
    }
  } catch (error) {
    logger.error('JOBS', 'Achievement check failed', error instanceof Error ? error : undefined);
  }
}

// Job definitions
const jobs: JobConfig[] = [
  { name: 'Story Cleanup', intervalMs: 15 * 60 * 1000, handler: storyCleanupJob, enabled: true },
  { name: 'Chat Cleanup', intervalMs: 30 * 60 * 1000, handler: chatCleanupJob, enabled: true },
  { name: 'Premium Expiration', intervalMs: 60 * 60 * 1000, handler: premiumExpirationJob, enabled: true },
  { name: 'Inactive User Reminder', intervalMs: 24 * 60 * 60 * 1000, handler: inactiveUserReminderJob, enabled: true },
  { name: 'Achievement Check', intervalMs: 30 * 60 * 1000, handler: achievementCheckJob, enabled: true },
  { name: 'Database Health', intervalMs: 5 * 60 * 1000, handler: databaseHealthJob, enabled: true },
];

export function startBackgroundJobs(): void {
  logger.info('JOBS', 'Starting background job scheduler...');
  for (const job of jobs) {
    if (!job.enabled) { logger.info('JOBS', `${job.name} is disabled, skipping`); continue; }
    job.handler().catch(err => logger.error('JOBS', `${job.name} initial run failed`, err instanceof Error ? err : undefined));
    const interval = setInterval(job.handler, job.intervalMs);
    intervals.push(interval);
    logger.info('JOBS', `${job.name} scheduled every ${Math.round(job.intervalMs / 60000)} minutes`);
  }
  logger.info('JOBS', `Started ${jobs.filter(j => j.enabled).length} background jobs`);
}

export function stopBackgroundJobs(): void {
  logger.info('JOBS', 'Stopping background jobs...');
  for (const interval of intervals) { clearInterval(interval); }
  intervals.length = 0;
  logger.info('JOBS', 'All background jobs stopped');
}

export async function runJobManually(jobName: string): Promise<{ success: boolean; message: string }> {
  const job = jobs.find(j => j.name.toLowerCase() === jobName.toLowerCase());
  if (!job) {
    return { success: false, message: `Job "${jobName}" not found. Available jobs: ${jobs.map(j => j.name).join(', ')}` };
  }
  try {
    await job.handler();
    return { success: true, message: `Job "${job.name}" executed successfully` };
  } catch (error) {
    return { success: false, message: `Job "${job.name}" failed: ${error}` };
  }
}

export function getJobsStatus(): { name: string; enabled: boolean; intervalMinutes: number }[] {
  return jobs.map(job => ({
    name: job.name, enabled: job.enabled, intervalMinutes: Math.round(job.intervalMs / 60000),
  }));
}
