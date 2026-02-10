/**
 * E2E Authentication Helpers
 * Utilities for setting up authenticated test sessions
 * Supports both mocked and full-stack authentication
 */
import { test as base, Page } from '@playwright/test';
import { resolve } from 'path';
import { STORAGE_STATE_PATH } from './test-data.js';
import { mockApiResponse } from './api-mock.helpers.js';
import { createMockUser } from './factories/index.js';
import type { MockUser } from './factories/index.js';

export interface TestFixtures {
  authenticatedPage: Page;
}

export const test = base.extend<TestFixtures>({
  authenticatedPage: async ({ browser }, use) => {
    const context = await browser.newContext({
      storageState: STORAGE_STATE_PATH,
    }).catch(() => browser.newContext());

    const page = await context.newPage();
    await use(page);
    await context.close();
  },
});

/** Setup authenticated user with full state (mocked - for existing tests) */
export async function setupAuthenticatedUser(page: Page, user?: Partial<MockUser>) {
  const mockUser = createMockUser(user);

  await page.goto('/');
  await page.evaluate((u) => {
    localStorage.setItem('accessToken', 'mock-access-token');
    localStorage.setItem('refreshToken', 'mock-refresh-token');
    localStorage.setItem('user', JSON.stringify(u));
  }, mockUser);

  await mockApiResponse(page, '**/api/v1/auth/me', mockUser);
  await mockApiResponse(page, '**/api/v1/users/me', mockUser);

  return mockUser;
}

// --- Full-stack authentication helpers ---

/** Storage state paths for full-stack tests */
export const FULLSTACK_AUTH = {
  user: resolve(__dirname, '../../playwright/.auth/user.json'),
  user2: resolve(__dirname, '../../playwright/.auth/user2.json'),
  admin: resolve(__dirname, '../../playwright/.auth/admin.json'),
} as const;

/** Full-stack test fixture with real authentication */
export const fullstackTest = base.extend<TestFixtures>({
  authenticatedPage: async ({ browser }, use) => {
    const context = await browser.newContext({
      storageState: FULLSTACK_AUTH.user,
    }).catch(() => browser.newContext());

    const page = await context.newPage();
    await use(page);
    await context.close();
  },
});

/** Login using real credentials against the running backend */
export async function loginWithRealCredentials(
  page: Page,
  email: string,
  password: string,
): Promise<void> {
  await page.goto('/Login');
  await page.waitForLoadState('networkidle');

  const emailInput = page.locator(
    'input[type="email"], input[placeholder*="email" i], input[placeholder*="אימייל" i]',
  ).first();
  const passwordInput = page.locator(
    'input[type="password"], input[placeholder*="password" i], input[placeholder*="סיסמ" i]',
  ).first();

  await emailInput.fill(email);
  await passwordInput.fill(password);

  const submitBtn = page.locator(
    'button[type="submit"], button:has-text("login"), button:has-text("התחבר"), button:has-text("כניסה")',
  ).first();
  await submitBtn.click();

  // Wait for redirect to authenticated area
  await page.waitForURL(/\/(Home|SharedSpace|Feed)/, { timeout: 15000 });
}

/** Register a new user through the real onboarding flow */
export async function registerNewUser(
  page: Page,
  userData: {
    email: string;
    password: string;
    nickname: string;
    birthDate?: string;
  },
): Promise<void> {
  await page.goto('/Onboarding');
  await page.waitForLoadState('networkidle');

  // Fill registration form fields as they appear in onboarding steps
  const emailInput = page.locator(
    'input[type="email"], input[placeholder*="email" i], input[placeholder*="אימייל" i]',
  ).first();
  if (await emailInput.isVisible().catch(() => false)) {
    await emailInput.fill(userData.email);
  }

  const passwordInput = page.locator(
    'input[type="password"], input[placeholder*="password" i], input[placeholder*="סיסמ" i]',
  ).first();
  if (await passwordInput.isVisible().catch(() => false)) {
    await passwordInput.fill(userData.password);
  }
}

/** Get auth tokens from localStorage */
export async function getAuthTokens(page: Page) {
  return page.evaluate(() => ({
    accessToken: localStorage.getItem('accessToken'),
    refreshToken: localStorage.getItem('refreshToken'),
    user: localStorage.getItem('user'),
  }));
}

/** Check if user is currently authenticated */
export async function isAuthenticated(page: Page): Promise<boolean> {
  const tokens = await getAuthTokens(page);
  return tokens.accessToken !== null;
}
