/**
 * E2E Authentication Helpers (Mocked)
 * Test fixtures with catch-all API mocking and auth setup
 */
import { test as base, Page } from '@playwright/test';
import { STORAGE_STATE_PATH } from './test-data.js';
import { mockApiResponse } from './api-mock.helpers.js';
import { createMockUser } from './factories/index.js';
import type { MockUser } from './factories/index.js';

export interface TestFixtures {
  authenticatedPage: Page;
  _apiCatchAll: void;
}

/** JSON helper to reduce repetition in catch-all handler */
function json(data: object, status = 200) {
  return { status, contentType: 'application/json', body: JSON.stringify(data) };
}

export const test = base.extend<TestFixtures>({
  /**
   * Auto-fixture: catch-all API mock that runs BEFORE any test navigation.
   * Prevents unmocked API calls from hanging (e.g., SPA init calls to production).
   * Individual test mocks override this via Playwright's LIFO route matching.
   */
  _apiCatchAll: [async ({ page }, use) => {
    await page.route('**/api/v1/**', (route) => {
      const url = route.request().url();
      const method = route.request().method();

      // Auth endpoints - return 401 (unauthenticated by default)
      if (url.includes('/auth/me') || url.includes('/users/me')) {
        return route.fulfill(json({ error: 'Not authenticated' }, 401));
      }

      // Common GET endpoints - return empty data
      if (method === 'GET') {
        if (url.includes('/notifications'))
          return route.fulfill(json({ notifications: [], unreadCount: 0 }));
        if (url.includes('/missions/today'))
          return route.fulfill(json({ mission: null }));
        if (url.includes('/responses'))
          return route.fulfill(json({ responses: [], pagination: { total: 0, page: 1, limit: 20 } }));
        if (url.includes('/chats'))
          return route.fulfill(json({ chats: [] }));
        if (url.includes('/follows'))
          return route.fulfill(json({ following: [], followers: [] }));
        if (url.includes('/likes'))
          return route.fulfill(json({ likes: [] }));
      }

      // Default: return empty success for any unhandled API call
      return route.fulfill(json({}));
    });
    await use();
  }, { auto: true }],

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
