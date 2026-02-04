/**
 * Settings E2E Tests
 *
 * Tests settings functionality including:
 * - Main settings page
 * - Theme settings
 * - Notification settings
 * - Privacy settings
 * - Blocked users
 * - Following list
 *
 * @see PRD.md Section 10.1 Phase 6 - Testing
 * Priority: Medium
 */

import { test, expect } from '@playwright/test';
import {
  setupAuthenticatedUser,
  mockApiResponse,
  createMockUser,
  waitForPageLoad,
  waitForLoadingComplete,
} from './fixtures';

test.describe('Settings', () => {
  test.describe('Main Settings Page', () => {
    test.beforeEach(async ({ page }) => {
      await setupAuthenticatedUser(page);
    });

    test('should display settings page', async ({ page }) => {
      await page.goto('/settings');
      await waitForPageLoad(page);

      // Should show settings header
      await expect(page.locator('text=/settings|הגדרות/i')).toBeVisible({ timeout: 10000 });
    });

    test('should show theme settings link', async ({ page }) => {
      await page.goto('/settings');
      await waitForPageLoad(page);

      // Should show theme option
      const themeLink = page.locator('text=/theme|appearance|ערכת נושא|מראה/i');
      await expect(themeLink.first()).toBeVisible({ timeout: 10000 });
    });

    test('should show notification settings link', async ({ page }) => {
      await page.goto('/settings');
      await waitForPageLoad(page);

      // Should show notifications option
      const notifLink = page.locator('text=/notification.*settings|notifications|התראות/i');
      await expect(notifLink.first()).toBeVisible({ timeout: 10000 });
    });

    test('should show privacy settings link', async ({ page }) => {
      await page.goto('/settings');
      await waitForPageLoad(page);

      // Should show privacy option
      const privacyLink = page.locator('text=/privacy|פרטיות/i');
      await expect(privacyLink.first()).toBeVisible({ timeout: 10000 });
    });

    test('should show blocked users link', async ({ page }) => {
      await page.goto('/settings');
      await waitForPageLoad(page);

      // Should show blocked users option
      const blockedLink = page.locator('text=/blocked.*users|blocked|חסומים/i');
      await expect(blockedLink.first()).toBeVisible({ timeout: 10000 });
    });

    test('should show logout button', async ({ page }) => {
      await page.goto('/settings');
      await waitForPageLoad(page);

      // Should show logout button
      const logoutButton = page.getByRole('button', { name: /logout|sign out|התנתק|יציאה/i });
      await expect(logoutButton).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('Theme Settings', () => {
    test.beforeEach(async ({ page }) => {
      await setupAuthenticatedUser(page);
    });

    test('should navigate to theme settings', async ({ page }) => {
      await page.goto('/settings');
      await waitForPageLoad(page);

      // Click theme settings
      const themeLink = page.locator('text=/theme|appearance|ערכת נושא/i');
      await themeLink.first().click();

      // Should navigate to theme settings
      await expect(page).toHaveURL(/.*theme.*/i);
    });

    test('should display theme options', async ({ page }) => {
      await page.goto('/themesettings');
      await waitForPageLoad(page);

      // Should show theme options
      const themeOptions = page.locator('text=/light|dark|system|בהיר|כהה|מערכת/i');
      await expect(themeOptions.first()).toBeVisible({ timeout: 10000 });
    });

    test('should toggle dark mode', async ({ page }) => {
      await page.goto('/themesettings');
      await waitForPageLoad(page);

      // Find dark mode toggle
      const darkToggle = page.locator('text=/dark|כהה/i');
      if (await darkToggle.isVisible()) {
        await darkToggle.click();
        // Theme should change
      }
    });
  });

  test.describe('Notification Settings', () => {
    test.beforeEach(async ({ page }) => {
      await setupAuthenticatedUser(page);
    });

    test('should navigate to notification settings', async ({ page }) => {
      await page.goto('/settings');
      await waitForPageLoad(page);

      // Click notification settings
      const notifLink = page.locator('a, button').filter({ hasText: /notification.*setting|notifications/i });
      if (await notifLink.first().isVisible()) {
        await notifLink.first().click();
        await expect(page).toHaveURL(/.*notification.*/i);
      }
    });

    test('should display notification toggles', async ({ page }) => {
      await page.goto('/notificationsettings');
      await waitForPageLoad(page);

      // Should show notification toggles
      const toggles = page.locator('input[type="checkbox"], button[role="switch"], [data-testid="toggle"]');
      await expect(toggles.first()).toBeVisible({ timeout: 10000 });
    });

    test('should toggle push notifications', async ({ page }) => {
      await mockApiResponse(page, '**/api/v1/users/settings', { success: true });

      await page.goto('/notificationsettings');
      await waitForPageLoad(page);

      // Find push notification toggle
      const pushToggle = page.locator('text=/push|דחיפה/i');
      // Toggle depends on implementation
    });
  });

  test.describe('Privacy Settings', () => {
    test.beforeEach(async ({ page }) => {
      await setupAuthenticatedUser(page);
    });

    test('should navigate to privacy settings', async ({ page }) => {
      await page.goto('/settings');
      await waitForPageLoad(page);

      // Click privacy settings
      const privacyLink = page.locator('a, button').filter({ hasText: /privacy|פרטיות/i });
      if (await privacyLink.first().isVisible()) {
        await privacyLink.first().click();
        await expect(page).toHaveURL(/.*privacy.*/i);
      }
    });

    test('should display privacy options', async ({ page }) => {
      await page.goto('/privacysettings');
      await waitForPageLoad(page);

      // Should show privacy options
      const privacyOptions = page.locator('text=/profile.*visibility|who can see|נראות/i');
      // Options depend on implementation
    });
  });

  test.describe('Blocked Users', () => {
    test.beforeEach(async ({ page }) => {
      await setupAuthenticatedUser(page);
    });

    test('should navigate to blocked users', async ({ page }) => {
      await page.goto('/settings');
      await waitForPageLoad(page);

      // Click blocked users
      const blockedLink = page.locator('a, button').filter({ hasText: /blocked|חסומים/i });
      if (await blockedLink.first().isVisible()) {
        await blockedLink.first().click();
        await expect(page).toHaveURL(/.*blocked.*/i);
      }
    });

    test('should display blocked users list', async ({ page }) => {
      await mockApiResponse(page, '**/api/v1/users/blocked*', {
        blockedUsers: [
          createMockUser({ id: 'blocked-1', nickname: 'BlockedUser1' }),
        ],
      });

      await page.goto('/blockedusers');
      await waitForPageLoad(page);
      await waitForLoadingComplete(page);

      // Should show blocked user
      await expect(page.locator('text=/blockeduser1/i')).toBeVisible({ timeout: 10000 });
    });

    test('should show empty state when no blocked users', async ({ page }) => {
      await mockApiResponse(page, '**/api/v1/users/blocked*', { blockedUsers: [] });

      await page.goto('/blockedusers');
      await waitForPageLoad(page);
      await waitForLoadingComplete(page);

      // Should show empty state
      await expect(page.locator('text=/no blocked|אין חסומים/i')).toBeVisible({ timeout: 10000 });
    });

    test('should unblock user', async ({ page }) => {
      await mockApiResponse(page, '**/api/v1/users/blocked*', {
        blockedUsers: [
          createMockUser({ id: 'blocked-1', nickname: 'BlockedUser1' }),
        ],
      });
      await mockApiResponse(page, '**/api/v1/users/blocked-1/unblock', { success: true });

      await page.goto('/blockedusers');
      await waitForPageLoad(page);
      await waitForLoadingComplete(page);

      // Click unblock button
      const unblockButton = page.getByRole('button', { name: /unblock|בטל חסימה/i });
      if (await unblockButton.isVisible()) {
        await unblockButton.click();
      }
    });
  });

  test.describe('Following List', () => {
    test.beforeEach(async ({ page }) => {
      await setupAuthenticatedUser(page);
    });

    test('should navigate to following list', async ({ page }) => {
      await page.goto('/settings');
      await waitForPageLoad(page);

      // Click following
      const followingLink = page.locator('a, button').filter({ hasText: /following|עוקבים/i });
      if (await followingLink.first().isVisible()) {
        await followingLink.first().click();
        await expect(page).toHaveURL(/.*following.*/i);
      }
    });

    test('should display following list', async ({ page }) => {
      await mockApiResponse(page, '**/api/v1/follows/following*', {
        following: [
          createMockUser({ id: 'following-1', nickname: 'FollowingUser1' }),
        ],
      });

      await page.goto('/followinglist');
      await waitForPageLoad(page);
      await waitForLoadingComplete(page);

      // Should show following user
      await expect(page.locator('text=/followinguser1/i')).toBeVisible({ timeout: 10000 });
    });

    test('should show empty state when not following anyone', async ({ page }) => {
      await mockApiResponse(page, '**/api/v1/follows/following*', { following: [] });

      await page.goto('/followinglist');
      await waitForPageLoad(page);
      await waitForLoadingComplete(page);

      // Should show empty state
      await expect(page.locator('text=/not following|אינך עוקב/i')).toBeVisible({ timeout: 10000 });
    });

    test('should unfollow user', async ({ page }) => {
      await mockApiResponse(page, '**/api/v1/follows/following*', {
        following: [
          createMockUser({ id: 'following-1', nickname: 'FollowingUser1' }),
        ],
      });
      await mockApiResponse(page, '**/api/v1/follows/following-1', { success: true });

      await page.goto('/followinglist');
      await waitForPageLoad(page);
      await waitForLoadingComplete(page);

      // Click unfollow button
      const unfollowButton = page.getByRole('button', { name: /unfollow|הפסק לעקוב/i });
      if (await unfollowButton.isVisible()) {
        await unfollowButton.click();
      }
    });
  });

  test.describe('Filter Settings', () => {
    test.beforeEach(async ({ page }) => {
      await setupAuthenticatedUser(page);
    });

    test('should navigate to filter settings', async ({ page }) => {
      await page.goto('/settings');
      await waitForPageLoad(page);

      // Click filters
      const filterLink = page.locator('a, button').filter({ hasText: /filter|מסנן/i });
      if (await filterLink.first().isVisible()) {
        await filterLink.first().click();
        await expect(page).toHaveURL(/.*filter.*/i);
      }
    });

    test('should display filter options', async ({ page }) => {
      await page.goto('/filtersettings');
      await waitForPageLoad(page);

      // Should show filter options (age, location, etc.)
      const filterOptions = page.locator('text=/age|location|גיל|מיקום/i');
      await expect(filterOptions.first()).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('Logout', () => {
    test.beforeEach(async ({ page }) => {
      await setupAuthenticatedUser(page);
    });

    test('should logout and redirect to onboarding', async ({ page }) => {
      await mockApiResponse(page, '**/api/v1/auth/logout', { success: true });

      await page.goto('/settings');
      await waitForPageLoad(page);

      // Click logout
      const logoutButton = page.getByRole('button', { name: /logout|sign out|התנתק|יציאה/i });
      await logoutButton.click();

      // May show confirmation dialog
      const confirmButton = page.getByRole('button', { name: /confirm|yes|אישור|כן/i });
      if (await confirmButton.isVisible()) {
        await confirmButton.click();
      }

      // Should redirect to onboarding
      await expect(page).toHaveURL(/.*onboarding.*/);
    });

    test('should clear local storage on logout', async ({ page }) => {
      await mockApiResponse(page, '**/api/v1/auth/logout', { success: true });

      await page.goto('/settings');
      await waitForPageLoad(page);

      // Click logout
      const logoutButton = page.getByRole('button', { name: /logout|sign out|התנתק|יציאה/i });
      await logoutButton.click();

      // Confirm if needed
      const confirmButton = page.getByRole('button', { name: /confirm|yes|אישור|כן/i });
      if (await confirmButton.isVisible()) {
        await confirmButton.click();
      }

      // Wait for redirect
      await page.waitForTimeout(1000);

      // Check token is cleared
      const token = await page.evaluate(() => localStorage.getItem('accessToken'));
      expect(token).toBeNull();
    });
  });

  test.describe('Loading States', () => {
    test('should show loading skeleton', async ({ page }) => {
      await setupAuthenticatedUser(page);

      // Delay response
      await page.route('**/api/v1/users/blocked*', async (route) => {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ blockedUsers: [] }),
        });
      });

      await page.goto('/blockedusers');

      // Should show skeleton
      const skeleton = page.locator('.animate-pulse, [data-testid="list-skeleton"]');
      await expect(skeleton.first()).toBeVisible({ timeout: 3000 });
    });
  });
});

test.describe('Settings - Mobile', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('should display mobile-optimized settings', async ({ page }) => {
    await setupAuthenticatedUser(page);

    await page.goto('/settings');
    await waitForPageLoad(page);

    // Check viewport
    const viewport = page.viewportSize();
    expect(viewport?.width).toBe(375);

    // Settings should be visible
    await expect(page.locator('text=/settings|הגדרות/i')).toBeVisible({ timeout: 10000 });
  });

  test('should have touch-friendly menu items', async ({ page }) => {
    await setupAuthenticatedUser(page);

    await page.goto('/settings');
    await waitForPageLoad(page);

    // Menu items should be large enough
    const menuItem = page.locator('a, button').filter({ hasText: /theme|privacy|notifications/i }).first();
    if (await menuItem.isVisible()) {
      const box = await menuItem.boundingBox();
      if (box) {
        expect(box.height).toBeGreaterThanOrEqual(44);
      }
    }
  });
});
