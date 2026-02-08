/**
 * Notification Sender
 * Firebase messaging, batch send, device token management
 */

import admin from 'firebase-admin';
import { prisma } from '../../lib/prisma.js';
import { NotificationType } from '@prisma/client';

// Initialize Firebase Admin SDK
let firebaseApp: admin.app.App | null = null;

export function getFirebaseApp(): admin.app.App {
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

/**
 * Send push notification to specific tokens
 */
export async function sendToTokens(
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
    notification: { title, body, imageUrl },
    data: data || {},
    android: {
      priority: 'high',
      notification: { sound: 'default', clickAction: 'FLUTTER_NOTIFICATION_CLICK' },
    },
    apns: {
      payload: { aps: { sound: 'default', badge: 1 } },
    },
    webpush: {
      notification: { icon: '/icon-192x192.png', badge: '/badge-72x72.png' },
    },
  };

  try {
    const response = await messaging.sendEachForMulticast(message);

    const failedTokens: string[] = [];
    response.responses.forEach((resp, idx) => {
      if (!resp.success) {
        failedTokens.push(tokens[idx]);
        console.error(`Failed to send to token: ${resp.error?.message}`);
      }
    });

    if (failedTokens.length > 0) {
      await prisma.deviceToken.updateMany({
        where: { token: { in: failedTokens } },
        data: { isActive: false },
      });
    }

    return { sent: response.successCount, failed: response.failureCount };
  } catch (error) {
    console.error('FCM send error:', error);
    throw error;
  }
}

/**
 * Send broadcast notification to all users
 */
export async function sendBroadcast(
  title: string,
  body: string,
  data?: Record<string, string>
) {
  const deviceTokens = await prisma.deviceToken.findMany({
    where: { isActive: true },
  });

  if (deviceTokens.length === 0) {
    return { sent: 0, failed: 0 };
  }

  const batchSize = 500;
  let totalSent = 0;
  let totalFailed = 0;

  for (let i = 0; i < deviceTokens.length; i += batchSize) {
    const batch = deviceTokens.slice(i, i + batchSize);
    const tokens = batch.map(d => d.token);
    const result = await sendToTokens(tokens, title, body, data);
    totalSent += result.sent;
    totalFailed += result.failed;
  }

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
}
