/**
 * Seed Data - Responses and Stories
 * User-generated content for missions and stories
 */

import { ResponseType, MediaType } from '@prisma/client';

/**
 * Helper to create dates spread over specified days
 */
function getRandomPastDate(daysAgo: number, variance: number = 5): Date {
  const days = daysAgo + Math.random() * variance;
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

/**
 * Response data with variety of content types
 * TEXT (50%), VOICE (25%), VIDEO (15%), DRAWING (10%)
 */
export const demoResponses = [
  // TEXT responses (15)
  { userId: 'demo-user-1', missionId: null, achievementId: null, response_type: ResponseType.TEXT, text_content: 'My perfect day would start with sunrise yoga on the beach, followed by a homemade brunch. Then exploring a new hiking trail and ending with stargazing!', content: '', created_date: getRandomPastDate(45, 10) },
  { userId: 'demo-user-hebrew-1', missionId: null, achievementId: null, response_type: ResponseType.TEXT, text_content: 'היום המושלם שלי יתחיל עם קפה טוב, טיול בטבע, ארוחת ערב עם חברים, והרבה שמחה!', content: '', created_date: getRandomPastDate(40, 10) },
  { userId: 'demo-user-2', missionId: null, achievementId: null, response_type: ResponseType.TEXT, text_content: 'I wake up at 6am, do 20 minutes of meditation, make my favorite coffee, and journal. It sets such a positive tone for the day!', content: '', created_date: getRandomPastDate(35, 10) },
  { userId: 'demo-user-hebrew-2', missionId: null, achievementId: null, response_type: ResponseType.TEXT, text_content: 'השגרה שלי: אימון בוקר, קפה חזק, ו-15 דקות מדיטציה. מתחיל את היום נכון!', content: '', created_date: getRandomPastDate(30, 10) },
  { userId: 'demo-user-en-1', missionId: null, achievementId: null, response_type: ResponseType.TEXT, text_content: "Not many people know this, but I can solve a Rubik's cube in under 2 minutes! Started learning during quarantine.", content: '', created_date: getRandomPastDate(25, 10) },
  { userId: 'demo-user-en-2', missionId: null, achievementId: null, response_type: ResponseType.TEXT, text_content: 'My favorite travel memory is watching the northern lights in Iceland. The colors dancing across the sky was absolutely magical.', content: '', created_date: getRandomPastDate(20, 10) },
  { userId: 'demo-user-hebrew-3', missionId: null, achievementId: null, response_type: ResponseType.TEXT, text_content: 'הזיכרון האהוב עלי מטיול - שקיעה באיים היווניים. פשוט קסום!', content: '', created_date: getRandomPastDate(18, 8) },
  { userId: 'demo-user-en-3', missionId: null, achievementId: null, response_type: ResponseType.TEXT, text_content: 'Just made homemade pasta from scratch for the first time! It was easier than I thought and so delicious.', content: '', created_date: getRandomPastDate(15, 8) },
  { userId: 'demo-user-mixed-1', missionId: null, achievementId: null, response_type: ResponseType.TEXT, text_content: 'Two truths and a lie: I can speak 4 languages, I have a pilot license, I once swam with sharks. Guess which is the lie!', content: '', created_date: getRandomPastDate(12, 6) },
  { userId: 'demo-user-hebrew-4', missionId: null, achievementId: null, response_type: ResponseType.TEXT, text_content: 'רשימת המשאלות שלי: 1) לטייל בדרום אמריקה 2) ללמוד לצלול 3) לכתוב ספר', content: '', created_date: getRandomPastDate(10, 5) },
  { userId: 'demo-user-en-4', missionId: null, achievementId: null, response_type: ResponseType.TEXT, text_content: 'Bucket list top 3: 1) Northern lights in Norway, 2) Hike the Inca trail, 3) Learn to surf in Bali', content: '', created_date: getRandomPastDate(8, 4) },
  { userId: 'demo-user-hebrew-5', missionId: null, achievementId: null, response_type: ResponseType.TEXT, text_content: 'הכי אהבתי לראות את הזריחה מהר סיני. רגע של שקט ויופי פשוט מדהים', content: '', created_date: getRandomPastDate(6, 3) },
  { userId: 'demo-user-en-5', missionId: null, achievementId: null, response_type: ResponseType.TEXT, text_content: 'Morning routine: 5am wake up, cold shower, 30 min run, healthy smoothie. Changed my life!', content: '', created_date: getRandomPastDate(5, 2) },
  { userId: 'demo-user-mixed-2', missionId: null, achievementId: null, response_type: ResponseType.TEXT, text_content: 'Today I feel like a calm ocean - peaceful but full of depth. Drew a watercolor to express it.', content: '', created_date: getRandomPastDate(3, 2) },
  { userId: 'demo-user-add-1', missionId: null, achievementId: null, response_type: ResponseType.TEXT, text_content: 'My favorite dish: a homemade mushroom risotto. My grandmother\'s recipe!', content: '', created_date: getRandomPastDate(2, 1) },

  // VOICE responses (8)
  { userId: 'demo-user-1', missionId: null, achievementId: null, response_type: ResponseType.VOICE, text_content: '', content: 'https://bellor-demo.s3.amazonaws.com/voice/response-voice-001.mp3', created_date: getRandomPastDate(42, 10) },
  { userId: 'demo-user-hebrew-1', missionId: null, achievementId: null, response_type: ResponseType.VOICE, text_content: '', content: 'https://bellor-demo.s3.amazonaws.com/voice/response-voice-002.mp3', created_date: getRandomPastDate(38, 10) },
  { userId: 'demo-user-2', missionId: null, achievementId: null, response_type: ResponseType.VOICE, text_content: '', content: 'https://bellor-demo.s3.amazonaws.com/voice/response-voice-003.mp3', created_date: getRandomPastDate(32, 8) },
  { userId: 'demo-user-en-1', missionId: null, achievementId: null, response_type: ResponseType.VOICE, text_content: '', content: 'https://bellor-demo.s3.amazonaws.com/voice/response-voice-004.mp3', created_date: getRandomPastDate(28, 8) },
  { userId: 'demo-user-hebrew-2', missionId: null, achievementId: null, response_type: ResponseType.VOICE, text_content: '', content: 'https://bellor-demo.s3.amazonaws.com/voice/response-voice-005.mp3', created_date: getRandomPastDate(22, 6) },
  { userId: 'demo-user-en-2', missionId: null, achievementId: null, response_type: ResponseType.VOICE, text_content: '', content: 'https://bellor-demo.s3.amazonaws.com/voice/response-voice-006.mp3', created_date: getRandomPastDate(16, 6) },
  { userId: 'demo-user-mixed-1', missionId: null, achievementId: null, response_type: ResponseType.VOICE, text_content: '', content: 'https://bellor-demo.s3.amazonaws.com/voice/response-voice-007.mp3', created_date: getRandomPastDate(11, 4) },
  { userId: 'demo-user-hebrew-3', missionId: null, achievementId: null, response_type: ResponseType.VOICE, text_content: '', content: 'https://bellor-demo.s3.amazonaws.com/voice/response-voice-008.mp3', created_date: getRandomPastDate(7, 3) },

  // VIDEO responses (5)
  { userId: 'demo-user-1', missionId: null, achievementId: null, response_type: ResponseType.VIDEO, text_content: '', content: 'https://bellor-demo.s3.amazonaws.com/video/response-video-001.mp4', created_date: getRandomPastDate(44, 10) },
  { userId: 'demo-user-en-1', missionId: null, achievementId: null, response_type: ResponseType.VIDEO, text_content: '', content: 'https://bellor-demo.s3.amazonaws.com/video/response-video-002.mp4', created_date: getRandomPastDate(36, 8) },
  { userId: 'demo-user-hebrew-1', missionId: null, achievementId: null, response_type: ResponseType.VIDEO, text_content: '', content: 'https://bellor-demo.s3.amazonaws.com/video/response-video-003.mp4', created_date: getRandomPastDate(26, 8) },
  { userId: 'demo-user-en-2', missionId: null, achievementId: null, response_type: ResponseType.VIDEO, text_content: '', content: 'https://bellor-demo.s3.amazonaws.com/video/response-video-004.mp4', created_date: getRandomPastDate(19, 6) },
  { userId: 'demo-user-mixed-1', missionId: null, achievementId: null, response_type: ResponseType.VIDEO, text_content: '', content: 'https://bellor-demo.s3.amazonaws.com/video/response-video-005.mp4', created_date: getRandomPastDate(13, 5) },

  // DRAWING responses (3)
  { userId: 'demo-user-2', missionId: null, achievementId: null, response_type: ResponseType.DRAWING, text_content: '', content: 'https://bellor-demo.s3.amazonaws.com/drawings/response-drawing-001.png', created_date: getRandomPastDate(39, 10) },
  { userId: 'demo-user-hebrew-2', missionId: null, achievementId: null, response_type: ResponseType.DRAWING, text_content: '', content: 'https://bellor-demo.s3.amazonaws.com/drawings/response-drawing-002.png', created_date: getRandomPastDate(27, 8) },
  { userId: 'demo-user-en-3', missionId: null, achievementId: null, response_type: ResponseType.DRAWING, text_content: '', content: 'https://bellor-demo.s3.amazonaws.com/drawings/response-drawing-003.png', created_date: getRandomPastDate(14, 6) },
];

/**
 * Stories - 15 stories across 10 users
 * Content types: IMAGE (60%), VIDEO (40%)
 * Note: No TEXT type - using IMAGE with text in caption
 */
export const demoStories = [
  // IMAGE stories with text captions (6)
  { userId: 'demo-user-1', content_type: MediaType.IMAGE, content: 'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?w=600', caption: 'Just finished an amazing workout! Feeling energized for the day 💪', expiresAt: new Date(Date.now() + 12 * 60 * 60 * 1000), created_date: getRandomPastDate(0, 0) },
  { userId: 'demo-user-hebrew-1', content_type: MediaType.IMAGE, content: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=600', caption: 'קפה בוקר מושלם ☕️ יום טוב!', expiresAt: new Date(Date.now() + 18 * 60 * 60 * 1000), created_date: getRandomPastDate(0, 0) },
  { userId: 'demo-user-en-1', content_type: MediaType.IMAGE, content: 'https://images.unsplash.com/photo-1533910534207-90f31029a78e?w=600', caption: 'Weekend vibes! Who wants to grab brunch? 🥞', expiresAt: new Date(Date.now() + 15 * 60 * 60 * 1000), created_date: getRandomPastDate(0, 0) },
  { userId: 'demo-user-hebrew-2', content_type: MediaType.IMAGE, content: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600', caption: 'הגעתי לחדר הכושר! מי איתי? 🏋️', expiresAt: new Date(Date.now() + 10 * 60 * 60 * 1000), created_date: getRandomPastDate(0, 0) },
  { userId: 'demo-user-mixed-1', content_type: MediaType.IMAGE, content: 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=600', caption: 'New city, new adventures! Tel Aviv here I come 🌆', expiresAt: new Date(Date.now() + 20 * 60 * 60 * 1000), created_date: getRandomPastDate(0, 0) },
  { userId: 'demo-user-en-2', content_type: MediaType.IMAGE, content: 'https://images.unsplash.com/photo-1504805572947-34fad45aed93?w=600', caption: 'Coding session with coffee ☕️💻 Living the dream!', expiresAt: new Date(Date.now() + 14 * 60 * 60 * 1000), created_date: getRandomPastDate(0, 0) },

  // IMAGE stories (6)
  { userId: 'demo-user-2', content_type: MediaType.IMAGE, content: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600', caption: 'Morning hike views', expiresAt: new Date(Date.now() + 16 * 60 * 60 * 1000), created_date: getRandomPastDate(0, 0) },
  { userId: 'demo-user-hebrew-3', content_type: MediaType.IMAGE, content: 'https://images.unsplash.com/photo-1493770348161-369560ae357d?w=600', caption: 'ארוחת בוקר מושלמת!', expiresAt: new Date(Date.now() + 11 * 60 * 60 * 1000), created_date: getRandomPastDate(0, 0) },
  { userId: 'demo-user-en-3', content_type: MediaType.IMAGE, content: 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=600', caption: 'Weekend camping', expiresAt: new Date(Date.now() + 19 * 60 * 60 * 1000), created_date: getRandomPastDate(0, 0) },
  { userId: 'demo-user-hebrew-4', content_type: MediaType.IMAGE, content: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600', caption: 'ערב עם חברים', expiresAt: new Date(Date.now() + 13 * 60 * 60 * 1000), created_date: getRandomPastDate(0, 0) },
  { userId: 'demo-user-en-4', content_type: MediaType.IMAGE, content: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600', caption: 'Pizza night!', expiresAt: new Date(Date.now() + 17 * 60 * 60 * 1000), created_date: getRandomPastDate(0, 0) },
  { userId: 'demo-user-mixed-2', content_type: MediaType.IMAGE, content: 'https://images.unsplash.com/photo-1552733407-5d5c46c3bb3b?w=600', caption: 'Beach day', expiresAt: new Date(Date.now() + 21 * 60 * 60 * 1000), created_date: getRandomPastDate(0, 0) },

  // VIDEO stories (3)
  { userId: 'demo-user-hebrew-5', content_type: MediaType.VIDEO, content: 'https://bellor-demo.s3.amazonaws.com/stories/story-video-001.mp4', caption: 'רגע של שקט', expiresAt: new Date(Date.now() + 22 * 60 * 60 * 1000), created_date: getRandomPastDate(0, 0) },
  { userId: 'demo-user-en-5', content_type: MediaType.VIDEO, content: 'https://bellor-demo.s3.amazonaws.com/stories/story-video-002.mp4', caption: 'Sunset yoga', expiresAt: new Date(Date.now() + 9 * 60 * 60 * 1000), created_date: getRandomPastDate(0, 0) },
  { userId: 'demo-user-add-1', content_type: MediaType.VIDEO, content: 'https://bellor-demo.s3.amazonaws.com/stories/story-video-003.mp4', caption: 'Quick workout tip!', expiresAt: new Date(Date.now() + 23 * 60 * 60 * 1000), created_date: getRandomPastDate(0, 0) },
];
