/**
 * Visual Regression Tests - Mobile Viewport
 * Key pages tested at 390x844 (iPhone 12)
 */
import {
  test, expect, setupAuthenticatedUser,
  navigateTo, waitForLoadingComplete,
} from '../fixtures';
import { MOBILE_VIEWPORT, maskDynamicContent, setupAdminUser } from './visual-helpers';
import { mockFeedData, mockDiscoverData, mockNotifData, mockAdminData, mockAchievementsData } from './visual-mocks';

test.describe('Visual - Mobile Viewport', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize(MOBILE_VIEWPORT);
  });

  test('Mobile - Login page', async ({ page }) => {
    await page.goto('/Login');
    await waitForLoadingComplete(page);
    await expect(page).toHaveScreenshot('login-mobile.png', { maxDiffPixels: 100 });
  });

  test('Mobile - Welcome page', async ({ page }) => {
    await page.goto('/Welcome');
    await waitForLoadingComplete(page);
    await expect(page).toHaveScreenshot('welcome-mobile.png', { maxDiffPixels: 100 });
  });

  test('Mobile - Home/Feed page', async ({ page }) => {
    await setupAuthenticatedUser(page);
    await mockFeedData(page);
    await navigateTo(page, '/');
    await maskDynamicContent(page);
    await expect(page).toHaveScreenshot('home-mobile.png', { maxDiffPixels: 200 });
  });

  test('Mobile - Discover page', async ({ page }) => {
    await setupAuthenticatedUser(page);
    await mockDiscoverData(page);
    await navigateTo(page, '/Discover');
    await maskDynamicContent(page);
    await expect(page).toHaveScreenshot('discover-mobile.png', { maxDiffPixels: 200 });
  });

  test('Mobile - Profile page', async ({ page }) => {
    await setupAuthenticatedUser(page);
    await navigateTo(page, '/Profile');
    await maskDynamicContent(page);
    await expect(page).toHaveScreenshot('profile-mobile.png', { maxDiffPixels: 150 });
  });

  test('Mobile - Settings page', async ({ page }) => {
    await setupAuthenticatedUser(page);
    await navigateTo(page, '/Settings');
    await expect(page).toHaveScreenshot('settings-mobile.png', { maxDiffPixels: 100 });
  });

  test('Mobile - LiveChat page', async ({ page }) => {
    await setupAuthenticatedUser(page);
    await navigateTo(page, '/LiveChat');
    await maskDynamicContent(page);
    await expect(page).toHaveScreenshot('livechat-mobile.png', { maxDiffPixels: 150 });
  });

  test('Mobile - Notifications page', async ({ page }) => {
    await setupAuthenticatedUser(page);
    await mockNotifData(page);
    await page.goto('/Notifications');
    await waitForLoadingComplete(page);
    await maskDynamicContent(page);
    await expect(page).toHaveScreenshot('notifications-mobile.png', { maxDiffPixels: 150 });
  });

  test('Mobile - Premium page', async ({ page }) => {
    await setupAuthenticatedUser(page);
    await navigateTo(page, '/Premium');
    await expect(page).toHaveScreenshot('premium-mobile.png', { maxDiffPixels: 100 });
  });

  test('Mobile - Achievements page', async ({ page }) => {
    await setupAuthenticatedUser(page);
    await mockAchievementsData(page);
    await navigateTo(page, '/Achievements');
    await expect(page).toHaveScreenshot('achievements-mobile.png', { maxDiffPixels: 150 });
  });

  test('Mobile - Audio Task page', async ({ page }) => {
    await setupAuthenticatedUser(page);
    await navigateTo(page, '/AudioTask');
    await expect(page).toHaveScreenshot('audio-task-mobile.png', { maxDiffPixels: 150 });
  });

  test('Mobile - Admin Dashboard', async ({ page }) => {
    await setupAdminUser(page);
    await mockAdminData(page);
    await navigateTo(page, '/AdminDashboard');
    await maskDynamicContent(page);
    await expect(page).toHaveScreenshot('admin-dashboard-mobile.png', { maxDiffPixels: 150 });
  });
});
