/**
 * Base test fixture for full-stack E2E tests
 * Auto-refreshes expired JWT access tokens before app code runs,
 * preventing auth failures when tests take longer than token lifetime.
 */
import { test as base, expect, BrowserContext } from '@playwright/test';

/** Init script that refreshes expired JWT tokens synchronously before app code runs */
const TOKEN_REFRESH_SCRIPT = () => {
  const refreshToken = localStorage.getItem('bellor_refresh_token');
  if (!refreshToken) return;

  const accessToken = localStorage.getItem('bellor_access_token');
  if (accessToken) {
    try {
      const payload = JSON.parse(atob(accessToken.split('.')[1]));
      const now = Math.floor(Date.now() / 1000);
      if (payload.exp && payload.exp > now + 60) return;
    } catch { /* malformed token, refresh it */ }
  }

  try {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/v1/auth/refresh', false);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.send(JSON.stringify({ refreshToken }));
    if (xhr.status === 200) {
      const resp = JSON.parse(xhr.responseText);
      const newToken = resp.data?.accessToken || resp.accessToken;
      if (newToken) {
        localStorage.setItem('bellor_access_token', newToken);
      }
    }
  } catch { /* refresh failed, let app handle it */ }
};

/**
 * Add auto-refresh init script to a browser context.
 * Use this when creating contexts directly via browser.newContext().
 */
export async function addAutoRefresh(context: BrowserContext): Promise<BrowserContext> {
  await context.addInitScript(TOKEN_REFRESH_SCRIPT);
  return context;
}

export const test = base.extend({
  page: async ({ page }, use) => {
    await page.addInitScript(TOKEN_REFRESH_SCRIPT);
    await use(page);
  },
});

export { expect };
export type { Page } from '@playwright/test';
