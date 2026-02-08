/**
 * Push Notifications Service
 * Public API, orchestration - delegates to notification-sender and notification-events
 */

import { prisma } from '../lib/prisma.js';
import { NotificationType, Platform } from '@prisma/client';
import { sendToTokens, sendBroadcast } from './push-notifications/notification-sender.js';
import {
  sendForNotificationType,
  sendNewMessageNotification as _sendNewMessage,
  sendNewMatchNotification as _sendNewMatch,
  sendNewLikeNotification as _sendNewLike,
  sendMissionReminderNotification as _sendMissionReminder,
  sendAchievementUnlockedNotification as _sendAchievementUnlocked,
  sendStoryViewNotification as _sendStoryView,
} from './push-notifications/notification-events.js';

interface RegisterDeviceInput {
  userId: string;
  token: string;
  platform: Platform;
  deviceId?: string;
  deviceName?: string;
}

export const PushNotificationsService = {
  async registerDevice(input: RegisterDeviceInput) {
    const { userId, token, platform, deviceId, deviceName } = input;
    return prisma.deviceToken.upsert({
      where: { token },
      update: { userId, platform, deviceId, deviceName, isActive: true, lastUsedAt: new Date() },
      create: { userId, token, platform, deviceId, deviceName, isActive: true },
    });
  },

  async unregisterDevice(token: string) {
    await prisma.deviceToken.updateMany({ where: { token }, data: { isActive: false } });
    return { success: true };
  },

  async getUserDeviceTokens(userId: string) {
    return prisma.deviceToken.findMany({ where: { userId, isActive: true } });
  },

  async sendToUser(input: { userId: string; title: string; body: string; data?: Record<string, string>; imageUrl?: string }) {
    const deviceTokens = await prisma.deviceToken.findMany({
      where: { userId: input.userId, isActive: true },
    });
    if (deviceTokens.length === 0) return { sent: 0, failed: 0 };
    const tokens = deviceTokens.map(d => d.token);
    return sendToTokens(tokens, input.title, input.body, input.data, input.imageUrl);
  },

  async sendToUsers(input: { userIds: string[]; title: string; body: string; data?: Record<string, string>; imageUrl?: string }) {
    const deviceTokens = await prisma.deviceToken.findMany({
      where: { userId: { in: input.userIds }, isActive: true },
    });
    if (deviceTokens.length === 0) return { sent: 0, failed: 0 };
    const tokens = deviceTokens.map(d => d.token);
    return sendToTokens(tokens, input.title, input.body, input.data, input.imageUrl);
  },

  sendToTokens,

  async sendForNotificationType(
    userId: string, type: NotificationType, title: string,
    message: string, relatedData?: Record<string, string>
  ) {
    return sendForNotificationType(this.sendToUser.bind(this), userId, type, title, message, relatedData);
  },

  async sendNewMessageNotification(userId: string, senderName: string, chatId: string, preview: string) {
    return _sendNewMessage(this.sendToUser.bind(this), userId, senderName, chatId, preview);
  },

  async sendNewMatchNotification(userId: string, matchedUserName: string, matchedUserId: string) {
    return _sendNewMatch(this.sendToUser.bind(this), userId, matchedUserName, matchedUserId);
  },

  async sendNewLikeNotification(userId: string, likerName: string, likerId: string) {
    return _sendNewLike(this.sendToUser.bind(this), userId, likerName, likerId);
  },

  async sendMissionReminderNotification(userId: string, missionTitle: string, missionId: string) {
    return _sendMissionReminder(this.sendToUser.bind(this), userId, missionTitle, missionId);
  },

  async sendAchievementUnlockedNotification(userId: string, achievementName: string, achievementId: string) {
    return _sendAchievementUnlocked(this.sendToUser.bind(this), userId, achievementName, achievementId);
  },

  async sendStoryViewNotification(userId: string, viewerName: string, viewerId: string) {
    return _sendStoryView(this.sendToUser.bind(this), userId, viewerName, viewerId);
  },

  sendBroadcast,

  async cleanupInactiveTokens(daysOld: number = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);
    const result = await prisma.deviceToken.deleteMany({
      where: {
        OR: [
          { isActive: false },
          { lastUsedAt: { lt: cutoffDate } },
          { lastUsedAt: null, createdAt: { lt: cutoffDate } },
        ],
      },
    });
    return { deletedCount: result.count };
  },
};
