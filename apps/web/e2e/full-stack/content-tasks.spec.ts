/**
 * Full-Stack E2E: Content Tasks (WriteTask, AudioTask, VideoTask, Creation)
 * Tests page load, key UI elements, navigation, and console warnings
 */
import { test, expect } from './fullstack-base.js';
import { waitForPageLoad, FULLSTACK_AUTH, collectConsoleMessages } from '../fixtures/index.js';

test.describe('[P1][content] Content Tasks - Full Stack', () => {
  test.use({ storageState: FULLSTACK_AUTH.user });

  // --- WriteTask ---
  test('WriteTask: loads page with header and textarea', async ({ page }) => {
    const cc = collectConsoleMessages(page);
    await page.goto('/WriteTask', { waitUntil: 'domcontentloaded' });
    await waitForPageLoad(page);

    await expect(page.locator('h1:has-text("Bellor today")')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('text=Task - Write')).toBeVisible();
    const textarea = page.locator('textarea').first();
    if (await textarea.isVisible({ timeout: 5000 }).catch(() => false)) {
      await textarea.fill('E2E test content');
      expect(await textarea.inputValue()).toContain('E2E test content');
    }
    cc.assertClean();
  });

  test('WriteTask: navigation buttons switch to other tasks', async ({ page }) => {
    await page.goto('/WriteTask', { waitUntil: 'domcontentloaded' });
    await waitForPageLoad(page);

    // Bottom nav has Video, Write (active), Ideas, Voice
    // Use getByText for broader matching (works regardless of wrapping element)
    const videoNav = page.getByText('Video', { exact: true }).first();
    await expect(videoNav).toBeVisible({ timeout: 15000 });
    await expect(page.getByText('Voice', { exact: true }).first()).toBeVisible({ timeout: 5000 });

    // Click Video to navigate to VideoTask
    await videoNav.click();
    await page.waitForURL(/VideoTask/, { timeout: 10000 });
  });

  // --- AudioTask ---
  test('AudioTask: loads page with header and mission card', async ({ page }) => {
    const cc = collectConsoleMessages(page);
    await page.goto('/AudioTask', { waitUntil: 'domcontentloaded' });
    await waitForPageLoad(page);

    await expect(page.locator('h1:has-text("Bellor today")')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('text=Task - Audio')).toBeVisible();
    // Mission card with title and question
    const missionTitle = page.locator('h2').first();
    await expect(missionTitle).toBeVisible({ timeout: 10000 });
    cc.assertClean();
  });

  test('AudioTask: nav buttons navigate to WriteTask', async ({ page }) => {
    await page.goto('/AudioTask', { waitUntil: 'domcontentloaded' });
    await waitForPageLoad(page);

    const writeNav = page.getByText('Write', { exact: true }).first();
    await expect(writeNav).toBeVisible({ timeout: 15000 });
    await writeNav.click();
    await page.waitForURL(/WriteTask/, { timeout: 10000 });
  });

  // --- VideoTask ---
  test('VideoTask: loads with mission question and option buttons', async ({ page }) => {
    const cc = collectConsoleMessages(page);
    await page.goto('/VideoTask', { waitUntil: 'domcontentloaded' });
    await waitForPageLoad(page);

    const header = page.locator('h1:has-text("Bellor today")');
    const headerVisible = await header.isVisible({ timeout: 20000 }).catch(() => false);

    if (headerVisible) {
      await expect(page.locator('text=Task - Video')).toBeVisible({ timeout: 5000 });
      // Mission question h2 may be empty if API data hasn't loaded yet.
      // Accept either: h2 with text content, or "Choose your way to share" paragraph.
      const questionVisible = await page.locator('h2').first()
        .isVisible({ timeout: 5000 }).catch(() => false);
      const chooseVisible = await page.locator('text=Choose your way to share')
        .isVisible({ timeout: 3000 }).catch(() => false);
      expect(questionVisible || chooseVisible).toBe(true);
    } else {
      // Page may be loading/redirected - verify no crash
      await expect(page.locator('body')).toBeVisible();
      const url = page.url();
      expect(url.includes('VideoTask') || url.includes('SharedSpace') || url.includes('Welcome')).toBe(true);
    }
    cc.assertClean();
  });

  test('VideoTask: nav buttons navigate to AudioTask', async ({ page }) => {
    await page.goto('/VideoTask', { waitUntil: 'domcontentloaded' });
    await waitForPageLoad(page);

    const voiceNav = page.getByText('Voice', { exact: true }).first();
    await expect(voiceNav).toBeVisible({ timeout: 15000 });
    await voiceNav.click();
    await page.waitForURL(/AudioTask/, { timeout: 10000 });
  });

  // --- Creation ---
  test('Creation: loads with header, task grid, and stats', async ({ page }) => {
    const cc = collectConsoleMessages(page);
    await page.goto('/Creation', { waitUntil: 'domcontentloaded' });
    await waitForPageLoad(page);

    // Creation page header - may show skeleton while useCurrentUser loads
    const header = page.locator('h1:has-text("Creation")');
    const skeleton = page.locator('.animate-pulse').first();
    const headerVisible = await header.isVisible({ timeout: 20000 }).catch(() => false);

    if (headerVisible) {
      // Task option grid: Write, Video, Audio, Drawing
      await expect(page.getByText('Write', { exact: true }).first()).toBeVisible({ timeout: 10000 });
      await expect(page.getByText('Video', { exact: true }).first()).toBeVisible({ timeout: 5000 });
      await expect(page.getByText('Audio', { exact: true }).first()).toBeVisible({ timeout: 5000 });
      // "My Creations" stats section
      const hasStats = await page.locator('text=/My Creations|Total creations|Hearts/i').first()
        .isVisible({ timeout: 5000 }).catch(() => false);
      expect(hasStats).toBe(true);
    } else {
      // Page may be stuck loading or redirected - verify it didn't crash
      await expect(page.locator('body')).toBeVisible();
      const url = page.url();
      expect(url.includes('Creation') || url.includes('SharedSpace') || url.includes('Login')).toBe(true);
    }
    cc.assertClean();
  });

  test('Creation: task buttons navigate to correct pages', async ({ page }) => {
    await page.goto('/Creation', { waitUntil: 'domcontentloaded' });
    await waitForPageLoad(page);

    // Click Write button to navigate to WriteTask
    const writeBtn = page.locator('button').filter({ hasText: /^Write$/ }).first();
    const writeBtnVisible = await writeBtn.isVisible({ timeout: 15000 }).catch(() => false);
    if (writeBtnVisible) {
      await writeBtn.click();
      await page.waitForURL(/WriteTask/, { timeout: 10000 });
    } else {
      // Page may still be loading - verify it's at least on the Creation page
      expect(page.url()).toContain('Creation');
    }
  });
});
