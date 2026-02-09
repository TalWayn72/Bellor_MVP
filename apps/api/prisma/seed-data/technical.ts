/**
 * Seed Data - Technical
 * Device tokens, likes, and follows
 */

import { Platform, LikeType } from '@prisma/client';

/**
 * Helper to create dates spread over specified days
 */
function getRandomPastDate(daysAgo: number, variance: number = 10): Date {
  const days = daysAgo + Math.random() * variance;
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

/**
 * Generate random device token
 */
function generateDeviceToken(platform: Platform, userId: string, index: number): string {
  const prefix = platform === Platform.IOS ? 'ios' : platform === Platform.ANDROID ? 'and' : 'web';
  const random = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  return `${prefix}_${userId.substring(0, 12)}_tkn_${index}_${random}`;
}

/**
 * Device Tokens (35 total)
 * Platforms: iOS (50%), Android (45%), Web (5%)
 * Active: 30 (85%), Expired: 5 (15%)
 */
export const demoDeviceTokens = [
  // iOS tokens (18)
  { id: 'dt-001', userId: 'demo-user-1', token: generateDeviceToken(Platform.IOS, 'demo-user-1', 1), platform: Platform.IOS, deviceId: 'iPhone14-001', deviceName: 'iPhone 14 Pro', isActive: true, lastUsedAt: new Date(), createdAt: getRandomPastDate(30, 10) },
  { id: 'dt-002', userId: 'demo-user-hebrew-1', token: generateDeviceToken(Platform.IOS, 'demo-user-hebrew-1', 1), platform: Platform.IOS, deviceId: 'iPhone13-002', deviceName: 'iPhone 13', isActive: true, lastUsedAt: new Date(), createdAt: getRandomPastDate(40, 10) },
  { id: 'dt-003', userId: 'demo-user-2', token: generateDeviceToken(Platform.IOS, 'demo-user-2', 1), platform: Platform.IOS, deviceId: 'iPhone15-003', deviceName: 'iPhone 15', isActive: true, lastUsedAt: new Date(), createdAt: getRandomPastDate(25, 8) },
  { id: 'dt-004', userId: 'demo-user-hebrew-2', token: generateDeviceToken(Platform.IOS, 'demo-user-hebrew-2', 1), platform: Platform.IOS, deviceId: 'iPhone14-004', deviceName: 'iPhone 14', isActive: true, lastUsedAt: new Date(), createdAt: getRandomPastDate(35, 10) },
  { id: 'dt-005', userId: 'demo-user-en-1', token: generateDeviceToken(Platform.IOS, 'demo-user-en-1', 1), platform: Platform.IOS, deviceId: 'iPhone13-005', deviceName: 'iPhone 13 Pro', isActive: true, lastUsedAt: new Date(), createdAt: getRandomPastDate(45, 10) },
  { id: 'dt-006', userId: 'demo-user-en-2', token: generateDeviceToken(Platform.IOS, 'demo-user-en-2', 1), platform: Platform.IOS, deviceId: 'iPhone14-006', deviceName: 'iPhone 14', isActive: true, lastUsedAt: new Date(), createdAt: getRandomPastDate(28, 8) },
  { id: 'dt-007', userId: 'demo-user-hebrew-3', token: generateDeviceToken(Platform.IOS, 'demo-user-hebrew-3', 1), platform: Platform.IOS, deviceId: 'iPhone15-007', deviceName: 'iPhone 15 Pro', isActive: true, lastUsedAt: new Date(), createdAt: getRandomPastDate(32, 8) },
  { id: 'dt-008', userId: 'demo-user-en-3', token: generateDeviceToken(Platform.IOS, 'demo-user-en-3', 1), platform: Platform.IOS, deviceId: 'iPhone13-008', deviceName: 'iPhone 13', isActive: true, lastUsedAt: new Date(), createdAt: getRandomPastDate(38, 10) },
  { id: 'dt-009', userId: 'demo-user-mixed-1', token: generateDeviceToken(Platform.IOS, 'demo-user-mixed-1', 1), platform: Platform.IOS, deviceId: 'iPhone14-009', deviceName: 'iPhone 14 Pro Max', isActive: true, lastUsedAt: new Date(), createdAt: getRandomPastDate(22, 6) },
  { id: 'dt-010', userId: 'demo-user-hebrew-4', token: generateDeviceToken(Platform.IOS, 'demo-user-hebrew-4', 1), platform: Platform.IOS, deviceId: 'iPhone15-010', deviceName: 'iPhone 15', isActive: true, lastUsedAt: new Date(), createdAt: getRandomPastDate(42, 10) },
  { id: 'dt-011', userId: 'demo-user-en-4', token: generateDeviceToken(Platform.IOS, 'demo-user-en-4', 1), platform: Platform.IOS, deviceId: 'iPhone14-011', deviceName: 'iPhone 14', isActive: true, lastUsedAt: new Date(), createdAt: getRandomPastDate(48, 10) },
  { id: 'dt-012', userId: 'demo-user-hebrew-5', token: generateDeviceToken(Platform.IOS, 'demo-user-hebrew-5', 1), platform: Platform.IOS, deviceId: 'iPhone13-012', deviceName: 'iPhone 13 Pro', isActive: true, lastUsedAt: new Date(), createdAt: getRandomPastDate(36, 8) },
  { id: 'dt-013', userId: 'demo-user-en-5', token: generateDeviceToken(Platform.IOS, 'demo-user-en-5', 1), platform: Platform.IOS, deviceId: 'iPhone15-013', deviceName: 'iPhone 15 Pro Max', isActive: true, lastUsedAt: new Date(), createdAt: getRandomPastDate(26, 6) },
  { id: 'dt-014', userId: 'demo-user-mixed-2', token: generateDeviceToken(Platform.IOS, 'demo-user-mixed-2', 1), platform: Platform.IOS, deviceId: 'iPhone14-014', deviceName: 'iPhone 14', isActive: true, lastUsedAt: new Date(), createdAt: getRandomPastDate(44, 10) },
  { id: 'dt-015', userId: 'demo-user-add-1', token: generateDeviceToken(Platform.IOS, 'demo-user-add-1', 1), platform: Platform.IOS, deviceId: 'iPhone13-015', deviceName: 'iPhone 13', isActive: true, lastUsedAt: new Date(), createdAt: getRandomPastDate(50, 10) },
  { id: 'dt-016', userId: 'demo-user-add-2', token: generateDeviceToken(Platform.IOS, 'demo-user-add-2', 1), platform: Platform.IOS, deviceId: 'iPhone15-016', deviceName: 'iPhone 15', isActive: false, lastUsedAt: getRandomPastDate(100, 10), createdAt: getRandomPastDate(120, 10) },
  { id: 'dt-017', userId: 'demo-user-add-6', token: generateDeviceToken(Platform.IOS, 'demo-user-add-6', 1), platform: Platform.IOS, deviceId: 'iPhone14-017', deviceName: 'iPhone 14 Pro', isActive: true, lastUsedAt: new Date(), createdAt: getRandomPastDate(34, 8) },
  { id: 'dt-018', userId: 'demo-user-add-10', token: generateDeviceToken(Platform.IOS, 'demo-user-add-10', 1), platform: Platform.IOS, deviceId: 'iPhone13-018', deviceName: 'iPhone 13 Pro', isActive: true, lastUsedAt: new Date(), createdAt: getRandomPastDate(29, 6) },

  // Android tokens (15)
  { id: 'dt-019', userId: 'demo-user-1', token: generateDeviceToken(Platform.ANDROID, 'demo-user-1', 2), platform: Platform.ANDROID, deviceId: 'Samsung-001', deviceName: 'Samsung Galaxy S23', isActive: true, lastUsedAt: new Date(), createdAt: getRandomPastDate(28, 8) },
  { id: 'dt-020', userId: 'demo-user-hebrew-1', token: generateDeviceToken(Platform.ANDROID, 'demo-user-hebrew-1', 2), platform: Platform.ANDROID, deviceId: 'Pixel-002', deviceName: 'Google Pixel 7', isActive: true, lastUsedAt: new Date(), createdAt: getRandomPastDate(38, 10) },
  { id: 'dt-021', userId: 'demo-user-2', token: generateDeviceToken(Platform.ANDROID, 'demo-user-2', 2), platform: Platform.ANDROID, deviceId: 'Samsung-003', deviceName: 'Samsung Galaxy S22', isActive: true, lastUsedAt: new Date(), createdAt: getRandomPastDate(46, 10) },
  { id: 'dt-022', userId: 'demo-user-hebrew-2', token: generateDeviceToken(Platform.ANDROID, 'demo-user-hebrew-2', 2), platform: Platform.ANDROID, deviceId: 'Pixel-004', deviceName: 'Google Pixel 8', isActive: false, lastUsedAt: getRandomPastDate(95, 10), createdAt: getRandomPastDate(110, 10) },
  { id: 'dt-023', userId: 'demo-user-en-1', token: generateDeviceToken(Platform.ANDROID, 'demo-user-en-1', 2), platform: Platform.ANDROID, deviceId: 'Samsung-005', deviceName: 'Samsung Galaxy S23 Ultra', isActive: true, lastUsedAt: new Date(), createdAt: getRandomPastDate(33, 8) },
  { id: 'dt-024', userId: 'demo-user-en-2', token: generateDeviceToken(Platform.ANDROID, 'demo-user-en-2', 2), platform: Platform.ANDROID, deviceId: 'OnePlus-006', deviceName: 'OnePlus 11', isActive: true, lastUsedAt: new Date(), createdAt: getRandomPastDate(27, 6) },
  { id: 'dt-025', userId: 'demo-user-hebrew-3', token: generateDeviceToken(Platform.ANDROID, 'demo-user-hebrew-3', 2), platform: Platform.ANDROID, deviceId: 'Pixel-007', deviceName: 'Google Pixel 7 Pro', isActive: true, lastUsedAt: new Date(), createdAt: getRandomPastDate(41, 10) },
  { id: 'dt-026', userId: 'demo-user-en-3', token: generateDeviceToken(Platform.ANDROID, 'demo-user-en-3', 2), platform: Platform.ANDROID, deviceId: 'Samsung-008', deviceName: 'Samsung Galaxy A54', isActive: true, lastUsedAt: new Date(), createdAt: getRandomPastDate(52, 10) },
  { id: 'dt-027', userId: 'demo-user-mixed-1', token: generateDeviceToken(Platform.ANDROID, 'demo-user-mixed-1', 2), platform: Platform.ANDROID, deviceId: 'Pixel-009', deviceName: 'Google Pixel 8 Pro', isActive: false, lastUsedAt: getRandomPastDate(105, 10), createdAt: getRandomPastDate(125, 10) },
  { id: 'dt-028', userId: 'demo-user-hebrew-4', token: generateDeviceToken(Platform.ANDROID, 'demo-user-hebrew-4', 2), platform: Platform.ANDROID, deviceId: 'Samsung-010', deviceName: 'Samsung Galaxy S24', isActive: true, lastUsedAt: new Date(), createdAt: getRandomPastDate(24, 6) },
  { id: 'dt-029', userId: 'demo-user-en-4', token: generateDeviceToken(Platform.ANDROID, 'demo-user-en-4', 2), platform: Platform.ANDROID, deviceId: 'OnePlus-011', deviceName: 'OnePlus 12', isActive: true, lastUsedAt: new Date(), createdAt: getRandomPastDate(31, 8) },
  { id: 'dt-030', userId: 'demo-user-hebrew-5', token: generateDeviceToken(Platform.ANDROID, 'demo-user-hebrew-5', 2), platform: Platform.ANDROID, deviceId: 'Pixel-012', deviceName: 'Google Pixel 6', isActive: true, lastUsedAt: new Date(), createdAt: getRandomPastDate(49, 10) },
  { id: 'dt-031', userId: 'demo-user-en-5', token: generateDeviceToken(Platform.ANDROID, 'demo-user-en-5', 2), platform: Platform.ANDROID, deviceId: 'Samsung-013', deviceName: 'Samsung Galaxy Z Fold 5', isActive: true, lastUsedAt: new Date(), createdAt: getRandomPastDate(37, 8) },
  { id: 'dt-032', userId: 'demo-user-mixed-2', token: generateDeviceToken(Platform.ANDROID, 'demo-user-mixed-2', 2), platform: Platform.ANDROID, deviceId: 'Pixel-014', deviceName: 'Google Pixel 7a', isActive: true, lastUsedAt: new Date(), createdAt: getRandomPastDate(43, 10) },
  { id: 'dt-033', userId: 'demo-user-add-4', token: generateDeviceToken(Platform.ANDROID, 'demo-user-add-4', 1), platform: Platform.ANDROID, deviceId: 'Samsung-015', deviceName: 'Samsung Galaxy A34', isActive: false, lastUsedAt: getRandomPastDate(98, 10), createdAt: getRandomPastDate(115, 10) },

  // Web tokens (2)
  { id: 'dt-034', userId: 'demo-user-add-8', token: generateDeviceToken(Platform.WEB, 'demo-user-add-8', 1), platform: Platform.WEB, deviceId: 'Chrome-001', deviceName: 'Chrome on Windows', isActive: true, lastUsedAt: new Date(), createdAt: getRandomPastDate(18, 5) },
  { id: 'dt-035', userId: 'demo-user-add-12', token: generateDeviceToken(Platform.WEB, 'demo-user-add-12', 1), platform: Platform.WEB, deviceId: 'Safari-002', deviceName: 'Safari on Mac', isActive: false, lastUsedAt: getRandomPastDate(92, 10), createdAt: getRandomPastDate(108, 10) },
];

/**
 * Additional Likes (46 new + 14 existing = 60 total)
 * Types: ROMANTIC (70%), POSITIVE (20%), SUPER (10%)
 */
export const demoLikes = [
  // ROMANTIC likes (32)
  { userId: 'demo-user-hebrew-1', targetUserId: 'demo-user-en-2', likeType: LikeType.ROMANTIC, createdAt: getRandomPastDate(45, 10) },
  { userId: 'demo-user-en-2', targetUserId: 'demo-user-hebrew-1', likeType: LikeType.ROMANTIC, createdAt: getRandomPastDate(44, 10) },
  { userId: 'demo-user-hebrew-2', targetUserId: 'demo-user-en-1', likeType: LikeType.ROMANTIC, createdAt: getRandomPastDate(40, 10) },
  { userId: 'demo-user-en-1', targetUserId: 'demo-user-hebrew-2', likeType: LikeType.ROMANTIC, createdAt: getRandomPastDate(39, 10) },
  { userId: 'demo-user-hebrew-3', targetUserId: 'demo-user-mixed-1', likeType: LikeType.ROMANTIC, createdAt: getRandomPastDate(38, 10) },
  { userId: 'demo-user-mixed-1', targetUserId: 'demo-user-hebrew-3', likeType: LikeType.ROMANTIC, createdAt: getRandomPastDate(37, 10) },
  { userId: 'demo-user-en-3', targetUserId: 'demo-user-en-4', likeType: LikeType.ROMANTIC, createdAt: getRandomPastDate(35, 10) },
  { userId: 'demo-user-en-4', targetUserId: 'demo-user-en-3', likeType: LikeType.ROMANTIC, createdAt: getRandomPastDate(34, 10) },
  { userId: 'demo-user-hebrew-4', targetUserId: 'demo-user-en-5', likeType: LikeType.ROMANTIC, createdAt: getRandomPastDate(32, 8) },
  { userId: 'demo-user-en-5', targetUserId: 'demo-user-hebrew-4', likeType: LikeType.ROMANTIC, createdAt: getRandomPastDate(31, 8) },
  { userId: 'demo-user-hebrew-5', targetUserId: 'demo-user-mixed-2', likeType: LikeType.ROMANTIC, createdAt: getRandomPastDate(28, 8) },
  { userId: 'demo-user-mixed-2', targetUserId: 'demo-user-hebrew-5', likeType: LikeType.ROMANTIC, createdAt: getRandomPastDate(27, 8) },
  { userId: 'demo-user-add-1', targetUserId: 'demo-user-add-6', likeType: LikeType.ROMANTIC, createdAt: getRandomPastDate(25, 6) },
  { userId: 'demo-user-add-6', targetUserId: 'demo-user-add-1', likeType: LikeType.ROMANTIC, createdAt: getRandomPastDate(24, 6) },
  { userId: 'demo-user-add-2', targetUserId: 'demo-user-add-10', likeType: LikeType.ROMANTIC, createdAt: getRandomPastDate(22, 6) },
  { userId: 'demo-user-add-10', targetUserId: 'demo-user-add-2', likeType: LikeType.ROMANTIC, createdAt: getRandomPastDate(21, 6) },
  { userId: 'demo-user-1', targetUserId: 'demo-user-add-4', likeType: LikeType.ROMANTIC, createdAt: getRandomPastDate(20, 5) },
  { userId: 'demo-user-2', targetUserId: 'demo-user-add-8', likeType: LikeType.ROMANTIC, createdAt: getRandomPastDate(18, 5) },
  { userId: 'demo-user-add-12', targetUserId: 'demo-user-add-14', likeType: LikeType.ROMANTIC, createdAt: getRandomPastDate(16, 5) },
  { userId: 'demo-user-add-14', targetUserId: 'demo-user-add-12', likeType: LikeType.ROMANTIC, createdAt: getRandomPastDate(15, 5) },
  { userId: 'demo-user-add-16', targetUserId: 'demo-user-add-18', likeType: LikeType.ROMANTIC, createdAt: getRandomPastDate(12, 4) },
  { userId: 'demo-user-add-18', targetUserId: 'demo-user-add-16', likeType: LikeType.ROMANTIC, createdAt: getRandomPastDate(11, 4) },
  { userId: 'demo-user-add-3', targetUserId: 'demo-user-add-5', likeType: LikeType.ROMANTIC, createdAt: getRandomPastDate(10, 4) },
  { userId: 'demo-user-add-5', targetUserId: 'demo-user-add-7', likeType: LikeType.ROMANTIC, createdAt: getRandomPastDate(9, 3) },
  { userId: 'demo-user-add-7', targetUserId: 'demo-user-add-9', likeType: LikeType.ROMANTIC, createdAt: getRandomPastDate(8, 3) },
  { userId: 'demo-user-add-9', targetUserId: 'demo-user-add-11', likeType: LikeType.ROMANTIC, createdAt: getRandomPastDate(7, 3) },
  { userId: 'demo-user-add-11', targetUserId: 'demo-user-add-13', likeType: LikeType.ROMANTIC, createdAt: getRandomPastDate(6, 2) },
  { userId: 'demo-user-add-13', targetUserId: 'demo-user-add-15', likeType: LikeType.ROMANTIC, createdAt: getRandomPastDate(5, 2) },
  { userId: 'demo-user-add-15', targetUserId: 'demo-user-add-17', likeType: LikeType.ROMANTIC, createdAt: getRandomPastDate(4, 2) },
  { userId: 'demo-user-add-17', targetUserId: 'demo-user-add-19', likeType: LikeType.ROMANTIC, createdAt: getRandomPastDate(3, 1) },
  { userId: 'demo-user-add-19', targetUserId: 'demo-user-1', likeType: LikeType.ROMANTIC, createdAt: getRandomPastDate(2, 1) },
  { userId: 'demo-user-mixed-3', targetUserId: 'demo-user-add-1', likeType: LikeType.ROMANTIC, createdAt: getRandomPastDate(1, 0) },

  // POSITIVE likes (9)
  { userId: 'demo-user-1', targetUserId: 'demo-user-2', likeType: LikeType.POSITIVE, createdAt: getRandomPastDate(42, 10) },
  { userId: 'demo-user-hebrew-1', targetUserId: 'demo-user-hebrew-2', likeType: LikeType.POSITIVE, createdAt: getRandomPastDate(36, 8) },
  { userId: 'demo-user-en-1', targetUserId: 'demo-user-en-2', likeType: LikeType.POSITIVE, createdAt: getRandomPastDate(30, 8) },
  { userId: 'demo-user-hebrew-3', targetUserId: 'demo-user-hebrew-4', likeType: LikeType.POSITIVE, createdAt: getRandomPastDate(26, 6) },
  { userId: 'demo-user-en-3', targetUserId: 'demo-user-en-5', likeType: LikeType.POSITIVE, createdAt: getRandomPastDate(23, 6) },
  { userId: 'demo-user-mixed-1', targetUserId: 'demo-user-mixed-2', likeType: LikeType.POSITIVE, createdAt: getRandomPastDate(19, 5) },
  { userId: 'demo-user-add-2', targetUserId: 'demo-user-add-4', likeType: LikeType.POSITIVE, createdAt: getRandomPastDate(14, 4) },
  { userId: 'demo-user-add-6', targetUserId: 'demo-user-add-8', likeType: LikeType.POSITIVE, createdAt: getRandomPastDate(13, 4) },
  { userId: 'demo-user-add-10', targetUserId: 'demo-user-add-12', likeType: LikeType.POSITIVE, createdAt: getRandomPastDate(10, 3) },

  // SUPER likes (5)
  { userId: 'demo-user-1', targetUserId: 'demo-user-hebrew-1', likeType: LikeType.SUPER, createdAt: getRandomPastDate(48, 10) },
  { userId: 'demo-user-en-1', targetUserId: 'demo-user-hebrew-3', likeType: LikeType.SUPER, createdAt: getRandomPastDate(41, 10) },
  { userId: 'demo-user-mixed-1', targetUserId: 'demo-user-en-5', likeType: LikeType.SUPER, createdAt: getRandomPastDate(33, 8) },
  { userId: 'demo-user-add-2', targetUserId: 'demo-user-add-6', likeType: LikeType.SUPER, createdAt: getRandomPastDate(17, 5) },
  { userId: 'demo-user-add-10', targetUserId: 'demo-user-add-1', likeType: LikeType.SUPER, createdAt: getRandomPastDate(11, 4) },
];

/**
 * Follows (40 total)
 */
export const demoFollows = [
  { followerId: 'demo-user-1', followingId: 'demo-user-2', createdAt: getRandomPastDate(50, 10) },
  { followerId: 'demo-user-1', followingId: 'demo-user-hebrew-1', createdAt: getRandomPastDate(48, 10) },
  { followerId: 'demo-user-hebrew-1', followingId: 'demo-user-1', createdAt: getRandomPastDate(47, 10) },
  { followerId: 'demo-user-hebrew-1', followingId: 'demo-user-en-1', createdAt: getRandomPastDate(45, 10) },
  { followerId: 'demo-user-en-1', followingId: 'demo-user-hebrew-1', createdAt: getRandomPastDate(44, 10) },
  { followerId: 'demo-user-2', followingId: 'demo-user-en-2', createdAt: getRandomPastDate(42, 10) },
  { followerId: 'demo-user-en-2', followingId: 'demo-user-2', createdAt: getRandomPastDate(41, 10) },
  { followerId: 'demo-user-hebrew-2', followingId: 'demo-user-en-1', createdAt: getRandomPastDate(40, 10) },
  { followerId: 'demo-user-hebrew-2', followingId: 'demo-user-hebrew-3', createdAt: getRandomPastDate(38, 10) },
  { followerId: 'demo-user-hebrew-3', followingId: 'demo-user-hebrew-2', createdAt: getRandomPastDate(37, 10) },
  { followerId: 'demo-user-en-3', followingId: 'demo-user-en-4', createdAt: getRandomPastDate(35, 8) },
  { followerId: 'demo-user-en-4', followingId: 'demo-user-en-3', createdAt: getRandomPastDate(34, 8) },
  { followerId: 'demo-user-hebrew-4', followingId: 'demo-user-en-5', createdAt: getRandomPastDate(32, 8) },
  { followerId: 'demo-user-en-5', followingId: 'demo-user-hebrew-4', createdAt: getRandomPastDate(31, 8) },
  { followerId: 'demo-user-hebrew-5', followingId: 'demo-user-mixed-1', createdAt: getRandomPastDate(30, 8) },
  { followerId: 'demo-user-mixed-1', followingId: 'demo-user-hebrew-5', createdAt: getRandomPastDate(29, 8) },
  { followerId: 'demo-user-mixed-2', followingId: 'demo-user-mixed-1', createdAt: getRandomPastDate(28, 6) },
  { followerId: 'demo-user-mixed-1', followingId: 'demo-user-mixed-2', createdAt: getRandomPastDate(27, 6) },
  { followerId: 'demo-user-add-1', followingId: 'demo-user-add-2', createdAt: getRandomPastDate(25, 6) },
  { followerId: 'demo-user-add-2', followingId: 'demo-user-add-1', createdAt: getRandomPastDate(24, 6) },
  { followerId: 'demo-user-add-6', followingId: 'demo-user-add-10', createdAt: getRandomPastDate(22, 6) },
  { followerId: 'demo-user-add-10', followingId: 'demo-user-add-6', createdAt: getRandomPastDate(21, 6) },
  { followerId: 'demo-user-add-3', followingId: 'demo-user-add-4', createdAt: getRandomPastDate(20, 5) },
  { followerId: 'demo-user-add-5', followingId: 'demo-user-add-7', createdAt: getRandomPastDate(18, 5) },
  { followerId: 'demo-user-add-7', followingId: 'demo-user-add-9', createdAt: getRandomPastDate(16, 5) },
  { followerId: 'demo-user-add-9', followingId: 'demo-user-add-11', createdAt: getRandomPastDate(14, 4) },
  { followerId: 'demo-user-add-11', followingId: 'demo-user-add-13', createdAt: getRandomPastDate(12, 4) },
  { followerId: 'demo-user-add-13', followingId: 'demo-user-add-15', createdAt: getRandomPastDate(10, 3) },
  { followerId: 'demo-user-add-15', followingId: 'demo-user-add-17', createdAt: getRandomPastDate(8, 3) },
  { followerId: 'demo-user-add-17', followingId: 'demo-user-add-19', createdAt: getRandomPastDate(6, 2) },
  { followerId: 'demo-user-add-19', followingId: 'demo-user-1', createdAt: getRandomPastDate(4, 2) },
  { followerId: 'demo-user-add-4', followingId: 'demo-user-1', createdAt: getRandomPastDate(19, 5) },
  { followerId: 'demo-user-add-8', followingId: 'demo-user-2', createdAt: getRandomPastDate(17, 5) },
  { followerId: 'demo-user-add-12', followingId: 'demo-user-hebrew-1', createdAt: getRandomPastDate(15, 4) },
  { followerId: 'demo-user-add-14', followingId: 'demo-user-en-1', createdAt: getRandomPastDate(13, 4) },
  { followerId: 'demo-user-add-16', followingId: 'demo-user-mixed-1', createdAt: getRandomPastDate(11, 3) },
  { followerId: 'demo-user-add-18', followingId: 'demo-user-hebrew-3', createdAt: getRandomPastDate(9, 3) },
  { followerId: 'demo-user-mixed-3', followingId: 'demo-user-en-2', createdAt: getRandomPastDate(7, 2) },
  { followerId: 'demo-user-1', followingId: 'demo-user-en-3', createdAt: getRandomPastDate(5, 2) },
  { followerId: 'demo-user-hebrew-1', followingId: 'demo-user-add-1', createdAt: getRandomPastDate(3, 1) },
];
