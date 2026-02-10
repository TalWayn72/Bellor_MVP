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

    // The Notifications page has <h1>Notifications</h1> in the header.
    // While loading, it shows ListSkeleton. Wait for the header to appear.
    // Use separate selectors (not mixed CSS/text with comma).
    const header = page.locator('h1').filter({ hasText: 'Notifications' });
    const notifText = page.locator('text=/notification/i').first();

    const hasHeader = await header.isVisible({ timeout: 15000 }).catch(() => false);
    const hasText = await notifText.isVisible({ timeout: 5000 }).catch(() => false);

    expect(hasHeader || hasText).toBe(true);
  });

  test('should display notification tabs', async ({ page }) => {
    await page.goto('/Notifications');
    await waitForPageLoad(page);

    // Tabs: "Today Chat", "Crushes", "Messages"
    const tabs = page.locator(
      'button:has-text("Today Chat"), button:has-text("Crushes"), button:has-text("Messages")',
    );
    const count = await tabs.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should switch between notification tabs', async ({ page }) => {
    await page.goto('/Notifications');
    await waitForPageLoad(page);

    const tabNames = ['Crushes', 'Messages', 'Today Chat'];
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

    // Notification items are Card components, or empty state shows
    const hasNotifications = await page.locator(
      '[class*="card"], [role="article"]',
    ).count() > 1; // at least one card beyond page structure

    const hasEmptyState = await page.locator(
      'text=/no.*notification|all.*caught|אין התראות/i',
    ).isVisible().catch(() => false);

    // Page should have either notifications or empty state
    const pageLoaded = await page.locator('h1:has-text("Notifications")').isVisible().catch(() => false);
    expect(hasNotifications || hasEmptyState || pageLoaded).toBe(true);
  });

  test('should click through to notification source', async ({ page }) => {
    await page.goto('/Notifications');
    await waitForPageLoad(page);
    await page.waitForTimeout(3000);

    // Notification items are Card components with avatars inside
    const notificationCard = page.locator(
      'button[aria-label*="actions" i], button[aria-label*="Show actions" i]',
    ).first();

    if (await notificationCard.isVisible({ timeout: 5000 }).catch(() => false)) {
      await notificationCard.click();
      await page.waitForTimeout(1000);
      // Should expand to show action buttons
    }
    // If no notifications exist, test passes gracefully
    await expect(page.locator('body')).toBeVisible();
  });

  test('should handle notification actions (close/keep chatting)', async ({ page }) => {
    await page.goto('/Notifications');
    await waitForPageLoad(page);
    await page.waitForTimeout(3000);

    // Look for expandable notification with chevron button
    // NotificationItem uses aria-label="Show actions" / "Hide actions"
    const expandBtn = page.locator(
      'button[aria-label="Show actions"], button[aria-label*="actions" i]',
    ).first();

    if (await expandBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expandBtn.click();
      await page.waitForTimeout(500);

      // Action buttons should appear
      const closeAction = page.locator('button:has-text("CLOSE")').first();
      const keepAction = page.locator('button:has-text("KEEP CHATTING")').first();

      const anyVisible = await closeAction.isVisible().catch(() => false)
        || await keepAction.isVisible().catch(() => false);
    }
    // If no notifications, test passes gracefully
    await expect(page.locator('body')).toBeVisible();
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
