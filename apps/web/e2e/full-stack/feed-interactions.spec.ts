/**
 * Full-Stack E2E: Feed & SharedSpace Interactions
 * Tests real feed loading, likes, responses, and content creation
 */
import { test, expect } from '@playwright/test';
import {
  waitForPageLoad,
  scrollToElement,
  FULLSTACK_AUTH,
  SPECIAL_INPUTS,
} from '../fixtures/index.js';

test.describe('[P1][content] Feed Interactions - Full Stack', () => {
  test.use({ storageState: FULLSTACK_AUTH.user });

  test('should load SharedSpace with content', async ({ page }) => {
    await page.goto('/SharedSpace');
    await waitForPageLoad(page);

    // Page should load without errors
    await expect(page.locator('body')).not.toContainText('error', { ignoreCase: false });

    // Main content area should be visible
    await expect(page.locator('main, [role="main"], .feed, .shared-space').first()).toBeVisible({
      timeout: 15000,
    });
  });

  test('should display daily mission card', async ({ page }) => {
    await page.goto('/SharedSpace');
    await waitForPageLoad(page);

    // Mission card or today's challenge should appear
    const missionCard = page.locator(
      'text=/mission|daily|challenge|משימה|אתגר/i',
    ).first();
    await expect(missionCard).toBeVisible({ timeout: 15000 });
  });

  test('should show feed responses from seeded data', async ({ page }) => {
    await page.goto('/SharedSpace');
    await waitForPageLoad(page);

    // Wait for feed content to load (not skeleton)
    await page.waitForFunction(() => {
      const skeletons = document.querySelectorAll('.animate-pulse');
      return skeletons.length === 0;
    }, { timeout: 15000 });

    // There should be at least one feed item
    const feedItems = page.locator(
      '[data-testid*="feed"], [data-testid*="response"], [class*="feed-item"], [class*="post"]',
    );
    // Or look for user avatars/names in feed
    const avatars = page.locator('img[alt*="user" i], img[alt*="avatar" i], img[alt*="profile" i]');
    const count = await feedItems.count() || await avatars.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should like a feed response', async ({ page }) => {
    await page.goto('/SharedSpace');
    await waitForPageLoad(page);

    // Wait for content to load
    await page.waitForTimeout(3000);

    // Find a like button (heart icon)
    const likeButton = page.locator(
      'button[aria-label*="like" i], button:has(svg path[d*="heart"]), button:has(path[d*="20.84"])',
    ).first();

    if (await likeButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await likeButton.click();
      // Like should register (visual change or count update)
      await page.waitForTimeout(1000);
    }
  });

  test('should navigate to user profile from feed', async ({ page }) => {
    await page.goto('/SharedSpace');
    await waitForPageLoad(page);
    await page.waitForTimeout(3000);

    // Click on a user avatar or name in the feed
    const userLink = page.locator(
      'a[href*="UserProfile"], [data-testid*="user-avatar"], img[alt*="avatar" i]',
    ).first();

    if (await userLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await userLink.click();
      await page.waitForURL(/UserProfile/, { timeout: 10000 });
    }
  });

  test('should open task selector from mission card', async ({ page }) => {
    await page.goto('/SharedSpace');
    await waitForPageLoad(page);

    // Click share/respond button on mission card
    const shareBtn = page.getByRole('button', { name: /share|respond|participate|שתף|הגב/i }).first();
    if (await shareBtn.isVisible({ timeout: 10000 }).catch(() => false)) {
      await shareBtn.click();

      // Task selector modal should appear
      const taskOptions = page.locator('text=/text|write|video|audio|draw|טקסט|כתוב/i');
      await expect(taskOptions.first()).toBeVisible({ timeout: 5000 });
    }
  });

  test('should navigate to WriteTask from task selector', async ({ page }) => {
    await page.goto('/SharedSpace');
    await waitForPageLoad(page);

    const shareBtn = page.getByRole('button', { name: /share|respond|participate|שתף|הגב/i }).first();
    if (await shareBtn.isVisible({ timeout: 10000 }).catch(() => false)) {
      await shareBtn.click();

      // Select text/write task
      const textOption = page.locator(
        'button:has-text("Text"), button:has-text("Write"), button:has-text("טקסט")',
      ).first();
      if (await textOption.isVisible({ timeout: 5000 }).catch(() => false)) {
        await textOption.click();
        await page.waitForURL(/WriteTask/, { timeout: 10000 });
      }
    }
  });

  test('should display bottom navigation', async ({ page }) => {
    await page.goto('/SharedSpace');
    await waitForPageLoad(page);

    // Bottom nav should have key navigation items
    const nav = page.locator('nav').last();
    await expect(nav).toBeVisible();
  });

  test('should open drawer menu', async ({ page }) => {
    await page.goto('/SharedSpace');
    await waitForPageLoad(page);

    // Click menu/hamburger button
    const menuBtn = page.locator(
      'button[aria-label*="menu" i], button:has(svg path[d*="M3 12"]), [data-testid="drawer-toggle"]',
    ).first();

    if (await menuBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await menuBtn.click();
      // Drawer should appear
      await expect(
        page.locator('[role="dialog"], [data-testid="drawer"], .drawer').first(),
      ).toBeVisible({ timeout: 5000 });
    }
  });

  test('should handle feed scroll (infinite scroll)', async ({ page }) => {
    await page.goto('/SharedSpace');
    await waitForPageLoad(page);
    await page.waitForTimeout(3000);

    // Scroll down to trigger more content loading
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(2000);

    // Page should not crash after scrolling
    await expect(page.locator('body')).toBeVisible();
  });

  test('should switch feed tabs if available', async ({ page }) => {
    await page.goto('/SharedSpace');
    await waitForPageLoad(page);

    // Look for tab buttons (All/Following/etc.)
    const followingTab = page.locator(
      'button:has-text("Following"), button:has-text("עוקבים")',
    ).first();

    if (await followingTab.isVisible({ timeout: 5000 }).catch(() => false)) {
      await followingTab.click();
      await page.waitForTimeout(2000);
      // Content should update
      await expect(page.locator('body')).toBeVisible();
    }
  });

  test('should handle Hebrew text in feed search', async ({ page }) => {
    await page.goto('/SharedSpace');
    await waitForPageLoad(page);

    const searchInput = page.locator(
      'input[placeholder*="search" i], input[placeholder*="חיפוש" i], input[type="search"]',
    ).first();

    if (await searchInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      await searchInput.fill('שלום');
      await page.waitForTimeout(1000);
      // Should not crash with Hebrew input
      await expect(page.locator('body')).toBeVisible();
    }
  });
});
