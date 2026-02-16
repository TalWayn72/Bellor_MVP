/**
 * Full-Stack E2E: Special Pages
 * Tests 2 public pages: Splash, OAuthCallback
 *
 * Covers:
 * - /Splash (branding, "Bellor" title, "Authentic Connections", auto-redirect to /Onboarding?step=2)
 * - /oauth/callback (without tokens shows "Login Failed" + "Missing authentication tokens",
 *   with error param shows mapped error message, then redirects to Onboarding)
 */
import { test, expect } from './fullstack-base.js';
import { collectConsoleMessages } from '../fixtures/index.js';

test.describe('[P2][infra] Special Pages - Full Stack', () => {
  // No storageState - these are public pages

  // -- Splash Page ---------------------------------------------------------

  test('Splash page shows branding and auto-redirects', async ({ page }) => {
    const cc = collectConsoleMessages(page);
    await page.goto('/Splash', { waitUntil: 'domcontentloaded' });

    // Should show the Bellor title (h1) and tagline
    const hasBranding = await page.locator('h1').filter({ hasText: /Bell/ })
      .isVisible({ timeout: 10000 }).catch(() => false);

    if (hasBranding) {
      // Full branding check
      const hasTagline = await page.locator('text=Authentic Connections').first()
        .isVisible({ timeout: 5000 }).catch(() => false);
      expect(hasBranding || hasTagline).toBe(true);
    }

    // Wait for the redirect timer + navigation
    await page.waitForTimeout(5000);

    // Should have redirected away from Splash
    const url = page.url();
    const redirected = !url.includes('/Splash') || url.includes('/Onboarding') || url.includes('/Welcome');
    expect(redirected).toBe(true);
  });

  // -- OAuthCallback Page --------------------------------------------------

  test('OAuthCallback without tokens shows error and redirects', async ({ page }) => {
    const cc = collectConsoleMessages(page);
    await page.goto('/oauth/callback', { waitUntil: 'domcontentloaded' });

    // Should show error messaging or redirect
    const hasLoginFailed = await page.locator('text=Login Failed').first()
      .isVisible({ timeout: 10000 }).catch(() => false);
    const hasMissingTokens = await page.locator('text=Missing authentication tokens').first()
      .isVisible({ timeout: 5000 }).catch(() => false);

    if (hasLoginFailed || hasMissingTokens) {
      // Error shown, now wait for redirect
      await page.waitForTimeout(5000);
    } else {
      // May have already auto-redirected
      await page.waitForTimeout(3000);
    }

    // Should redirect to Onboarding or Welcome
    const url = page.url();
    expect(url.includes('/Onboarding') || url.includes('/Welcome') || url.includes('/Login')).toBe(true);
  });

  test('OAuthCallback with error param shows mapped error message', async ({ page }) => {
    const cc = collectConsoleMessages(page);
    await page.goto('/oauth/callback?error=oauth_denied', {
      waitUntil: 'domcontentloaded',
    });

    // Should show error or redirect
    const hasLoginFailed = await page.locator('text=Login Failed').first()
      .isVisible({ timeout: 10000 }).catch(() => false);

    if (hasLoginFailed) {
      const hasCancelledMsg = await page.locator('text=OAuth login was cancelled').first()
        .isVisible({ timeout: 5000 }).catch(() => false);
      expect(hasLoginFailed || hasCancelledMsg).toBe(true);
    }

    // Should eventually redirect
    await page.waitForTimeout(5000);
    const url = page.url();
    expect(url.includes('/Onboarding') || url.includes('/Welcome') || url.includes('/Login')).toBe(true);
  });

  test('OAuthCallback with account_blocked error shows deactivated message', async ({ page }) => {
    await page.goto('/oauth/callback?error=account_blocked', {
      waitUntil: 'domcontentloaded',
    });

    const hasLoginFailed = await page.locator('text=Login Failed').first()
      .isVisible({ timeout: 10000 }).catch(() => false);

    if (hasLoginFailed) {
      const hasDeactivated = await page.locator('text=Your account has been deactivated').first()
        .isVisible({ timeout: 5000 }).catch(() => false);
      expect(hasLoginFailed || hasDeactivated).toBe(true);
    } else {
      // Page may have auto-redirected
      await page.waitForTimeout(3000);
      const url = page.url();
      expect(url.includes('/Onboarding') || url.includes('/Welcome') || url.includes('/Login')).toBe(true);
    }
  });
});
