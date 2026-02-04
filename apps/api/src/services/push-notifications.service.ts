/**
 * Push Notifications Service
 * Handles Firebase Cloud Messaging for push notifications
 */

import admin from 'firebase-admin';
import { prisma } from '../lib/prisma.js';
import { NotificationType, Platform } from '@prisma/client';

// Initialize Firebase Admin SDK
let firebaseApp: admin.app.App | null = null;

function getFirebaseApp(): admin.app.App {
  if (firebaseApp) {
    return firebaseApp;
  }

  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;

  if (!serviceAccount) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT environment variable not set');
  }

  try {
    const credentials = JSON.parse(serviceAccount);

    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert(credentials),
    });

    return firebaseApp;
  } catch (error) {
    throw new Error('Failed to initialize Firebase: Invalid service account');
  }
}

interface SendPushNotificationInput {
  userId: string;
  title: string;
  body: string;
  data?: Record<string, string>;
  imageUrl?: string;
}

interface SendMultiplePushInput {
  userIds: string[];
  title: string;
  body: string;
  data?: Record<string, string>;
  imageUrl?: string;
}

interface RegisterDeviceInput {
  userId: string;
  token: string;
  platform: Platform;
  deviceId?: string;
  deviceName?: string;
}

export const PushNotificationsService = {
  /**
   * Register device token
   */
  async registerDevice(input: RegisterDeviceInput) {
    const { userId, token, platform, deviceId, deviceName } = input;

    // Upsert device token
    const deviceToken = await prisma.deviceToken.upsert({
      where: { token },
      update: {
        userId,
        platform,
        deviceId,
        deviceName,
        isActive: true,
        lastUsedAt: new Date(),
      },
      create: {
        userId,
        token,
        platform,
        deviceId,
        deviceName,
        isActive: true,
      },
    });

    return deviceToken;
  },

  /**
   * Unregister device token
   */
  async unregisterDevice(token: string) {
    await prisma.deviceToken.updateMany({
      where: { token },
      data: { isActive: false },
    });

    return { success: true };
  },

  /**
   * Get user's active device tokens
   */
  async getUserDeviceTokens(userId: string) {
    return prisma.deviceToken.findMany({
      where: {
        userId,
        isActive: true,
      },
    });
  },

  /**
   * Send push notification to a single user
   */
  async sendToUser(input: SendPushNotificationInput) {
    const { userId, title, body, data, imageUrl } = input;

    // Get user's active device tokens
    const deviceTokens = await prisma.deviceToken.findMany({
      where: {
        userId,
        isActive: true,
      },
    });

    if (deviceTokens.length === 0) {
      return { sent: 0, failed: 0 };
    }

    const tokens = deviceTokens.map(d => d.token);

    return this.sendToTokens(tokens, title, body, data, imageUrl);
  },

  /**
   * Send push notification to multiple users
   */
  async sendToUsers(input: SendMultiplePushInput) {
    const { userIds, title, body, data, imageUrl } = input;

    // Get all active device tokens for these users
    const deviceTokens = await prisma.deviceToken.findMany({
      where: {
        userId: { in: userIds },
        isActive: true,
      },
    });

    if (deviceTokens.length === 0) {
      return { sent: 0, failed: 0 };
    }

    const tokens = deviceTokens.map(d => d.token);

    return this.sendToTokens(tokens, title, body, data, imageUrl);
  },

  /**
   * Send push notification to specific tokens
   */
  async sendToTokens(
    tokens: string[],
    title: string,
    body: string,
    data?: Record<string, string>,
    imageUrl?: string
  ) {
    if (tokens.length === 0) {
      return { sent: 0, failed: 0 };
    }

    const app = getFirebaseApp();
    const messaging = app.messaging();

    const message: admin.messaging.MulticastMessage = {
      tokens,
      notification: {
        title,
        body,
        imageUrl,
      },
      data: data || {},
      android: {
        priority: 'high',
        notification: {
          sound: 'default',
          clickAction: 'FLUTTER_NOTIFICATION_CLICK',
        },
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1,
          },
        },
      },
      webpush: {
        notification: {
          icon: '/icon-192x192.png',
          badge: '/badge-72x72.png',
        },
      },
    };

    try {
      const response = await messaging.sendEachForMulticast(message);

      // Handle failed tokens
      const failedTokens: string[] = [];
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          failedTokens.push(tokens[idx]);
          console.error(`Failed to send to token: ${resp.error?.message}`);
        }
      });

      // Deactivate failed tokens
      if (failedTokens.length > 0) {
        await prisma.deviceToken.updateMany({
          where: { token: { in: failedTokens } },
          data: { isActive: false },
        });
      }

      return {
        sent: response.successCount,
        failed: response.failureCount,
      };
    } catch (error) {
      console.error('FCM send error:', error);
      throw error;
    }
  },

  /**
   * Send notification based on notification type
   */
  async sendForNotificationType(
    userId: string,
    type: NotificationType,
    title: string,
    message: string,
    relatedData?: Record<string, string>
  ) {
    // Create in-app notification
    await prisma.notification.create({
      data: {
        userId,
        type,
        title,
        message,
        relatedUserId: relatedData?.relatedUserId,
        relatedContentType: relatedData?.contentType as any,
        relatedContentId: relatedData?.contentId,
      },
    });

    // Send push notification
    const data: Record<string, string> = {
      type,
      ...relatedData,
    };

    return this.sendToUser({
      userId,
      title,
      body: message,
      data,
    });
  },

  /**
   * Send new message notification
   */
  async sendNewMessageNotification(
    userId: string,
    senderName: string,
    chatId: string,
    preview: string
  ) {
    return this.sendForNotificationType(
      userId,
      'NEW_MESSAGE',
      `${senderName} הודעה חדשה מ`,
      preview.substring(0, 100),
      {
        chatId,
        contentType: 'MESSAGE',
      }
    );
  },

  /**
   * Send new match notification
   */
  async sendNewMatchNotification(userId: string, matchedUserName: string, matchedUserId: string) {
    return this.sendForNotificationType(
      userId,
      'NEW_MATCH',
      '! יש לך Match חדש 💕',
      `${matchedUserName} !עשה איתך Match`,
      {
        relatedUserId: matchedUserId,
      }
    );
  },

  /**
   * Send new like notification
   */
  async sendNewLikeNotification(userId: string, likerName: string, likerId: string) {
    return this.sendForNotificationType(
      userId,
      'NEW_LIKE',
      '! מישהו אהב אותך ❤️',
      `${likerName} אהב את הפרופיל שלך`,
      {
        relatedUserId: likerId,
      }
    );
  },

  /**
   * Send mission reminder notification
   */
  async sendMissionReminderNotification(userId: string, missionTitle: string, missionId: string) {
    return this.sendForNotificationType(
      userId,
      'MISSION_REMINDER',
      '! משימה מחכה לך 🎯',
      `אל תשכח להשלים: ${missionTitle}`,
      {
        contentId: missionId,
        contentType: 'MISSION' as any,
      }
    );
  },

  /**
   * Send achievement unlocked notification
   */
  async sendAchievementUnlockedNotification(
    userId: string,
    achievementName: string,
    achievementId: string
  ) {
    return this.sendForNotificationType(
      userId,
      'ACHIEVEMENT_UNLOCKED',
      '! הישג חדש נפתח 🏆',
      `פתחת: ${achievementName}`,
      {
        contentId: achievementId,
      }
    );
  },

  /**
   * Send story view notification
   */
  async sendStoryViewNotification(userId: string, viewerName: string, viewerId: string) {
    return this.sendForNotificationType(
      userId,
      'STORY_VIEW',
      'מישהו צפה בסטורי שלך 👀',
      `${viewerName} צפה בסטורי שלך`,
      {
        relatedUserId: viewerId,
      }
    );
  },

  /**
   * Send broadcast notification to all users
   */
  async sendBroadcast(title: string, body: string, data?: Record<string, string>) {
    // Get all active device tokens
    const deviceTokens = await prisma.deviceToken.findMany({
      where: { isActive: true },
    });

    if (deviceTokens.length === 0) {
      return { sent: 0, failed: 0 };
    }

    // FCM has a limit of 500 tokens per batch
    const batchSize = 500;
    let totalSent = 0;
    let totalFailed = 0;

    for (let i = 0; i < deviceTokens.length; i += batchSize) {
      const batch = deviceTokens.slice(i, i + batchSize);
      const tokens = batch.map(d => d.token);

      const result = await this.sendToTokens(tokens, title, body, data);
      totalSent += result.sent;
      totalFailed += result.failed;
    }

    // Also create system notifications in database
    const users = await prisma.user.findMany({
      where: { isBlocked: false },
      select: { id: true },
    });

    await prisma.notification.createMany({
      data: users.map(user => ({
        userId: user.id,
        type: 'SYSTEM' as NotificationType,
        title,
        message: body,
      })),
    });

    return { sent: totalSent, failed: totalFailed };
  },

  /**
   * Clean up inactive device tokens
   */
  async cleanupInactiveTokens(daysOld: number = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const result = await prisma.deviceToken.deleteMany({
      where: {
        OR: [
          { isActive: false },
          {
            lastUsedAt: { lt: cutoffDate },
          },
          {
            lastUsedAt: null,
            createdAt: { lt: cutoffDate },
          },
        ],
      },
    });

    return { deletedCount: result.count };
  },
};
