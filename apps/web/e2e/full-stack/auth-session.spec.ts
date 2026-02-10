/**
 * Full-Stack E2E: Session Management
 * Tests token persistence, refresh, expiry, and logout
 *
 * Uses saved auth state from global-setup
 */
import { test, expect } from '@playwright/test';
import { resolve } from 'path';
import {
  waitForPageLoad,
  getLocalStorageItem,
  clearLocalStorage,
  FULLSTACK_AUTH,
} from '../fixtures/index.js';

test.describe('[P0][auth] Session Management - Full Stack', () => {
  test('should maintain session after page reload', async ({ browser }) => {
    const context = await browser.newContext({
      storageState: FULLSTACK_AUTH.user,
    });
    const page = await context.newPage();

    await page.goto('/SharedSpace');
    await waitForPageLoad(page);

    // Verify we're on an authenticated page
    expect(page.url()).not.toContain('/Login');

    // Reload
    await page.reload();
    await waitForPageLoad(page);

    // Should still be authenticated
    expect(page.url()).not.toContain('/Login');
    expect(page.url()).not.toContain('/Onboarding');

    await context.close();
  });

  test('should redirect to login when tokens are cleared', async ({ browser }) => {
    const context = await browser.newContext({
      storageState: FULLSTACK_AUTH.user,
    });
    const page = await context.newPage();

    await page.goto('/SharedSpace');
    await waitForPageLoad(page);

    // Clear all auth data
    await clearLocalStorage(page);

    // Navigate to a protected page
    await page.goto('/Profile');

    // Should redirect to login or onboarding
    await page.waitForURL(/\/(Login|Onboarding)/, { timeout: 15000 });

    await context.close();
  });

  test('should logout and clear tokens', async ({ browser }) => {
    const context = await browser.newContext({
      storageState: FULLSTACK_AUTH.user,
    });
    const page = await context.newPage();

    await page.goto('/Settings');
    await waitForPageLoad(page);

    // Click logout button
    const logoutBtn = page.getByRole('button', { name: /logout|התנתק|יציאה/i });
    await logoutBtn.click();

    // May show confirmation dialog
    const confirmBtn = page.getByRole('button', { name: /confirm|yes|אישור|כן/i });
    if (await confirmBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await confirmBtn.click();
    }

    // Should redirect to login/onboarding
    await page.waitForURL(/\/(Login|Onboarding|Welcome)/, { timeout: 15000 });

    // Tokens should be cleared
    const accessToken = await getLocalStorageItem(page, 'accessToken');
    expect(accessToken).toBeFalsy();

    await context.close();
  });

  test('should protect routes for unauthenticated users', async ({ page }) => {
    // No auth state - try accessing protected routes
    const protectedRoutes = ['/Profile', '/Settings', '/SharedSpace', '/TemporaryChats'];

    for (const route of protectedRoutes) {
      await page.goto(route);
      await page.waitForURL(/\/(Login|Onboarding|Welcome)/, { timeout: 10000 });
    }
  });

  test('should handle concurrent sessions (two tabs)', async ({ browser }) => {
    const context = await browser.newContext({
      storageState: FULLSTACK_AUTH.user,
    });

    const page1 = await context.newPage();
    const page2 = await context.newPage();

    // Both tabs access authenticated pages
    await page1.goto('/SharedSpace');
    await page2.goto('/Profile');

    await waitForPageLoad(page1);
    await waitForPageLoad(page2);

    // Both should be authenticated
    expect(page1.url()).not.toContain('/Login');
    expect(page2.url()).not.toContain('/Login');

    await context.close();
  });

  test('should access admin pages with admin auth', async ({ browser }) => {
    const context = await browser.newContext({
      storageState: FULLSTACK_AUTH.admin,
    });
    const page = await context.newPage();

    await page.goto('/AdminDashboard');
    await waitForPageLoad(page);

    // Admin should be able to access admin pages
    expect(page.url()).toContain('Admin');

    await context.close();
  });

  test('should deny admin pages for regular users', async ({ browser }) => {
    const context = await browser.newContext({
      storageState: FULLSTACK_AUTH.user,
    });
    const page = await context.newPage();

    await page.goto('/AdminDashboard');
    await waitForPageLoad(page);

    // Regular user should be redirected away from admin
    expect(page.url()).not.toContain('AdminDashboard');

    await context.close();
  });

  test('should handle back button after logout', async ({ browser }) => {
    const context = await browser.newContext({
      storageState: FULLSTACK_AUTH.user,
    });
    const page = await context.newPage();

    // Navigate to settings and logout
    await page.goto('/Settings');
    await waitForPageLoad(page);

    const logoutBtn = page.getByRole('button', { name: /logout|התנתק|יציאה/i });
    await logoutBtn.click();

    const confirmBtn = page.getByRole('button', { name: /confirm|yes|אישור|כן/i });
    if (await confirmBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await confirmBtn.click();
    }

    await page.waitForURL(/\/(Login|Onboarding|Welcome)/, { timeout: 15000 });

    // Go back in browser history
    await page.goBack();

    // Should NOT show protected content - should redirect again
    await page.waitForURL(/\/(Login|Onboarding|Welcome)/, { timeout: 10000 });

    await context.close();
  });
});
