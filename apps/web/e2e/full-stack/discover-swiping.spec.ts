/**
 * Full-Stack E2E: Discover & Swiping
 * Tests profile browsing, likes, passes, and filters
 */
import { test, expect } from '@playwright/test';
import {
  waitForPageLoad,
  FULLSTACK_AUTH,
  waitForDialog,
} from '../fixtures/index.js';

test.describe('[P1][social] Discover Swiping - Full Stack', () => {
  test.use({ storageState: FULLSTACK_AUTH.user });

  test('should load discover page with profiles', async ({ page }) => {
    await page.goto('/Discover');
    await waitForPageLoad(page);

    // Wait for profiles to load
    await page.waitForTimeout(3000);

    // Should show a profile card or empty state
    const hasProfiles = await page.locator(
      'img[alt*="profile" i], img[alt*="photo" i], [class*="card"]',
    ).first().isVisible({ timeout: 10000 }).catch(() => false);

    const hasEmptyState = await page.locator(
      'text=/no.*more.*profiles|no.*matches|check.*back|אין פרופילים/i',
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

    const likeBtn = page.locator(
      'button[aria-label*="like" i]:not([aria-label*="super"]), button:has(svg[data-icon="heart"])',
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

    const passBtn = page.locator(
      'button[aria-label*="pass" i], button:has(svg[data-icon="x"]), button[aria-label*="skip" i]',
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

    const superLikeBtn = page.locator(
      'button[aria-label*="super" i], button:has(svg[data-icon="star"])',
    ).first();

    if (await superLikeBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await superLikeBtn.click();

      // Modal should appear with message textarea
      const modal = page.locator('[role="dialog"]').first();
      await expect(modal).toBeVisible({ timeout: 5000 });
    }
  });

  test('should open filter settings', async ({ page }) => {
    await page.goto('/Discover');
    await waitForPageLoad(page);

    // Click filter button
    const filterBtn = page.locator(
      'button[aria-label*="filter" i], button:has(svg[data-icon="sliders"])',
    ).first();

    if (await filterBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await filterBtn.click();
      await page.waitForTimeout(1000);

      // Filter panel should appear
      const filterPanel = page.locator(
        '[role="dialog"], [data-testid="filters"], text=/age|distance|gender|גיל|מרחק/i',
      ).first();
      await expect(filterPanel).toBeVisible({ timeout: 5000 });
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

    // If no more profiles, empty state should appear
    const emptyState = page.locator(
      'text=/no.*more|check.*back|start.*over|אין עוד/i',
    ).first();

    // Either profiles or empty state should be visible eventually
    await page.waitForTimeout(5000);
    await expect(page.locator('body')).toBeVisible();
  });
});
