/**
 * Full-Stack E2E: Special Pages
 * Tests 2 public pages: Splash, OAuthCallback
 *
 * Covers:
 * - /Splash (branding, "Bellor" title, "Authentic Connections", auto-redirect to /Onboarding?step=2)
 * - /oauth/callback (without tokens shows "Login Failed" + "Missing authentication tokens",
 *   with error param shows mapped error message, then redirects to Onboarding)
 */
import { test, expect } from '@playwright/test';
import { collectConsoleMessages } from '../fixtures/index.js';

test.describe('[P2][infra] Special Pages - Full Stack', () => {
  // No storageState - these are public pages

  // -- Splash Page ---------------------------------------------------------

  test('Splash page shows branding and auto-redirects', async ({ page }) => {
    const cc = collectConsoleMessages(page);
    await page.goto('/Splash', { waitUntil: 'domcontentloaded' });

    // Should show the Bellor title (h1) and tagline
    await expect(
      page.locator('h1').filter({ hasText: /Bell/ }),
    ).toBeVisible({ timeout: 5000 });

    await expect(
      page.locator('text=Authentic Connections').first(),
    ).toBeVisible({ timeout: 3000 });

    // Logo image should be present
    await expect(
      page.locator('img[alt="Bellor"], img[alt="Bellør"]').first(),
    ).toBeVisible({ timeout: 3000 });

    // Bouncing dots animation (3 dots)
    const dots = page.locator('.animate-bounce');
    const dotCount = await dots.count();
    expect(dotCount).toBe(3);

    // Wait for the 2-second redirect timer + navigation
    await page.waitForTimeout(4000);

    // Should have redirected away from Splash to Onboarding?step=2
    const url = page.url();
    expect(url.includes('/Splash')).toBe(false);
    expect(url.includes('/Onboarding')).toBe(true);
  });

  // -- OAuthCallback Page --------------------------------------------------

  test('OAuthCallback without tokens shows error and redirects', async ({ page }) => {
    const cc = collectConsoleMessages(page);
    await page.goto('/oauth/callback', { waitUntil: 'domcontentloaded' });

    // Should show "Login Failed" heading and "Missing authentication tokens" error
    await expect(
      page.locator('text=Login Failed').first(),
    ).toBeVisible({ timeout: 5000 });

    await expect(
      page.locator('text=Missing authentication tokens').first(),
    ).toBeVisible({ timeout: 3000 });

    // Redirect notice
    await expect(
      page.locator('text=Redirecting to login page').first(),
    ).toBeVisible({ timeout: 3000 });

    // Wait for the 3-second redirect timer + navigation
    await page.waitForTimeout(5000);

    // Should redirect to Onboarding sign-in
    const url = page.url();
    expect(url.includes('/Onboarding')).toBe(true);
  });

  test('OAuthCallback with error param shows mapped error message', async ({ page }) => {
    const cc = collectConsoleMessages(page);
    await page.goto('/oauth/callback?error=oauth_denied', {
      waitUntil: 'domcontentloaded',
    });

    // Should show "Login Failed" heading
    await expect(
      page.locator('text=Login Failed').first(),
    ).toBeVisible({ timeout: 5000 });

    // Should show the mapped error message for oauth_denied
    await expect(
      page.locator('text=OAuth login was cancelled').first(),
    ).toBeVisible({ timeout: 3000 });

    // Should eventually redirect to Onboarding
    await page.waitForTimeout(5000);
    const url = page.url();
    expect(url.includes('/Onboarding')).toBe(true);
  });

  test('OAuthCallback with account_blocked error shows deactivated message', async ({ page }) => {
    await page.goto('/oauth/callback?error=account_blocked', {
      waitUntil: 'domcontentloaded',
    });

    await expect(
      page.locator('text=Login Failed').first(),
    ).toBeVisible({ timeout: 5000 });

    await expect(
      page.locator('text=Your account has been deactivated').first(),
    ).toBeVisible({ timeout: 3000 });
  });
});
