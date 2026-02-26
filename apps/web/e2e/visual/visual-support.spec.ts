/**
 * Visual Regression Tests - Support Pages
 * Pages: SafetyCenter, HelpSupport, FAQ, EmailSupport
 */
import {
  test, expect, setupAuthenticatedUser, navigateTo,
} from '../fixtures';
import { DESKTOP_VIEWPORT } from './visual-helpers';

test.describe('Visual - Support Pages', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize(DESKTOP_VIEWPORT);
    await setupAuthenticatedUser(page);
  });

  test('Safety Center page', async ({ page }) => {
    await navigateTo(page, '/SafetyCenter');
    await expect(page).toHaveScreenshot('safety-center-page.png', { maxDiffPixels: 100 });
  });

  test('Help & Support page', async ({ page }) => {
    await navigateTo(page, '/HelpSupport');
    await expect(page).toHaveScreenshot('help-support-page.png', { maxDiffPixels: 100 });
  });

  test('FAQ page', async ({ page }) => {
    await navigateTo(page, '/FAQ');
    await expect(page).toHaveScreenshot('faq-page.png', { maxDiffPixels: 100 });
  });

  test('Email Support page', async ({ page }) => {
    await navigateTo(page, '/EmailSupport');
    await expect(page).toHaveScreenshot('email-support-page.png', { maxDiffPixels: 100 });
  });
});
