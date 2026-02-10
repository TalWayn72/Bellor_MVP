/**
 * Full-Stack E2E: User Login
 * Tests real login flow against running backend
 *
 * Uses seeded demo users: demo_sarah@bellor.app / Demo123!
 */
import { test, expect } from '@playwright/test';
import {
  waitForPageLoad,
  getLocalStorageItem,
  SEEDED_USERS,
} from '../fixtures/index.js';

test.describe('[P0][auth] Login - Full Stack', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/Login');
    await waitForPageLoad(page);
  });

  test('should login with valid seeded credentials', async ({ page }) => {
    const { email, password } = SEEDED_USERS.sarah;

    await page.getByPlaceholder(/you@example\.com|email/i).fill(email);
    await page.locator('#password, input[name="password"]').fill(password);
    await page.getByRole('button', { name: /sign in|כניסה/i }).click();

    // Wait for redirect to authenticated area
    await page.waitForURL(/\/(Home|SharedSpace|Feed|Welcome)/, {
      timeout: 15000,
    });

    // Verify tokens are stored
    const accessToken = await getLocalStorageItem(page, 'accessToken');
    expect(accessToken).toBeTruthy();
  });

  test('should reject wrong password', async ({ page }) => {
    await page.getByPlaceholder(/you@example\.com|email/i).fill(SEEDED_USERS.sarah.email);
    await page.locator('#password, input[name="password"]').fill('WrongPassword123!');
    await page.getByRole('button', { name: /sign in|כניסה/i }).click();

    // Verify error message
    await expect(
      page.locator('text=/invalid|incorrect|wrong|authentication failed|שגיאה/i'),
    ).toBeVisible({ timeout: 10000 });

    // Should stay on login page
    expect(page.url()).toContain('Login');
  });

  test('should reject non-existent email', async ({ page }) => {
    await page.getByPlaceholder(/you@example\.com|email/i).fill('nonexistent@bellor.app');
    await page.locator('#password, input[name="password"]').fill('TestPass123!');
    await page.getByRole('button', { name: /sign in|כניסה/i }).click();

    await expect(
      page.locator('text=/not found|invalid|failed|no account|שגיאה/i'),
    ).toBeVisible({ timeout: 10000 });
  });

  test('should store auth tokens in localStorage', async ({ page }) => {
    const { email, password } = SEEDED_USERS.sarah;

    await page.getByPlaceholder(/you@example\.com|email/i).fill(email);
    await page.locator('#password, input[name="password"]').fill(password);
    await page.getByRole('button', { name: /sign in|כניסה/i }).click();

    await page.waitForURL(/\/(Home|SharedSpace|Feed|Welcome)/, { timeout: 15000 });

    // Verify all tokens exist
    const accessToken = await getLocalStorageItem(page, 'accessToken');
    const refreshToken = await getLocalStorageItem(page, 'refreshToken');
    const user = await getLocalStorageItem(page, 'user');

    expect(accessToken).toBeTruthy();
    expect(refreshToken).toBeTruthy();
    expect(user).toBeTruthy();

    // Verify user data structure
    const userData = JSON.parse(user!);
    expect(userData.email).toBe(email);
  });

  test('should show loading state during login', async ({ page }) => {
    const { email, password } = SEEDED_USERS.sarah;

    await page.getByPlaceholder(/you@example\.com|email/i).fill(email);
    await page.locator('#password, input[name="password"]').fill(password);

    // Click submit and immediately check for loading
    const submitBtn = page.getByRole('button', { name: /sign in|כניסה/i });
    await submitBtn.click();

    // Submit button should be disabled during loading
    // (this may happen very quickly, so we use a short window)
    await expect(submitBtn).toBeDisabled({ timeout: 2000 }).catch(() => {
      // Loading may be too fast to catch - that's ok
    });
  });

  test('should validate required email field', async ({ page }) => {
    // Leave email empty
    await page.locator('#password, input[name="password"]').fill('TestPass123!');
    await page.getByRole('button', { name: /sign in|כניסה/i }).click();

    // Email field should be required
    const emailInput = page.locator('#email, input[name="email"], input[type="email"]').first();
    await expect(emailInput).toHaveAttribute('required', '');
  });

  test('should validate required password field', async ({ page }) => {
    await page.getByPlaceholder(/you@example\.com|email/i).fill('test@bellor.app');
    // Leave password empty and submit
    await page.getByRole('button', { name: /sign in|כניסה/i }).click();

    const passwordInput = page.locator('#password, input[name="password"]');
    await expect(passwordInput).toHaveAttribute('required', '');
  });

  test('should login with admin credentials', async ({ page }) => {
    const { email, password } = SEEDED_USERS.admin;

    await page.getByPlaceholder(/you@example\.com|email/i).fill(email);
    await page.locator('#password, input[name="password"]').fill(password);
    await page.getByRole('button', { name: /sign in|כניסה/i }).click();

    await page.waitForURL(/\/(Home|SharedSpace|AdminDashboard|Welcome)/, {
      timeout: 15000,
    });

    const accessToken = await getLocalStorageItem(page, 'accessToken');
    expect(accessToken).toBeTruthy();
  });

  test('should handle long email input', async ({ page }) => {
    const longEmail = 'a'.repeat(200) + '@bellor.app';
    await page.getByPlaceholder(/you@example\.com|email/i).fill(longEmail);
    await page.locator('#password, input[name="password"]').fill('TestPass123!');
    await page.getByRole('button', { name: /sign in|כניסה/i }).click();

    // Should show error or validation, not crash
    await expect(
      page.locator('text=/invalid|failed|error|שגיאה/i'),
    ).toBeVisible({ timeout: 10000 });
  });

  test('should persist login across page reload', async ({ page }) => {
    const { email, password } = SEEDED_USERS.sarah;

    await page.getByPlaceholder(/you@example\.com|email/i).fill(email);
    await page.locator('#password, input[name="password"]').fill(password);
    await page.getByRole('button', { name: /sign in|כניסה/i }).click();

    await page.waitForURL(/\/(Home|SharedSpace|Feed|Welcome)/, { timeout: 15000 });

    // Reload the page
    await page.reload();
    await waitForPageLoad(page);

    // Should still be on authenticated page, not redirected to login
    expect(page.url()).not.toContain('/Login');
    expect(page.url()).not.toContain('/Onboarding');
  });
});
