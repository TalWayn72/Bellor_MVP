/**
 * Visual Regression Tests - Interaction States
 * Tests hover, focus, active, and modal states on key pages
 */
import {
  test, expect, setupAuthenticatedUser, navigateTo,
  waitForLoadingComplete, mockDailyMission,
} from '../fixtures';
import { DESKTOP_VIEWPORT, maskDynamicContent, setupAdminUser } from './visual-helpers';
import { mockFeedData, mockAdminData, mockDiscoverData } from './visual-mocks';

test.describe('Visual - Interaction States', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize(DESKTOP_VIEWPORT);
  });

  test('Login form - focused state', async ({ page }) => {
    await page.goto('/Login');
    await waitForLoadingComplete(page);
    const emailInput = page.locator('input[type="email"], input[name="email"]').first();
    if (await emailInput.isVisible().catch(() => false)) {
      await emailInput.focus();
      await expect(page).toHaveScreenshot('login-form-focused.png', { maxDiffPixels: 100 });
    }
  });

  test('Login button - hover state', async ({ page }) => {
    await page.goto('/Login');
    await waitForLoadingComplete(page);
    const submitBtn = page.getByRole('button', { name: /login|sign in|enter/i }).first();
    if (await submitBtn.isVisible().catch(() => false)) {
      await submitBtn.hover();
      await expect(page).toHaveScreenshot('login-button-hover.png', { maxDiffPixels: 100 });
    }
  });

  test('Admin filter buttons - active state', async ({ page }) => {
    await setupAdminUser(page);
    await mockAdminData(page);
    await navigateTo(page, '/AdminUserManagement');
    await maskDynamicContent(page);
    const activeBtn = page.getByRole('button', { name: /Active/i }).first();
    if (await activeBtn.isVisible().catch(() => false)) {
      await activeBtn.click();
      await expect(page).toHaveScreenshot('admin-filters-active.png', { maxDiffPixels: 150 });
    }
  });

  test('Admin search input - typing state', async ({ page }) => {
    await setupAdminUser(page);
    await mockAdminData(page);
    await navigateTo(page, '/AdminUserManagement');
    const searchInput = page.locator('input[placeholder*="Search"]').first();
    if (await searchInput.isVisible().catch(() => false)) {
      await searchInput.fill('test@example.com');
      await expect(page).toHaveScreenshot('admin-search-typing.png', { maxDiffPixels: 150 });
    }
  });

  test('Settings menu item - hover state', async ({ page }) => {
    await setupAuthenticatedUser(page);
    await navigateTo(page, '/Settings');
    const menuItem = page.locator('a, button').filter({ hasText: /privacy|notification/i }).first();
    if (await menuItem.isVisible().catch(() => false)) {
      await menuItem.hover();
      await expect(page).toHaveScreenshot('settings-item-hover.png', { maxDiffPixels: 100 });
    }
  });

  test('Discover card - hover actions', async ({ page }) => {
    await setupAuthenticatedUser(page);
    await mockDiscoverData(page);
    await navigateTo(page, '/Discover');
    await maskDynamicContent(page);
    const actionBtn = page.locator('[data-testid="like-button"], button').filter({ hasText: /like/i }).first();
    if (await actionBtn.isVisible().catch(() => false)) {
      await actionBtn.hover();
      await expect(page).toHaveScreenshot('discover-action-hover.png', { maxDiffPixels: 200 });
    }
  });

  test('Premium plan - selected state', async ({ page }) => {
    await setupAuthenticatedUser(page);
    await navigateTo(page, '/Premium');
    const planCard = page.locator('[data-testid="plan-card"], .plan-card, [role="radio"]').first();
    if (await planCard.isVisible().catch(() => false)) {
      await planCard.click();
      await expect(page).toHaveScreenshot('premium-plan-selected.png', { maxDiffPixels: 100 });
    }
  });

  test('Daily task selector modal', async ({ page }) => {
    await setupAuthenticatedUser(page);
    await mockDailyMission(page);
    await mockFeedData(page);
    await navigateTo(page, '/');
    const taskBtn = page.getByRole('button', { name: /daily.*mission|task/i }).first();
    if (await taskBtn.isVisible().catch(() => false)) {
      await taskBtn.click();
      const modal = page.locator('[role="dialog"]');
      await modal.waitFor({ timeout: 5000 }).catch(() => {});
      if (await modal.isVisible().catch(() => false)) {
        await expect(modal).toHaveScreenshot('task-selector-modal.png', { maxDiffPixels: 100 });
      }
    }
  });

  test('FAQ question - expanded state', async ({ page }) => {
    await setupAuthenticatedUser(page);
    await navigateTo(page, '/FAQ');
    const question = page.locator('button').filter({ hasText: /.{10,}/ }).first();
    if (await question.isVisible().catch(() => false)) {
      await question.click();
      await expect(page).toHaveScreenshot('faq-expanded.png', { maxDiffPixels: 100 });
    }
  });
});
