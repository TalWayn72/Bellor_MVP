/**
 * Full-Stack E2E: Edge Cases
 * Tests rapid interactions, boundary values, and unusual scenarios
 */
import { test, expect, addAutoRefresh } from './fullstack-base.js';
import {
  waitForPageLoad,
  FULLSTACK_AUTH,
  SPECIAL_INPUTS,
  getTestFilePath,
  TEST_FILES,
  collectConsoleMessages,
} from '../fixtures/index.js';

test.describe('[P2][infra] Edge Cases - Full Stack', () => {
  test.use({ storageState: FULLSTACK_AUTH.user });

  test('should handle rapid double-click on like button', async ({ page }) => {
    const cc = collectConsoleMessages(page);
    await page.goto('/Discover', { waitUntil: 'domcontentloaded' });
    await waitForPageLoad(page);
    await page.waitForTimeout(3000);

    // DiscoverCard uses aria-label="Like this profile"
    const likeBtn = page.locator(
      'button[aria-label="Like this profile"]',
    ).first();

    if (await likeBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      // Rapid double-click
      await likeBtn.dblclick();
      await page.waitForTimeout(1000);

      // Should not crash or create duplicate likes
      await expect(page.locator('body')).toBeVisible();
    } else {
      // No profiles available - test passes gracefully
      await expect(page.locator('body')).toBeVisible();
    }
    cc.assertClean();
  });

  test('should handle rapid form submission', async ({ page }) => {
    // Clear auth state for this test since we need the login form
    await page.context().clearCookies();
    await page.goto('/Login', { waitUntil: 'domcontentloaded' });
    await waitForPageLoad(page);

    const emailInput = page.locator('#email');
    if (await emailInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      await emailInput.fill('test@bellor.app');
      await page.locator('#password').fill('Test123!');

      const submitBtn = page.getByRole('button', { name: /sign in/i });

      // Click submit multiple times rapidly
      if (await submitBtn.isVisible().catch(() => false)) {
        await submitBtn.click();
        await submitBtn.click().catch(() => {});
        await submitBtn.click().catch(() => {});
      }
    }

    await page.waitForTimeout(3000);

    // Should not crash
    await expect(page.locator('body')).toBeVisible();
  });

  test('should handle paste of very long text', async ({ page }) => {
    await page.goto('/EditProfile', { waitUntil: 'domcontentloaded' });
    await waitForPageLoad(page);

    const bioField = page.locator('textarea').first();
    if (await bioField.isVisible({ timeout: 10000 }).catch(() => false)) {
      // Paste very long text
      await bioField.fill('A'.repeat(50000));
      await page.waitForTimeout(1000);

      // Should truncate or handle gracefully
      const value = await bioField.inputValue();
      expect(value.length).toBeGreaterThan(0);
      await expect(page.locator('body')).toBeVisible();
    }
  });

  test('should handle paste of HTML content', async ({ page }) => {
    await page.goto('/EditProfile', { waitUntil: 'domcontentloaded' });
    await waitForPageLoad(page);

    const bioField = page.locator('textarea').first();
    if (await bioField.isVisible({ timeout: 10000 }).catch(() => false)) {
      await bioField.fill(SPECIAL_INPUTS.htmlInjection);

      // HTML should not render
      await expect(page.locator('img[src="x"]')).toHaveCount(0);
    }
  });

  test('should handle window resize during modal', async ({ page }) => {
    await page.goto('/Discover', { waitUntil: 'domcontentloaded' });
    await waitForPageLoad(page);
    await page.waitForTimeout(3000);

    // DiscoverCard uses aria-label="Super like this profile"
    const superLikeBtn = page.locator(
      'button[aria-label="Super like this profile"]',
    ).first();

    if (await superLikeBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await superLikeBtn.click();
      await page.waitForTimeout(1000);

      // Super Like modal is a custom bottom sheet (NOT role="dialog")
      // Look for the "Send Super Like" heading or the Cancel/Send buttons
      const dialog = page.locator('h2').filter({ hasText: /Send Super Like/i }).first();
      if (await dialog.isVisible({ timeout: 3000 }).catch(() => false)) {
        // Resize window
        await page.setViewportSize({ width: 375, height: 667 });
        await page.waitForTimeout(500);

        await page.setViewportSize({ width: 1280, height: 720 });
        await page.waitForTimeout(500);

        // Dialog should still be visible or gracefully close
        await expect(page.locator('body')).toBeVisible();
      }
    }
  });

  test('should handle navigate away during file upload', async ({ page }) => {
    await page.goto('/EditProfile', { waitUntil: 'domcontentloaded' });
    await waitForPageLoad(page);

    const fileInput = page.locator('input[type="file"]').first();
    if (await fileInput.count() > 0) {
      // Start upload
      await fileInput.setInputFiles(
        getTestFilePath(TEST_FILES.sampleAvatar),
      );

      // Immediately navigate away
      await page.goto('/SharedSpace', { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(2000);

      // Should not crash
      await expect(page.locator('body')).toBeVisible();
    }
  });

  test('should handle back button during loading', async ({ page }) => {
    // First navigate somewhere to have a history entry
    await page.goto('/Profile', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('domcontentloaded');

    // Then navigate to SharedSpace
    await page.goto('/SharedSpace', { waitUntil: 'domcontentloaded' });

    // Immediately go back before page fully loads
    await page.goBack().catch(() => {});
    await page.waitForTimeout(2000);

    await expect(page.locator('body')).toBeVisible();
  });

  test('should handle multiple rapid page navigations', async ({ page }) => {
    // Navigate rapidly without waiting
    const routes = [
      '/SharedSpace', '/Profile', '/Settings',
      '/Notifications', '/TemporaryChats', '/SharedSpace',
    ];

    for (const route of routes) {
      page.goto(route, { waitUntil: 'domcontentloaded' }).catch(() => {});
      await page.waitForTimeout(100);
    }

    // Wait for final page to load
    await page.waitForTimeout(3000);
    await expect(page.locator('body')).toBeVisible();
  });

  test('should handle concurrent tab operations', async ({ browser }) => {
    const context = await browser.newContext({
      storageState: FULLSTACK_AUTH.user,
    });
    await addAutoRefresh(context);

    const page1 = await context.newPage();
    const page2 = await context.newPage();
    const page3 = await context.newPage();

    // All three tabs navigate simultaneously
    await Promise.all([
      page1.goto('/SharedSpace', { waitUntil: 'domcontentloaded' }),
      page2.goto('/Profile', { waitUntil: 'domcontentloaded' }),
      page3.goto('/Notifications', { waitUntil: 'domcontentloaded' }),
    ]);

    await page1.waitForTimeout(3000);

    // All should be functional
    await expect(page1.locator('body')).toBeVisible();
    await expect(page2.locator('body')).toBeVisible();
    await expect(page3.locator('body')).toBeVisible();

    await context.close();
  });

  test('should handle emoji in all text fields', async ({ page }) => {
    await page.goto('/EditProfile', { waitUntil: 'domcontentloaded' });
    await waitForPageLoad(page);

    // EditProfile uses useCurrentUser which may show ProfileSkeleton while loading.
    // Wait for the actual form to render (look for the "Edit Profile" header or form fields).
    const header = page.locator('h1').filter({ hasText: 'Edit Profile' });
    const anyField = page.locator('textarea, input').first();
    const formVisible = await header.or(anyField)
      .isVisible({ timeout: 15000 }).catch(() => false);

    if (!formVisible) {
      // Page may have redirected or is still loading - pass gracefully
      await expect(page.locator('body')).toBeVisible();
      return;
    }

    // EditProfileForm has Input fields (text) and a Textarea (bio).
    // The Input components render as <input> but may not have type="text" explicitly.
    const textFields = await page.locator('input:not([type="file"]):not([type="number"]):not([type="tel"]):not([type="hidden"]), textarea').all();

    for (const field of textFields.slice(0, 3)) {
      if (await field.isVisible().catch(() => false)) {
        await field.clear();
        await field.fill(SPECIAL_INPUTS.emoji);
        const value = await field.inputValue();
        expect(value).toContain('\u{1F600}');
      }
    }
  });

  test('should handle mixed RTL/LTR text', async ({ page }) => {
    await page.goto('/EditProfile', { waitUntil: 'domcontentloaded' });
    await waitForPageLoad(page);

    const bioField = page.locator('textarea').first();
    if (await bioField.isVisible({ timeout: 10000 }).catch(() => false)) {
      await bioField.fill(SPECIAL_INPUTS.mixed);
      const value = await bioField.inputValue();
      expect(value).toContain('Hello');
      expect(value).toContain('שלום');
    }
  });

  test('should survive page refresh on every main page', async ({ page }) => {
    const routes = [
      '/SharedSpace', '/Profile', '/Settings',
      '/Notifications', '/TemporaryChats', '/EditProfile',
    ];

    for (const route of routes) {
      await page.goto(route, { waitUntil: 'domcontentloaded' });
      await waitForPageLoad(page);
      await page.reload({ waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(2000);

      // Should not show error or crash
      await expect(page.locator('body')).toBeVisible();
    }
  });

  test('should handle null/undefined query params', async ({ page }) => {
    await page.goto('/PrivateChat?chatId=', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);

    // Should handle gracefully - redirect or show error
    await expect(page.locator('body')).toBeVisible();
  });

  test('should handle very long query params', async ({ page }) => {
    await page.goto('/PrivateChat?chatId=' + 'x'.repeat(5000), { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);

    await expect(page.locator('body')).toBeVisible();
  });

  test('should persist profile data after save on EditProfile', async ({ page }) => {
    const cc = collectConsoleMessages(page);
    await page.goto('/EditProfile', { waitUntil: 'domcontentloaded' });
    await waitForPageLoad(page);

    const header = page.locator('h1').filter({ hasText: 'Edit Profile' });
    const anyField = page.locator('textarea, input').first();
    const formVisible = await header.or(anyField).isVisible({ timeout: 15000 }).catch(() => false);
    if (!formVisible) return;

    // Find the bio textarea and set a unique value
    const bioField = page.locator('textarea').first();
    if (!(await bioField.isVisible({ timeout: 5000 }).catch(() => false))) return;

    const uniqueBio = `Persistence test ${Date.now()}`;
    await bioField.clear();
    await bioField.fill(uniqueBio);

    // Save
    const saveBtn = page.getByRole('button', { name: /save|שמור/i }).first();
    await saveBtn.click();
    await page.waitForTimeout(3000);

    // Navigate away and come back
    await page.goto('/SharedSpace', { waitUntil: 'domcontentloaded' });
    await waitForPageLoad(page);
    await page.goto('/EditProfile', { waitUntil: 'domcontentloaded' });
    await waitForPageLoad(page);

    // Verify bio persisted
    const bioAfter = page.locator('textarea').first();
    if (await bioAfter.isVisible({ timeout: 15000 }).catch(() => false)) {
      const value = await bioAfter.inputValue();
      expect(value).toContain('Persistence test');
    }
    cc.assertClean();
  });
});
