/**
 * Visual Regression Tests - Public Pages
 * Pages: Login, Welcome, Splash, Onboarding, PrivacyPolicy, TermsOfService
 */
import { test, expect, setupAuthenticatedUser, waitForLoadingComplete } from '../fixtures';
import { DESKTOP_VIEWPORT, maskDynamicContent } from './visual-helpers';

test.describe('Visual - Public Pages', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize(DESKTOP_VIEWPORT);
  });

  test('Login page', async ({ page }) => {
    await page.goto('/Login');
    await waitForLoadingComplete(page);
    await expect(page).toHaveScreenshot('login-page.png', { maxDiffPixels: 100 });
  });

  test('Welcome page', async ({ page }) => {
    await page.goto('/Welcome');
    await waitForLoadingComplete(page);
    await expect(page).toHaveScreenshot('welcome-page.png', { maxDiffPixels: 100 });
  });

  test('Splash page', async ({ page }) => {
    await page.goto('/Splash');
    await waitForLoadingComplete(page);
    await page.waitForTimeout(500);
    await expect(page).toHaveScreenshot('splash-page.png', { maxDiffPixels: 500 });
  });

  test('Onboarding page', async ({ page }) => {
    await setupAuthenticatedUser(page, { nickname: '' });
    await page.goto('/Onboarding');
    await waitForLoadingComplete(page);
    await expect(page).toHaveScreenshot('onboarding-page.png', { maxDiffPixels: 150 });
  });

  test('Privacy Policy page', async ({ page }) => {
    await page.goto('/PrivacyPolicy');
    await waitForLoadingComplete(page);
    await maskDynamicContent(page);
    await expect(page).toHaveScreenshot('privacy-policy-page.png', { maxDiffPixels: 150 });
  });

  test('Terms of Service page', async ({ page }) => {
    await page.goto('/TermsOfService');
    await waitForLoadingComplete(page);
    await maskDynamicContent(page);
    await expect(page).toHaveScreenshot('terms-of-service-page.png', { maxDiffPixels: 150 });
  });
});
