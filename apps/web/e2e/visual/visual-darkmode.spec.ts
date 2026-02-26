/**
 * Visual Regression Tests - Dark Mode
 * Key pages tested with dark theme enabled
 */
import {
  test, expect, setupAuthenticatedUser,
  navigateTo, waitForLoadingComplete,
} from '../fixtures';
import {
  DESKTOP_VIEWPORT, enableDarkMode, applyDarkClass, maskDynamicContent, setupAdminUser,
} from './visual-helpers';
import {
  mockFeedData, mockDiscoverData, mockNotifData, mockAchievementsData, mockAdminData,
} from './visual-mocks';

test.describe('Visual - Dark Mode', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize(DESKTOP_VIEWPORT);
    await enableDarkMode(page);
  });

  test('Dark mode - Login page', async ({ page }) => {
    await page.goto('/Login');
    await waitForLoadingComplete(page);
    await applyDarkClass(page);
    await expect(page).toHaveScreenshot('login-dark.png', { maxDiffPixels: 100 });
  });

  test('Dark mode - Home/Feed page', async ({ page }) => {
    await setupAuthenticatedUser(page);
    await mockFeedData(page);
    await navigateTo(page, '/');
    await applyDarkClass(page);
    await maskDynamicContent(page);
    await expect(page).toHaveScreenshot('home-dark.png', { maxDiffPixels: 200 });
  });

  test('Dark mode - Profile page', async ({ page }) => {
    await setupAuthenticatedUser(page);
    await navigateTo(page, '/Profile');
    await applyDarkClass(page);
    await maskDynamicContent(page);
    await expect(page).toHaveScreenshot('profile-dark.png', { maxDiffPixels: 150 });
  });

  test('Dark mode - Discover page', async ({ page }) => {
    await setupAuthenticatedUser(page);
    await mockDiscoverData(page);
    await navigateTo(page, '/Discover');
    await applyDarkClass(page);
    await maskDynamicContent(page);
    await expect(page).toHaveScreenshot('discover-dark.png', { maxDiffPixels: 200 });
  });

  test('Dark mode - Settings page', async ({ page }) => {
    await setupAuthenticatedUser(page);
    await navigateTo(page, '/Settings');
    await applyDarkClass(page);
    await expect(page).toHaveScreenshot('settings-dark.png', { maxDiffPixels: 100 });
  });

  test('Dark mode - LiveChat page', async ({ page }) => {
    await setupAuthenticatedUser(page);
    await navigateTo(page, '/LiveChat');
    await applyDarkClass(page);
    await maskDynamicContent(page);
    await expect(page).toHaveScreenshot('livechat-dark.png', { maxDiffPixels: 150 });
  });

  test('Dark mode - Notifications page', async ({ page }) => {
    await setupAuthenticatedUser(page);
    await mockNotifData(page);
    await page.goto('/Notifications');
    await waitForLoadingComplete(page);
    await applyDarkClass(page);
    await maskDynamicContent(page);
    await expect(page).toHaveScreenshot('notifications-dark.png', { maxDiffPixels: 150 });
  });

  test('Dark mode - Premium page', async ({ page }) => {
    await setupAuthenticatedUser(page);
    await navigateTo(page, '/Premium');
    await applyDarkClass(page);
    await expect(page).toHaveScreenshot('premium-dark.png', { maxDiffPixels: 100 });
  });

  test('Dark mode - Achievements page', async ({ page }) => {
    await setupAuthenticatedUser(page);
    await mockAchievementsData(page);
    await navigateTo(page, '/Achievements');
    await applyDarkClass(page);
    await expect(page).toHaveScreenshot('achievements-dark.png', { maxDiffPixels: 150 });
  });

  test('Dark mode - Admin Dashboard', async ({ page }) => {
    await setupAdminUser(page);
    await mockAdminData(page);
    await navigateTo(page, '/AdminDashboard');
    await applyDarkClass(page);
    await maskDynamicContent(page);
    await expect(page).toHaveScreenshot('admin-dashboard-dark.png', { maxDiffPixels: 150 });
  });
});
