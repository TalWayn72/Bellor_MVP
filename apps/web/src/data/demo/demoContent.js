/**
 * Demo Content Data
 * Responses, stories, notifications, likes, chat users, temp chats, relationships
 */

// ========== DEMO RESPONSES (Feed Posts) ==========
export const DEMO_RESPONSES = [
  {
    id: 'demo-response-1',
    user_id: 'demo-user-1',
    mission_id: 'demo-mission-1',
    response_type: 'text',
    text_content: 'My perfect day would start with sunrise yoga on the beach, followed by a cozy brunch with friends. How would yours look?',
    text_content_he: 'היום המושלם שלי יתחיל עם יוגה בזריחה על החוף, ואחר כך ארוחת בוקר נעימה עם חברים. איך נראה היום המושלם שלכם?',
    is_public: true, likes_count: 24, comments_count: 5,
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
    is_public: true, likes_count: 42, comments_count: 12,
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
    is_public: true, likes_count: 18, comments_count: 3,
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
    is_public: true, likes_count: 31, comments_count: 8,
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
    is_public: true, likes_count: 56, comments_count: 15,
    hashtags: ['diving', 'nature', 'ocean'],
    created_date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  },
];

// ========== DEMO STORIES ==========
export const DEMO_STORIES = [
  {
    id: 'demo-story-1', user_id: 'demo-user-1', media_type: 'text',
    text_content: 'Beautiful sunset today!', background_color: '#FF6B6B',
    views_count: 12, created_date: new Date().toISOString(),
    expires_at: new Date(Date.now() + 20 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'demo-story-2', user_id: 'demo-user-2', media_type: 'text',
    text_content: 'Coffee time!', background_color: '#4ECDC4',
    views_count: 8, created_date: new Date(Date.now() - 3600000).toISOString(),
    expires_at: new Date(Date.now() + 19 * 60 * 60 * 1000).toISOString(),
  },
];

// ========== DEMO NOTIFICATIONS ==========
export const DEMO_NOTIFICATIONS = [
  { id: 'demo-notif-1', type: 'new_message', title: 'New Message', message: 'Sarah sent you a message', related_id: 'demo-user-1', is_read: false, created_date: new Date().toISOString() },
  { id: 'demo-notif-2', type: 'match', title: 'New Match!', message: 'You and David matched!', related_id: 'demo-user-2', is_read: false, created_date: new Date(Date.now() - 3600000).toISOString() },
  { id: 'demo-notif-3', type: 'like', title: 'Someone likes you', message: 'Michael sent you a star!', related_id: 'demo-user-3', is_read: true, created_date: new Date(Date.now() - 7200000).toISOString() },
];

// ========== DEMO LIKES ==========
export const DEMO_LIKES = {
  romantic: [
    { id: 'demo-like-romantic-1', user_id: 'demo-user-1', like_type: 'ROMANTIC', created_date: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() },
    { id: 'demo-like-romantic-2', user_id: 'demo-user-4', like_type: 'ROMANTIC', created_date: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString() },
  ],
  positive: [
    { id: 'demo-like-positive-1', user_id: 'demo-user-3', like_type: 'POSITIVE', created_date: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString() },
    { id: 'demo-like-positive-2', user_id: 'demo-user-2', like_type: 'POSITIVE', created_date: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString() },
  ],
  super: [
    { id: 'demo-like-super-1', user_id: 'demo-user-5', like_type: 'SUPER', created_date: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString() },
  ],
};

// ========== DEMO CHAT USERS (for SharedSpace header) ==========
export const DEMO_CHAT_USERS = [
  { chatId: 'demo-chat-1', userId: 'demo-user-1', isOnline: true },
  { chatId: 'demo-chat-2', userId: 'demo-user-2', isOnline: false },
  { chatId: 'demo-chat-3', userId: 'demo-user-3', isOnline: true },
  { chatId: 'demo-chat-4', userId: 'demo-user-4', isOnline: false },
  { chatId: 'demo-chat-5', userId: 'demo-user-5', isOnline: true },
];

// ========== DEMO TEMPORARY CHATS ==========
export const DEMO_TEMP_CHATS = [
  { id: 'demo-temp-chat-1', user2_id: 'demo-user-1', status: 'pending', is_temporary: true, expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() },
  { id: 'demo-temp-chat-2', user2_id: 'demo-user-3', status: 'active', is_temporary: true, expires_at: new Date(Date.now() + 20 * 60 * 60 * 1000).toISOString(), created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString() },
  { id: 'demo-temp-chat-3', user2_id: 'demo-user-5', status: 'pending', is_temporary: true, expires_at: new Date(Date.now() + 22 * 60 * 60 * 1000).toISOString(), created_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString() },
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
