/**
 * Centralized Demo Data Module
 * Single source of truth for all demo/mock data in the application
 */

// ========== CONSTANTS ==========
const DEMO_PREFIX = 'demo-';

// Unsplash image URLs for demo users
const DEMO_IMAGES = {
  sarah: [
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400',
    'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400',
  ],
  david: [
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400',
  ],
  michael: [
    'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400',
    'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400',
  ],
  maria: [
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400',
    'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400',
  ],
  alex: [
    'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400',
    'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400',
  ],
};

// ========== DEMO USERS ==========
export const DEMO_USERS = {
  'demo-user-1': {
    id: 'demo-user-1',
    nickname: 'Sarah',
    first_name: 'Sarah',
    age: 28,
    gender: 'FEMALE',
    looking_for: ['MALE'],
    location: 'Tel Aviv',
    location_display: 'Tel Aviv, Israel',
    bio: 'Creative soul who loves art, music, and spontaneous adventures. Looking for someone to explore the world with.',
    bio_he: 'נשמה יצירתית שאוהבת אומנות, מוזיקה והרפתקאות ספונטניות. מחפשת מישהו לחקור איתו את העולם.',
    interests: ['Art', 'Music', 'Travel', 'Photography'],
    profile_images: DEMO_IMAGES.sarah,
    main_profile_image_url: DEMO_IMAGES.sarah[0],
    is_verified: true,
    is_premium: false,
    is_online: true,
    occupation: 'Graphic Designer',
    education: 'Bezalel Academy of Arts',
    onboarding_completed: true,
    created_at: '2024-01-15T10:00:00Z',
    last_active_at: new Date().toISOString(),
  },
  'demo-user-2': {
    id: 'demo-user-2',
    nickname: 'David',
    first_name: 'David',
    age: 31,
    gender: 'MALE',
    looking_for: ['FEMALE'],
    location: 'Jerusalem',
    location_display: 'Jerusalem, Israel',
    bio: 'Tech enthusiast by day, amateur chef by night. Love hiking and discovering hidden gems in the city.',
    bio_he: 'חובב טכנולוגיה ביום, שף חובב בלילה. אוהב טיולים וגילוי מקומות נסתרים בעיר.',
    interests: ['Technology', 'Cooking', 'Hiking', 'History'],
    profile_images: DEMO_IMAGES.david,
    main_profile_image_url: DEMO_IMAGES.david[0],
    is_verified: true,
    is_premium: true,
    is_online: false,
    occupation: 'Software Engineer',
    education: 'Hebrew University',
    onboarding_completed: true,
    created_at: '2024-02-01T14:30:00Z',
    last_active_at: new Date(Date.now() - 3600000).toISOString(),
  },
  'demo-user-3': {
    id: 'demo-user-3',
    nickname: 'Michael',
    first_name: 'Michael',
    age: 26,
    gender: 'MALE',
    looking_for: ['FEMALE', 'OTHER'],
    location: 'Haifa',
    location_display: 'Haifa, Israel',
    bio: 'Fitness enthusiast and nature lover. Always up for a beach day or mountain hike.',
    bio_he: 'חובב כושר ואוהב טבע. תמיד מוכן ליום חוף או טיול הרים.',
    interests: ['Fitness', 'Nature', 'Sports', 'Movies'],
    profile_images: DEMO_IMAGES.michael,
    main_profile_image_url: DEMO_IMAGES.michael[0],
    is_verified: false,
    is_premium: false,
    is_online: true,
    occupation: 'Personal Trainer',
    education: 'Wingate Institute',
    onboarding_completed: true,
    created_at: '2024-01-20T09:15:00Z',
    last_active_at: new Date().toISOString(),
  },
  'demo-user-4': {
    id: 'demo-user-4',
    nickname: 'Maria',
    first_name: 'Maria',
    age: 24,
    gender: 'FEMALE',
    looking_for: ['MALE'],
    location: 'Beer Sheva',
    location_display: 'Beer Sheva, Israel',
    bio: 'Medical student with a passion for dance and good coffee. Looking for meaningful connections.',
    bio_he: 'סטודנטית לרפואה עם תשוקה לריקוד וקפה טוב. מחפשת קשרים משמעותיים.',
    interests: ['Dance', 'Medicine', 'Coffee', 'Reading'],
    profile_images: DEMO_IMAGES.maria,
    main_profile_image_url: DEMO_IMAGES.maria[0],
    is_verified: true,
    is_premium: false,
    is_online: false,
    occupation: 'Medical Student',
    education: 'Ben-Gurion University',
    onboarding_completed: true,
    created_at: '2024-03-05T11:45:00Z',
    last_active_at: new Date(Date.now() - 7200000).toISOString(),
  },
  'demo-user-5': {
    id: 'demo-user-5',
    nickname: 'Alex',
    first_name: 'Alex',
    age: 29,
    gender: 'OTHER',
    looking_for: ['MALE', 'FEMALE', 'OTHER'],
    location: 'Eilat',
    location_display: 'Eilat, Israel',
    bio: 'Free spirit and diving instructor. The ocean is my happy place.',
    bio_he: 'נשמה חופשית ומדריך צלילה. הים הוא המקום המאושר שלי.',
    interests: ['Diving', 'Travel', 'Yoga', 'Music'],
    profile_images: DEMO_IMAGES.alex,
    main_profile_image_url: DEMO_IMAGES.alex[0],
    is_verified: true,
    is_premium: true,
    is_online: true,
    occupation: 'Diving Instructor',
    education: 'Self-taught',
    onboarding_completed: true,
    created_at: '2024-02-15T16:20:00Z',
    last_active_at: new Date().toISOString(),
  },
};

// Legacy ID mapping - map old IDs to standardized IDs
const LEGACY_ID_MAP = {
  'demo-match-user-1-romantic': 'demo-user-1',
  'demo-match-user-1-positive': 'demo-user-3',
  'demo-match-user-2-positive': 'demo-user-4',
  'demo-match-user-3-super': 'demo-user-2',
  'demo-story-user-1': 'demo-user-1',
  'demo-story-user-2': 'demo-user-2',
  'demo-discover-1': 'demo-user-1',
  'demo-discover-2': 'demo-user-2',
  'demo-follower-user-1': 'demo-user-1',
  'demo-following-user-1': 'demo-user-2',
  'mock-user': 'demo-user-1',
};

// ========== DEMO RESPONSES (Feed Posts) ==========
export const DEMO_RESPONSES = [
  {
    id: 'demo-response-1',
    user_id: 'demo-user-1',
    mission_id: 'demo-mission-1',
    response_type: 'text',
    text_content: 'My perfect day would start with sunrise yoga on the beach, followed by a cozy brunch with friends. How would yours look?',
    text_content_he: 'היום המושלם שלי יתחיל עם יוגה בזריחה על החוף, ואחר כך ארוחת בוקר נעימה עם חברים. איך נראה היום המושלם שלכם?',
    is_public: true,
    likes_count: 24,
    comments_count: 5,
    hashtags: ['perfectday', 'beach', 'yoga'],
    created_date: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'demo-response-2',
    user_id: 'demo-user-2',
    mission_id: 'demo-mission-1',
    response_type: 'text',
    text_content: 'If I could have dinner with anyone, it would be my grandmother. She passed when I was young, and I have so many questions about our family history.',
    text_content_he: 'אם יכולתי לאכול ארוחת ערב עם מישהו, זו הייתה סבתא שלי. היא נפטרה כשהייתי צעיר, ויש לי כל כך הרבה שאלות על ההיסטוריה המשפחתית שלנו.',
    is_public: true,
    likes_count: 42,
    comments_count: 12,
    hashtags: ['family', 'memories', 'connection'],
    created_date: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'demo-response-3',
    user_id: 'demo-user-3',
    mission_id: 'demo-mission-2',
    response_type: 'text',
    text_content: 'Just finished a 10km run and feeling amazing! There is nothing like the endorphin rush after a good workout.',
    text_content_he: 'סיימתי עכשיו ריצה של 10 ק"מ ומרגיש מדהים! אין כמו האנדורפינים אחרי אימון טוב.',
    is_public: true,
    likes_count: 18,
    comments_count: 3,
    hashtags: ['fitness', 'running', 'motivation'],
    created_date: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'demo-response-4',
    user_id: 'demo-user-4',
    mission_id: 'demo-mission-2',
    response_type: 'text',
    text_content: 'Currently studying for my anatomy exam while drinking my third coffee. Med school life!',
    text_content_he: 'לומדת כרגע למבחן אנטומיה תוך כדי שתיית הקפה השלישי שלי. חיי סטודנטית לרפואה!',
    is_public: true,
    likes_count: 31,
    comments_count: 8,
    hashtags: ['medschool', 'studying', 'coffee'],
    created_date: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'demo-response-5',
    user_id: 'demo-user-5',
    mission_id: 'demo-mission-1',
    response_type: 'text',
    text_content: 'Just saw a sea turtle during my dive today. These moments remind me why I chose this life.',
    text_content_he: 'ראיתי היום צב ים במהלך הצלילה. הרגעים האלה מזכירים לי למה בחרתי בחיים האלה.',
    is_public: true,
    likes_count: 56,
    comments_count: 15,
    hashtags: ['diving', 'nature', 'ocean'],
    created_date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  },
];

// ========== DEMO STORIES ==========
export const DEMO_STORIES = [
  {
    id: 'demo-story-1',
    user_id: 'demo-user-1',
    media_type: 'text',
    text_content: 'Beautiful sunset today!',
    background_color: '#FF6B6B',
    views_count: 12,
    created_date: new Date().toISOString(),
    expires_at: new Date(Date.now() + 20 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'demo-story-2',
    user_id: 'demo-user-2',
    media_type: 'text',
    text_content: 'Coffee time!',
    background_color: '#4ECDC4',
    views_count: 8,
    created_date: new Date(Date.now() - 3600000).toISOString(),
    expires_at: new Date(Date.now() + 19 * 60 * 60 * 1000).toISOString(),
  },
];

// ========== DEMO NOTIFICATIONS ==========
export const DEMO_NOTIFICATIONS = [
  {
    id: 'demo-notif-1',
    type: 'new_message',
    title: 'New Message',
    message: 'Sarah sent you a message',
    related_id: 'demo-user-1',
    is_read: false,
    created_date: new Date().toISOString(),
  },
  {
    id: 'demo-notif-2',
    type: 'match',
    title: 'New Match!',
    message: 'You and David matched!',
    related_id: 'demo-user-2',
    is_read: false,
    created_date: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: 'demo-notif-3',
    type: 'like',
    title: 'Someone likes you',
    message: 'Michael sent you a star!',
    related_id: 'demo-user-3',
    is_read: true,
    created_date: new Date(Date.now() - 7200000).toISOString(),
  },
];

// ========== DEMO LIKES ==========
export const DEMO_LIKES = {
  romantic: [
    {
      id: 'demo-like-romantic-1',
      user_id: 'demo-user-1',
      like_type: 'ROMANTIC',
      created_date: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'demo-like-romantic-2',
      user_id: 'demo-user-4',
      like_type: 'ROMANTIC',
      created_date: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    },
  ],
  positive: [
    {
      id: 'demo-like-positive-1',
      user_id: 'demo-user-3',
      like_type: 'POSITIVE',
      created_date: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'demo-like-positive-2',
      user_id: 'demo-user-2',
      like_type: 'POSITIVE',
      created_date: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
    },
  ],
  super: [
    {
      id: 'demo-like-super-1',
      user_id: 'demo-user-5',
      like_type: 'SUPER',
      created_date: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    },
  ],
};

// ========== DEMO CHAT USERS (for SharedSpace header) ==========
export const DEMO_CHAT_USERS = [
  { chatId: 'demo-chat-1', userId: 'demo-user-1', isOnline: true },
  { chatId: 'demo-chat-2', userId: 'demo-user-2', isOnline: false },
  { chatId: 'demo-chat-3', userId: 'demo-user-3', isOnline: true },
  { chatId: 'demo-chat-4', userId: 'demo-user-4', isOnline: false },
];

// ========== DEMO TEMPORARY CHATS ==========
export const DEMO_TEMP_CHATS = [
  {
    id: 'demo-temp-chat-1',
    user2_id: 'demo-user-1',
    status: 'pending',
    is_temporary: true,
    expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'demo-temp-chat-2',
    user2_id: 'demo-user-3',
    status: 'active',
    is_temporary: true,
    expires_at: new Date(Date.now() + 20 * 60 * 60 * 1000).toISOString(),
    created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'demo-temp-chat-3',
    user2_id: 'demo-user-5',
    status: 'pending',
    is_temporary: true,
    expires_at: new Date(Date.now() + 22 * 60 * 60 * 1000).toISOString(),
    created_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
  },
];

// ========== DEMO RELATIONSHIPS ==========
export const DEMO_RELATIONSHIPS = {
  follows: {
    'demo-user-1': ['demo-user-2', 'demo-user-3'],
    'demo-user-2': ['demo-user-1', 'demo-user-5'],
    'demo-user-3': ['demo-user-1', 'demo-user-4'],
    'demo-user-4': ['demo-user-1', 'demo-user-2'],
    'demo-user-5': ['demo-user-1', 'demo-user-3'],
  },
  followers: {
    'demo-user-1': ['demo-user-2', 'demo-user-3', 'demo-user-4', 'demo-user-5'],
    'demo-user-2': ['demo-user-1', 'demo-user-4'],
    'demo-user-3': ['demo-user-1', 'demo-user-5'],
    'demo-user-4': ['demo-user-3'],
    'demo-user-5': ['demo-user-2'],
  },
};

// ========== HELPER FUNCTIONS ==========

/**
 * Check if an ID is a demo user ID
 * @param {string} userId
 * @returns {boolean}
 */
export function isDemoUser(userId) {
  if (!userId || typeof userId !== 'string') return false;
  return userId.startsWith(DEMO_PREFIX) || userId === 'mock-user';
}

/**
 * Check if any ID is a demo ID (user, chat, response, etc.)
 * @param {string} id
 * @returns {boolean}
 */
export function isDemoId(id) {
  if (!id || typeof id !== 'string') return false;
  return id.startsWith(DEMO_PREFIX) || id === 'mock-user';
}

/**
 * Resolve legacy demo IDs to standardized IDs
 * @param {string} userId
 * @returns {string}
 */
function resolveLegacyId(userId) {
  return LEGACY_ID_MAP[userId] || userId;
}

/**
 * Get a demo user by ID
 * @param {string} userId
 * @returns {object | null}
 */
export function getDemoUser(userId) {
  if (!isDemoUser(userId)) return null;

  const resolvedId = resolveLegacyId(userId);
  const user = DEMO_USERS[resolvedId];

  if (user) return { ...user };

  // Fallback for unknown demo users - return a generic demo user
  return {
    id: userId,
    nickname: 'Demo User',
    first_name: 'Demo',
    age: 25,
    gender: 'OTHER',
    looking_for: ['MALE', 'FEMALE', 'OTHER'],
    location: 'Israel',
    location_display: 'Israel',
    bio: 'This is a demo profile',
    interests: [],
    profile_images: [`https://i.pravatar.cc/400?u=${userId}`],
    main_profile_image_url: `https://i.pravatar.cc/400?u=${userId}`,
    is_verified: false,
    is_premium: false,
    is_online: false,
    onboarding_completed: true,
  };
}

/**
 * Get all demo users
 * @returns {object[]}
 */
export function getAllDemoUsers() {
  return Object.values(DEMO_USERS);
}

/**
 * Get demo users for discovery (filtered by preferences)
 * @param {object} filters - { gender, minAge, maxAge }
 * @returns {object[]}
 */
export function getDiscoverDemoUsers(filters = {}) {
  let users = getAllDemoUsers();

  if (filters.gender) {
    users = users.filter(u => u.gender === filters.gender);
  }
  if (filters.minAge) {
    users = users.filter(u => u.age >= filters.minAge);
  }
  if (filters.maxAge) {
    users = users.filter(u => u.age <= filters.maxAge);
  }

  return users;
}

/**
 * Get demo responses for feed
 * @param {string} [userId] - Optional filter by user
 * @returns {object[]}
 */
export function getDemoResponses(userId) {
  let responses = DEMO_RESPONSES.map(r => ({
    ...r,
    user: getDemoUser(r.user_id),
  }));

  if (userId) {
    const resolvedId = resolveLegacyId(userId);
    responses = responses.filter(r => r.user_id === resolvedId);
  }

  return responses;
}

/**
 * Get demo stories
 * @returns {object[]}
 */
export function getDemoStories() {
  return DEMO_STORIES.map(s => ({
    ...s,
    user: getDemoUser(s.user_id),
  }));
}

/**
 * Get demo notifications for a user
 * @param {string} currentUserId
 * @returns {object[]}
 */
export function getDemoNotifications(currentUserId) {
  return DEMO_NOTIFICATIONS.map(n => ({
    ...n,
    user_id: currentUserId,
  }));
}

/**
 * Get demo likes by type
 * @param {'romantic' | 'positive' | 'super'} likeType
 * @param {string} currentUserId
 * @returns {object[]}
 */
export function getDemoLikes(likeType, currentUserId) {
  const likes = DEMO_LIKES[likeType] || [];
  return likes.map(l => ({
    ...l,
    liked_user_id: currentUserId,
  }));
}

/**
 * Get demo chat users for SharedSpace header
 * @returns {object[]}
 */
export function getDemoChatUsers() {
  return DEMO_CHAT_USERS.map(c => {
    const user = getDemoUser(c.userId);
    return {
      ...c,
      name: user?.nickname,
      image: user?.profile_images?.[0],
    };
  });
}

/**
 * Get demo temporary chats
 * @param {string} currentUserId
 * @returns {object[]}
 */
export function getDemoTempChats(currentUserId) {
  return DEMO_TEMP_CHATS.map(c => {
    const user = getDemoUser(c.user2_id);
    return {
      ...c,
      otherUser: user ? {
        id: user.id,
        first_name: user.nickname,
        last_name: '',
        profile_images: user.profile_images || [],
        is_verified: user.is_verified || false,
      } : null,
    };
  });
}

/**
 * Get demo followers/following
 * @param {string} userId
 * @param {'followers' | 'following'} type
 * @returns {string[]}
 */
export function getDemoFollows(userId, type) {
  const resolvedId = resolveLegacyId(userId);
  const relationship = type === 'followers' ? DEMO_RELATIONSHIPS.followers : DEMO_RELATIONSHIPS.follows;
  return relationship[resolvedId] || ['demo-user-1', 'demo-user-2'];
}

/**
 * Create mock chat for demo user
 * @param {string} otherUserId
 * @returns {object}
 */
export function createDemoChat(otherUserId) {
  const resolvedId = resolveLegacyId(otherUserId);
  const user = getDemoUser(resolvedId);
  return {
    id: `demo-chat-${resolvedId}`,
    otherUser: user ? {
      id: user.id,
      first_name: user.nickname,
      last_name: '',
      profile_images: user.profile_images || [],
      is_verified: user.is_verified || false,
    } : { id: resolvedId, first_name: 'User', last_name: '', profile_images: [], is_verified: false },
    messages: [],
    created_at: new Date().toISOString(),
    status: 'active',
    is_temporary: false,
  };
}

/**
 * Get demo messages for a chat (empty for now)
 * @param {string} chatId
 * @returns {object[]}
 */
export function getDemoMessages(chatId) {
  // Return empty for now - can be extended later
  return [];
}

/**
 * Get demo profiles for Discover page
 * @returns {object[]}
 */
export function getDemoProfiles() {
  return getAllDemoUsers();
}

/**
 * Get demo analytics data
 * @returns {object}
 */
export function getDemoAnalytics() {
  return {
    likes: DEMO_LIKES.romantic.concat(DEMO_LIKES.positive),
    chats: DEMO_CHAT_USERS.map(c => ({ id: c.chatId, status: 'active' })),
    responses: DEMO_RESPONSES,
  };
}

export default {
  DEMO_USERS,
  DEMO_RESPONSES,
  DEMO_STORIES,
  DEMO_NOTIFICATIONS,
  DEMO_LIKES,
  DEMO_CHAT_USERS,
  DEMO_TEMP_CHATS,
  DEMO_RELATIONSHIPS,
  isDemoUser,
  isDemoId,
  getDemoUser,
  getAllDemoUsers,
  getDiscoverDemoUsers,
  getDemoProfiles,
  getDemoResponses,
  getDemoStories,
  getDemoNotifications,
  getDemoLikes,
  getDemoChatUsers,
  getDemoTempChats,
  getDemoFollows,
  createDemoChat,
  getDemoMessages,
  getDemoAnalytics,
};
