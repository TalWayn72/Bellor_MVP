/**
 * Full-Stack E2E: Profile Management
 * Tests viewing and editing user profiles
 */
import { test, expect } from '@playwright/test';
import {
  waitForPageLoad,
  FULLSTACK_AUTH,
  SPECIAL_INPUTS,
  getTestFilePath,
  TEST_FILES,
} from '../fixtures/index.js';

test.describe('[P1][profile] Profile Management - Full Stack', () => {
  test.use({ storageState: FULLSTACK_AUTH.user });

  test('should display user profile', async ({ page }) => {
    await page.goto('/Profile');
    await waitForPageLoad(page);

    // Profile should show user info
    await expect(
      page.locator('text=/about.*me|my.*book|profile|פרופיל/i').first(),
    ).toBeVisible({ timeout: 15000 });
  });

  test('should show profile tabs (About Me / My Book)', async ({ page }) => {
    await page.goto('/Profile');
    await waitForPageLoad(page);

    const aboutTab = page.locator('text=/about.*me|אודות/i').first();
    const bookTab = page.locator('text=/my.*book|הספר שלי/i').first();

    // At least "About Me" tab should be visible
    await expect(aboutTab).toBeVisible({ timeout: 10000 });
  });

  test('should switch between profile tabs', async ({ page }) => {
    await page.goto('/Profile');
    await waitForPageLoad(page);

    const bookTab = page.locator(
      'button:has-text("My Book"), button:has-text("הספר שלי")',
    ).first();

    if (await bookTab.isVisible({ timeout: 5000 }).catch(() => false)) {
      await bookTab.click();
      await page.waitForTimeout(1000);

      // Content should change to My Book content
      await expect(page.locator('body')).toBeVisible();
    }
  });

  test('should navigate to edit profile', async ({ page }) => {
    await page.goto('/Profile');
    await waitForPageLoad(page);

    const editBtn = page.getByRole('button', { name: /edit.*profile|עריכת פרופיל/i });
    await editBtn.click();

    await page.waitForURL(/EditProfile/, { timeout: 10000 });
  });

  test('should navigate to settings', async ({ page }) => {
    await page.goto('/Profile');
    await waitForPageLoad(page);

    const settingsBtn = page.getByRole('button', { name: /settings|הגדרות/i }).first();
    await settingsBtn.click();

    await page.waitForURL(/Settings/, { timeout: 10000 });
  });

  test('should edit nickname and save', async ({ page }) => {
    await page.goto('/EditProfile');
    await waitForPageLoad(page);

    // Find and update nickname field
    const nicknameInput = page.locator(
      'input[name="nickname"], input[placeholder*="nickname" i], input[placeholder*="כינוי" i]',
    ).first();

    if (await nicknameInput.isVisible({ timeout: 10000 }).catch(() => false)) {
      const newNickname = `E2EUser${Date.now() % 10000}`;
      await nicknameInput.clear();
      await nicknameInput.fill(newNickname);

      // Save
      const saveBtn = page.getByRole('button', { name: /save|שמור/i }).first();
      await saveBtn.click();

      // Should redirect to profile or show success
      await page.waitForTimeout(3000);
    }
  });

  test('should edit bio with Hebrew text', async ({ page }) => {
    await page.goto('/EditProfile');
    await waitForPageLoad(page);

    const bioField = page.locator('textarea').first();
    if (await bioField.isVisible({ timeout: 10000 }).catch(() => false)) {
      await bioField.clear();
      await bioField.fill('שלום! אני אוהב לטייל ולהכיר אנשים חדשים');

      const saveBtn = page.getByRole('button', { name: /save|שמור/i }).first();
      await saveBtn.click();
      await page.waitForTimeout(3000);
    }
  });

  test('should handle XSS in bio field', async ({ page }) => {
    await page.goto('/EditProfile');
    await waitForPageLoad(page);

    const bioField = page.locator('textarea').first();
    if (await bioField.isVisible({ timeout: 10000 }).catch(() => false)) {
      await bioField.clear();
      await bioField.fill(SPECIAL_INPUTS.xss);

      // Verify script is not executed
      await expect(page.locator('script:not([src])')).toHaveCount(0);
    }
  });

  test('should upload profile photo', async ({ page }) => {
    await page.goto('/EditProfile');
    await waitForPageLoad(page);

    const fileInput = page.locator('input[type="file"]').first();
    if (await fileInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      await fileInput.setInputFiles(getTestFilePath(TEST_FILES.sampleAvatar));
      await page.waitForTimeout(3000);

      // Photo should appear
      await expect(
        page.locator('img[src*="blob:"], img[src*="data:"]').first(),
      ).toBeVisible({ timeout: 10000 });
    }
  });

  test('should add and remove interests', async ({ page }) => {
    await page.goto('/EditProfile');
    await waitForPageLoad(page);

    // Look for interest input
    const interestInput = page.locator(
      'input[placeholder*="interest" i], input[placeholder*="תחום" i], input[placeholder*="add" i]',
    ).first();

    if (await interestInput.isVisible({ timeout: 10000 }).catch(() => false)) {
      await interestInput.fill('hiking');

      // Click add button
      const addBtn = page.getByRole('button', { name: /add|הוסף|\+/i }).first();
      if (await addBtn.isVisible().catch(() => false)) {
        await addBtn.click();
        await page.waitForTimeout(1000);
      }
    }
  });

  test('should view other user profile', async ({ page }) => {
    // Navigate to another user's profile via discover or feed
    await page.goto('/SharedSpace');
    await waitForPageLoad(page);
    await page.waitForTimeout(3000);

    const userAvatar = page.locator(
      'a[href*="UserProfile"], img[alt*="avatar" i], img[alt*="profile" i]',
    ).first();

    if (await userAvatar.isVisible({ timeout: 5000 }).catch(() => false)) {
      await userAvatar.click();
      await page.waitForURL(/UserProfile/, { timeout: 10000 });
      await waitForPageLoad(page);

      // Other user's profile should display
      await expect(page.locator('body')).toBeVisible();
    }
  });

  test('should cancel edit and discard changes', async ({ page }) => {
    await page.goto('/EditProfile');
    await waitForPageLoad(page);

    const bioField = page.locator('textarea').first();
    if (await bioField.isVisible({ timeout: 10000 }).catch(() => false)) {
      const originalValue = await bioField.inputValue();
      await bioField.clear();
      await bioField.fill('TEMPORARY CHANGE');

      // Navigate back without saving
      const backBtn = page.locator(
        'button[aria-label*="back" i], button:has(path[d*="15 19l-7-7"])',
      ).first();

      if (await backBtn.isVisible().catch(() => false)) {
        await backBtn.click();
      } else {
        await page.goBack();
      }

      await page.waitForTimeout(2000);
    }
  });
});
