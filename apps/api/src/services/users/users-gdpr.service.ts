/**
 * User GDPR & Stats Service
 * Handles data export, deletion (right to erasure), and user statistics
 */
import { prisma } from '../../lib/prisma.js';
import { cacheDel, CacheKey } from '../../lib/cache.js';

/**
 * Get user statistics
 */
export async function getUserStats(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      _count: {
        select: {
          sentMessages: true,
          chatsAsUser1: true,
          chatsAsUser2: true,
        },
      },
    },
  });

  if (!user) {
    throw new Error('User not found');
  }

  return {
    userId: user.id,
    messagesCount: user._count.sentMessages,
    chatsCount: user._count.chatsAsUser1 + user._count.chatsAsUser2,
    isPremium: user.isPremium,
    memberSince: user.createdAt,
    lastLogin: user.lastActiveAt,
  };
}

/**
 * GDPR Data Export - Export all user data
 */
export async function exportUserData(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      sentMessages: { select: { id: true, content: true, createdAt: true } },
      responses: { select: { id: true, content: true, responseType: true, createdAt: true } },
      stories: { select: { id: true, mediaUrl: true, caption: true, createdAt: true } },
      achievements: { include: { achievement: true } },
      feedbacks: { select: { id: true, type: true, description: true, createdAt: true } },
    },
  });

  if (!user) {
    throw new Error('User not found');
  }

  // Fetch data from tables without direct User back-relation
  const [devices, subscriptions, payments] = await Promise.all([
    prisma.deviceToken.findMany({
      where: { userId }, select: { id: true, platform: true, createdAt: true },
    }),
    prisma.subscription.findMany({
      where: { userId }, select: { id: true, status: true, billingCycle: true, createdAt: true },
    }),
    prisma.payment.findMany({
      where: { userId }, select: { id: true, amount: true, currency: true, status: true, createdAt: true },
    }),
  ]);

  return {
    personalInformation: {
      id: user.id, email: user.email, firstName: user.firstName,
      lastName: user.lastName, birthDate: user.birthDate, gender: user.gender,
      bio: user.bio, location: user.location, preferredLanguage: user.preferredLanguage,
      profileImages: user.profileImages, createdAt: user.createdAt, lastActiveAt: user.lastActiveAt,
    },
    preferences: {
      lookingFor: user.lookingFor, ageRangeMin: user.ageRangeMin,
      ageRangeMax: user.ageRangeMax, maxDistance: user.maxDistance,
    },
    accountStatus: {
      isVerified: user.isVerified, isPremium: user.isPremium,
      premiumExpiresAt: user.premiumExpiresAt,
    },
    content: {
      messages: user.sentMessages, responses: user.responses, stories: user.stories,
    },
    achievements: user.achievements.map((ua) => ({
      name: ua.achievement.name, description: ua.achievement.description, unlockedAt: ua.unlockedAt,
    })),
    devices,
    feedback: user.feedbacks,
    subscriptions,
    payments,
    statistics: {
      responseCount: user.responseCount, chatCount: user.chatCount,
      missionCompletedCount: user.missionCompletedCount,
    },
  };
}

/**
 * GDPR Right to Erasure - Permanently delete all user data
 */
export async function deleteUserGDPR(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user) {
    throw new Error('User not found');
  }

  // Delete all related data in correct order (respecting foreign keys)
  await prisma.$transaction(async (tx) => {
    await tx.message.deleteMany({ where: { senderId: userId } });
    await tx.response.deleteMany({ where: { userId: userId } });
    await tx.story.deleteMany({ where: { userId: userId } });
    await tx.userAchievement.deleteMany({ where: { userId: userId } });
    await tx.notification.deleteMany({ where: { userId: userId } });
    await tx.deviceToken.deleteMany({ where: { userId: userId } });
    await tx.feedback.deleteMany({ where: { userId: userId } });
    await tx.payment.deleteMany({ where: { userId: userId } });
    await tx.subscription.deleteMany({ where: { userId: userId } });
    await tx.referral.updateMany({
      where: { referrerUserId: userId },
      data: { referrerUserId: null },
    });
    await tx.chat.deleteMany({
      where: { OR: [{ user1Id: userId }, { user2Id: userId }] },
    });
    await tx.report.deleteMany({
      where: { OR: [{ reporterId: userId }, { reportedUserId: userId }] },
    });
    await tx.like.deleteMany({
      where: { OR: [{ userId: userId }, { targetUserId: userId }] },
    });
    await tx.follow.deleteMany({
      where: { OR: [{ followerId: userId }, { followingId: userId }] },
    });
    await tx.user.delete({ where: { id: userId } });
  });

  await cacheDel(CacheKey.user(userId));

  return { message: 'User and all related data permanently deleted' };
}
