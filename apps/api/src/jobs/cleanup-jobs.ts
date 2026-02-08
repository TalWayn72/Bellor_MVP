/**
 * Cleanup Jobs
 * Story/chat/session cleanup, premium expiration
 */

import { StoriesService } from '../services/stories.service.js';
import { prisma } from '../lib/prisma.js';
import { logger } from '../lib/logger.js';

/**
 * Story Cleanup Job
 * Removes expired stories (older than 24 hours)
 */
export async function storyCleanupJob(): Promise<void> {
  try {
    const result = await StoriesService.cleanupExpiredStories();
    if (result.deletedCount > 0) {
      logger.info('JOBS', `Story cleanup: removed ${result.deletedCount} expired stories`);
    }
  } catch (error) {
    logger.error('JOBS', 'Story cleanup failed', error instanceof Error ? error : undefined);
  }
}

/**
 * Chat Cleanup Job
 * Expires temporary chats that have passed their expiration time
 */
export async function chatCleanupJob(): Promise<void> {
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
      logger.info('JOBS', `Chat cleanup: expired ${result.count} temporary chats`);
    }
  } catch (error) {
    logger.error('JOBS', 'Chat cleanup failed', error instanceof Error ? error : undefined);
  }
}

/**
 * Premium Expiration Job
 * Removes premium status from users whose subscription has expired
 */
export async function premiumExpirationJob(): Promise<void> {
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
      logger.info('JOBS', `Premium expiration: removed premium from ${result.count} users`);

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
    logger.error('JOBS', 'Premium expiration failed', error instanceof Error ? error : undefined);
  }
}

/**
 * Database Health Check Job
 * Performs basic database health monitoring
 */
export async function databaseHealthJob(): Promise<void> {
  try {
    const start = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    const latency = Date.now() - start;

    if (latency > 1000) {
      logger.warn('JOBS', `Database health: high latency detected (${latency}ms)`);
    }
  } catch (error) {
    logger.error('JOBS', 'Database health check failed', error instanceof Error ? error : undefined);
  }
}
