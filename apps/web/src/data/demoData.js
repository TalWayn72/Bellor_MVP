/**
 * Centralized Demo Data Module - Barrel re-export
 * Single source of truth for all demo/mock data in the application
 * All imports from '@/data/demoData' continue to work unchanged.
 */
export { DEMO_PREFIX, DEMO_IMAGES, LEGACY_ID_MAP } from './demo/demoConstants.js';
export { DEMO_USERS } from './demo/demoUsers.js';
export {
  DEMO_RESPONSES, DEMO_STORIES, DEMO_NOTIFICATIONS, DEMO_LIKES,
  DEMO_CHAT_USERS, DEMO_TEMP_CHATS, DEMO_RELATIONSHIPS,
} from './demo/demoContent.js';
export {
  isDemoUser, isDemoId, getDemoUser, getAllDemoUsers, getDiscoverDemoUsers,
  getDemoResponses, getDemoStories, getDemoNotifications, getDemoLikes,
  getDemoChatUsers, getDemoTempChats, getDemoFollows, createDemoChat,
  getDemoMessages, getDemoProfiles, getDemoAnalytics,
} from './demo/demoHelpers.js';
