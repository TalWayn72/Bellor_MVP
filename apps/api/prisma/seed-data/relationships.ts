/**
 * Seed Data - Chat conversations, follows, likes, notifications
 */

export const demoConversations = [
  {
    messages: [
      { sender: 0, content: 'Hey! I saw your profile and loved your travel photos. Have you been to Japan?', delay: 0 },
      { sender: 1, content: 'Hi! Yes, I spent two weeks there last spring. It was amazing! Have you been?', delay: 5 },
      { sender: 0, content: "Not yet, but it's on my bucket list! What was your favorite place?", delay: 10 },
      { sender: 1, content: 'Definitely Kyoto. The temples and gardens are so peaceful. I can share some recommendations!', delay: 18 },
      { sender: 0, content: 'That would be amazing! I\'d love to hear them', delay: 22 },
    ],
  },
  {
    messages: [
      { sender: 0, content: 'Loved your bio! What is your favorite music genre?', delay: 0 },
      { sender: 1, content: 'Thanks! I really love jazz and classic rock. And you?', delay: 8 },
      { sender: 0, content: 'I am really into indie and pop. Any song recommendations?', delay: 15 },
      { sender: 1, content: 'Sure! Listen to the new Kings of Leon album. Fire!', delay: 25 },
    ],
  },
  {
    messages: [
      { sender: 0, content: 'Hi! Loved your paella photo. Did you make it yourself?', delay: 0 },
      { sender: 1, content: 'Yes! Cooking is my passion. Do you like Spanish cuisine?', delay: 12 },
      { sender: 0, content: 'I love it. Especially tapas. Do you have a favorite recipe?', delay: 20 },
    ],
  },
  {
    messages: [
      { sender: 0, content: 'Hey, I noticed you play guitar too! What style do you prefer?', delay: 0 },
      { sender: 1, content: 'Mostly acoustic and some blues. Been playing for about 8 years now. You?', delay: 7 },
      { sender: 0, content: 'Nice! I play electric mainly, love rock and metal. Maybe we could jam sometime?', delay: 15 },
      { sender: 1, content: 'That would be awesome! I know a great studio we could use', delay: 22 },
      { sender: 0, content: 'Perfect! Let me know when you\'re free', delay: 28 },
    ],
  },
  {
    messages: [
      { sender: 0, content: 'Hey! I saw you are also studying psychology. What year are you in?', delay: 0 },
      { sender: 1, content: 'Third year! You too?', delay: 6 },
      { sender: 0, content: 'Second, really enjoying it. What is your favorite topic?', delay: 14 },
      { sender: 1, content: 'Positive psychology, really fascinating. Meet for coffee and chat about it?', delay: 20 },
      { sender: 0, content: 'Sure! I would love to', delay: 24 },
    ],
  },
  {
    messages: [
      { sender: 0, content: 'Your sunset photos are incredible! Where were they taken?', delay: 0 },
      { sender: 1, content: 'Thank you! Most were taken in Santorini, Greece. Best sunsets I have ever seen!', delay: 9 },
      { sender: 0, content: 'Greece is on my list! Any tips for first-time visitors?', delay: 16 },
    ],
  },
];

/** Chat pairs: [userIndex1, userIndex2] */
export const chatPairs: [number, number][] = [
  [0, 1], [2, 4], [3, 1], [5, 6], [7, 8],
  [9, 10], [11, 12], [0, 6], [13, 14], [3, 4],
];

/** Like pairs: [fromIdx, toIdx, likeType] */
export const likePairs: [number, number, string][] = [
  [0, 1, 'ROMANTIC'], [1, 0, 'ROMANTIC'],
  [2, 1, 'ROMANTIC'],
  [3, 4, 'POSITIVE'],
  [4, 3, 'ROMANTIC'],
  [5, 6, 'ROMANTIC'], [6, 5, 'ROMANTIC'],
  [7, 8, 'POSITIVE'],
  [9, 10, 'ROMANTIC'],
  [13, 14, 'ROMANTIC'], [14, 13, 'ROMANTIC'],
  [0, 4, 'POSITIVE'],
  [11, 12, 'ROMANTIC'],
  [3, 6, 'POSITIVE'],
];

/** Follow pairs: [followerIdx, followingIdx] */
export const followPairs: [number, number][] = [
  [0, 1], [1, 0],
  [2, 0], [2, 1],
  [3, 4], [4, 3],
  [5, 6], [6, 5],
  [7, 8],
  [9, 10], [10, 9],
  [13, 14], [14, 13],
  [0, 3],
  [11, 0],
  [1, 4],
];

/** Notification templates */
export const notificationTemplates = [
  { type: 'NEW_LIKE', title: 'New Like!', message: '{name} liked your profile' },
  { type: 'NEW_MATCH', title: 'New Match!', message: 'You and {name} matched!' },
  { type: 'NEW_MESSAGE', title: 'New Message', message: '{name} sent you a message' },
  { type: 'MISSION_REMINDER', title: 'New Mission!', message: 'A new daily mission is available' },
  { type: 'ACHIEVEMENT_UNLOCKED', title: 'Achievement Unlocked!', message: 'You earned the {achievement} badge' },
  { type: 'NEW_FOLLOW', title: 'New Follower!', message: '{name} started following you' },
];
