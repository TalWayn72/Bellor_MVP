/**
 * E2E API Mocking Helpers
 * Utilities for mocking API responses in Playwright tests
 */
import { Page } from '@playwright/test';
import type { MockResponse, MockMessage, MockNotification, MockLike, MockUser } from './factories/index.js';

export async function mockApiResponse(page: Page, url: string | RegExp, response: object, status = 200) {
  await page.route(url, (route) => {
    route.fulfill({
      status,
      contentType: 'application/json',
      body: JSON.stringify(response),
    });
  });
}

export async function mockApiError(page: Page, url: string | RegExp, message: string, status = 400) {
  await page.route(url, (route) => {
    route.fulfill({
      status,
      contentType: 'application/json',
      body: JSON.stringify({ error: message }),
    });
  });
}

export async function mockFeedResponses(page: Page, responses: MockResponse[]) {
  await mockApiResponse(page, '**/api/v1/responses*', {
    responses,
    pagination: { total: responses.length, page: 1, limit: 20 },
  });
}

export async function mockChatMessages(page: Page, chatId: string, messages: MockMessage[]) {
  await mockApiResponse(page, `**/api/v1/chats/${chatId}/messages*`, {
    messages,
    pagination: { total: messages.length },
  });
}

export async function mockChats(page: Page, chats: Array<{ id: string; participants: MockUser[]; lastMessage?: MockMessage }>) {
  await mockApiResponse(page, '**/api/v1/chats*', { chats });
}

export async function mockNotifications(page: Page, notifications: MockNotification[], unreadCount = 0) {
  await mockApiResponse(page, '**/api/v1/notifications*', {
    notifications,
    unreadCount,
  });
}

export async function mockLikes(page: Page, likes: MockLike[]) {
  await mockApiResponse(page, '**/api/v1/likes/received*', { likes });
}

export async function mockDailyMission(page: Page, mission?: { id: string; title: string; description: string }) {
  await mockApiResponse(page, '**/api/v1/missions/today', {
    mission: mission || {
      id: 'daily-mission-1',
      title: 'Daily Mission',
      description: 'Share something about yourself',
      missionType: 'DAILY',
      responseTypes: ['TEXT', 'VIDEO', 'AUDIO', 'DRAWING'],
    },
  });
}

export async function mockUserProfile(page: Page, userId: string, user?: Partial<MockUser>) {
  const { createMockUser } = await import('./factories/index.js');
  const mockUser = createMockUser({ id: userId, ...user });
  await mockApiResponse(page, `**/api/v1/users/${userId}`, { user: mockUser });
  return mockUser;
}

export async function mockFileUpload(page: Page, fileUrl = 'https://example.com/uploaded-file.jpg') {
  await mockApiResponse(page, '**/api/v1/uploads*', { url: fileUrl, key: 'uploaded-file-key' });
}
