/**
 * Bellor MVP - Comprehensive Database Seed
 * Creates demo data for all entities so new users see engaging content
 */

import { PrismaClient, Gender, Language, MediaType, MessageType, ResponseType, MissionType, ChatStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// ==================== DEMO USERS ====================
const demoUsers = [
  {
    email: 'demo_sarah@bellor.app',
    firstName: 'Demo_Sarah',
    lastName: 'Johnson',
    gender: Gender.FEMALE,
    preferredLanguage: Language.ENGLISH,
    bio: 'Adventure seeker and coffee enthusiast. Love hiking and trying new cuisines! 🏔️☕',
    birthDate: new Date('1995-03-15'),
    lookingFor: [Gender.MALE],
    profileImages: [
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400',
      'https://images.unsplash.com/photo-1524250502761-1ac6f2e30d43?w=400',
    ],
  },
  {
    email: 'demo_michael@bellor.app',
    firstName: 'Demo_Michael',
    lastName: 'Chen',
    gender: Gender.MALE,
    preferredLanguage: Language.ENGLISH,
    bio: 'Software engineer by day, guitarist by night. Always up for a spontaneous road trip! 🎸🚗',
    birthDate: new Date('1992-07-22'),
    lookingFor: [Gender.FEMALE],
    profileImages: [
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400',
    ],
  },
  {
    email: 'demo_yael@bellor.app',
    firstName: 'Demo_Yael',
    lastName: 'Cohen',
    gender: Gender.FEMALE,
    preferredLanguage: Language.HEBREW,
    bio: 'אוהבת אמנות, מוזיקה וטיולים. מחפשת מישהו לחלוק איתו חוויות חדשות! 🎨🎵',
    birthDate: new Date('1996-11-08'),
    lookingFor: [Gender.MALE],
    profileImages: [
      'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400',
    ],
  },
  {
    email: 'demo_david@bellor.app',
    firstName: 'Demo_David',
    lastName: 'Levi',
    gender: Gender.MALE,
    preferredLanguage: Language.HEBREW,
    bio: 'מהנדס תוכנה, אוהב ספורט ולטייל בטבע. מחפש מערכת יחסים רצינית. 💻🏃',
    birthDate: new Date('1990-05-12'),
    lookingFor: [Gender.FEMALE],
    profileImages: [
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
    ],
  },
  {
    email: 'demo_maria@bellor.app',
    firstName: 'Demo_Maria',
    lastName: 'Garcia',
    gender: Gender.FEMALE,
    preferredLanguage: Language.SPANISH,
    bio: '¡Amante de la vida! Me encanta bailar, viajar y conocer gente nueva. 💃🌍',
    birthDate: new Date('1994-09-28'),
    lookingFor: [Gender.MALE, Gender.FEMALE],
    profileImages: [
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400',
    ],
  },
  {
    email: 'demo_carlos@bellor.app',
    firstName: 'Demo_Carlos',
    lastName: 'Rodriguez',
    gender: Gender.MALE,
    preferredLanguage: Language.SPANISH,
    bio: 'Fotógrafo profesional. Siempre buscando la luz perfecta y nuevas aventuras. 📷✨',
    birthDate: new Date('1991-12-03'),
    lookingFor: [Gender.FEMALE],
    profileImages: [
      'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400',
    ],
  },
  {
    email: 'demo_anna@bellor.app',
    firstName: 'Demo_Anna',
    lastName: 'Schmidt',
    gender: Gender.FEMALE,
    preferredLanguage: Language.GERMAN,
    bio: 'Lehrerin und Yogalehrerin. Liebe Natur, Meditation und gute Gespräche. 🧘‍♀️🌿',
    birthDate: new Date('1993-04-17'),
    lookingFor: [Gender.MALE],
    profileImages: [
      'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=400',
    ],
  },
  {
    email: 'demo_thomas@bellor.app',
    firstName: 'Demo_Thomas',
    lastName: 'Müller',
    gender: Gender.MALE,
    preferredLanguage: Language.GERMAN,
    bio: 'Architekt mit Leidenschaft für Design und Kunst. Reise gerne! 🏛️🎨',
    birthDate: new Date('1989-08-25'),
    lookingFor: [Gender.FEMALE],
    profileImages: [
      'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=400',
    ],
  },
  {
    email: 'demo_sophie@bellor.app',
    firstName: 'Demo_Sophie',
    lastName: 'Dubois',
    gender: Gender.FEMALE,
    preferredLanguage: Language.FRENCH,
    bio: "Passionnée de cuisine et de littérature. J'aime les longues promenades. 📚🥐",
    birthDate: new Date('1997-02-14'),
    lookingFor: [Gender.MALE],
    profileImages: [
      'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400',
    ],
  },
  {
    email: 'demo_pierre@bellor.app',
    firstName: 'Demo_Pierre',
    lastName: 'Martin',
    gender: Gender.MALE,
    preferredLanguage: Language.FRENCH,
    bio: "Chef cuisinier et amateur de vin. Toujours à la recherche de nouvelles saveurs! 👨‍🍳🍷",
    birthDate: new Date('1988-10-30'),
    lookingFor: [Gender.FEMALE],
    profileImages: [
      'https://images.unsplash.com/photo-1463453091185-61582044d556?w=400',
    ],
  },
];

// ==================== DEMO MISSIONS ====================
const demoMissions = [
  {
    title: 'Ice Breaker: Your Perfect Day',
    description: 'Describe your ideal perfect day from morning to night. What would you do?',
    missionType: MissionType.ICE_BREAKER,
    difficulty: 1,
    xpReward: 10,
    activeFrom: new Date(),
    activeUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
  },
  {
    title: 'Daily Challenge: Morning Routine',
    description: 'Share your morning routine! How do you start your day?',
    missionType: MissionType.DAILY,
    difficulty: 1,
    xpReward: 15,
    activeFrom: new Date(),
    activeUntil: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
  },
  {
    title: 'Weekly Quest: Hidden Talent',
    description: "Show us a talent that most people don't know you have!",
    missionType: MissionType.WEEKLY,
    difficulty: 2,
    xpReward: 25,
    activeFrom: new Date(),
    activeUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  },
  {
    title: 'Favorite Travel Memory',
    description: 'Share your favorite travel memory. Where was it and why was it special?',
    missionType: MissionType.ICE_BREAKER,
    difficulty: 1,
    xpReward: 10,
    activeFrom: new Date(),
    activeUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
  },
  {
    title: 'Cook Something New',
    description: 'Try cooking a dish from a cuisine you\'ve never tried before and share the result!',
    missionType: MissionType.WEEKLY,
    difficulty: 3,
    xpReward: 30,
    activeFrom: new Date(),
    activeUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  },
  {
    title: 'Sunset Photo',
    description: 'Capture a beautiful sunset and share it with the community.',
    missionType: MissionType.DAILY,
    difficulty: 1,
    xpReward: 15,
    activeFrom: new Date(),
    activeUntil: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
  },
  {
    title: 'Special: Valentine\'s Day',
    description: 'What does love mean to you? Share your thoughts in a creative way.',
    missionType: MissionType.SPECIAL,
    difficulty: 2,
    xpReward: 50,
    activeFrom: new Date(),
    activeUntil: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
  },
];

// ==================== DEMO ACHIEVEMENTS ====================
const demoAchievements = [
  { name: 'First Response', description: 'Complete your first mission response', requirement: { type: 'response_count', value: 1 }, xpReward: 50, iconUrl: '🎯' },
  { name: 'Chatty', description: 'Start 5 conversations', requirement: { type: 'chat_count', value: 5 }, xpReward: 100, iconUrl: '💬' },
  { name: 'Social Butterfly', description: 'Complete 10 missions', requirement: { type: 'mission_count', value: 10 }, xpReward: 150, iconUrl: '🦋' },
  { name: 'Story Teller', description: 'Post your first story', requirement: { type: 'story_count', value: 1 }, xpReward: 75, iconUrl: '📖' },
  { name: 'Explorer', description: 'View 20 different profiles', requirement: { type: 'profile_views', value: 20 }, xpReward: 80, iconUrl: '🔍' },
  { name: 'Popular', description: 'Get 50 likes on your responses', requirement: { type: 'total_likes', value: 50 }, xpReward: 200, iconUrl: '⭐' },
  { name: 'Consistent', description: 'Complete 7 daily missions in a row', requirement: { type: 'streak', value: 7 }, xpReward: 250, iconUrl: '🔥' },
  { name: 'Premium Member', description: 'Upgrade to Premium', requirement: { type: 'premium', value: 1 }, xpReward: 100, iconUrl: '💎' },
];

// ==================== DEMO CONVERSATION TEMPLATES ====================
const demoConversations = [
  {
    messages: [
      { sender: 0, content: 'Hey! I saw your profile and loved your travel photos. Have you been to Japan?', delay: 0 },
      { sender: 1, content: 'Hi! Yes, I spent two weeks there last spring. It was amazing! Have you been?', delay: 5 },
      { sender: 0, content: "Not yet, but it's on my bucket list! What was your favorite place?", delay: 10 },
      { sender: 1, content: 'Definitely Kyoto. The temples and gardens are so peaceful. I can share some recommendations!', delay: 18 },
      { sender: 0, content: 'That would be amazing! I\'d love to hear them 😊', delay: 22 },
    ]
  },
  {
    messages: [
      { sender: 0, content: 'אהבתי את הביו שלך! מה הסגנון מוזיקה האהוב עליך?', delay: 0 },
      { sender: 1, content: 'תודה! אני מאוד אוהב ג\'אז ורוק קלאסי. ואת?', delay: 8 },
      { sender: 0, content: 'אני מאוד לתוך אינדי ופופ. יש לך המלצות לשירים?', delay: 15 },
      { sender: 1, content: 'בטח! תשמעי את האלבום החדש של Kings of Leon. אש! 🎸', delay: 25 },
    ]
  },
  {
    messages: [
      { sender: 0, content: '¡Hola! Me encantó tu foto de la paella. ¿La hiciste tú?', delay: 0 },
      { sender: 1, content: '¡Sí! Cocinar es mi pasión. ¿Te gusta la cocina española?', delay: 12 },
      { sender: 0, content: 'Me encanta. Especialmente las tapas. ¿Tienes alguna receta favorita?', delay: 20 },
    ]
  },
  {
    messages: [
      { sender: 0, content: 'Hey, I noticed you play guitar too! What style do you prefer?', delay: 0 },
      { sender: 1, content: 'Mostly acoustic and some blues. Been playing for about 8 years now. You?', delay: 7 },
      { sender: 0, content: 'Nice! I play electric mainly, love rock and metal. Maybe we could jam sometime?', delay: 15 },
      { sender: 1, content: 'That would be awesome! I know a great studio we could use', delay: 22 },
      { sender: 0, content: 'Perfect! Let me know when you\'re free 🎸', delay: 28 },
    ]
  },
];

// ==================== DEMO RESPONSES TEMPLATES ====================
const demoResponseTexts = [
  'My perfect day would start with sunrise yoga on the beach, followed by a homemade brunch. Then exploring a new hiking trail and ending with stargazing! 🌅🏔️✨',
  'I wake up at 6am, do 20 minutes of meditation, make my favorite coffee, and journal. It sets such a positive tone for the day! ☕🧘‍♀️',
  "Not many people know this, but I can solve a Rubik's cube in under 2 minutes! Started learning during quarantine. 🧩",
  'My favorite travel memory is watching the northern lights in Iceland. The colors dancing across the sky was absolutely magical. 🌌',
  'Just made homemade pasta from scratch for the first time! It was easier than I thought and so delicious. Italian grandmothers were onto something! 🍝',
  'היום המושלם שלי: קפה בבוקר מול הים, יום בטבע עם חברים, וערב של משחקי קופסא! 🌊🌿🎲',
  'הכישרון הנסתר שלי - אני יודע לעשות אוריגמי מורכב. הנה ברבור שקיפלתי! 🦢',
  '¡Mi día perfecto incluye tapas con amigos, música en vivo, y un buen libro en la playa! 🎶📖',
  "Captured this amazing sunset during my trip to Santorini. The colors were unreal! 🌅",
  'Morning routine: 5am wake up, cold shower, 30 min run, healthy smoothie. Changed my life! 🏃‍♂️💪',
];

// ==================== DEMO STORY TEMPLATES ====================
const demoStoryImages = [
  { url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600', caption: 'Morning hike views 🏔️' },
  { url: 'https://images.unsplash.com/photo-1493770348161-369560ae357d?w=600', caption: 'Brunch time! 🥐' },
  { url: 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=600', caption: 'Weekend camping ⛺' },
  { url: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600', caption: 'Dinner date 🍷' },
  { url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600', caption: 'Pizza night! 🍕' },
  { url: 'https://images.unsplash.com/photo-1552733407-5d5c46c3bb3b?w=600', caption: 'Beach day 🏖️' },
  { url: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=600', caption: 'Night sky magic ✨' },
  { url: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=600', caption: 'Coffee time ☕' },
];

async function main() {
  console.log('🌱 Starting comprehensive database seed...\n');

  const hashedPassword = await bcrypt.hash('Demo123!', 10);
  const createdUsers: any[] = [];

  // ==================== CREATE USERS ====================
  console.log('👥 Creating demo users...');
  for (const userData of demoUsers) {
    const user = await prisma.user.upsert({
      where: { email: userData.email },
      update: {
        ...userData,
        lastActiveAt: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000),
      },
      create: {
        ...userData,
        passwordHash: hashedPassword,
        isVerified: true,
        lastActiveAt: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000),
        location: {
          lat: 32.0853 + (Math.random() - 0.5) * 0.5,
          lng: 34.7818 + (Math.random() - 0.5) * 0.5,
          city: 'Tel Aviv',
          country: 'Israel',
        },
      },
    });
    createdUsers.push(user);
    console.log(`  ✅ ${user.firstName} ${user.lastName}`);
  }

  // ==================== CREATE MISSIONS ====================
  console.log('\n🎯 Creating demo missions...');
  const createdMissions: any[] = [];
  for (const missionData of demoMissions) {
    const mission = await prisma.mission.upsert({
      where: { id: missionData.title.slice(0, 20).replace(/\s/g, '-').toLowerCase() },
      update: missionData,
      create: {
        id: missionData.title.slice(0, 20).replace(/\s/g, '-').toLowerCase(),
        ...missionData,
      },
    });
    createdMissions.push(mission);
    console.log(`  ✅ ${mission.title}`);
  }

  // ==================== CREATE ACHIEVEMENTS ====================
  console.log('\n🏆 Creating demo achievements...');
  const createdAchievements: any[] = [];
  for (const achievementData of demoAchievements) {
    const achievement = await prisma.achievement.upsert({
      where: { id: achievementData.name.replace(/\s/g, '-').toLowerCase() },
      update: achievementData as any,
      create: {
        id: achievementData.name.replace(/\s/g, '-').toLowerCase(),
        ...achievementData,
      } as any,
    });
    createdAchievements.push(achievement);
    console.log(`  ✅ ${achievement.name}`);
  }

  // ==================== CREATE CHATS & MESSAGES ====================
  console.log('\n💬 Creating demo chats and messages...');
  const chatPairs = [
    [0, 1], // Sarah & Michael
    [2, 3], // Yael & David
    [4, 5], // Maria & Carlos
    [6, 7], // Anna & Thomas
    [8, 9], // Sophie & Pierre
    [0, 2], // Sarah & Yael
    [1, 3], // Michael & David
  ];

  for (let i = 0; i < chatPairs.length; i++) {
    const [idx1, idx2] = chatPairs[i];
    const user1 = createdUsers[idx1];
    const user2 = createdUsers[idx2];
    const conversation = demoConversations[i % demoConversations.length];

    // Create or get chat
    let chat = await prisma.chat.findFirst({
      where: {
        OR: [
          { user1Id: user1.id, user2Id: user2.id },
          { user1Id: user2.id, user2Id: user1.id },
        ],
      },
    });

    if (!chat) {
      chat = await prisma.chat.create({
        data: {
          user1Id: user1.id,
          user2Id: user2.id,
          status: ChatStatus.ACTIVE,
          isTemporary: false,
          isPermanent: true,
          lastMessageAt: new Date(),
          messageCount: conversation.messages.length,
        },
      });
    }

    // Create messages
    for (const msg of conversation.messages) {
      const senderId = msg.sender === 0 ? user1.id : user2.id;
      const messageTime = new Date(Date.now() - (60 - msg.delay) * 60 * 1000);

      await prisma.message.upsert({
        where: { id: `demo-msg-${chat.id}-${msg.delay}` },
        update: {},
        create: {
          id: `demo-msg-${chat.id}-${msg.delay}`,
          chatId: chat.id,
          senderId,
          messageType: MessageType.TEXT,
          content: msg.content,
          isRead: true,
          createdAt: messageTime,
        },
      });
    }

    console.log(`  ✅ Chat: ${user1.firstName} ↔ ${user2.firstName} (${conversation.messages.length} messages)`);
  }

  // ==================== CREATE RESPONSES ====================
  console.log('\n📝 Creating demo mission responses...');
  for (let i = 0; i < createdUsers.length; i++) {
    const user = createdUsers[i];
    const numResponses = 1 + Math.floor(Math.random() * 3);

    for (let j = 0; j < numResponses; j++) {
      const mission = createdMissions[Math.floor(Math.random() * createdMissions.length)];
      const responseText = demoResponseTexts[(i + j) % demoResponseTexts.length];

      await prisma.response.upsert({
        where: { id: `demo-response-${user.id}-${mission.id}-${j}` },
        update: {},
        create: {
          id: `demo-response-${user.id}-${mission.id}-${j}`,
          userId: user.id,
          missionId: mission.id,
          responseType: ResponseType.TEXT,
          content: responseText,
          isPublic: true,
          viewCount: Math.floor(Math.random() * 50) + 10,
          likeCount: Math.floor(Math.random() * 20) + 5,
          createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
        },
      });
    }
    console.log(`  ✅ ${user.firstName}: ${numResponses} responses`);
  }

  // Update user response counts
  for (const user of createdUsers) {
    const count = await prisma.response.count({ where: { userId: user.id } });
    await prisma.user.update({
      where: { id: user.id },
      data: { responseCount: count },
    });
  }

  // ==================== CREATE STORIES ====================
  console.log('\n📸 Creating demo stories...');
  for (let i = 0; i < 6; i++) {
    const user = createdUsers[i];
    const storyData = demoStoryImages[i % demoStoryImages.length];
    const expiresAt = new Date(Date.now() + (12 + Math.random() * 12) * 60 * 60 * 1000);

    await prisma.story.upsert({
      where: { id: `demo-story-${user.id}` },
      update: {
        mediaUrl: storyData.url,
        caption: storyData.caption,
        expiresAt,
      },
      create: {
        id: `demo-story-${user.id}`,
        userId: user.id,
        mediaType: MediaType.IMAGE,
        mediaUrl: storyData.url,
        caption: storyData.caption,
        viewCount: Math.floor(Math.random() * 30) + 5,
        createdAt: new Date(Date.now() - Math.random() * 12 * 60 * 60 * 1000),
        expiresAt,
      },
    });
    console.log(`  ✅ ${user.firstName}'s story: "${storyData.caption}"`);
  }

  // ==================== UNLOCK ACHIEVEMENTS ====================
  console.log('\n🎖️ Unlocking demo achievements...');
  for (let i = 0; i < createdUsers.length; i++) {
    const user = createdUsers[i];
    const numAchievements = 1 + Math.floor(Math.random() * 3);

    for (let j = 0; j < numAchievements; j++) {
      const achievement = createdAchievements[j];
      await prisma.userAchievement.upsert({
        where: {
          userId_achievementId: {
            userId: user.id,
            achievementId: achievement.id,
          },
        },
        update: {},
        create: {
          userId: user.id,
          achievementId: achievement.id,
          unlockedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
        },
      });
    }
    console.log(`  ✅ ${user.firstName}: ${numAchievements} achievements`);
  }

  // ==================== SUMMARY ====================
  console.log('\n' + '='.repeat(50));
  console.log('🎉 SEED COMPLETED SUCCESSFULLY!');
  console.log('='.repeat(50));
  console.log('\n📊 Summary:');
  console.log(`   👥 Users: ${createdUsers.length}`);
  console.log(`   🎯 Missions: ${createdMissions.length}`);
  console.log(`   🏆 Achievements: ${createdAchievements.length}`);
  console.log(`   💬 Chats: ${chatPairs.length}`);
  console.log(`   📸 Stories: 6`);
  console.log(`   📝 Responses: ~${createdUsers.length * 2}`);

  console.log('\n📝 Demo Login Credentials:');
  console.log('   Password for all: Demo123!');
  console.log('   Emails:');
  for (const user of demoUsers.slice(0, 5)) {
    console.log(`   - ${user.email}`);
  }
  console.log('   ... and 5 more\n');
}

main()
  .catch((e) => {
    console.error('❌ Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
