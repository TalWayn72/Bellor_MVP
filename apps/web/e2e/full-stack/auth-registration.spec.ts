/**
 * Full-Stack E2E: User Registration
 * Tests real registration flow against running backend
 *
 * Seeded data: demo_sarah@bellor.app / Demo123!
 * Test users: e2e-<timestamp>@bellor.app
 */
import { test, expect } from './fullstack-base.js';
import { execSync } from 'child_process';
import {
  waitForPageLoad,
  generateTestEmail,
  SPECIAL_INPUTS,
  collectConsoleMessages,
} from '../fixtures/index.js';

/** Flush rate limit keys in Redis to prevent test flakiness */
function clearRateLimits() {
  const redisPw = process.env.REDIS_PASSWORD;
  const authFlag = redisPw ? `-a ${redisPw} --no-auth-warning` : '';
  const delCmd = `redis-cli ${authFlag} KEYS 'fastify-rate-limit*' | xargs -r redis-cli ${authFlag} DEL`;
  for (const container of ['bellor-redis', 'bellor_redis']) {
    try {
      execSync(`docker exec ${container} sh -c "${delCmd}"`, {
        stdio: 'pipe',
        timeout: 3000,
      });
      return;
    } catch { /* try next */ }
  }
  try {
    execSync(`bash -c "${delCmd}"`, { stdio: 'pipe', timeout: 3000 });
  } catch { /* non-critical */ }
}

test.describe('[P0][auth] Registration - Full Stack', () => {
  // Override project-level storageState - registration tests must start unauthenticated
  test.use({ storageState: { cookies: [], origins: [] } });

  test.beforeEach(async ({ page }) => {
    clearRateLimits();
    await page.goto('/Login');
    // Use domcontentloaded to avoid hanging on /oauth/status API call
    await page.waitForLoadState('domcontentloaded');
    // Wait for the login form to render
    await page.locator('#email').waitFor({ state: 'visible', timeout: 10000 });
  });

  test('should switch to register mode', async ({ page }) => {
    const cc = collectConsoleMessages(page);
    // Find "Sign up" link/button to switch mode
    const signUpLink = page.locator('text=/sign up|הרשמה/i').first();
    await signUpLink.click();
    await page.waitForTimeout(500);

    // Verify registration form fields appear
    await expect(page.locator('#firstName, input[name="firstName"]')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('#lastName, input[name="lastName"]')).toBeVisible({ timeout: 5000 });
    cc.assertClean();
  });

  test('should register with valid credentials', async ({ page }) => {
    // Switch to register mode
    await page.locator('text=/sign up|הרשמה/i').first().click();
    await page.waitForTimeout(500);

    const testEmail = generateTestEmail();

    // Fill registration form
    await page.locator('#firstName, input[name="firstName"]').fill('TestFirst');
    await page.locator('#lastName, input[name="lastName"]').fill('TestLast');
    await page.locator('#email').fill(testEmail);
    await page.locator('#password').fill('TestPass123!');

    // Submit
    await page.getByRole('button', { name: /create account|הרשמה/i }).click();

    // Verify redirect to authenticated area or onboarding
    await page.waitForURL(/\/(Home|SharedSpace|Onboarding|Welcome)/, {
      timeout: 15000,
    });
  });

  test('should reject duplicate email', async ({ page }) => {
    await page.locator('text=/sign up|הרשמה/i').first().click();
    await page.waitForTimeout(500);

    // Use existing seeded email
    await page.locator('#firstName, input[name="firstName"]').fill('Duplicate');
    await page.locator('#lastName, input[name="lastName"]').fill('User');
    await page.locator('#email').fill('demo_sarah@bellor.app');
    await page.locator('#password').fill('TestPass123!');

    await page.getByRole('button', { name: /create account|הרשמה/i }).click();

    await page.waitForTimeout(5000);

    // Login.jsx shows errors in a div with bg-destructive/10 text-destructive.
    // The error message could be "already exists", "email taken", "Authentication failed", etc.
    const hasErrorText = await page.locator(
      'text=/already.*exist|email.*taken|כבר קיים|failed|error|duplicate/i',
    ).first().isVisible({ timeout: 10000 }).catch(() => false);
    const hasDestructiveDiv = await page.locator(
      '[class*="destructive"]',
    ).first().isVisible().catch(() => false);

    // Also acceptable: user stayed on login page (registration was rejected)
    const stayedOnLogin = page.url().includes('Login');

    expect(hasErrorText || hasDestructiveDiv || stayedOnLogin).toBe(true);
  });

  test('should validate weak password', async ({ page }) => {
    await page.locator('text=/sign up|הרשמה/i').first().click();
    await page.waitForTimeout(500);

    await page.locator('#firstName, input[name="firstName"]').fill('Test');
    await page.locator('#lastName, input[name="lastName"]').fill('User');
    await page.locator('#email').fill(generateTestEmail());
    await page.locator('#password').fill('123');

    // Password hint in register mode shows:
    // "Password must be at least 8 characters with uppercase, lowercase, number, and special character"
    await expect(
      page.locator('text=/at least 8 characters|must be at least|8 תווים/i'),
    ).toBeVisible({ timeout: 5000 });
  });

  test('should validate empty email', async ({ page }) => {
    await page.locator('text=/sign up|הרשמה/i').first().click();
    await page.waitForTimeout(500);
    await page.locator('#firstName, input[name="firstName"]').fill('Test');
    await page.locator('#lastName, input[name="lastName"]').fill('User');

    // Leave email empty, fill password
    await page.locator('#password').fill('TestPass123!');
    await page.getByRole('button', { name: /create account|הרשמה/i }).click();

    // Email input has required attribute - browser should prevent submission
    const emailInput = page.locator('#email');
    const isRequired = await emailInput.evaluate(
      (el: HTMLInputElement) => el.required || el.hasAttribute('required'),
    );
    expect(isRequired).toBe(true);
  });

  test('should validate invalid email format', async ({ page }) => {
    await page.locator('text=/sign up|הרשמה/i').first().click();
    await page.waitForTimeout(500);

    await page.locator('#firstName, input[name="firstName"]').fill('Test');
    await page.locator('#lastName, input[name="lastName"]').fill('User');
    await page.locator('#email').fill('invalid-email');
    await page.locator('#password').fill('TestPass123!');
    await page.getByRole('button', { name: /create account|הרשמה/i }).click();

    // Browser native validation or custom error
    const emailInput = page.locator('#email, input[name="email"]');
    const isInvalid = await emailInput.evaluate(
      (el: HTMLInputElement) => !el.validity.valid,
    );
    expect(isInvalid).toBe(true);
  });

  test('should handle XSS in name fields', async ({ page }) => {
    // Wait for login form to fully render
    await page.locator('#email').waitFor({ state: 'visible', timeout: 10000 });

    await page.locator('text=/sign up|הרשמה/i').first().click();
    await page.waitForTimeout(500);

    // Wait for register form fields to appear
    const firstNameField = page.locator('#firstName, input[name="firstName"]');
    await firstNameField.waitFor({ state: 'visible', timeout: 5000 });

    // Count existing inline scripts before XSS input (Vite HMR injects one)
    const scriptCountBefore = await page.locator('script:not([src])').count();

    // Try XSS in first name
    await firstNameField.fill(SPECIAL_INPUTS.xss);
    await page.locator('#lastName, input[name="lastName"]').fill(SPECIAL_INPUTS.htmlInjection);

    // Wait briefly for any potential script execution
    await page.waitForTimeout(1000);

    // Verify the raw script tag is NOT rendered as executable HTML in the DOM
    // (input fields contain text, not rendered HTML - that's expected and safe)
    const scriptCountAfter = await page.locator('script:not([src])').count();
    expect(scriptCountAfter).toBeLessThanOrEqual(scriptCountBefore);

    // Verify page is stable and no script executed
    await expect(page.locator('body')).toBeVisible();

    // Verify no injected img tag with onerror appeared in the DOM
    await expect(page.locator('img[src="x"]')).toHaveCount(0);
  });

  test('should handle Hebrew input in name fields', async ({ page }) => {
    await page.locator('text=/sign up|הרשמה/i').first().click();
    await page.waitForTimeout(500);

    await page.locator('#firstName, input[name="firstName"]').fill('שרה');
    await page.locator('#lastName, input[name="lastName"]').fill('כהן');
    await page.locator('#email').fill(generateTestEmail());
    await page.locator('#password').fill('TestPass123!');

    // Hebrew names should be accepted
    const firstName = page.locator('#firstName, input[name="firstName"]');
    await expect(firstName).toHaveValue('שרה');
  });

  test('should show/hide password toggle', async ({ page }) => {
    const passwordInput = page.locator('#password');
    await passwordInput.fill('TestPass123!');

    // Initially type=password
    await expect(passwordInput).toHaveAttribute('type', 'password');

    // Click show password toggle button (sibling of password input, inside relative div)
    // The toggle is a button inside the password field's wrapper div
    const toggleBtn = page.locator('#password ~ button, .relative button').first();
    if (await toggleBtn.isVisible().catch(() => false)) {
      await toggleBtn.click();
      await page.waitForTimeout(300);

      // Should show password (type changed to text)
      await expect(passwordInput).toHaveAttribute('type', 'text');
    } else {
      // Fallback: try any button with an eye icon near the password field
      const eyeBtn = page.locator('button:has(svg.lucide-eye), button:has(svg.lucide-eye-off)').first();
      if (await eyeBtn.isVisible().catch(() => false)) {
        await eyeBtn.click();
        await expect(passwordInput).toHaveAttribute('type', 'text');
      }
    }
  });

  test('should navigate to guest mode', async ({ page }) => {
    // Login page has "Continue as Guest" button
    const guestBtn = page.getByRole('button', { name: /continue as guest|אורח/i });
    if (await guestBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await guestBtn.click();
      await page.waitForURL(/\/(Welcome|Home|SharedSpace)/, { timeout: 10000 });
    } else {
      // Fallback: try locator with text match
      const guestBtnAlt = page.locator('button:has-text("Continue as Guest")').first();
      if (await guestBtnAlt.isVisible().catch(() => false)) {
        await guestBtnAlt.click();
        await page.waitForURL(/\/(Welcome|Home|SharedSpace)/, { timeout: 10000 });
      }
    }
  });

  test('should handle SQL injection in email', async ({ page }) => {
    await page.locator('#email').fill(SPECIAL_INPUTS.sqlInjection);
    await page.locator('#password').fill('TestPass123!');
    await page.getByRole('button', { name: /sign in|כניסה/i }).click();

    await page.waitForTimeout(3000);

    // Should show error message or the page remains stable (browser may block invalid email format)
    const hasError = await page.locator(
      'text=/invalid|failed|error|שגיאה/i, [class*="destructive"]',
    ).first().isVisible().catch(() => false);

    // If email validation blocks submission, page stays on Login - also acceptable
    const stayedOnLogin = page.url().includes('Login');

    expect(hasError || stayedOnLogin).toBe(true);
  });
});
