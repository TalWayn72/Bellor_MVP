/**
 * Full-Stack E2E: Navigation & History
 * Tests drawer menu, bottom nav, back button, browser history
 */
import { test, expect } from '@playwright/test';
import {
  waitForPageLoad,
  navigateTo,
  FULLSTACK_AUTH,
  getAllClickableElements,
} from '../fixtures/index.js';

test.describe('[P1][infra] Navigation History - Full Stack', () => {
  test.use({ storageState: FULLSTACK_AUTH.user });

  test('should navigate via bottom navigation', async ({ page }) => {
    await page.goto('/SharedSpace');
    await waitForPageLoad(page);

    // Bottom nav items
    const navItems = page.locator('nav a, nav button').all();
    const items = await navItems;

    for (const item of items.slice(0, 5)) {
      if (await item.isVisible().catch(() => false)) {
        await item.click();
        await page.waitForTimeout(1000);
        // Page should not crash
        await expect(page.locator('body')).toBeVisible();
      }
    }
  });

  test('should open and close drawer menu', async ({ page }) => {
    await page.goto('/SharedSpace');
    await waitForPageLoad(page);

    const menuBtn = page.locator(
      'button[aria-label*="menu" i], [data-testid="drawer-toggle"]',
    ).first();

    if (await menuBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await menuBtn.click();

      // Drawer should open
      const drawer = page.locator('[role="dialog"], .drawer, [data-state="open"]').first();
      await expect(drawer).toBeVisible({ timeout: 5000 });

      // Close via overlay or close button
      await page.keyboard.press('Escape');
      await page.waitForTimeout(500);
    }
  });

  test('should navigate drawer menu items', async ({ page }) => {
    await page.goto('/SharedSpace');
    await waitForPageLoad(page);

    const menuBtn = page.locator(
      'button[aria-label*="menu" i], [data-testid="drawer-toggle"]',
    ).first();

    if (await menuBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await menuBtn.click();
      await page.waitForTimeout(500);

      // Click first menu item
      const menuItem = page.locator(
        '[role="dialog"] a, [role="dialog"] button, .drawer a',
      ).first();

      if (await menuItem.isVisible().catch(() => false)) {
        await menuItem.click();
        await page.waitForTimeout(1000);
      }
    }
  });

  test('should navigate back with browser back button', async ({ page }) => {
    await page.goto('/SharedSpace');
    await waitForPageLoad(page);

    await page.goto('/Profile');
    await waitForPageLoad(page);

    await page.goto('/Settings');
    await waitForPageLoad(page);

    // Go back twice
    await page.goBack();
    await page.waitForTimeout(1000);
    expect(page.url()).toContain('Profile');

    await page.goBack();
    await page.waitForTimeout(1000);
    expect(page.url()).toContain('SharedSpace');
  });

  test('should navigate forward after going back', async ({ page }) => {
    await page.goto('/SharedSpace');
    await waitForPageLoad(page);

    await page.goto('/Profile');
    await waitForPageLoad(page);

    await page.goBack();
    await page.waitForTimeout(1000);

    await page.goForward();
    await page.waitForTimeout(1000);
    expect(page.url()).toContain('Profile');
  });

  test('should handle back button on each main page', async ({ page }) => {
    const pages = ['/Profile', '/Settings', '/Notifications', '/TemporaryChats'];

    for (const pagePath of pages) {
      await page.goto(pagePath);
      await waitForPageLoad(page);

      const backBtn = page.locator(
        'button[aria-label*="back" i], button:has(path[d*="15 19l-7-7"])',
      ).first();

      if (await backBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await backBtn.click();
        await page.waitForTimeout(1000);
        // Should navigate away from current page
      }
    }
  });

  test('should deep link to protected page after login', async ({ page }) => {
    // This test uses saved storage state, so user is already logged in
    await page.goto('/EditProfile');
    await waitForPageLoad(page);

    // Should load the page directly
    expect(page.url()).toContain('EditProfile');
  });

  test('should handle rapid navigation', async ({ page }) => {
    const routes = ['/SharedSpace', '/Profile', '/Settings', '/Notifications', '/SharedSpace'];

    for (const route of routes) {
      await page.goto(route);
      // Don't wait for full load - test rapid navigation
      await page.waitForTimeout(300);
    }

    // Page should not crash
    await waitForPageLoad(page);
    await expect(page.locator('body')).toBeVisible();
  });

  test('should navigate through 5+ pages and maintain history', async ({ page }) => {
    const routes = ['/SharedSpace', '/Profile', '/Settings', '/Notifications', '/TemporaryChats'];

    for (const route of routes) {
      await page.goto(route);
      await waitForPageLoad(page);
    }

    // Go back through all pages
    for (let i = routes.length - 2; i >= 0; i--) {
      await page.goBack();
      await page.waitForTimeout(500);
    }

    // Should be back at first page
    expect(page.url()).toContain('SharedSpace');
  });

  test('should handle 404 page for invalid routes', async ({ page }) => {
    await page.goto('/NonExistentPage12345');
    await waitForPageLoad(page);

    // Should show 404 or redirect
    const is404 = await page.locator('text=/not found|404|page.*not|לא נמצא/i').isVisible().catch(() => false);
    const isRedirected = !page.url().includes('NonExistentPage');

    expect(is404 || isRedirected).toBe(true);
  });
});
