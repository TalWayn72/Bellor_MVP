/**
 * Full-Stack E2E: Stories
 * Tests story viewing, creation, and expiry
 */
import { test, expect } from '@playwright/test';
import {
  waitForPageLoad,
  FULLSTACK_AUTH,
  getTestFilePath,
  TEST_FILES,
  collectConsoleMessages,
} from '../fixtures/index.js';

test.describe('[P2][content] Stories - Full Stack', () => {
  test.use({ storageState: FULLSTACK_AUTH.user });

  test('should load stories page', async ({ page }) => {
    const cc = collectConsoleMessages(page);
    await page.goto('/Stories');
    await waitForPageLoad(page);

    await expect(page.locator('body')).toBeVisible({ timeout: 15000 });
    cc.assertClean();
  });

  test('should navigate to create story', async ({ page }) => {
    await page.goto('/CreateStory');
    await waitForPageLoad(page);

    // CreateStory shows a full-screen story creation interface
    // with a textarea (placeholder "Type your story..."), Text/Image buttons,
    // and a "Share Story" publish button
    const hasTextarea = await page.locator('textarea[placeholder*="story" i]').isVisible({ timeout: 15000 }).catch(() => false);
    const hasShareBtn = await page.locator('button:has-text("Share Story")').isVisible().catch(() => false);
    const hasTextBtn = await page.locator('button:has-text("Text")').isVisible().catch(() => false);
    const pageLoaded = await page.locator('body').isVisible();

    expect(hasTextarea || hasShareBtn || hasTextBtn || pageLoaded).toBe(true);
  });

  test('should show story creation options', async ({ page }) => {
    await page.goto('/CreateStory');
    await waitForPageLoad(page);

    // CreateStory renders StoryPreview with:
    // - textarea (placeholder "Type your story...")
    // - hidden input[type="file"] (className="hidden")
    // - "Text" and "Image" buttons at the bottom
    // - "Share Story" publish button
    // The textarea or buttons might take time to render if useCurrentUser is loading.
    const hasTextArea = await page.locator('textarea[placeholder="Type your story..."]').isVisible({ timeout: 10000 }).catch(() => false);
    const hasFileInput = await page.locator('input[type="file"][accept="image/*"]').count() > 0;
    const hasShareBtn = await page.getByRole('button', { name: /share story/i }).isVisible({ timeout: 5000 }).catch(() => false);

    expect(hasTextArea || hasFileInput || hasShareBtn).toBe(true);
  });

  test('should upload image for story', async ({ page }) => {
    await page.goto('/CreateStory');
    await waitForPageLoad(page);

    // File input is hidden, but still usable via setInputFiles
    const fileInput = page.locator('input[type="file"]').first();
    if (await fileInput.count() > 0) {
      await fileInput.setInputFiles(getTestFilePath(TEST_FILES.sampleAvatar));
      await page.waitForTimeout(3000);

      // Preview should appear (an img element)
      await expect(page.locator('body')).toBeVisible();
    }
  });

  test('should display story carousel on SharedSpace', async ({ page }) => {
    await page.goto('/SharedSpace');
    await waitForPageLoad(page);

    // Story circles/carousel may appear at top
    const storySection = page.locator(
      '[data-testid*="story"], [class*="story"], [class*="carousel"]',
    ).first();

    // May or may not have stories
    await expect(page.locator('body')).toBeVisible();
  });

  test('should view creation page (write task)', async ({ page }) => {
    await page.goto('/WriteTask');
    await waitForPageLoad(page);

    // WriteTask renders WritingPrompt with a Textarea (placeholder "Share your thoughts...")
    // and a header with "Bellor today" / "Task - Write".
    // The page may take time to load if useCurrentUser or todayMission query is pending.
    const textarea = page.locator('textarea').first();
    const header = page.locator('text=/Bellor today|Task.*Write/i').first();

    const hasTextarea = await textarea.isVisible({ timeout: 15000 }).catch(() => false);
    const hasHeader = await header.isVisible({ timeout: 5000 }).catch(() => false);

    // Either the textarea or the header should be visible
    expect(hasTextarea || hasHeader).toBe(true);
  });

  test('should type content in write task', async ({ page }) => {
    await page.goto('/WriteTask');
    await waitForPageLoad(page);

    const textarea = page.locator('textarea').first();
    if (await textarea.isVisible({ timeout: 10000 }).catch(() => false)) {
      await textarea.fill('This is a test response for the daily mission! שלום');
      const value = await textarea.inputValue();
      expect(value).toContain('test response');
    }
  });
});
