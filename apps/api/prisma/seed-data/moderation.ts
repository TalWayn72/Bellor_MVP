/**
 * Seed Data - Moderation
 * Reports and Feedback for testing admin features
 */

import { ReportReason, ReportStatus, ContentType } from '@prisma/client';

/**
 * Helper to create dates spread over specified days
 */
function getRandomPastDate(daysAgo: number, variance: number = 10): Date {
  const days = daysAgo + Math.random() * variance;
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

/**
 * Reports (15 total)
 * Content types: PROFILE (40%), MESSAGE (30%), RESPONSE (20%), STORY (10%)
 * Status: pending (40%), reviewed (30%), action_taken (30%)
 */
export const demoReports = [
  // Pending reports (6)
  {
    id: 'report-001',
    reporterId: 'demo-user-1',
    reportedUserId: 'demo-user-add-3',
    reportedContentType: ContentType.PROFILE,
    reportedContentId: 'demo-user-add-3',
    reason: ReportReason.FAKE_PROFILE,
    description: 'This profile seems suspicious, no real photos',
    priority: 3,
    status: ReportStatus.PENDING,
    createdAt: getRandomPastDate(5, 2),
  },
  {
    id: 'report-002',
    reporterId: 'demo-user-hebrew-1',
    reportedUserId: 'demo-user-add-8',
    reportedContentType: ContentType.MESSAGE,
    reportedContentId: 'msg-spam-001',
    reason: ReportReason.SPAM,
    description: 'Sending repeated spam messages',
    priority: 2,
    status: ReportStatus.PENDING,
    createdAt: getRandomPastDate(8, 3),
  },
  {
    id: 'report-003',
    reporterId: 'demo-user-en-1',
    reportedUserId: 'demo-user-add-12',
    reportedContentType: ContentType.RESPONSE,
    reportedContentId: 'response-inappropriate-001',
    reason: ReportReason.INAPPROPRIATE_CONTENT,
    description: 'Contains offensive language',
    priority: 2,
    status: ReportStatus.PENDING,
    createdAt: getRandomPastDate(12, 4),
  },
  {
    id: 'report-004',
    reporterId: 'demo-user-en-2',
    reportedUserId: 'demo-user-add-14',
    reportedContentType: ContentType.PROFILE,
    reportedContentId: 'demo-user-add-14',
    reason: ReportReason.UNDERAGE,
    description: 'Profile looks underage, please verify',
    priority: 3,
    status: ReportStatus.PENDING,
    createdAt: getRandomPastDate(3, 1),
  },
  {
    id: 'report-005',
    reporterId: 'demo-user-mixed-1',
    reportedUserId: 'demo-user-add-16',
    reportedContentType: ContentType.MESSAGE,
    reportedContentId: 'msg-harass-001',
    reason: ReportReason.HARASSMENT,
    description: 'Inappropriate and harassing messages',
    priority: 3,
    status: ReportStatus.PENDING,
    createdAt: getRandomPastDate(15, 5),
  },
  {
    id: 'report-006',
    reporterId: 'demo-user-hebrew-2',
    reportedUserId: 'demo-user-add-18',
    reportedContentType: ContentType.STORY,
    reportedContentId: 'story-inappropriate-001',
    reason: ReportReason.INAPPROPRIATE_CONTENT,
    description: 'Inappropriate story content',
    priority: 2,
    status: ReportStatus.PENDING,
    createdAt: getRandomPastDate(7, 2),
  },

  // Reviewed reports (5)
  {
    id: 'report-007',
    reporterId: 'demo-user-2',
    reportedUserId: 'demo-user-add-5',
    reportedContentType: ContentType.PROFILE,
    reportedContentId: 'demo-user-add-5',
    reason: ReportReason.FAKE_PROFILE,
    description: 'Duplicate profile detected',
    priority: 2,
    status: ReportStatus.REVIEWED,
    createdAt: getRandomPastDate(25, 5),
  },
  {
    id: 'report-008',
    reporterId: 'demo-user-hebrew-3',
    reportedUserId: 'demo-user-add-7',
    reportedContentType: ContentType.MESSAGE,
    reportedContentId: 'msg-spam-002',
    reason: ReportReason.SPAM,
    description: 'Promotional spam messages',
    priority: 1,
    status: ReportStatus.REVIEWED,
    createdAt: getRandomPastDate(30, 5),
  },
  {
    id: 'report-009',
    reporterId: 'demo-user-en-3',
    reportedUserId: 'demo-user-add-9',
    reportedContentType: ContentType.RESPONSE,
    reportedContentId: 'response-spam-001',
    reason: ReportReason.SPAM,
    description: 'Spam response with links',
    priority: 1,
    status: ReportStatus.REVIEWED,
    createdAt: getRandomPastDate(35, 5),
  },
  {
    id: 'report-010',
    reporterId: 'demo-user-en-4',
    reportedUserId: 'demo-user-add-11',
    reportedContentType: ContentType.PROFILE,
    reportedContentId: 'demo-user-add-11',
    reason: ReportReason.OTHER,
    description: 'Profile seems incomplete or suspicious',
    priority: 1,
    status: ReportStatus.REVIEWED,
    createdAt: getRandomPastDate(40, 5),
  },
  {
    id: 'report-011',
    reporterId: 'demo-user-mixed-2',
    reportedUserId: 'demo-user-add-13',
    reportedContentType: ContentType.MESSAGE,
    reportedContentId: 'msg-inappropriate-001',
    reason: ReportReason.INAPPROPRIATE_CONTENT,
    description: 'Inappropriate message content',
    priority: 2,
    status: ReportStatus.REVIEWED,
    createdAt: getRandomPastDate(45, 5),
  },

  // Action taken reports (4)
  {
    id: 'report-012',
    reporterId: 'demo-user-hebrew-4',
    reportedUserId: 'demo-user-add-15',
    reportedContentType: ContentType.PROFILE,
    reportedContentId: 'demo-user-add-15',
    reason: ReportReason.HARASSMENT,
    description: 'Harassing behavior towards multiple users',
    priority: 3,
    status: ReportStatus.ACTION_TAKEN,
    createdAt: getRandomPastDate(50, 5),
  },
  {
    id: 'report-013',
    reporterId: 'demo-user-en-5',
    reportedUserId: 'demo-user-add-17',
    reportedContentType: ContentType.MESSAGE,
    reportedContentId: 'msg-harass-002',
    reason: ReportReason.HARASSMENT,
    description: 'Continuous harassment after being asked to stop',
    priority: 3,
    status: ReportStatus.ACTION_TAKEN,
    createdAt: getRandomPastDate(55, 5),
  },
  {
    id: 'report-014',
    reporterId: 'demo-user-hebrew-5',
    reportedUserId: 'demo-user-add-19',
    reportedContentType: ContentType.PROFILE,
    reportedContentId: 'demo-user-add-19',
    reason: ReportReason.FAKE_PROFILE,
    description: 'Confirmed fake profile using stolen photos',
    priority: 3,
    status: ReportStatus.ACTION_TAKEN,
    createdAt: getRandomPastDate(60, 5),
  },
  {
    id: 'report-015',
    reporterId: 'demo-user-add-1',
    reportedUserId: 'demo-user-add-2',
    reportedContentType: ContentType.STORY,
    reportedContentId: 'story-inappropriate-002',
    reason: ReportReason.INAPPROPRIATE_CONTENT,
    description: 'Story contains explicit content',
    priority: 3,
    status: ReportStatus.ACTION_TAKEN,
    createdAt: getRandomPastDate(48, 5),
  },
];

/**
 * Feedback (20 items)
 * Types: improvement (40%), bug (25%), feature (25%), other (10%)
 * Status: pending (60%), reviewed (30%), implemented (10%)
 *
 * Note: Feedback model already created in TASK-048
 */
export const demoFeedback = [
  // Improvement suggestions (8)
  { userId: 'demo-user-1', type: 'improvement', title: 'Better profile discovery', description: 'Add filters for interests and hobbies to discover more compatible matches', rating: 5, status: 'pending', createdAt: getRandomPastDate(10, 5) },
  { userId: 'demo-user-hebrew-1', type: 'improvement', title: 'Hebrew UI improvements', description: 'שיפורים בממשק בעברית - כמה מילים עדיין באנגלית', rating: 4, status: 'pending', createdAt: getRandomPastDate(15, 5) },
  { userId: 'demo-user-en-1', type: 'improvement', title: 'Notification settings', description: 'More granular control over notifications (likes, messages, matches)', rating: 4, status: 'reviewed', createdAt: getRandomPastDate(20, 5) },
  { userId: 'demo-user-en-2', type: 'improvement', title: 'Profile completion indicator', description: 'Show progress bar for profile completion percentage', rating: 3, status: 'implemented', createdAt: getRandomPastDate(80, 10) },
  { userId: 'demo-user-hebrew-2', type: 'improvement', title: 'Chat search', description: 'חיפוש בתוך שיחות - קשה למצוא הודעות ישנות', rating: 5, status: 'pending', createdAt: getRandomPastDate(25, 5) },
  { userId: 'demo-user-mixed-1', type: 'improvement', title: 'Voice message playback speed', description: 'Add playback speed control for voice messages (1.5x, 2x)', rating: 4, status: 'pending', createdAt: getRandomPastDate(30, 5) },
  { userId: 'demo-user-en-3', type: 'improvement', title: 'Block list management', description: 'Better UI for managing blocked users', rating: 3, status: 'reviewed', createdAt: getRandomPastDate(35, 5) },
  { userId: 'demo-user-hebrew-3', type: 'improvement', title: 'Match quality', description: 'שיפור באלגוריתם ההתאמה - יותר מידע על תחומי עניין', rating: 5, status: 'reviewed', createdAt: getRandomPastDate(40, 5) },

  // Bug reports (5)
  { userId: 'demo-user-2', type: 'bug', title: 'App crashes on Android', description: 'App crashes when uploading large images on Android 13', rating: 2, status: 'pending', createdAt: getRandomPastDate(5, 2) },
  { userId: 'demo-user-hebrew-4', type: 'bug', title: 'Push notifications not working', description: 'התראות פוש לא עובדות אחרי העדכון האחרון', rating: 1, status: 'pending', createdAt: getRandomPastDate(8, 3) },
  { userId: 'demo-user-en-4', type: 'bug', title: 'Chat messages not sending', description: 'Messages get stuck on "sending" status sometimes', rating: 2, status: 'reviewed', createdAt: getRandomPastDate(45, 5) },
  { userId: 'demo-user-mixed-2', type: 'bug', title: 'Profile images not loading', description: 'Some profile images fail to load on slow connections', rating: 3, status: 'pending', createdAt: getRandomPastDate(12, 4) },
  { userId: 'demo-user-en-5', type: 'bug', title: 'Video playback issues', description: 'Videos don\'t play on iOS devices', rating: 2, status: 'reviewed', createdAt: getRandomPastDate(50, 5) },

  // Feature requests (5)
  { userId: 'demo-user-hebrew-5', type: 'feature', title: 'Video calls', description: 'שיחות וידאו בתוך האפליקציה', rating: 5, status: 'pending', createdAt: getRandomPastDate(18, 5) },
  { userId: 'demo-user-add-1', type: 'feature', title: 'Group chats', description: 'Support for group conversations with multiple matches', rating: 4, status: 'pending', createdAt: getRandomPastDate(22, 5) },
  { userId: 'demo-user-add-2', type: 'feature', title: 'Virtual events', description: 'אירועים וירטואליים להיכרות קבוצתית', rating: 5, status: 'pending', createdAt: getRandomPastDate(28, 5) },
  { userId: 'demo-user-add-6', type: 'feature', title: 'Icebreaker games', description: 'Built-in icebreaker games to start conversations', rating: 4, status: 'implemented', createdAt: getRandomPastDate(75, 10) },
  { userId: 'demo-user-add-10', type: 'feature', title: 'Location-based matching', description: 'Filter matches by distance/location', rating: 5, status: 'reviewed', createdAt: getRandomPastDate(55, 5) },

  // Other feedback (2)
  { userId: 'demo-user-add-4', type: 'other', title: 'Great app!', description: 'אפליקציה נהדרת, תודה לצוות! כיף להשתמש', rating: 5, status: 'pending', createdAt: getRandomPastDate(6, 2) },
  { userId: 'demo-user-add-12', type: 'other', title: 'Loving the new UI', description: 'The new design is beautiful and much easier to navigate!', rating: 5, status: 'reviewed', createdAt: getRandomPastDate(32, 5) },
];
