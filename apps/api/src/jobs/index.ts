/**
 * Background Jobs Scheduler
 * Handles periodic tasks like cleanup, notifications, etc.
 */

import { StoriesService } from '../services/stories.service.js';
import { AchievementsService } from '../services/achievements.service.js';
import { prisma } from '../lib/prisma.js';

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
 * Story Cleanup Job
 * Removes expired stories (older than 24 hours)
 */
async function storyCleanupJob(): Promise<void> {
  try {
    const result = await StoriesService.cleanupExpiredStories();
    if (result.deletedCount > 0) {
      console.log(`[Job] Story cleanup: removed ${result.deletedCount} expired stories`);
    }
  } catch (error) {
    console.error('[Job] Story cleanup failed:', error);
  }
}

/**
 * Chat Cleanup Job
 * Expires temporary chats that have passed their expiration time
 */
async function chatCleanupJob(): Promise<void> {
  try {
    const result = await prisma.chat.updateMany({
      where: {
        isTemporary: true,
        status: 'ACTIVE',
        expiresAt: { lt: new Date() },
      },
      data: {
        status: 'EXPIRED',
      },
    });

    if (result.count > 0) {
      console.log(`[Job] Chat cleanup: expired ${result.count} temporary chats`);
    }
  } catch (error) {
    console.error('[Job] Chat cleanup failed:', error);
  }
}

/**
 * Premium Expiration Job
 * Removes premium status from users whose subscription has expired
 */
async function premiumExpirationJob(): Promise<void> {
  try {
    const result = await prisma.user.updateMany({
      where: {
        isPremium: true,
        premiumExpiresAt: { lt: new Date() },
      },
      data: {
        isPremium: false,
      },
    });

    if (result.count > 0) {
      console.log(`[Job] Premium expiration: removed premium from ${result.count} users`);

      // Create notifications for affected users
      const expiredUsers = await prisma.user.findMany({
        where: {
          isPremium: false,
          premiumExpiresAt: {
            lt: new Date(),
            gt: new Date(Date.now() - 60 * 60 * 1000), // Within last hour
          },
        },
        select: { id: true },
      });

      for (const user of expiredUsers) {
        await prisma.notification.create({
          data: {
            userId: user.id,
            type: 'SYSTEM',
            title: 'Premium Expired',
            message: 'Your premium subscription has expired. Renew to continue enjoying premium features!',
          },
        });
      }
    }
  } catch (error) {
    console.error('[Job] Premium expiration failed:', error);
  }
}

/**
 * Inactive User Reminder Job
 * Sends notifications to users who haven't been active
 */
async function inactiveUserReminderJob(): Promise<void> {
  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const eightDaysAgo = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000);

    // Find users inactive for 7 days (but not already notified in last day)
    const inactiveUsers = await prisma.user.findMany({
      where: {
        isBlocked: false,
        lastActiveAt: {
          lt: sevenDaysAgo,
          gt: eightDaysAgo, // Only notify once
        },
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
 * Checks and unlocks achievements for recently active users
 */
async function achievementCheckJob(): Promise<void> {
  try {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    // Get recently active users
    const activeUsers = await prisma.user.findMany({
      where: {
        lastActiveAt: { gte: oneHourAgo },
        isBlocked: false,
      },
      select: { id: true },
      take: 100, // Process in batches
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

/**
 * Database Health Check Job
 * Performs basic database health monitoring
 */
async function databaseHealthJob(): Promise<void> {
  try {
    const start = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    const latency = Date.now() - start;

    if (latency > 1000) {
      console.warn(`[Job] Database health: high latency detected (${latency}ms)`);
    }
  } catch (error) {
    console.error('[Job] Database health check failed:', error);
  }
}

// Job definitions
const jobs: JobConfig[] = [
  {
    name: 'Story Cleanup',
    intervalMs: 15 * 60 * 1000, // Every 15 minutes
    handler: storyCleanupJob,
    enabled: true,
  },
  {
    name: 'Chat Cleanup',
    intervalMs: 30 * 60 * 1000, // Every 30 minutes
    handler: chatCleanupJob,
    enabled: true,
  },
  {
    name: 'Premium Expiration',
    intervalMs: 60 * 60 * 1000, // Every hour
    handler: premiumExpirationJob,
    enabled: true,
  },
  {
    name: 'Inactive User Reminder',
    intervalMs: 24 * 60 * 60 * 1000, // Once a day
    handler: inactiveUserReminderJob,
    enabled: true,
  },
  {
    name: 'Achievement Check',
    intervalMs: 30 * 60 * 1000, // Every 30 minutes
    handler: achievementCheckJob,
    enabled: true,
  },
  {
    name: 'Database Health',
    intervalMs: 5 * 60 * 1000, // Every 5 minutes
    handler: databaseHealthJob,
    enabled: true,
  },
];

/**
 * Start all background jobs
 */
export function startBackgroundJobs(): void {
  console.log('[Jobs] Starting background job scheduler...');

  for (const job of jobs) {
    if (!job.enabled) {
      console.log(`[Jobs] ${job.name} is disabled, skipping`);
      continue;
    }

    // Run immediately on startup
    job.handler().catch(err => {
      console.error(`[Jobs] ${job.name} initial run failed:`, err);
    });

    // Schedule recurring runs
    const interval = setInterval(job.handler, job.intervalMs);
    intervals.push(interval);

    const intervalMinutes = Math.round(job.intervalMs / 60000);
    console.log(`[Jobs] ${job.name} scheduled every ${intervalMinutes} minutes`);
  }

  console.log(`[Jobs] Started ${jobs.filter(j => j.enabled).length} background jobs`);
}

/**
 * Stop all background jobs
 */
export function stopBackgroundJobs(): void {
  console.log('[Jobs] Stopping background jobs...');

  for (const interval of intervals) {
    clearInterval(interval);
  }

  intervals.length = 0;
  console.log('[Jobs] All background jobs stopped');
}

/**
 * Run a specific job manually (for testing/admin)
 */
export async function runJobManually(jobName: string): Promise<{ success: boolean; message: string }> {
  const job = jobs.find(j => j.name.toLowerCase() === jobName.toLowerCase());

  if (!job) {
    return {
      success: false,
      message: `Job "${jobName}" not found. Available jobs: ${jobs.map(j => j.name).join(', ')}`,
    };
  }

  try {
    await job.handler();
    return {
      success: true,
      message: `Job "${job.name}" executed successfully`,
    };
  } catch (error) {
    return {
      success: false,
      message: `Job "${job.name}" failed: ${error}`,
    };
  }
}

/**
 * Get status of all jobs
 */
export function getJobsStatus(): { name: string; enabled: boolean; intervalMinutes: number }[] {
  return jobs.map(job => ({
    name: job.name,
    enabled: job.enabled,
    intervalMinutes: Math.round(job.intervalMs / 60000),
  }));
}
