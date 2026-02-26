/**
 * Visual Test Mock Data Helpers
 * Domain-specific mock data for visual regression tests
 */
import type { Page } from '@playwright/test';
import {
  mockApiResponse,
  mockFeedResponses,
  mockDailyMission,
  mockChats,
  mockNotifications,
  mockLikes,
  createMockResponse,
  createMockUser,
  createMockNotification,
  createMockLike,
} from '../fixtures';

/** Mock admin dashboard data (users, reports, stats) */
export async function mockAdminData(page: Page) {
  const users = Array.from({ length: 5 }, (_, i) =>
    createMockUser({ firstName: `User${i}`, email: `user${i}@test.com` })
  );
  await mockApiResponse(page, '**/api/v1/users/search*', { users });
  await mockApiResponse(page, '**/api/v1/admin/reports*', { reports: [] });
  await mockApiResponse(page, '**/api/v1/admin/stats*', {
    totalUsers: 77, activeUsers: 65, blockedUsers: 0, reports: 3,
  });
  await mockApiResponse(page, '**/api/v1/admin/activity*', { activities: [] });
  await mockApiResponse(page, '**/api/v1/admin/chats*', { chats: [] });
  await mockApiResponse(page, '**/api/v1/admin/pre-registrations*', { registrations: [] });
  await mockApiResponse(page, '**/api/v1/admin/settings*', { settings: {} });
}

/** Mock feed with sample responses */
export async function mockFeedData(page: Page) {
  const responses = [
    createMockResponse('text', { textContent: 'Visual test response', likesCount: 42 }),
    createMockResponse('text', { textContent: 'Second test response', likesCount: 15 }),
  ];
  await mockFeedResponses(page, responses);
  await mockDailyMission(page);
}

/** Mock discover profiles */
export async function mockDiscoverData(page: Page) {
  await page.route('**/api/v1/users/discover*', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        users: [createMockUser({ firstName: 'Discover', age: 26, bio: 'Visual test' })],
      }),
    });
  });
}

/** Mock matches/likes data */
export async function mockMatchesData(page: Page) {
  const likes = [createMockLike(), createMockLike()];
  await mockLikes(page, likes);
}

/** Mock chat list */
export async function mockChatData(page: Page) {
  await mockChats(page, [{
    id: 'chat-1',
    participants: [createMockUser({ firstName: 'Chat', lastName: 'Partner' })],
  }]);
}

/** Mock notifications */
export async function mockNotifData(page: Page) {
  const notifs = [
    createMockNotification({ type: 'LIKE', title: 'New Like', body: 'Someone liked you' }),
    createMockNotification({ type: 'MATCH', title: 'New Match', body: 'New match!' }),
  ];
  await mockNotifications(page, notifs, 2);
}

/** Mock stories data */
export async function mockStoriesData(page: Page) {
  await mockApiResponse(page, '**/api/v1/stories*', { stories: [] });
}

/** Mock mission data for task pages */
export async function mockMissionData(page: Page) {
  await mockDailyMission(page);
  await mockApiResponse(page, '**/api/v1/missions/ice-breakers*', { iceBreakers: [] });
  await mockApiResponse(page, '**/api/v1/missions/quiz*', { questions: [] });
  await mockApiResponse(page, '**/api/v1/missions/date-ideas*', { ideas: [] });
  await mockApiResponse(page, '**/api/v1/events*', { events: [] });
}

/** Mock achievements data */
export async function mockAchievementsData(page: Page) {
  await mockApiResponse(page, '**/api/v1/achievements*', { achievements: [] });
  await mockApiResponse(page, '**/api/v1/analytics*', { views: 0, likes: 0, matches: 0 });
}

/** Mock blocked users list */
export async function mockBlockedUsersData(page: Page) {
  await mockApiResponse(page, '**/api/v1/users/blocked*', { users: [] });
}
