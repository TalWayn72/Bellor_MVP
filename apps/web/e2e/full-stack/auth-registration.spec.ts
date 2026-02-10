/**
 * Full-Stack E2E: User Registration
 * Tests real registration flow against running backend
 *
 * Seeded data: demo_sarah@bellor.app / Demo123!
 * Test users: e2e-<timestamp>@bellor.app
 */
import { test, expect } from '@playwright/test';
import {
  waitForPageLoad,
  generateTestEmail,
  SPECIAL_INPUTS,
} from '../fixtures/index.js';

test.describe('[P0][auth] Registration - Full Stack', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/Login');
    await waitForPageLoad(page);
  });

  test('should switch to register mode', async ({ page }) => {
    // Find "Sign up" link/button to switch mode
    const signUpLink = page.locator('text=/sign up|הרשמה/i').first();
    await signUpLink.click();

    // Verify registration form fields appear
    await expect(page.locator('#firstName, input[name="firstName"]')).toBeVisible();
    await expect(page.locator('#lastName, input[name="lastName"]')).toBeVisible();
  });

  test('should register with valid credentials', async ({ page }) => {
    // Switch to register mode
    await page.locator('text=/sign up|הרשמה/i').first().click();

    const testEmail = generateTestEmail();

    // Fill registration form
    await page.locator('#firstName, input[name="firstName"]').fill('TestFirst');
    await page.locator('#lastName, input[name="lastName"]').fill('TestLast');
    await page.getByPlaceholder(/you@example\.com|email/i).fill(testEmail);
    await page.locator('#password, input[name="password"]').fill('TestPass123!');

    // Submit
    await page.getByRole('button', { name: /create account|הרשמה/i }).click();

    // Verify redirect to authenticated area or onboarding
    await page.waitForURL(/\/(Home|SharedSpace|Onboarding|Welcome)/, {
      timeout: 15000,
    });
  });

  test('should reject duplicate email', async ({ page }) => {
    await page.locator('text=/sign up|הרשמה/i').first().click();

    // Use existing seeded email
    await page.locator('#firstName, input[name="firstName"]').fill('Duplicate');
    await page.locator('#lastName, input[name="lastName"]').fill('User');
    await page.getByPlaceholder(/you@example\.com|email/i).fill('demo_sarah@bellor.app');
    await page.locator('#password, input[name="password"]').fill('TestPass123!');

    await page.getByRole('button', { name: /create account|הרשמה/i }).click();

    // Verify error message
    await expect(
      page.locator('text=/already exists|כבר קיים|email.*taken/i'),
    ).toBeVisible({ timeout: 10000 });
  });

  test('should validate weak password', async ({ page }) => {
    await page.locator('text=/sign up|הרשמה/i').first().click();

    await page.locator('#firstName, input[name="firstName"]').fill('Test');
    await page.locator('#lastName, input[name="lastName"]').fill('User');
    await page.getByPlaceholder(/you@example\.com|email/i).fill(generateTestEmail());
    await page.locator('#password, input[name="password"]').fill('123');

    // Password hint should show requirements
    await expect(
      page.locator('text=/at least 8 characters|8 תווים/i'),
    ).toBeVisible();
  });

  test('should validate empty email', async ({ page }) => {
    await page.locator('text=/sign up|הרשמה/i').first().click();
    await page.locator('#firstName, input[name="firstName"]').fill('Test');
    await page.locator('#lastName, input[name="lastName"]').fill('User');

    // Leave email empty, fill password
    await page.locator('#password, input[name="password"]').fill('TestPass123!');
    await page.getByRole('button', { name: /create account|הרשמה/i }).click();

    // Expect validation error
    const emailInput = page.locator('#email, input[name="email"]');
    await expect(emailInput).toHaveAttribute('required', '');
  });

  test('should validate invalid email format', async ({ page }) => {
    await page.locator('text=/sign up|הרשמה/i').first().click();

    await page.locator('#firstName, input[name="firstName"]').fill('Test');
    await page.locator('#lastName, input[name="lastName"]').fill('User');
    await page.getByPlaceholder(/you@example\.com|email/i).fill('invalid-email');
    await page.locator('#password, input[name="password"]').fill('TestPass123!');
    await page.getByRole('button', { name: /create account|הרשמה/i }).click();

    // Browser native validation or custom error
    const emailInput = page.locator('#email, input[name="email"]');
    const isInvalid = await emailInput.evaluate(
      (el: HTMLInputElement) => !el.validity.valid,
    );
    expect(isInvalid).toBe(true);
  });

  test('should handle XSS in name fields', async ({ page }) => {
    await page.locator('text=/sign up|הרשמה/i').first().click();

    // Try XSS in first name
    await page.locator('#firstName, input[name="firstName"]').fill(SPECIAL_INPUTS.xss);
    await page.locator('#lastName, input[name="lastName"]').fill(SPECIAL_INPUTS.htmlInjection);

    // Verify the raw script tag is NOT rendered as HTML
    await expect(page.locator('script')).toHaveCount(0);
    // Verify the text is sanitized or shown as plaintext
    const firstName = page.locator('#firstName, input[name="firstName"]');
    const value = await firstName.inputValue();
    expect(value).not.toContain('<script>');
  });

  test('should handle Hebrew input in name fields', async ({ page }) => {
    await page.locator('text=/sign up|הרשמה/i').first().click();

    await page.locator('#firstName, input[name="firstName"]').fill('שרה');
    await page.locator('#lastName, input[name="lastName"]').fill('כהן');
    await page.getByPlaceholder(/you@example\.com|email/i).fill(generateTestEmail());
    await page.locator('#password, input[name="password"]').fill('TestPass123!');

    // Hebrew names should be accepted
    const firstName = page.locator('#firstName, input[name="firstName"]');
    await expect(firstName).toHaveValue('שרה');
  });

  test('should show/hide password toggle', async ({ page }) => {
    const passwordInput = page.locator('#password, input[name="password"]');
    await passwordInput.fill('TestPass123!');

    // Initially type=password
    await expect(passwordInput).toHaveAttribute('type', 'password');

    // Click show password button
    const toggleBtn = page.locator('button').filter({ has: page.locator('svg') }).last();
    await toggleBtn.click();

    // Should show password
    await expect(passwordInput).toHaveAttribute('type', 'text');
  });

  test('should navigate to guest mode', async ({ page }) => {
    const guestBtn = page.getByRole('button', { name: /continue as guest|אורח/i });
    await guestBtn.click();

    await page.waitForURL(/\/(Welcome|Home|SharedSpace)/, { timeout: 10000 });
  });

  test('should handle SQL injection in email', async ({ page }) => {
    await page.getByPlaceholder(/you@example\.com|email/i).fill(SPECIAL_INPUTS.sqlInjection);
    await page.locator('#password, input[name="password"]').fill('TestPass123!');
    await page.getByRole('button', { name: /sign in|כניסה/i }).click();

    // Should show error, not crash
    await expect(page.locator('text=/invalid|failed|שגיאה/i')).toBeVisible({
      timeout: 10000,
    });
  });
});
