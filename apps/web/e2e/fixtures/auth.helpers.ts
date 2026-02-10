/**
 * E2E Authentication Helpers
 * Utilities for setting up authenticated test sessions
 */
import { test as base, Page } from '@playwright/test';
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

/** Setup authenticated user with full state */
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
