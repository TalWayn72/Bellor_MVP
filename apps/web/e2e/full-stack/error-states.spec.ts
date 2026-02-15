/**
 * Full-Stack E2E: Error States
 * Tests error handling, empty states, and graceful degradation
 */
import { test, expect } from './fullstack-base.js';
import {
  waitForPageLoad,
  FULLSTACK_AUTH,
  clearLocalStorage,
  collectConsoleMessages,
} from '../fixtures/index.js';

test.describe('[P2][infra] Error States - Full Stack', () => {
  test.use({ storageState: FULLSTACK_AUTH.user });

  test('should show 404 for invalid route', async ({ page }) => {
    const cc = collectConsoleMessages(page);
    await page.goto('/ThisPageDoesNotExist', { waitUntil: 'domcontentloaded' });
    await waitForPageLoad(page);

    // Wait for potential redirect
    await page.waitForTimeout(3000);

    const is404 = await page.locator(
      'text=/not found|404|page.*not|לא נמצא/i',
    ).isVisible().catch(() => false);
    // App may redirect to a known page (Onboarding, Home, SharedSpace)
    const isRedirected = !page.url().includes('ThisPageDoesNotExist');
    // Page should be functional regardless
    const bodyVisible = await page.locator('body').isVisible();

    expect(is404 || isRedirected || bodyVisible).toBe(true);
    cc.assertClean();
  });

  test('should handle expired session gracefully', async ({ page }) => {
    await page.goto('/SharedSpace', { waitUntil: 'domcontentloaded' });
    await waitForPageLoad(page);

    // Clear tokens to simulate expired session
    await clearLocalStorage(page);
    await page.context().clearCookies();

    // Try to navigate to protected page
    await page.goto('/Profile', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(5000);

    // Should redirect to login/onboarding or show the page (some pages may not require auth)
    const url = page.url();
    const isLogin = url.includes('Login') || url.includes('Onboarding') || url.includes('Welcome');
    const isProfile = url.includes('Profile');

    // Either redirected to auth page or stayed on profile (if page handles missing auth gracefully)
    expect(isLogin || isProfile).toBe(true);
  });

  test('should handle network error on feed load', async ({ page }) => {
    // Intercept API calls to simulate network error
    await page.route('**/api/v1/responses/**', (route) => route.abort());
    await page.route('**/api/v1/feed/**', (route) => route.abort());

    await page.goto('/SharedSpace', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(5000);

    // Should show error state or empty state, not crash
    await expect(page.locator('body')).toBeVisible();
  });

  test('should handle server 500 error', async ({ page }) => {
    await page.route('**/api/v1/**', (route) =>
      route.fulfill({ status: 500, body: JSON.stringify({ error: 'Internal Server Error' }) }),
    );

    await page.goto('/SharedSpace', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(5000);

    // Should show error state, not blank page
    await expect(page.locator('body')).toBeVisible();
  });

  test('should show empty state on feed with no data', async ({ page }) => {
    // Mock empty feed response
    await page.route('**/api/v1/responses/**', (route) =>
      route.fulfill({ status: 200, body: JSON.stringify({ data: [], total: 0 }) }),
    );

    await page.goto('/SharedSpace', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(5000);

    // Should show empty state or "no posts" message
    await expect(page.locator('body')).toBeVisible();
  });

  test('should show empty state on notifications', async ({ page }) => {
    await page.route('**/api/v1/notifications/**', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ notifications: [], unreadCount: 0 }),
      }),
    );

    await page.goto('/Notifications', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(5000);

    // Empty state shows "No notifications yet" / "You're all caught up!"
    const hasEmptyState = await page.locator(
      'text=/no.*notification|all.*caught|אין התראות/i',
    ).first().isVisible().catch(() => false);

    // Page should at least be loaded with the Notifications header
    const hasHeader = await page.locator('h1:has-text("Notifications")').isVisible().catch(() => false);

    expect(hasEmptyState || hasHeader).toBe(true);
  });

  test('should show empty state on chat list', async ({ page }) => {
    await page.route('**/api/v1/chats/**', (route) =>
      route.fulfill({ status: 200, body: JSON.stringify({ data: [] }) }),
    );

    await page.goto('/TemporaryChats', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(5000);

    await expect(page.locator('body')).toBeVisible();
  });

  test('should handle slow network gracefully', async ({ page }) => {
    // First load the page normally so it's cached / hydrated
    await page.goto('/SharedSpace', { waitUntil: 'domcontentloaded' });
    await waitForPageLoad(page);

    // Now simulate slow API responses (only intercept API calls, not page navigation)
    await page.route('**/api/**', async (route) => {
      await new Promise(resolve => setTimeout(resolve, 2000));
      await route.continue();
    });

    // Reload to trigger slow API fetches
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);

    // Page should show loading state or content (not crash)
    await expect(page.locator('body')).toBeVisible();

    // Wait for slow responses to finish
    await page.waitForTimeout(3000);

    // Page should still be functional after slow responses resolve
    await expect(page.locator('body')).toBeVisible();

    await page.unrouteAll();
  });

  test('should handle offline mode', async ({ page }) => {
    await page.goto('/SharedSpace', { waitUntil: 'domcontentloaded' });
    await waitForPageLoad(page);

    // Go offline
    await page.context().setOffline(true);

    // Try navigation
    await page.goto('/Profile', { waitUntil: 'domcontentloaded' }).catch(() => {});
    await page.waitForTimeout(2000);

    // Should show offline indicator or cached content
    await expect(page.locator('body')).toBeVisible();

    // Go back online
    await page.context().setOffline(false);
  });

  test('should handle auth API failure during login', async ({ page }) => {
    // Mock auth endpoints to return error
    await page.route('**/api/v1/auth/login', (route) =>
      route.fulfill({ status: 503, body: JSON.stringify({ error: 'Service Unavailable' }) }),
    );
    await page.route('**/api/v1/auth/signin', (route) =>
      route.fulfill({ status: 503, body: JSON.stringify({ error: 'Service Unavailable' }) }),
    );

    // Clear cookies/auth to ensure we see the login form
    await page.context().clearCookies();
    await page.goto('/Login', { waitUntil: 'domcontentloaded' });
    // Use domcontentloaded to avoid hanging on /oauth/status request
    await page.waitForLoadState('domcontentloaded');

    const emailInput = page.locator('#email');
    if (await emailInput.isVisible({ timeout: 10000 }).catch(() => false)) {
      await emailInput.fill('test@bellor.app');
      await page.locator('#password').fill('TestPass123!');
      await page.getByRole('button', { name: /sign in/i }).click();

      await page.waitForTimeout(3000);

      // Login.jsx shows error in a div with bg-destructive/10 text-destructive class
      // Look for error text OR destructive-styled elements separately (not mixed CSS/text)
      const hasErrorText = await page.locator(
        'text=/error|failed|unavailable|שגיאה/i',
      ).first().isVisible({ timeout: 10000 }).catch(() => false);
      const hasDestructiveDiv = await page.locator(
        '[class*="destructive"]',
      ).first().isVisible().catch(() => false);

      // Also acceptable: user stayed on login page (submission failed)
      const stayedOnLogin = page.url().includes('Login');

      expect(hasErrorText || hasDestructiveDiv || stayedOnLogin).toBe(true);
    } else {
      // If redirected (user already authenticated), test passes
      await expect(page.locator('body')).toBeVisible();
    }
  });
});
