/**
 * Visual Regression Tests - RTL Layout
 * Tests RTL-specific rendering for admin sidebar, chat, and Hebrew content
 */
import {
  test, expect, setupAuthenticatedUser, navigateTo,
} from '../fixtures';
import { DESKTOP_VIEWPORT, MOBILE_VIEWPORT, maskDynamicContent, setupAdminUser } from './visual-helpers';
import { mockAdminData, mockChatData } from './visual-mocks';

test.describe('Visual - RTL Layout', () => {
  test('Admin Dashboard RTL sidebar', async ({ page }) => {
    await page.setViewportSize(DESKTOP_VIEWPORT);
    await setupAdminUser(page);
    await mockAdminData(page);
    await navigateTo(page, '/AdminDashboard');
    await maskDynamicContent(page);

    // Capture sidebar area specifically
    const sidebar = page.locator('aside, nav').first();
    if (await sidebar.isVisible().catch(() => false)) {
      await expect(sidebar).toHaveScreenshot('admin-rtl-sidebar.png', { maxDiffPixels: 100 });
    }
  });

  test('Admin mobile sidebar open (RTL)', async ({ page }) => {
    await page.setViewportSize(MOBILE_VIEWPORT);
    await setupAdminUser(page);
    await mockAdminData(page);
    await navigateTo(page, '/AdminDashboard');

    // Click hamburger menu to open mobile sidebar
    const menuBtn = page.getByRole('button', { name: /menu|sidebar/i }).first();
    if (await menuBtn.isVisible().catch(() => false)) {
      await menuBtn.click();
      await page.waitForTimeout(300); // Wait for animation
      await expect(page).toHaveScreenshot('admin-rtl-mobile-sidebar.png', { maxDiffPixels: 150 });
    }
  });

  test('LiveChat RTL alignment', async ({ page }) => {
    await page.setViewportSize(DESKTOP_VIEWPORT);
    await setupAuthenticatedUser(page);
    await mockChatData(page);
    await navigateTo(page, '/LiveChat');
    await maskDynamicContent(page);
    await expect(page).toHaveScreenshot('livechat-rtl.png', { maxDiffPixels: 150 });
  });

  test('Safety Center RTL content', async ({ page }) => {
    await page.setViewportSize(DESKTOP_VIEWPORT);
    await setupAuthenticatedUser(page);
    await navigateTo(page, '/SafetyCenter');
    await expect(page).toHaveScreenshot('safety-rtl.png', { maxDiffPixels: 100 });
  });
});
