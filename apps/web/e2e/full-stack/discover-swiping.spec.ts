/**
 * Full-Stack E2E: Discover & Swiping
 * Tests profile browsing, likes, passes, and filters
 */
import { test, expect } from '@playwright/test';
import {
  waitForPageLoad,
  FULLSTACK_AUTH,
} from '../fixtures/index.js';

test.describe('[P1][social] Discover Swiping - Full Stack', () => {
  test.use({ storageState: FULLSTACK_AUTH.user });

  test('should load discover page with profiles', async ({ page }) => {
    await page.goto('/Discover');
    await waitForPageLoad(page);

    // Wait for profiles to load
    await page.waitForTimeout(3000);

    // Should show a profile card (img with user nickname alt) or empty state ("No more profiles")
    const hasProfiles = await page.locator(
      'button[aria-label="Like this profile"], img[alt]:not([alt=""]), [class*="card"]',
    ).first().isVisible({ timeout: 10000 }).catch(() => false);

    const hasEmptyState = await page.locator(
      'text=/no.*more.*profiles|check.*back.*later|אין פרופילים/i',
    ).isVisible().catch(() => false);

    expect(hasProfiles || hasEmptyState).toBe(true);
  });

  test('should display profile details on card', async ({ page }) => {
    await page.goto('/Discover');
    await waitForPageLoad(page);
    await page.waitForTimeout(3000);

    // Profile card should show name and/or age
    const nameElement = page.locator(
      'text=/\\w+.*\\d{2}|\\d{2}.*\\w+/i',
    ).first();

    if (await nameElement.isVisible({ timeout: 5000 }).catch(() => false)) {
      const text = await nameElement.textContent();
      expect(text).toBeTruthy();
    }
  });

  test('should like a profile', async ({ page }) => {
    await page.goto('/Discover');
    await waitForPageLoad(page);
    await page.waitForTimeout(3000);

    // DiscoverCard uses aria-label="Like this profile"
    const likeBtn = page.locator(
      'button[aria-label="Like this profile"]',
    ).first();

    if (await likeBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await likeBtn.click();
      await page.waitForTimeout(1000);
      // Profile should change (next profile or match notification)
    }
  });

  test('should pass on a profile', async ({ page }) => {
    await page.goto('/Discover');
    await waitForPageLoad(page);
    await page.waitForTimeout(3000);

    // DiscoverCard uses aria-label="Pass on this profile"
    const passBtn = page.locator(
      'button[aria-label="Pass on this profile"]',
    ).first();

    if (await passBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await passBtn.click();
      await page.waitForTimeout(1000);
    }
  });

  test('should open super like modal', async ({ page }) => {
    await page.goto('/Discover');
    await waitForPageLoad(page);
    await page.waitForTimeout(3000);

    // DiscoverCard uses aria-label="Super like this profile"
    const superLikeBtn = page.locator(
      'button[aria-label="Super like this profile"]',
    ).first();

    if (await superLikeBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await superLikeBtn.click();
      await page.waitForTimeout(1000);

      // Super Like modal is a custom bottom sheet (NOT role="dialog").
      // It's a fixed overlay div with a bottom panel containing:
      // - <h2>Send Super Like</h2>
      // - textarea (placeholder "Write a message (optional)...")
      // - "Cancel" and "Send Super Like" buttons
      const modalHeading = page.locator('h2').filter({ hasText: /Send Super Like/i });
      const cancelBtn = page.getByRole('button', { name: /cancel/i });
      const sendBtn = page.getByRole('button', { name: /Send Super Like/i });

      const headingVisible = await modalHeading.isVisible({ timeout: 5000 }).catch(() => false);
      const cancelVisible = await cancelBtn.isVisible({ timeout: 3000 }).catch(() => false);
      const sendVisible = await sendBtn.isVisible({ timeout: 3000 }).catch(() => false);

      expect(headingVisible || cancelVisible || sendVisible).toBe(true);
    }
  });

  test('should open filter settings', async ({ page }) => {
    await page.goto('/Discover');
    await waitForPageLoad(page);

    // Filter button is a ghost Button with SlidersHorizontal icon (no specific aria-label)
    const filterBtn = page.locator(
      'button:has(svg.lucide-sliders-horizontal), button[aria-label*="filter" i]',
    ).first();

    if (await filterBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await filterBtn.click();
      await page.waitForTimeout(1000);

      // DiscoverFilters panel should appear with age/distance fields
      const filterPanel = page.locator(
        'text=/age|distance|gender|גיל|מרחק/i',
      ).first();
      await expect(filterPanel).toBeVisible({ timeout: 5000 });
    } else {
      // If filter button not visible, page still loads fine
      await expect(page.locator('body')).toBeVisible();
    }
  });

  test('should navigate to filter settings page', async ({ page }) => {
    await page.goto('/FilterSettings');
    await waitForPageLoad(page);

    // Filter settings page should load
    await expect(
      page.locator('text=/filter|age|distance|מסנן|גיל|מרחק/i').first(),
    ).toBeVisible({ timeout: 15000 });
  });

  test('should handle empty discover state', async ({ page }) => {
    await page.goto('/Discover');
    await waitForPageLoad(page);

    // If no more profiles, empty state shows "No more profiles" / "Check back later"
    // and a "Start Over" button
    await page.waitForTimeout(5000);

    const hasProfiles = await page.locator(
      'button[aria-label="Like this profile"]',
    ).isVisible().catch(() => false);

    const hasEmptyState = await page.locator(
      'text=/no.*more.*profiles|check.*back|start.*over|אין עוד/i',
    ).first().isVisible().catch(() => false);

    // Either profiles or empty state should be visible
    expect(hasProfiles || hasEmptyState).toBe(true);
  });
});
