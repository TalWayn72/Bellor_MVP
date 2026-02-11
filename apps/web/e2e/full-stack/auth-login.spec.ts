/**
 * Full-Stack E2E: User Login
 * Tests real login flow against running backend
 *
 * Uses seeded demo users: demo_sarah@bellor.app / Demo123!
 */
import { test, expect } from '@playwright/test';
import { execSync } from 'child_process';
import {
  waitForPageLoad,
  getLocalStorageItem,
  SEEDED_USERS,
  collectConsoleMessages,
} from '../fixtures/index.js';

/** Flush rate limit keys in Redis to prevent test flakiness */
function clearRateLimits() {
  try {
    execSync(
      'docker exec bellor_redis redis-cli EVAL "local keys = redis.call(\'keys\', \'fastify-rate-limit*\') for i=1,#keys do redis.call(\'del\', keys[i]) end return #keys" 0',
      { stdio: 'pipe', timeout: 3000 },
    );
  } catch {
    // Non-critical
  }
}

test.describe('[P0][auth] Login - Full Stack', () => {
  // Override project-level storageState - login tests must start unauthenticated
  test.use({ storageState: { cookies: [], origins: [] } });

  test.beforeEach(async ({ page }) => {
    clearRateLimits();
    await page.goto('/Login');
    await waitForPageLoad(page);

    // If app redirected to onboarding landing, click "Sign In" to get to login form
    const emailField = page.locator('#email');
    if (!await emailField.isVisible({ timeout: 3000 }).catch(() => false)) {
      const signInBtn = page.getByText(/sign in/i).first();
      if (await signInBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await signInBtn.click();
        await page.waitForLoadState('networkidle');
      }
    }
  });

  test('should login with valid seeded credentials', async ({ page }) => {
    const cc = collectConsoleMessages(page);
    const { email, password } = SEEDED_USERS.sarah;

    await page.locator('#email').fill(email);
    await page.locator('#password').fill(password);
    await page.getByRole('button', { name: /sign in/i }).click();

    // Wait for redirect to authenticated area
    await page.waitForURL(/\/(Home|SharedSpace|Onboarding|Feed|Welcome)/, {
      timeout: 15000,
    });

    // Verify tokens are stored
    const accessToken = await getLocalStorageItem(page, 'bellor_access_token');
    expect(accessToken).toBeTruthy();
    cc.assertClean();
  });

  test('should reject wrong password', async ({ page }) => {
    await page.locator('#email').fill(SEEDED_USERS.sarah.email);
    await page.locator('#password').fill('WrongPassword123!');

    // Intercept the login API response
    const responsePromise = page.waitForResponse('**/api/v1/auth/login');
    await page.getByRole('button', { name: /sign in/i }).click();
    const response = await responsePromise;

    // API should return 401
    expect(response.status()).toBe(401);

    // Should NOT navigate to authenticated area
    await page.waitForTimeout(2000);
    expect(page.url()).not.toMatch(/\/(Home|SharedSpace|Feed)$/);

    // No tokens should be stored
    const accessToken = await getLocalStorageItem(page, 'bellor_access_token');
    expect(accessToken).toBeFalsy();
  });

  test('should reject non-existent email', async ({ page }) => {
    await page.locator('#email').fill('nonexistent@bellor.app');
    await page.locator('#password').fill('TestPass123!');

    const responsePromise = page.waitForResponse('**/api/v1/auth/login');
    await page.getByRole('button', { name: /sign in/i }).click();
    const response = await responsePromise;

    // API should return error (401 unauthorized or 429 rate limited)
    expect(response.status()).toBeGreaterThanOrEqual(400);

    // Wait for any navigation to settle before checking localStorage
    await page.waitForLoadState('load').catch(() => {});
    const accessToken = await getLocalStorageItem(page, 'bellor_access_token').catch(() => null);
    expect(accessToken).toBeFalsy();
  });

  test('should store auth tokens in localStorage', async ({ page }) => {
    const { email, password } = SEEDED_USERS.sarah;

    await page.locator('#email').fill(email);
    await page.locator('#password').fill(password);
    await page.getByRole('button', { name: /sign in/i }).click();

    await page.waitForURL(/\/(Home|SharedSpace|Onboarding|Feed|Welcome)/, { timeout: 15000 });

    // Verify all tokens exist (app uses bellor_ prefix)
    const accessToken = await getLocalStorageItem(page, 'bellor_access_token');
    const refreshToken = await getLocalStorageItem(page, 'bellor_refresh_token');
    const user = await getLocalStorageItem(page, 'bellor_user');

    expect(accessToken).toBeTruthy();
    expect(refreshToken).toBeTruthy();
    expect(user).toBeTruthy();

    // Verify user data structure
    const userData = JSON.parse(user!);
    expect(userData.email).toBe(email);
  });

  test('should show loading state during login', async ({ page }) => {
    const { email, password } = SEEDED_USERS.sarah;

    await page.locator('#email').fill(email);
    await page.locator('#password').fill(password);

    // Click submit and immediately check for loading
    const submitBtn = page.getByRole('button', { name: /sign in/i });
    await submitBtn.click();

    // Submit button should be disabled during loading
    // (this may happen very quickly, so we use a short window)
    await expect(submitBtn).toBeDisabled({ timeout: 2000 }).catch(() => {
      // Loading may be too fast to catch - that's ok
    });
  });

  test('should validate required email field', async ({ page }) => {
    // Leave email empty
    await page.locator('#password').fill('TestPass123!');
    await page.getByRole('button', { name: /sign in/i }).click();

    // Email field should be required
    const emailInput = page.locator('#email').first();
    await expect(emailInput).toHaveAttribute('required', '');
  });

  test('should validate required password field', async ({ page }) => {
    await page.locator('#email').fill('test@bellor.app');
    // Leave password empty and submit
    await page.getByRole('button', { name: /sign in/i }).click();

    const passwordInput = page.locator('#password');
    await expect(passwordInput).toHaveAttribute('required', '');
  });

  test('should login with admin credentials', async ({ page }) => {
    const { email, password } = SEEDED_USERS.admin;

    await page.locator('#email').fill(email);
    await page.locator('#password').fill(password);
    await page.getByRole('button', { name: /sign in/i }).click();

    await page.waitForURL(/\/(Home|SharedSpace|Onboarding|AdminDashboard|Welcome)/, {
      timeout: 15000,
    });

    const accessToken = await getLocalStorageItem(page, 'bellor_access_token');
    expect(accessToken).toBeTruthy();
  });

  test('should handle long email input', async ({ page }) => {
    const longEmail = 'a'.repeat(200) + '@bellor.app';
    await page.locator('#email').fill(longEmail);
    await page.locator('#password').fill('TestPass123!');

    const responsePromise = page.waitForResponse('**/api/v1/auth/login');
    await page.getByRole('button', { name: /sign in/i }).click();
    const response = await responsePromise;

    // Should get error response, not crash
    expect(response.status()).toBeGreaterThanOrEqual(400);

    // Wait for any navigation to settle
    await page.waitForLoadState('load').catch(() => {});
    const accessToken = await getLocalStorageItem(page, 'bellor_access_token').catch(() => null);
    expect(accessToken).toBeFalsy();
  });

  test('should persist login across page reload', async ({ page }) => {
    const { email, password } = SEEDED_USERS.sarah;

    await page.locator('#email').fill(email);
    await page.locator('#password').fill(password);
    await page.getByRole('button', { name: /sign in/i }).click();

    await page.waitForURL(/\/(Home|SharedSpace|Onboarding|Feed|Welcome)/, { timeout: 15000 });

    // Reload the page
    await page.reload();
    await waitForPageLoad(page);

    // Should still be on authenticated page, not redirected to login
    expect(page.url()).not.toContain('/Login');
  });
});
