/**
 * Visual Regression Tests - Admin Pages
 * Pages: AdminDashboard, AdminUserManagement, AdminReportManagement,
 *        AdminActivityMonitoring, AdminChatMonitoring, AdminPreRegistration,
 *        AdminSystemSettings, ThemeSettings
 */
import { test, expect, waitForLoadingComplete, navigateTo } from '../fixtures';
import { DESKTOP_VIEWPORT, setupAdminUser, maskDynamicContent } from './visual-helpers';
import { mockAdminData } from './visual-mocks';

const ADMIN_DIFF = 500; // Admin pages have dynamic charts/widgets - allow higher diff

test.describe('Visual - Admin Pages', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize(DESKTOP_VIEWPORT);
    await setupAdminUser(page);
    await mockAdminData(page);
  });

  test('Admin Dashboard', async ({ page }) => {
    await navigateTo(page, '/AdminDashboard');
    await waitForLoadingComplete(page);
    await maskDynamicContent(page);
    await page.waitForTimeout(500);
    await expect(page).toHaveScreenshot('admin-dashboard.png', { maxDiffPixels: ADMIN_DIFF });
  });

  test('Admin User Management', async ({ page }) => {
    await navigateTo(page, '/AdminUserManagement');
    await waitForLoadingComplete(page);
    await maskDynamicContent(page);
    await page.waitForTimeout(500);
    await expect(page).toHaveScreenshot('admin-user-management.png', { maxDiffPixels: ADMIN_DIFF });
  });

  test('Admin Report Management', async ({ page }) => {
    await navigateTo(page, '/AdminReportManagement');
    await waitForLoadingComplete(page);
    await maskDynamicContent(page);
    await page.waitForTimeout(500);
    await expect(page).toHaveScreenshot('admin-report-management.png', { maxDiffPixels: ADMIN_DIFF });
  });

  test('Admin Activity Monitoring', async ({ page }) => {
    await navigateTo(page, '/AdminActivityMonitoring');
    await waitForLoadingComplete(page);
    await maskDynamicContent(page);
    await page.waitForTimeout(500);
    await expect(page).toHaveScreenshot('admin-activity-monitoring.png', { maxDiffPixels: ADMIN_DIFF });
  });

  test('Admin Chat Monitoring', async ({ page }) => {
    await navigateTo(page, '/AdminChatMonitoring');
    await waitForLoadingComplete(page);
    await maskDynamicContent(page);
    await page.waitForTimeout(500);
    await expect(page).toHaveScreenshot('admin-chat-monitoring.png', { maxDiffPixels: ADMIN_DIFF });
  });

  test('Admin Pre-Registration', async ({ page }) => {
    await navigateTo(page, '/AdminPreRegistration');
    await waitForLoadingComplete(page);
    await maskDynamicContent(page);
    await page.waitForTimeout(500);
    await expect(page).toHaveScreenshot('admin-pre-registration.png', { maxDiffPixels: ADMIN_DIFF });
  });

  test('Admin System Settings', async ({ page }) => {
    await navigateTo(page, '/AdminSystemSettings');
    await waitForLoadingComplete(page);
    await page.waitForTimeout(500);
    await expect(page).toHaveScreenshot('admin-system-settings.png', { maxDiffPixels: ADMIN_DIFF });
  });

  test('Theme Settings', async ({ page }) => {
    await navigateTo(page, '/ThemeSettings');
    await waitForLoadingComplete(page);
    await page.waitForTimeout(500);
    await expect(page).toHaveScreenshot('admin-theme-settings.png', { maxDiffPixels: ADMIN_DIFF });
  });
});
