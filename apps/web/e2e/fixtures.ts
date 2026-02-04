/**
 * Playwright Test Fixtures
 *
 * Shared utilities and fixtures for E2E tests
 *
 * @see PRD.md Section 10.1 Phase 6 - Testing
 */

import { test as base, Page, expect } from '@playwright/test';

// Test user data
export const testUser = {
  email: 'e2e-test@bellor.app',
  password: 'TestPassword123!',
  firstName: 'Test',
  lastName: 'User',
  birthDate: '1990-01-15',
};

export const newTestUser = {
  email: `e2e-${Date.now()}@bellor.app`,
  password: 'NewTestPass123!',
  firstName: 'New',
  lastName: 'Tester',
  birthDate: '1995-05-20',
};

// Storage state for authenticated user
export const STORAGE_STATE_PATH = 'playwright/.auth/user.json';

// Custom test fixtures
export interface TestFixtures {
  authenticatedPage: Page;
}

// Extend base test with custom fixtures
export const test = base.extend<TestFixtures>({
  // Authenticated page fixture
  authenticatedPage: async ({ browser }, use) => {
    // Try to use existing auth state, or create new one
    const context = await browser.newContext({
      storageState: STORAGE_STATE_PATH,
    }).catch(() => browser.newContext());

    const page = await context.newPage();
    await use(page);
    await context.close();
  },
});

// Re-export expect
export { expect };

// Helper functions
export async function waitForPageLoad(page: Page) {
  await page.waitForLoadState('networkidle');
}

export async function clearLocalStorage(page: Page) {
  await page.evaluate(() => localStorage.clear());
}

export async function getLocalStorageItem(page: Page, key: string): Promise<string | null> {
  return page.evaluate((k) => localStorage.getItem(k), key);
}

export async function setLocalStorageItem(page: Page, key: string, value: string) {
  await page.evaluate(([k, v]) => localStorage.setItem(k, v), [key, value]);
}

// API mocking helpers
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

// Wait utilities
export async function waitForToast(page: Page, text: string) {
  await page.locator('[data-sonner-toast]').filter({ hasText: text }).waitFor({ timeout: 10000 });
}

export async function waitForNavigation(page: Page, path: string) {
  await page.waitForURL(`**${path}**`, { timeout: 10000 });
}

// Form helpers
export async function fillLoginForm(page: Page, email: string, password: string) {
  await page.getByPlaceholder(/email|אימייל/i).fill(email);
  await page.getByPlaceholder(/password|סיסמה/i).fill(password);
}

export async function submitForm(page: Page, buttonText?: string | RegExp) {
  if (buttonText) {
    await page.getByRole('button', { name: buttonText }).click();
  } else {
    await page.getByRole('button', { name: /submit|sign|login|register|כניסה|הרשמה/i }).click();
  }
}

// Accessibility helpers
export async function checkAccessibility(page: Page) {
  // Basic accessibility checks
  const title = await page.title();
  expect(title).toBeTruthy();

  // Check for main landmark
  const main = page.locator('main, [role="main"]');
  if ((await main.count()) > 0) {
    await expect(main.first()).toBeVisible();
  }
}

// Mobile testing helpers
export async function isMobileView(page: Page): Promise<boolean> {
  const viewport = page.viewportSize();
  return viewport ? viewport.width < 768 : false;
}

// Screenshot helper for debugging
export async function takeDebugScreenshot(page: Page, name: string) {
  if (process.env.DEBUG) {
    await page.screenshot({ path: `playwright-report/debug-${name}-${Date.now()}.png` });
  }
}

// ==========================================
// Extended Fixtures for E2E Testing
// ==========================================

// Mock user data types
export interface MockUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  nickname?: string;
  age?: number;
  bio?: string;
  location?: string;
  profileImages?: string[];
  isVerified?: boolean;
  isPremium?: boolean;
}

export interface MockMessage {
  id: string;
  chatId: string;
  senderId: string;
  content: string;
  createdAt: string;
  isRead?: boolean;
}

export interface MockResponse {
  id: string;
  userId: string;
  responseType: 'text' | 'video' | 'audio' | 'drawing';
  content?: string;
  textContent?: string;
  likesCount: number;
  createdDate: string;
  mission?: { id: string; title: string };
}

export interface MockNotification {
  id: string;
  type: string;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
  data?: Record<string, unknown>;
}

export interface MockLike {
  id: string;
  userId: string;
  likedUserId: string;
  likeType: 'ROMANTIC' | 'POSITIVE';
  createdDate: string;
}

// Mock data generators
export function createMockUser(overrides: Partial<MockUser> = {}): MockUser {
  return {
    id: `user-${Date.now()}`,
    email: `test-${Date.now()}@bellor.app`,
    firstName: 'Test',
    lastName: 'User',
    nickname: 'TestUser',
    age: 25,
    bio: 'Test bio',
    location: 'Tel Aviv',
    profileImages: ['https://i.pravatar.cc/300?u=test'],
    isVerified: true,
    isPremium: false,
    ...overrides,
  };
}

export function createMockMessage(overrides: Partial<MockMessage> = {}): MockMessage {
  return {
    id: `msg-${Date.now()}`,
    chatId: 'chat-1',
    senderId: 'user-1',
    content: 'Test message',
    createdAt: new Date().toISOString(),
    isRead: false,
    ...overrides,
  };
}

export function createMockResponse(
  type: 'text' | 'video' | 'audio' | 'drawing',
  overrides: Partial<MockResponse> = {}
): MockResponse {
  return {
    id: `response-${Date.now()}`,
    userId: 'user-1',
    responseType: type,
    content: type === 'text' ? undefined : 'https://example.com/media.mp4',
    textContent: type === 'text' ? 'Test text response' : undefined,
    likesCount: Math.floor(Math.random() * 100),
    createdDate: new Date().toISOString(),
    mission: { id: 'mission-1', title: 'Daily Mission' },
    ...overrides,
  };
}

export function createMockNotification(overrides: Partial<MockNotification> = {}): MockNotification {
  return {
    id: `notif-${Date.now()}`,
    type: 'LIKE',
    title: 'New Like',
    body: 'Someone liked your response',
    isRead: false,
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

export function createMockLike(overrides: Partial<MockLike> = {}): MockLike {
  return {
    id: `like-${Date.now()}`,
    userId: 'other-user-1',
    likedUserId: 'current-user',
    likeType: 'ROMANTIC',
    createdDate: new Date().toISOString(),
    ...overrides,
  };
}

// Setup authenticated user with full state
export async function setupAuthenticatedUser(page: Page, user?: Partial<MockUser>) {
  const mockUser = createMockUser(user);

  await page.goto('/');
  await page.evaluate((u) => {
    localStorage.setItem('accessToken', 'mock-access-token');
    localStorage.setItem('refreshToken', 'mock-refresh-token');
    localStorage.setItem('user', JSON.stringify(u));
  }, mockUser);

  // Mock the auth/me endpoint
  await mockApiResponse(page, '**/api/v1/auth/me', mockUser);
  await mockApiResponse(page, '**/api/v1/users/me', mockUser);

  return mockUser;
}

// Mock feed responses
export async function mockFeedResponses(page: Page, responses: MockResponse[]) {
  await mockApiResponse(page, '**/api/v1/responses*', {
    responses,
    pagination: { total: responses.length, page: 1, limit: 20 },
  });
}

// Mock chat messages
export async function mockChatMessages(page: Page, chatId: string, messages: MockMessage[]) {
  await mockApiResponse(page, `**/api/v1/chats/${chatId}/messages*`, {
    messages,
    pagination: { total: messages.length },
  });
}

// Mock chat list
export async function mockChats(page: Page, chats: Array<{ id: string; participants: MockUser[]; lastMessage?: MockMessage }>) {
  await mockApiResponse(page, '**/api/v1/chats*', { chats });
}

// Mock notifications
export async function mockNotifications(page: Page, notifications: MockNotification[], unreadCount = 0) {
  await mockApiResponse(page, '**/api/v1/notifications*', {
    notifications,
    unreadCount,
  });
}

// Mock likes/matches
export async function mockLikes(page: Page, likes: MockLike[]) {
  await mockApiResponse(page, '**/api/v1/likes/received*', { likes });
}

// Mock daily mission
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

// Mock user profile (for viewing other users)
export async function mockUserProfile(page: Page, userId: string, user?: Partial<MockUser>) {
  const mockUser = createMockUser({ id: userId, ...user });
  await mockApiResponse(page, `**/api/v1/users/${userId}`, { user: mockUser });
  return mockUser;
}

// Wait for skeleton/loading to disappear
export async function waitForLoadingComplete(page: Page) {
  // Wait for any loading skeletons to disappear
  await page.locator('.animate-pulse, [data-loading="true"]').first().waitFor({ state: 'hidden', timeout: 10000 }).catch(() => {});
  // Also wait for network idle
  await page.waitForLoadState('networkidle').catch(() => {});
}

// Check for empty state component
export async function expectEmptyState(page: Page, variant?: string) {
  const emptyState = page.locator('[data-testid="empty-state"], .empty-state');
  await expect(emptyState).toBeVisible({ timeout: 5000 });
  if (variant) {
    await expect(emptyState).toContainText(new RegExp(variant, 'i'));
  }
}

// Fill and submit a form by field names
export async function fillForm(page: Page, fields: Record<string, string>) {
  for (const [name, value] of Object.entries(fields)) {
    const input = page.locator(`input[name="${name}"], textarea[name="${name}"], [data-testid="${name}"]`);
    if (await input.isVisible()) {
      await input.fill(value);
    }
  }
}

// Click a button by text (supports Hebrew and English)
export async function clickButton(page: Page, text: string | RegExp) {
  const button = page.getByRole('button', { name: text });
  await button.click();
}

// Navigate and wait for page to be ready
export async function navigateTo(page: Page, path: string) {
  await page.goto(path);
  await waitForPageLoad(page);
  await waitForLoadingComplete(page);
}

// Scroll to element (useful for snap scroll feeds)
export async function scrollToElement(page: Page, selector: string) {
  await page.locator(selector).scrollIntoViewIfNeeded();
}

// Check toast message appeared
export async function expectToast(page: Page, message: string | RegExp) {
  await expect(page.locator('[data-sonner-toast], [role="alert"], .toast')).toContainText(message, { timeout: 5000 });
}

// Mock file upload
export async function mockFileUpload(page: Page, fileUrl = 'https://example.com/uploaded-file.jpg') {
  await mockApiResponse(page, '**/api/v1/uploads*', { url: fileUrl, key: 'uploaded-file-key' });
}

// Wait for dialog/modal to appear
export async function waitForDialog(page: Page) {
  await page.locator('[role="dialog"], [data-state="open"]').waitFor({ timeout: 5000 });
}

// Close dialog/modal
export async function closeDialog(page: Page) {
  const closeButton = page.locator('[role="dialog"] button[aria-label="Close"], [data-state="open"] button:has-text("×")');
  if (await closeButton.isVisible()) {
    await closeButton.click();
  } else {
    await page.keyboard.press('Escape');
  }
}
