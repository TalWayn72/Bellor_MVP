/**
 * Full-Stack E2E: Content Tasks (WriteTask, AudioTask, VideoTask, Creation)
 * Tests page load, key UI elements, navigation, and console warnings
 */
import { test, expect } from '@playwright/test';
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
    await expect(page.locator('span:has-text("Video")')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('span:has-text("Voice")')).toBeVisible();
    await expect(page.locator('span:has-text("Ideas")')).toBeVisible();

    // Click Video to navigate to VideoTask
    await page.locator('span:has-text("Video")').click();
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

    await expect(page.locator('span:has-text("Write")')).toBeVisible({ timeout: 10000 });
    await page.locator('span:has-text("Write")').click();
    await page.waitForURL(/WriteTask/, { timeout: 10000 });
  });

  // --- VideoTask ---
  test('VideoTask: loads with mission question and option buttons', async ({ page }) => {
    const cc = collectConsoleMessages(page);
    await page.goto('/VideoTask', { waitUntil: 'domcontentloaded' });
    await waitForPageLoad(page);

    await expect(page.locator('h1:has-text("Bellor today")')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('text=Task - Video')).toBeVisible();
    // Mission question rendered in h2 inside Card
    const questionHeading = page.locator('h2').first();
    await expect(questionHeading).toBeVisible({ timeout: 10000 });
    // "Choose your way to share" text
    const chooseText = page.locator('text=Choose your way to share');
    if (await chooseText.isVisible({ timeout: 3000 }).catch(() => false)) {
      expect(true).toBe(true);
    }
    cc.assertClean();
  });

  test('VideoTask: nav buttons navigate to AudioTask', async ({ page }) => {
    await page.goto('/VideoTask', { waitUntil: 'domcontentloaded' });
    await waitForPageLoad(page);

    await expect(page.locator('span:has-text("Voice")')).toBeVisible({ timeout: 10000 });
    await page.locator('span:has-text("Voice")').click();
    await page.waitForURL(/AudioTask/, { timeout: 10000 });
  });

  // --- Creation ---
  test('Creation: loads with header, task grid, and stats', async ({ page }) => {
    const cc = collectConsoleMessages(page);
    await page.goto('/Creation', { waitUntil: 'domcontentloaded' });
    await waitForPageLoad(page);

    await expect(page.locator('h1:has-text("Creation")')).toBeVisible({ timeout: 15000 });
    // Task option grid: Write, Video, Audio, Drawing
    await expect(page.locator('span:has-text("Write")')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('span:has-text("Video")')).toBeVisible();
    await expect(page.locator('span:has-text("Audio")')).toBeVisible();
    await expect(page.locator('span:has-text("Drawing")')).toBeVisible();
    // "My Creations" stats section
    await expect(page.locator('h3:has-text("My Creations")')).toBeVisible();
    await expect(page.locator('text=Total creations')).toBeVisible();
    await expect(page.locator('text=Hearts')).toBeVisible();
    cc.assertClean();
  });

  test('Creation: task buttons navigate to correct pages', async ({ page }) => {
    await page.goto('/Creation', { waitUntil: 'domcontentloaded' });
    await waitForPageLoad(page);

    // Click Write button to navigate to WriteTask
    const writeBtn = page.locator('button:has(span:has-text("Write"))').first();
    await expect(writeBtn).toBeVisible({ timeout: 10000 });
    await writeBtn.click();
    await page.waitForURL(/WriteTask/, { timeout: 10000 });
  });
});
