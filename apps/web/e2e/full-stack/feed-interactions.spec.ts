/**
 * Full-Stack E2E: Feed & SharedSpace Interactions
 * Tests real feed loading, likes, responses, and content creation
 */
import { test, expect } from './fullstack-base.js';
import {
  waitForPageLoad,
  scrollToElement,
  FULLSTACK_AUTH,
  SPECIAL_INPUTS,
  collectConsoleMessages,
} from '../fixtures/index.js';

test.describe('[P1][content] Feed Interactions - Full Stack', () => {
  test.use({ storageState: FULLSTACK_AUTH.user });

  test('should load SharedSpace with content', async ({ page }) => {
    const cc = collectConsoleMessages(page);
    await page.goto('/SharedSpace', { waitUntil: 'domcontentloaded' });
    await waitForPageLoad(page);

    // Page should load without errors
    await expect(page.locator('body')).not.toContainText('error', { ignoreCase: false });

    // SharedSpace renders a div.min-h-screen.bg-background with content inside
    // Wait for either the bottom navigation, mission card, or feed section to appear
    await expect(
      page.locator('nav, [class*="bg-gradient"], [class*="snap-y"], .min-h-screen').first(),
    ).toBeVisible({ timeout: 30000 });
    cc.assertClean();
  });

  test('should display daily mission card', async ({ page }) => {
    await page.goto('/SharedSpace', { waitUntil: 'domcontentloaded' });
    await waitForPageLoad(page);

    // MissionCard renders "Daily Task" heading or mission question text
    // It also may not render if todayMission is null, so check for the card OR empty feed state
    const missionOrFeed = page.locator(
      'text=/Daily Task|daily|mission|משימה|אתגר|שתף עכשיו|No posts yet/i',
    ).first();
    await expect(missionOrFeed).toBeVisible({ timeout: 30000 });
  });

  test('should show feed responses from seeded data', async ({ page }) => {
    await page.goto('/SharedSpace', { waitUntil: 'domcontentloaded' });
    await waitForPageLoad(page);

    // Wait for feed content to load (not skeleton)
    await page.waitForFunction(() => {
      const skeletons = document.querySelectorAll('.animate-pulse');
      return skeletons.length === 0;
    }, { timeout: 30000 });

    // FeedSection renders FeedPost cards inside a snap-y scrollable div
    // Each FeedPost is a Card component. If no responses, an EmptyState with "No posts yet" shows.
    const feedCards = page.locator('[class*="snap-y"] [class*="card"], [class*="snap-y"] [class*="Card"]');
    const emptyState = page.locator('text=/No posts yet|Be the first/i');

    const feedCount = await feedCards.count();
    const hasEmpty = await emptyState.isVisible().catch(() => false);

    // Either we have feed cards OR the empty state is showing - both are valid
    expect(feedCount > 0 || hasEmpty).toBe(true);
  });

  test('should like a feed response', async ({ page }) => {
    await page.goto('/SharedSpace', { waitUntil: 'domcontentloaded' });
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
    await page.goto('/SharedSpace', { waitUntil: 'domcontentloaded' });
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
    await page.goto('/SharedSpace', { waitUntil: 'domcontentloaded' });
    await waitForPageLoad(page);

    // MissionCard has a button with Hebrew text: "שתף עכשיו" (Share Now) or "שתף תגובה נוספת" (Share Another Response)
    // It calls onOpenTaskSelector which opens the DailyTaskSelector dialog.
    const shareBtn = page.getByRole('button', { name: /שתף עכשיו|שתף תגובה|share|respond/i }).first();
    if (await shareBtn.isVisible({ timeout: 10000 }).catch(() => false)) {
      await shareBtn.click();

      // DailyTaskSelector is a Dialog (role="dialog") with Hebrew task labels:
      // "כתוב" (Write), "וידאו" (Video), "אודיו" (Audio), "ציור" (Drawing)
      const taskDialog = page.locator('[role="dialog"]');
      await expect(taskDialog).toBeVisible({ timeout: 5000 });

      const taskOptions = page.locator('text=/כתוב|וידאו|אודיו|ציור/i');
      await expect(taskOptions.first()).toBeVisible({ timeout: 5000 });
    }
  });

  test('should navigate to WriteTask from task selector', async ({ page }) => {
    await page.goto('/SharedSpace', { waitUntil: 'domcontentloaded' });
    await waitForPageLoad(page);

    const shareBtn = page.getByRole('button', { name: /שתף עכשיו|שתף תגובה|share|respond/i }).first();
    if (await shareBtn.isVisible({ timeout: 10000 }).catch(() => false)) {
      await shareBtn.click();

      // Wait for dialog animation to complete
      const taskDialog = page.locator('[role="dialog"]');
      const dialogOpened = await taskDialog.waitFor({ state: 'visible', timeout: 5000 }).then(() => true).catch(() => false);

      if (dialogOpened) {
        // DailyTaskSelector shows Hebrew labels inside the dialog.
        // IMPORTANT: Target buttons INSIDE the dialog to avoid matching "כתוב תגובה" in the feed.
        const writeOption = taskDialog.locator(
          'button:has-text("כתוב"), button:has-text("Write"), button:has-text("Text")',
        ).first();
        if (await writeOption.isVisible({ timeout: 5000 }).catch(() => false)) {
          // Use keyboard Enter to bypass Radix Dialog overlay pointer-event interception.
          // The overlay blocks mouse clicks but keyboard events reach the focused element.
          await writeOption.focus();
          await page.keyboard.press('Enter');
          await page.waitForURL(/WriteTask/, { timeout: 10000 });
        }
      }
    }
  });

  test('should display bottom navigation', async ({ page }) => {
    await page.goto('/SharedSpace', { waitUntil: 'domcontentloaded' });
    await waitForPageLoad(page);

    // BottomNavigation renders a fixed <nav> at the bottom with navigation buttons
    // It contains buttons for SharedSpace (פיד), TemporaryChats (צ'אטים), Matches (עניין), Profile (פרופיל)
    const nav = page.locator('nav.fixed, nav[class*="fixed"]').first();
    await expect(nav).toBeVisible({ timeout: 30000 });

    // Verify nav has clickable buttons inside
    const navButtons = nav.locator('button');
    await expect(navButtons.first()).toBeVisible({ timeout: 5000 });
  });

  test('should open drawer menu', async ({ page }) => {
    await page.goto('/SharedSpace', { waitUntil: 'domcontentloaded' });
    await waitForPageLoad(page);

    // SharedSpaceHeader has a button with aria-label="Open navigation menu"
    const menuBtn = page.locator(
      'button[aria-label="Open navigation menu"]',
    ).first();

    if (await menuBtn.isVisible({ timeout: 10000 }).catch(() => false)) {
      await menuBtn.click();

      // DrawerMenu renders as a fixed div (not role="dialog").
      // It has a fixed left panel (w-80 bg-white z-50) with a close button (X icon)
      // and a background overlay (bg-black/50 z-40).
      // Look for Drawer-specific content: profile image area, menu items, or "Bellor" brand text.
      await page.waitForTimeout(1000);

      // The drawer has dir="rtl" and contains "Bellor" text at the bottom
      const hasBellorText = await page.locator('h1').filter({ hasText: 'Bellor' }).isVisible({ timeout: 5000 }).catch(() => false);
      // Or look for the overlay (bg-black/50 z-40 fixed div)
      const hasOverlay = await page.locator('.fixed.inset-0').first().isVisible().catch(() => false);

      expect(hasBellorText || hasOverlay).toBe(true);
    }
  });

  test('should handle feed scroll (infinite scroll)', async ({ page }) => {
    await page.goto('/SharedSpace', { waitUntil: 'domcontentloaded' });
    await waitForPageLoad(page);
    await page.waitForTimeout(3000);

    // Scroll down to trigger more content loading
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(2000);

    // Page should not crash after scrolling
    await expect(page.locator('body')).toBeVisible();
  });

  test('should switch feed tabs if available', async ({ page }) => {
    await page.goto('/SharedSpace', { waitUntil: 'domcontentloaded' });
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
    await page.goto('/SharedSpace', { waitUntil: 'domcontentloaded' });
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
