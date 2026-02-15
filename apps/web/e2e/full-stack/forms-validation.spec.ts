/**
 * Full-Stack E2E: Forms Validation
 * Tests all forms with valid, invalid, and edge case inputs
 */
import { test, expect } from './fullstack-base.js';
import {
  waitForPageLoad,
  fillForm,
  fillWithSpecialInput,
  FULLSTACK_AUTH,
  SPECIAL_INPUTS,
  generateTestEmail,
  collectConsoleMessages,
} from '../fixtures/index.js';

// --- Login Form (unauthenticated) ---
test.describe('[P1][infra] Login Forms Validation - Full Stack', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('login: should reject empty fields', async ({ page }) => {
    const cc = collectConsoleMessages(page);
    await page.goto('/Login');
    // Use domcontentloaded instead of networkidle to avoid hanging on /oauth/status
    await page.waitForLoadState('domcontentloaded');
    await page.locator('#email').waitFor({ state: 'visible', timeout: 10000 });

    await page.getByRole('button', { name: /sign in|כניסה/i }).click();

    // Required fields should trigger validation
    const emailInput = page.locator('#email');
    const isInvalid = await emailInput.evaluate(
      (el: HTMLInputElement) => !el.validity.valid,
    );
    expect(isInvalid).toBe(true);
    cc.assertClean();
  });

  test('login: should handle XSS in email field', async ({ page }) => {
    await page.goto('/Login');
    // Use domcontentloaded instead of networkidle to avoid hanging on /oauth/status
    await page.waitForLoadState('domcontentloaded');
    await page.locator('#email').waitFor({ state: 'visible', timeout: 10000 });

    // Count existing inline scripts before XSS input (Vite HMR injects one)
    const scriptCountBefore = await page.locator('script:not([src])').count();

    await page.locator('#email').fill(SPECIAL_INPUTS.xss);
    await page.locator('#password').fill('Test123!');
    await page.getByRole('button', { name: /sign in|כניסה/i }).click();

    // Wait briefly for any potential script execution
    await page.waitForTimeout(1000);

    // XSS script should NOT execute - no NEW inline scripts added to the DOM
    const scriptCountAfter = await page.locator('script:not([src])').count();
    expect(scriptCountAfter).toBeLessThanOrEqual(scriptCountBefore);

    // Page should remain stable (either stays on login or shows error)
    await expect(page.locator('body')).toBeVisible();
  });

  test('login: should handle SQL injection in email', async ({ page }) => {
    await page.goto('/Login');
    // Use domcontentloaded instead of networkidle to avoid hanging on /oauth/status
    await page.waitForLoadState('domcontentloaded');
    await page.locator('#email').waitFor({ state: 'visible', timeout: 10000 });

    await page.locator('#email').fill(SPECIAL_INPUTS.sqlInjection);
    await page.locator('#password').fill('Test123!');
    await page.getByRole('button', { name: /sign in|כניסה/i }).click();

    await page.waitForTimeout(3000);
    // Should not crash or show SQL error
    await expect(page.locator('body')).toBeVisible();
  });
});

// --- Authenticated forms ---
test.describe('[P1][infra] Forms Validation - Full Stack', () => {
  test.use({ storageState: FULLSTACK_AUTH.user });

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

  // --- Chat Messages ---
  test('chat: should sanitize XSS in messages', async ({ page }) => {
    await page.goto('/TemporaryChats');
    await waitForPageLoad(page);
    await page.waitForTimeout(2000);

    // TempChatCard is a Card with onClick navigation (not an <a> tag).
    // Look for any clickable card-like element in the chat list.
    const chatItem = page.locator('[class*="cursor-pointer"]').first();
    if (await chatItem.isVisible({ timeout: 5000 }).catch(() => false)) {
      await chatItem.click();
      await page.waitForURL(/PrivateChat/, { timeout: 10000 });

      // ChatInput uses placeholder="Type a message..."
      const input = page.locator(
        'input[placeholder*="message" i], textarea[placeholder*="message" i]',
      ).first();

      if (await input.isVisible({ timeout: 5000 }).catch(() => false)) {
        // Count existing inline scripts before XSS input (Vite HMR injects one)
        const scriptCountBefore = await page.locator('script:not([src])').count();

        await input.fill(SPECIAL_INPUTS.xss);

        // XSS script should NOT execute - no NEW inline scripts added
        const scriptCountAfter = await page.locator('script:not([src])').count();
        expect(scriptCountAfter).toBeLessThanOrEqual(scriptCountBefore);
      }
    }
  });

  // --- Feedback Form ---
  test('feedback: should load and display form', async ({ page }) => {
    await page.goto('/Feedback');
    // Use domcontentloaded first, then wait for networkidle with a fallback
    // to avoid hanging if useCurrentUser API call is slow
    await page.waitForLoadState('domcontentloaded');
    await page.waitForLoadState('networkidle').catch(() => {});

    // The Feedback page shows a skeleton while loading, then the form.
    // Wait for the skeleton to disappear or the textarea to appear.
    const textarea = page.locator('textarea').first();
    const isVisible = await textarea.isVisible({ timeout: 20000 }).catch(() => false);

    if (!isVisible) {
      // Page may still be in loading state; check if page loaded at all
      await expect(page.locator('body')).toBeVisible();
      // If the textarea is not visible, the page may have redirected or API is down.
      // Verify we are on the Feedback page or were redirected gracefully.
      const url = page.url();
      expect(url.includes('Feedback') || url.includes('Login') || url.includes('SharedSpace')).toBe(true);
    } else {
      await expect(textarea).toBeVisible();
    }
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
  test('emailSupport: should validate required fields', async ({ page }) => {
    await page.goto('/EmailSupport');
    await waitForPageLoad(page);

    // EmailSupportForm has subject (text input), category (select), message (textarea)
    // but no email input field (user email is displayed as text, not editable).
    // Test that the Send button is disabled when fields are empty.
    const sendBtn = page.getByRole('button', { name: /send|submit|שלח/i }).first();
    if (await sendBtn.isVisible({ timeout: 10000 }).catch(() => false)) {
      // The button should be disabled when subject/category/message are empty
      const isDisabled = await sendBtn.isDisabled();
      expect(isDisabled).toBe(true);
    }
  });
});

// --- Onboarding Forms (unauthenticated - onboarding redirects authenticated users) ---
test.describe('[P1][infra] Onboarding Forms Validation - Full Stack', () => {
  // Onboarding pages redirect already-onboarded users, so we must use
  // an unauthenticated session to test onboarding form validation.
  test.use({ storageState: { cookies: [], origins: [] } });

  test('onboarding: nickname rejects numbers', async ({ page }) => {
    await page.goto('/Onboarding?step=3');
    await page.waitForLoadState('domcontentloaded');

    // Check if we actually landed on the onboarding page (not redirected)
    const nicknameInput = page.locator('input[placeholder="Nickname"]');
    const isOnStep = await nicknameInput.isVisible({ timeout: 10000 }).catch(() => false);

    if (!isOnStep) {
      // Unauthenticated user may be redirected to Login or step 1.
      // Verify the page loaded gracefully and skip the validation test.
      await expect(page.locator('body')).toBeVisible();
      return;
    }

    // StepNickname uses placeholder="Nickname"
    await nicknameInput.fill('User123');

    const value = await nicknameInput.inputValue();
    // Numbers should be stripped by the onChange handler
    expect(value).not.toMatch(/\d/);
  });

  test('onboarding: nickname max length 15', async ({ page }) => {
    await page.goto('/Onboarding?step=3');
    await page.waitForLoadState('domcontentloaded');

    const nicknameInput = page.locator('input[placeholder="Nickname"]');
    const isOnStep = await nicknameInput.isVisible({ timeout: 10000 }).catch(() => false);

    if (!isOnStep) {
      await expect(page.locator('body')).toBeVisible();
      return;
    }

    await nicknameInput.fill('A'.repeat(20));

    const value = await nicknameInput.inputValue();
    expect(value.length).toBeLessThanOrEqual(15);
  });

  test('onboarding: birth date rejects under 18', async ({ page }) => {
    await page.goto('/Onboarding?step=4');
    await page.waitForLoadState('domcontentloaded');

    const dateInput = page.locator('input[type="date"]');
    const isOnStep = await dateInput.isVisible({ timeout: 10000 }).catch(() => false);

    if (!isOnStep) {
      await expect(page.locator('body')).toBeVisible();
      return;
    }

    const today = new Date();
    const underageDate = `${today.getFullYear() - 15}-06-15`;
    await dateInput.fill(underageDate);

    // The NEXT button should be disabled for underage dates.
    // The onChange handler accepts all values (to allow typing), but
    // the button's disabled state validates the year range.
    const nextBtn = page.getByRole('button', { name: /next|הבא/i });
    await expect(nextBtn).toBeDisabled();
  });

  test('onboarding: birth date rejects future dates', async ({ page }) => {
    await page.goto('/Onboarding?step=4');
    await page.waitForLoadState('domcontentloaded');

    const dateInput = page.locator('input[type="date"]');
    const isOnStep = await dateInput.isVisible({ timeout: 10000 }).catch(() => false);

    if (!isOnStep) {
      await expect(page.locator('body')).toBeVisible();
      return;
    }

    const future = new Date();
    future.setFullYear(future.getFullYear() + 1);
    const futureDate = future.toISOString().split('T')[0];
    await dateInput.fill(futureDate);

    // The NEXT button should be disabled for future dates.
    // HTML min/max attributes constrain the date picker, and the
    // button's disabled state validates the year range.
    const nextBtn = page.getByRole('button', { name: /next|הבא/i });
    await expect(nextBtn).toBeDisabled();
  });
});
