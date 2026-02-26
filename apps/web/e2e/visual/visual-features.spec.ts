/**
 * Visual Regression Tests - Feature Pages
 * Pages: Achievements, Analytics, Feedback, Notifications, Premium, ProfileBoost, ReferralProgram
 */
import {
  test, expect, setupAuthenticatedUser, navigateTo, waitForLoadingComplete,
} from '../fixtures';
import { DESKTOP_VIEWPORT, maskDynamicContent } from './visual-helpers';
import { mockNotifData, mockAchievementsData } from './visual-mocks';

test.describe('Visual - Feature Pages', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize(DESKTOP_VIEWPORT);
    await setupAuthenticatedUser(page);
  });

  test('Achievements page', async ({ page }) => {
    await mockAchievementsData(page);
    await navigateTo(page, '/Achievements');
    await expect(page).toHaveScreenshot('achievements-page.png', { maxDiffPixels: 150 });
  });

  test('Analytics page', async ({ page }) => {
    await mockAchievementsData(page);
    await navigateTo(page, '/Analytics');
    await maskDynamicContent(page);
    await expect(page).toHaveScreenshot('analytics-page.png', { maxDiffPixels: 150 });
  });

  test('Feedback page', async ({ page }) => {
    await navigateTo(page, '/Feedback');
    await expect(page).toHaveScreenshot('feedback-page.png', { maxDiffPixels: 100 });
  });

  test('Notifications page', async ({ page }) => {
    await mockNotifData(page);
    await page.goto('/Notifications');
    await waitForLoadingComplete(page);
    await maskDynamicContent(page);
    await expect(page).toHaveScreenshot('notifications-page.png', { maxDiffPixels: 150 });
  });

  test('Premium page', async ({ page }) => {
    await navigateTo(page, '/Premium');
    await expect(page).toHaveScreenshot('premium-page.png', { maxDiffPixels: 100 });
  });

  test('Profile Boost page', async ({ page }) => {
    await navigateTo(page, '/ProfileBoost');
    await expect(page).toHaveScreenshot('profile-boost-page.png', { maxDiffPixels: 100 });
  });

  test('Referral Program page', async ({ page }) => {
    await navigateTo(page, '/ReferralProgram');
    await expect(page).toHaveScreenshot('referral-program-page.png', { maxDiffPixels: 100 });
  });
});
