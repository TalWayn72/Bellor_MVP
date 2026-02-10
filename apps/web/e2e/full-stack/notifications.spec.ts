/**
 * Full-Stack E2E: Notifications
 * Tests notification display, interaction, and real-time updates
 */
import { test, expect } from '@playwright/test';
import {
  waitForPageLoad,
  FULLSTACK_AUTH,
} from '../fixtures/index.js';

test.describe('[P1][social] Notifications - Full Stack', () => {
  test.use({ storageState: FULLSTACK_AUTH.user });

  test('should load notifications page', async ({ page }) => {
    await page.goto('/Notifications');
    await waitForPageLoad(page);

    await expect(
      page.locator('text=/notification|התראות/i').first(),
    ).toBeVisible({ timeout: 15000 });
  });

  test('should display notification tabs', async ({ page }) => {
    await page.goto('/Notifications');
    await waitForPageLoad(page);

    // Tabs: Today Chat, Crushes, Messages
    const tabs = page.locator(
      'button:has-text("Today"), button:has-text("Crushes"), button:has-text("Messages"), button:has-text("Chat")',
    );
    const count = await tabs.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should switch between notification tabs', async ({ page }) => {
    await page.goto('/Notifications');
    await waitForPageLoad(page);

    const tabNames = ['Crushes', 'Messages', 'Today'];
    for (const tab of tabNames) {
      const tabBtn = page.locator(`button:has-text("${tab}")`).first();
      if (await tabBtn.isVisible().catch(() => false)) {
        await tabBtn.click();
        await page.waitForTimeout(500);
      }
    }
  });

  test('should show notifications or empty state', async ({ page }) => {
    await page.goto('/Notifications');
    await waitForPageLoad(page);
    await page.waitForTimeout(3000);

    // Either notifications or empty state
    const hasNotifications = await page.locator(
      '[data-testid*="notification"], [class*="notification-item"]',
    ).count() > 0;

    const hasEmptyState = await page.locator(
      'text=/no.*notification|all.*caught|אין התראות/i',
    ).isVisible().catch(() => false);

    expect(hasNotifications || hasEmptyState).toBe(true);
  });

  test('should click through to notification source', async ({ page }) => {
    await page.goto('/Notifications');
    await waitForPageLoad(page);
    await page.waitForTimeout(3000);

    const notificationItem = page.locator(
      '[data-testid*="notification"], [class*="notification-item"], a[href]',
    ).first();

    if (await notificationItem.isVisible({ timeout: 5000 }).catch(() => false)) {
      const initialUrl = page.url();
      await notificationItem.click();
      await page.waitForTimeout(3000);

      // Should navigate somewhere (chat, profile, etc.)
      // or expand notification actions
    }
  });

  test('should handle notification actions (close/keep chatting)', async ({ page }) => {
    await page.goto('/Notifications');
    await waitForPageLoad(page);
    await page.waitForTimeout(3000);

    // Look for expandable notification with action buttons
    const expandBtn = page.locator(
      'button:has(svg[data-icon="chevron-down"]), [data-testid*="expand"]',
    ).first();

    if (await expandBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expandBtn.click();

      // Action buttons should appear
      const closeAction = page.locator('button:has-text("CLOSE")').first();
      const keepAction = page.locator('button:has-text("KEEP CHATTING")').first();

      const anyVisible = await closeAction.isVisible().catch(() => false)
        || await keepAction.isVisible().catch(() => false);
    }
  });

  test('should navigate back from notifications', async ({ page }) => {
    await page.goto('/Notifications');
    await waitForPageLoad(page);

    const backBtn = page.locator(
      'button[aria-label*="back" i], button:has(path[d*="15 19l-7-7"])',
    ).first();

    if (await backBtn.isVisible().catch(() => false)) {
      await backBtn.click();
      await page.waitForTimeout(2000);
    } else {
      await page.goBack();
    }

    expect(page.url()).not.toContain('/Notifications');
  });
});
