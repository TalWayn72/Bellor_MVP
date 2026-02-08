/**
 * Background Jobs Scheduler
 * startJobs, stopJobs, getJobsStatus, engagement jobs
 * Cleanup jobs delegated to cleanup-jobs.ts
 */

import { AchievementsService } from '../services/achievements.service.js';
import { prisma } from '../lib/prisma.js';
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
      console.log(`[Job] Inactive reminder: notified ${inactiveUsers.length} users`);
    }
  } catch (error) {
    console.error('[Job] Inactive user reminder failed:', error);
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
      console.log(`[Job] Achievement check: unlocked ${totalUnlocked} achievements for ${activeUsers.length} users`);
    }
  } catch (error) {
    console.error('[Job] Achievement check failed:', error);
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
  console.log('[Jobs] Starting background job scheduler...');
  for (const job of jobs) {
    if (!job.enabled) { console.log(`[Jobs] ${job.name} is disabled, skipping`); continue; }
    job.handler().catch(err => console.error(`[Jobs] ${job.name} initial run failed:`, err));
    const interval = setInterval(job.handler, job.intervalMs);
    intervals.push(interval);
    console.log(`[Jobs] ${job.name} scheduled every ${Math.round(job.intervalMs / 60000)} minutes`);
  }
  console.log(`[Jobs] Started ${jobs.filter(j => j.enabled).length} background jobs`);
}

export function stopBackgroundJobs(): void {
  console.log('[Jobs] Stopping background jobs...');
  for (const interval of intervals) { clearInterval(interval); }
  intervals.length = 0;
  console.log('[Jobs] All background jobs stopped');
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
