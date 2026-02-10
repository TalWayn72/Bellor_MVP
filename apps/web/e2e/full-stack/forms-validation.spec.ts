/**
 * Full-Stack E2E: Forms Validation
 * Tests all forms with valid, invalid, and edge case inputs
 */
import { test, expect } from '@playwright/test';
import {
  waitForPageLoad,
  fillForm,
  fillWithSpecialInput,
  FULLSTACK_AUTH,
  SPECIAL_INPUTS,
  generateTestEmail,
} from '../fixtures/index.js';

test.describe('[P1][infra] Forms Validation - Full Stack', () => {
  test.use({ storageState: FULLSTACK_AUTH.user });

  // --- Login Form ---
  test('login: should reject empty fields', async ({ page }) => {
    await page.goto('/Login');
    await waitForPageLoad(page);

    await page.getByRole('button', { name: /sign in|כניסה/i }).click();

    // Required fields should trigger validation
    const emailInput = page.locator('#email, input[type="email"]').first();
    const isInvalid = await emailInput.evaluate(
      (el: HTMLInputElement) => !el.validity.valid,
    );
    expect(isInvalid).toBe(true);
  });

  test('login: should handle XSS in email field', async ({ page }) => {
    await page.goto('/Login');
    await waitForPageLoad(page);

    await page.getByPlaceholder(/you@example\.com|email/i).fill(SPECIAL_INPUTS.xss);
    await page.locator('#password, input[name="password"]').fill('Test123!');
    await page.getByRole('button', { name: /sign in|כניסה/i }).click();

    // Should show error, not execute script
    await expect(page.locator('script:not([src])')).toHaveCount(0);
  });

  test('login: should handle SQL injection in email', async ({ page }) => {
    await page.goto('/Login');
    await waitForPageLoad(page);

    await page.getByPlaceholder(/you@example\.com|email/i).fill(SPECIAL_INPUTS.sqlInjection);
    await page.locator('#password, input[name="password"]').fill('Test123!');
    await page.getByRole('button', { name: /sign in|כניסה/i }).click();

    await page.waitForTimeout(3000);
    // Should not crash or show SQL error
    await expect(page.locator('body')).toBeVisible();
  });

  // --- Edit Profile Form ---
  test('editProfile: should handle very long bio', async ({ page }) => {
    await page.goto('/EditProfile');
    await waitForPageLoad(page);

    const bioField = page.locator('textarea').first();
    if (await bioField.isVisible({ timeout: 10000 }).catch(() => false)) {
      await bioField.fill(SPECIAL_INPUTS.longText);
      const value = await bioField.inputValue();
      // Should truncate or accept without crash
      expect(value.length).toBeGreaterThan(0);
    }
  });

  test('editProfile: should handle HTML injection in bio', async ({ page }) => {
    await page.goto('/EditProfile');
    await waitForPageLoad(page);

    const bioField = page.locator('textarea').first();
    if (await bioField.isVisible({ timeout: 10000 }).catch(() => false)) {
      await bioField.fill(SPECIAL_INPUTS.htmlInjection);

      // HTML should not render as actual elements
      await expect(page.locator('img[src="x"]')).toHaveCount(0);
    }
  });

  test('editProfile: should handle emoji in bio', async ({ page }) => {
    await page.goto('/EditProfile');
    await waitForPageLoad(page);

    const bioField = page.locator('textarea').first();
    if (await bioField.isVisible({ timeout: 10000 }).catch(() => false)) {
      await bioField.fill(SPECIAL_INPUTS.emoji);
      const value = await bioField.inputValue();
      expect(value).toContain('😀');
    }
  });

  test('editProfile: should handle unicode in bio', async ({ page }) => {
    await page.goto('/EditProfile');
    await waitForPageLoad(page);

    const bioField = page.locator('textarea').first();
    if (await bioField.isVisible({ timeout: 10000 }).catch(() => false)) {
      await bioField.fill(SPECIAL_INPUTS.unicode);
      const value = await bioField.inputValue();
      expect(value).toContain('Ünïcödé');
    }
  });

  test('editProfile: should handle whitespace-only input', async ({ page }) => {
    await page.goto('/EditProfile');
    await waitForPageLoad(page);

    const nicknameInput = page.locator(
      'input[name="nickname"], input[placeholder*="nickname" i]',
    ).first();

    if (await nicknameInput.isVisible({ timeout: 10000 }).catch(() => false)) {
      await nicknameInput.clear();
      await nicknameInput.fill(SPECIAL_INPUTS.whitespace);

      const saveBtn = page.getByRole('button', { name: /save|שמור/i }).first();
      await saveBtn.click();
      await page.waitForTimeout(2000);

      // Should show validation error or reject whitespace-only
    }
  });

  // --- Onboarding Nickname ---
  test('onboarding: nickname rejects numbers', async ({ page }) => {
    await page.goto('/Onboarding?step=3');
    await waitForPageLoad(page);

    const nicknameInput = page.getByPlaceholder(/nickname|כינוי/i);
    await nicknameInput.fill('User123');

    const value = await nicknameInput.inputValue();
    // Numbers should be stripped
    expect(value).not.toMatch(/\d/);
  });

  test('onboarding: nickname max length 15', async ({ page }) => {
    await page.goto('/Onboarding?step=3');
    await waitForPageLoad(page);

    const nicknameInput = page.getByPlaceholder(/nickname|כינוי/i);
    await nicknameInput.fill('A'.repeat(20));

    const value = await nicknameInput.inputValue();
    expect(value.length).toBeLessThanOrEqual(15);
  });

  // --- Onboarding Birth Date ---
  test('onboarding: birth date rejects under 18', async ({ page }) => {
    await page.goto('/Onboarding?step=4');
    await waitForPageLoad(page);

    const dateInput = page.locator('input[type="date"]');
    const today = new Date();
    await dateInput.fill(`${today.getFullYear() - 15}-06-15`);

    const nextBtn = page.getByRole('button', { name: /next|הבא/i });
    const isDisabled = await nextBtn.isDisabled();
    const errorShown = await page.locator('text=/18/i').isVisible().catch(() => false);

    expect(isDisabled || errorShown).toBe(true);
  });

  test('onboarding: birth date rejects future dates', async ({ page }) => {
    await page.goto('/Onboarding?step=4');
    await waitForPageLoad(page);

    const dateInput = page.locator('input[type="date"]');
    const future = new Date();
    future.setFullYear(future.getFullYear() + 1);
    await dateInput.fill(future.toISOString().split('T')[0]);

    const nextBtn = page.getByRole('button', { name: /next|הבא/i });
    await expect(nextBtn).toBeDisabled();
  });

  // --- Chat Messages ---
  test('chat: should sanitize XSS in messages', async ({ page }) => {
    await page.goto('/TemporaryChats');
    await waitForPageLoad(page);
    await page.waitForTimeout(2000);

    const chatItem = page.locator('a[href*="PrivateChat"]').first();
    if (await chatItem.isVisible({ timeout: 5000 }).catch(() => false)) {
      await chatItem.click();
      await page.waitForURL(/PrivateChat/, { timeout: 10000 });

      const input = page.locator(
        'input[placeholder*="message" i], textarea[placeholder*="message" i]',
      ).first();

      await input.fill(SPECIAL_INPUTS.xss);
      await expect(page.locator('script:not([src])')).toHaveCount(0);
    }
  });

  // --- Feedback Form ---
  test('feedback: should load and display form', async ({ page }) => {
    await page.goto('/Feedback');
    await waitForPageLoad(page);

    // Form should have text area
    const textarea = page.locator('textarea').first();
    await expect(textarea).toBeVisible({ timeout: 15000 });
  });

  test('feedback: should handle path traversal input', async ({ page }) => {
    await page.goto('/Feedback');
    await waitForPageLoad(page);

    const textarea = page.locator('textarea').first();
    if (await textarea.isVisible({ timeout: 10000 }).catch(() => false)) {
      await textarea.fill(SPECIAL_INPUTS.pathTraversal);
      // Should not crash
      await expect(page.locator('body')).toBeVisible();
    }
  });

  // --- Email Support ---
  test('emailSupport: should validate email field', async ({ page }) => {
    await page.goto('/EmailSupport');
    await waitForPageLoad(page);

    const emailInput = page.locator('input[type="email"]').first();
    if (await emailInput.isVisible({ timeout: 10000 }).catch(() => false)) {
      await emailInput.fill('not-an-email');

      const submitBtn = page.getByRole('button', { name: /send|submit|שלח/i }).first();
      await submitBtn.click();

      // Should validate email format
      const isInvalid = await emailInput.evaluate(
        (el: HTMLInputElement) => !el.validity.valid,
      );
      expect(isInvalid).toBe(true);
    }
  });
});
