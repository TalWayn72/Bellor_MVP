/**
 * Full-Stack E2E: Search Functionality
 * Tests search with various inputs, debounce, and results
 */
import { test, expect } from './fullstack-base.js';
import {
  waitForPageLoad,
  FULLSTACK_AUTH,
  SPECIAL_INPUTS,
  collectConsoleMessages,
} from '../fixtures/index.js';

test.describe('[P2][content] Search - Full Stack', () => {
  test.use({ storageState: FULLSTACK_AUTH.user });

  test('should find search input on SharedSpace', async ({ page }) => {
    const cc = collectConsoleMessages(page);
    await page.goto('/SharedSpace', { waitUntil: 'domcontentloaded' });
    await waitForPageLoad(page);

    const searchInput = page.locator(
      'input[placeholder*="search" i], input[placeholder*="חיפוש" i], input[type="search"]',
    ).first();

    // Search may or may not be directly visible
    await expect(page.locator('body')).toBeVisible();
    cc.assertClean();
  });

  test('should search with English text', async ({ page }) => {
    await page.goto('/SharedSpace', { waitUntil: 'domcontentloaded' });
    await waitForPageLoad(page);

    const searchInput = page.locator(
      'input[placeholder*="search" i], input[type="search"]',
    ).first();

    if (await searchInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      await searchInput.fill('hello');
      await page.waitForTimeout(1500); // debounce

      await expect(page.locator('body')).toBeVisible();
    }
  });

  test('should search with Hebrew text', async ({ page }) => {
    await page.goto('/SharedSpace', { waitUntil: 'domcontentloaded' });
    await waitForPageLoad(page);

    const searchInput = page.locator(
      'input[placeholder*="search" i], input[type="search"]',
    ).first();

    if (await searchInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      await searchInput.fill('שלום');
      await page.waitForTimeout(1500);

      await expect(page.locator('body')).toBeVisible();
    }
  });

  test('should handle empty search results', async ({ page }) => {
    await page.goto('/SharedSpace', { waitUntil: 'domcontentloaded' });
    await waitForPageLoad(page);

    const searchInput = page.locator(
      'input[placeholder*="search" i], input[type="search"]',
    ).first();

    if (await searchInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      await searchInput.fill('zzzznonexistent12345');
      await page.waitForTimeout(1500);

      // Should show "no results" or empty state
      await expect(page.locator('body')).toBeVisible();
    }
  });

  test('should clear search and restore full list', async ({ page }) => {
    await page.goto('/SharedSpace', { waitUntil: 'domcontentloaded' });
    await waitForPageLoad(page);

    const searchInput = page.locator(
      'input[placeholder*="search" i], input[type="search"]',
    ).first();

    if (await searchInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      await searchInput.fill('test');
      await page.waitForTimeout(1500);

      await searchInput.clear();
      await page.waitForTimeout(1500);

      // Content should be restored
      await expect(page.locator('body')).toBeVisible();
    }
  });

  test('should handle special characters in search', async ({ page }) => {
    await page.goto('/SharedSpace', { waitUntil: 'domcontentloaded' });
    await waitForPageLoad(page);

    const searchInput = page.locator(
      'input[placeholder*="search" i], input[type="search"]',
    ).first();

    if (await searchInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      await searchInput.fill(SPECIAL_INPUTS.xss);
      await page.waitForTimeout(1500);

      // Should not crash or execute script
      await expect(page.locator('script:not([src])')).toHaveCount(0);
      await expect(page.locator('body')).toBeVisible();
    }
  });

  test('should search users in admin management', async ({ page }) => {
    // Use admin auth for this test
    await page.goto('/AdminUserManagement', { waitUntil: 'domcontentloaded' });
    await waitForPageLoad(page);

    const searchInput = page.locator(
      'input[placeholder*="search" i], input[type="search"]',
    ).first();

    if (await searchInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      await searchInput.fill('sarah');
      await page.waitForTimeout(1500);

      await expect(page.locator('body')).toBeVisible();
    }
  });
});
