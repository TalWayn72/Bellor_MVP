/**
 * Bellor MVP - Comprehensive Database Seed
 * Creates demo data for all entities so new users see engaging content
 */
import { PrismaClient, ChatStatus, MessageType, ResponseType } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { demoUsersBatch1 } from './seed-data/users-1.js';
import { demoUsersBatch2, cities } from './seed-data/users-2.js';
import { demoUsersBatch3 } from './seed-data/users-3.js';
import { demoMissions, demoAchievements } from './seed-data/content.js';
import { demoResponses, demoStories } from './seed-data/responses-stories.js';
import { demoConversations, chatPairs, likePairs, followPairs, notificationTemplates } from './seed-data/relationships.js';
import { subscriptionPlans, subscriptions, payments, referrals } from './seed-data/financial.js';
import { demoReports, demoFeedback } from './seed-data/moderation.js';
import { demoDeviceTokens, demoLikes, demoFollows } from './seed-data/technical.js';

const prisma = new PrismaClient();
const demoUsers = [...demoUsersBatch1, ...demoUsersBatch2, ...demoUsersBatch3];

async function main() {
  console.log('Starting comprehensive database seed...\n');
  const hashedPassword = await bcrypt.hash('Demo123!', 10);
  const createdUsers: any[] = [];

  console.log('Creating demo users...');
  for (let i = 0; i < demoUsers.length; i++) {
    const userData = demoUsers[i];
    const cityData = cities[i % cities.length];
    const createData: any = {
      ...userData, passwordHash: hashedPassword,
      isVerified: (userData as any).isVerified ?? Math.random() > 0.3,
      isPremium: (userData as any).isPremium ?? Math.random() > 0.7,
      isAdmin: (userData as any).isAdmin ?? false,
      lastActiveAt: new Date(Date.now() - Math.random() * 86400000),
      location: { lat: cityData.lat + (Math.random() - 0.5) * 0.1, lng: cityData.lng + (Math.random() - 0.5) * 0.1, city: cityData.city, country: cityData.country },
      ageRangeMin: 20, ageRangeMax: 40, maxDistance: 50 + Math.floor(Math.random() * 100),
      responseCount: 0, chatCount: 0, missionCompletedCount: 0,
    };
    if (userData.id) createData.id = userData.id;
    const user = await prisma.user.upsert({
      where: { email: userData.email },
      update: { firstName: userData.firstName, lastName: userData.lastName, gender: userData.gender, bio: userData.bio, profileImages: userData.profileImages, lookingFor: userData.lookingFor, isAdmin: (userData as any).isAdmin ?? undefined, lastActiveAt: new Date(Date.now() - Math.random() * 86400000) },
      create: createData,
    });
    createdUsers.push(user);
  }

  console.log('Creating missions & achievements...');
  const createdMissions: any[] = [];
  for (const m of demoMissions) {
    const id = m.title.slice(0, 25).replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
    createdMissions.push(await prisma.mission.upsert({ where: { id }, update: m, create: { id, ...m } }));
  }
  const createdAchievements: any[] = [];
  for (const a of demoAchievements) {
    const id = a.name.replace(/\s/g, '-').toLowerCase();
    createdAchievements.push(await prisma.achievement.upsert({ where: { id }, update: a as any, create: { id, ...a } as any }));
  }

  console.log('Creating chats & messages...');
  for (let i = 0; i < chatPairs.length; i++) {
    const [idx1, idx2] = chatPairs[i];
    const user1 = createdUsers[idx1], user2 = createdUsers[idx2];
    const conversation = demoConversations[i % demoConversations.length];
    let chat = await prisma.chat.findFirst({ where: { OR: [{ user1Id: user1.id, user2Id: user2.id }, { user1Id: user2.id, user2Id: user1.id }] } });
    if (!chat) chat = await prisma.chat.create({ data: { user1Id: user1.id, user2Id: user2.id, status: ChatStatus.ACTIVE, isTemporary: false, isPermanent: true, lastMessageAt: new Date(), messageCount: conversation.messages.length } });
    for (const msg of conversation.messages) {
      const senderId = msg.sender === 0 ? user1.id : user2.id;
      await prisma.message.upsert({ where: { id: `demo-msg-${chat.id}-${msg.delay}` }, update: {}, create: { id: `demo-msg-${chat.id}-${msg.delay}`, chatId: chat.id, senderId, messageType: MessageType.TEXT, content: msg.content, isRead: true, createdAt: new Date(Date.now() - (60 - msg.delay) * 60000) } });
    }
  }

  console.log('Creating responses...');
  for (const resp of demoResponses) {
    const user = createdUsers.find(u => u.id === resp.userId);
    if (!user) continue;
    const mission = resp.missionId ? createdMissions.find(m => m.id === resp.missionId) : createdMissions[Math.floor(Math.random() * createdMissions.length)];
    const respData: any = {
      userId: user.id,
      missionId: mission?.id || createdMissions[0].id,
      responseType: resp.response_type,
      content: resp.content || '',
      isPublic: true,
      viewCount: Math.floor(Math.random() * 80) + 10,
      likeCount: Math.floor(Math.random() * 30) + 5,
      createdAt: resp.created_date || new Date(Date.now() - Math.random() * 14 * 86400000),
    };
    if (resp.text_content) respData.textContent = resp.text_content;
    await prisma.response.upsert({ where: { id: `demo-response-${user.id}-${Math.random().toString(36).substring(7)}` }, update: {}, create: { id: `demo-response-${user.id}-${Math.random().toString(36).substring(7)}`, ...respData } });
  }
  for (const user of createdUsers) {
    const count = await prisma.response.count({ where: { userId: user.id } });
    await prisma.user.update({ where: { id: user.id }, data: { responseCount: count } });
  }

  console.log('Creating stories...');
  for (const story of demoStories) {
    const user = createdUsers.find(u => u.id === story.userId);
    if (!user) continue;
    const storyData: any = {
      userId: user.id,
      mediaType: story.content_type,
      mediaUrl: story.content,
      caption: story.caption || '',
      viewCount: Math.floor(Math.random() * 50) + 5,
      createdAt: story.created_date || new Date(Date.now() - Math.random() * 12 * 3600000),
      expiresAt: story.expiresAt || new Date(Date.now() + (12 + Math.random() * 12) * 3600000),
    };
    await prisma.story.upsert({ where: { id: `demo-story-${user.id}-${Math.random().toString(36).substring(7)}` }, update: storyData, create: { id: `demo-story-${user.id}-${Math.random().toString(36).substring(7)}`, ...storyData } });
  }

  console.log('Creating likes...');
  for (const [fromIdx, toIdx, likeType] of likePairs) {
    const fromUser = createdUsers[fromIdx], toUser = createdUsers[toIdx];
    const existing = await prisma.like.findFirst({ where: { userId: fromUser.id, targetUserId: toUser.id } });
    if (!existing) await prisma.like.create({ data: { userId: fromUser.id, targetUserId: toUser.id, likeType: likeType as any, createdAt: new Date(Date.now() - Math.random() * 7 * 86400000) } });
  }

  console.log('Creating follows...');
  for (const [fromIdx, toIdx] of followPairs) {
    const follower = createdUsers[fromIdx], following = createdUsers[toIdx];
    const existing = await prisma.follow.findFirst({ where: { followerId: follower.id, followingId: following.id } });
    if (!existing) await prisma.follow.create({ data: { followerId: follower.id, followingId: following.id, createdAt: new Date(Date.now() - Math.random() * 14 * 86400000) } });
  }

  console.log('Creating notifications...');
  for (let i = 0; i < Math.min(8, createdUsers.length); i++) {
    const user = createdUsers[i];
    for (let j = 0; j < 1 + Math.floor(Math.random() * 3); j++) {
      const t = notificationTemplates[(i + j) % notificationTemplates.length];
      const other = createdUsers[(i + j + 1) % createdUsers.length];
      const message = t.message.replace('{name}', other.firstName.replace('Demo_', '')).replace('{achievement}', 'First Response');
      await prisma.notification.upsert({ where: { id: `demo-notif-${user.id}-${j}` }, update: {}, create: { id: `demo-notif-${user.id}-${j}`, userId: user.id, type: t.type as any, title: t.title, message, isRead: Math.random() > 0.5, createdAt: new Date(Date.now() - Math.random() * 3 * 86400000) } });
    }
  }

  console.log('Unlocking achievements...');
  for (const user of createdUsers) {
    for (let j = 0; j < 1 + Math.floor(Math.random() * 4) && j < createdAchievements.length; j++) {
      await prisma.userAchievement.upsert({ where: { userId_achievementId: { userId: user.id, achievementId: createdAchievements[j].id } }, update: {}, create: { userId: user.id, achievementId: createdAchievements[j].id, unlockedAt: new Date(Date.now() - Math.random() * 30 * 86400000) } });
    }
  }

  console.log('Creating subscription plans...');
  for (const plan of subscriptionPlans) {
    await prisma.subscriptionPlan.upsert({ where: { id: plan.id }, update: plan as any, create: plan as any });
  }

  console.log('Creating subscriptions & payments...');
  for (const sub of subscriptions) {
    await prisma.subscription.upsert({ where: { id: sub.id }, update: sub as any, create: sub as any });
  }
  for (const payment of payments) {
    await prisma.payment.upsert({ where: { id: payment.id }, update: payment as any, create: payment as any });
  }

  console.log('Creating referrals...');
  for (const ref of referrals) {
    await prisma.referral.upsert({ where: { id: ref.id }, update: ref as any, create: ref as any });
  }

  console.log('Creating reports & feedback...');
  for (const report of demoReports) {
    await prisma.report.upsert({ where: { id: report.id }, update: report as any, create: report as any });
  }
  for (const feedback of demoFeedback) {
    await prisma.feedback.upsert({ where: { id: `feedback-${feedback.userId}-${Date.now()}-${Math.random().toString(36).substring(7)}` }, update: {}, create: { id: `feedback-${feedback.userId}-${Date.now()}-${Math.random().toString(36).substring(7)}`, ...feedback as any } });
  }

  console.log('Creating device tokens...');
  for (const token of demoDeviceTokens) {
    await prisma.deviceToken.upsert({ where: { id: token.id }, update: token as any, create: token as any });
  }

  console.log('Creating additional likes & follows...');
  for (const like of demoLikes) {
    const existing = await prisma.like.findFirst({ where: { userId: like.userId, targetUserId: like.targetUserId } });
    if (!existing) await prisma.like.create({ data: like as any });
  }
  for (const follow of demoFollows) {
    const existing = await prisma.follow.findFirst({ where: { followerId: follow.followerId, followingId: follow.followingId } });
    if (!existing) await prisma.follow.create({ data: follow as any });
  }

  console.log('Updating user statistics...');
  for (const user of createdUsers) {
    const chatCount = await prisma.chat.count({ where: { OR: [{ user1Id: user.id }, { user2Id: user.id }] } });
    const missionCount = await prisma.response.count({ where: { userId: user.id } });
    await prisma.user.update({ where: { id: user.id }, data: { chatCount, missionCompletedCount: missionCount } });
  }

  console.log('\n========================================');
  console.log('SEED COMPLETED SUCCESSFULLY!');
  console.log('========================================');
  console.log(`Users: ${createdUsers.length} (18 original + ${demoUsersBatch3.length} new)`);
  console.log(`Missions: ${createdMissions.length} | Achievements: ${createdAchievements.length}`);
  console.log(`Responses: ${demoResponses.length} | Stories: ${demoStories.length}`);
  console.log(`Chats: ${chatPairs.length} | Likes: ${likePairs.length + demoLikes.length} | Follows: ${followPairs.length + demoFollows.length}`);
  console.log(`Subscriptions: ${subscriptions.length} | Payments: ${payments.length}`);
  console.log(`Referrals: ${referrals.length} | Device Tokens: ${demoDeviceTokens.length}`);
  console.log(`Reports: ${demoReports.length} | Feedback: ${demoFeedback.length}`);
  console.log('========================================');
  console.log('Demo Login: any demo email with password Demo123!');
  console.log('Admin Login: admin@bellor.app with password Demo123!');
  console.log('========================================');
}

main()
  .catch((e) => { console.error('Error during seed:', e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
