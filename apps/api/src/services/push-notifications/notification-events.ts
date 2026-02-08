/**
 * Notification Event Builders
 * Event-specific notification methods for different notification types
 */

import { NotificationType } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';

interface NotificationEventResult {
  sent: number;
  failed: number;
}

type SendToUserFn = (input: {
  userId: string;
  title: string;
  body: string;
  data?: Record<string, string>;
}) => Promise<NotificationEventResult>;

/**
 * Send notification based on notification type
 */
export async function sendForNotificationType(
  sendToUser: SendToUserFn,
  userId: string,
  type: NotificationType,
  title: string,
  message: string,
  relatedData?: Record<string, string>
) {
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

  const data: Record<string, string> = {
    type,
    ...relatedData,
  };

  return sendToUser({ userId, title, body: message, data });
}

/**
 * Send new message notification
 */
export async function sendNewMessageNotification(
  sendToUser: SendToUserFn,
  userId: string,
  senderName: string,
  chatId: string,
  preview: string
) {
  return sendForNotificationType(
    sendToUser,
    userId,
    'NEW_MESSAGE',
    `${senderName} הודעה חדשה מ`,
    preview.substring(0, 100),
    { chatId, contentType: 'MESSAGE' }
  );
}

/**
 * Send new match notification
 */
export async function sendNewMatchNotification(
  sendToUser: SendToUserFn,
  userId: string,
  matchedUserName: string,
  matchedUserId: string
) {
  return sendForNotificationType(
    sendToUser,
    userId,
    'NEW_MATCH',
    '! יש לך Match חדש \u{1F495}',
    `${matchedUserName} !עשה איתך Match`,
    { relatedUserId: matchedUserId }
  );
}

/**
 * Send new like notification
 */
export async function sendNewLikeNotification(
  sendToUser: SendToUserFn,
  userId: string,
  likerName: string,
  likerId: string
) {
  return sendForNotificationType(
    sendToUser,
    userId,
    'NEW_LIKE',
    '! מישהו אהב אותך \u{2764}\u{FE0F}',
    `${likerName} אהב את הפרופיל שלך`,
    { relatedUserId: likerId }
  );
}

/**
 * Send mission reminder notification
 */
export async function sendMissionReminderNotification(
  sendToUser: SendToUserFn,
  userId: string,
  missionTitle: string,
  missionId: string
) {
  return sendForNotificationType(
    sendToUser,
    userId,
    'MISSION_REMINDER',
    '! משימה מחכה לך \u{1F3AF}',
    `אל תשכח להשלים: ${missionTitle}`,
    { contentId: missionId, contentType: 'MISSION' as any }
  );
}

/**
 * Send achievement unlocked notification
 */
export async function sendAchievementUnlockedNotification(
  sendToUser: SendToUserFn,
  userId: string,
  achievementName: string,
  achievementId: string
) {
  return sendForNotificationType(
    sendToUser,
    userId,
    'ACHIEVEMENT_UNLOCKED',
    '! הישג חדש נפתח \u{1F3C6}',
    `פתחת: ${achievementName}`,
    { contentId: achievementId }
  );
}

/**
 * Send story view notification
 */
export async function sendStoryViewNotification(
  sendToUser: SendToUserFn,
  userId: string,
  viewerName: string,
  viewerId: string
) {
  return sendForNotificationType(
    sendToUser,
    userId,
    'STORY_VIEW',
    'מישהו צפה בסטורי שלך \u{1F440}',
    `${viewerName} צפה בסטורי שלך`,
    { relatedUserId: viewerId }
  );
}
