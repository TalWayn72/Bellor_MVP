/**
 * Demo Data Helper Functions
 * All utility functions for working with demo data
 */
import { DEMO_PREFIX, LEGACY_ID_MAP } from './demoConstants.js';
import { DEMO_USERS } from './demoUsers.js';
import {
  DEMO_RESPONSES, DEMO_STORIES, DEMO_NOTIFICATIONS, DEMO_LIKES,
  DEMO_CHAT_USERS, DEMO_TEMP_CHATS, DEMO_RELATIONSHIPS,
} from './demoContent.js';

/** Resolve legacy demo IDs to standardized IDs */
function resolveLegacyId(userId) {
  return LEGACY_ID_MAP[userId] || userId;
}

/** Check if an ID is a demo user ID */
export function isDemoUser(userId) {
  if (!userId || typeof userId !== 'string') return false;
  return userId.startsWith(DEMO_PREFIX) || userId === 'mock-user';
}

/** Check if any ID is a demo ID (user, chat, response, etc.) */
export function isDemoId(id) {
  if (!id || typeof id !== 'string') return false;
  return id.startsWith(DEMO_PREFIX) || id === 'mock-user';
}

/** Get a demo user by ID */
export function getDemoUser(userId) {
  if (!isDemoUser(userId)) return null;
  const resolvedId = resolveLegacyId(userId);
  const user = DEMO_USERS[resolvedId];
  if (user) return { ...user };
  return {
    id: userId, nickname: 'Demo User', first_name: 'Demo', age: 25,
    gender: 'OTHER', looking_for: ['MALE', 'FEMALE', 'OTHER'],
    location: 'Israel', location_display: 'Israel', bio: 'This is a demo profile',
    interests: [], profile_images: [`https://i.pravatar.cc/400?u=${userId}`],
    main_profile_image_url: `https://i.pravatar.cc/400?u=${userId}`,
    is_verified: false, is_premium: false, is_online: false, onboarding_completed: true,
  };
}

/** Get all demo users */
export function getAllDemoUsers() {
  return Object.values(DEMO_USERS);
}

/** Get demo users for discovery (filtered by preferences) */
export function getDiscoverDemoUsers(filters = {}) {
  let users = getAllDemoUsers();
  if (filters.gender) users = users.filter(u => u.gender === filters.gender);
  if (filters.minAge) users = users.filter(u => u.age >= filters.minAge);
  if (filters.maxAge) users = users.filter(u => u.age <= filters.maxAge);
  return users;
}

/** Get demo responses for feed */
export function getDemoResponses(userId) {
  let responses = DEMO_RESPONSES.map(r => ({ ...r, user: getDemoUser(r.user_id) }));
  if (userId) {
    const resolvedId = resolveLegacyId(userId);
    responses = responses.filter(r => r.user_id === resolvedId);
  }
  return responses;
}

/** Get demo stories */
export function getDemoStories() {
  return DEMO_STORIES.map(s => ({ ...s, user: getDemoUser(s.user_id) }));
}

/** Get demo notifications for a user */
export function getDemoNotifications(currentUserId) {
  return DEMO_NOTIFICATIONS.map(n => ({ ...n, user_id: currentUserId }));
}

/** Get demo likes by type */
export function getDemoLikes(likeType, currentUserId) {
  const likes = DEMO_LIKES[likeType] || [];
  return likes.map(l => ({ ...l, liked_user_id: currentUserId }));
}

/** Get demo chat users for SharedSpace header */
export function getDemoChatUsers() {
  return DEMO_CHAT_USERS.map(c => {
    const user = getDemoUser(c.userId);
    return { ...c, name: user?.nickname, image: user?.profile_images?.[0] };
  });
}

/** Get demo temporary chats */
export function getDemoTempChats(currentUserId) {
  return DEMO_TEMP_CHATS.map(c => {
    const user = getDemoUser(c.user2_id);
    return {
      ...c,
      otherUser: user ? {
        id: user.id, first_name: user.nickname, last_name: '',
        profile_images: user.profile_images || [], is_verified: user.is_verified || false,
      } : null,
    };
  });
}

/** Get demo followers/following */
export function getDemoFollows(userId, type) {
  const resolvedId = resolveLegacyId(userId);
  const relationship = type === 'followers' ? DEMO_RELATIONSHIPS.followers : DEMO_RELATIONSHIPS.follows;
  return relationship[resolvedId] || ['demo-user-1', 'demo-user-2'];
}

/** Create mock chat for demo user */
export function createDemoChat(otherUserId) {
  const resolvedId = resolveLegacyId(otherUserId);
  const user = getDemoUser(resolvedId);
  return {
    id: `demo-chat-${resolvedId}`,
    otherUser: user ? {
      id: user.id, first_name: user.nickname, last_name: '',
      profile_images: user.profile_images || [], is_verified: user.is_verified || false,
    } : { id: resolvedId, first_name: 'User', last_name: '', profile_images: [], is_verified: false },
    messages: [], created_at: new Date().toISOString(), status: 'active', is_temporary: false,
  };
}

/** Get demo messages for a chat (empty for now) */
export function getDemoMessages(chatId) {
  return [];
}

/** Get demo profiles for Discover page */
export function getDemoProfiles() {
  return getAllDemoUsers();
}

/** Get demo analytics data */
export function getDemoAnalytics() {
  return {
    likes: DEMO_LIKES.romantic.concat(DEMO_LIKES.positive),
    chats: DEMO_CHAT_USERS.map(c => ({ id: c.chatId, status: 'active' })),
    responses: DEMO_RESPONSES,
  };
}
