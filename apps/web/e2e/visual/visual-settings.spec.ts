/**
 * Visual Regression Tests - Settings Pages
 * Pages: Settings, PrivacySettings, NotificationSettings, FilterSettings, BlockedUsers
 */
import {
  test, expect, setupAuthenticatedUser, navigateTo,
} from '../fixtures';
import { DESKTOP_VIEWPORT, maskDynamicContent } from './visual-helpers';
import { mockBlockedUsersData } from './visual-mocks';

test.describe('Visual - Settings Pages', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize(DESKTOP_VIEWPORT);
    await setupAuthenticatedUser(page);
  });

  test('Settings page', async ({ page }) => {
    await navigateTo(page, '/Settings');
    await expect(page).toHaveScreenshot('settings-page.png', { maxDiffPixels: 100 });
  });

  test('Privacy Settings page', async ({ page }) => {
    await navigateTo(page, '/PrivacySettings');
    await expect(page).toHaveScreenshot('privacy-settings-page.png', { maxDiffPixels: 100 });
  });

  test('Notification Settings page', async ({ page }) => {
    await navigateTo(page, '/NotificationSettings');
    await expect(page).toHaveScreenshot('notification-settings-page.png', { maxDiffPixels: 100 });
  });

  test('Filter Settings page', async ({ page }) => {
    await navigateTo(page, '/FilterSettings');
    await expect(page).toHaveScreenshot('filter-settings-page.png', { maxDiffPixels: 100 });
  });

  test('Blocked Users page', async ({ page }) => {
    await mockBlockedUsersData(page);
    await navigateTo(page, '/BlockedUsers');
    await expect(page).toHaveScreenshot('blocked-users-page.png', { maxDiffPixels: 100 });
  });
});
