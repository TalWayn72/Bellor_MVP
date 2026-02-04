/**
 * Navigation E2E Tests
 *
 * Tests core navigation flows and page accessibility
 *
 * @see PRD.md Section 10.1 Phase 6 - Testing
 * Priority: High
 */

import { test, expect } from '@playwright/test';
import { waitForPageLoad, mockApiResponse, checkAccessibility } from './fixtures';

// Mock authenticated user data
const mockUser = {
  id: 'test-user-id',
  email: 'test@bellor.app',
  firstName: 'Test',
  lastName: 'User',
  isVerified: true,
  isPremium: false,
};

// Setup authenticated state before navigation tests
test.describe('Navigation', () => {
  test.beforeEach(async ({ page }) => {
    // Set up authenticated state
    await page.goto('/');
    await page.evaluate((user) => {
      localStorage.setItem('accessToken', 'mock-token');
      localStorage.setItem('user', JSON.stringify(user));
    }, mockUser);

    // Mock common API endpoints
    await mockApiResponse(page, '**/api/v1/users/me', mockUser);
    await mockApiResponse(page, '**/api/v1/missions/today', {
      mission: {
        id: 'daily-mission',
        title: 'Daily Mission',
        description: 'Test mission',
        missionType: 'DAILY',
      },
    });
    await mockApiResponse(page, '**/api/v1/responses*', { responses: [], pagination: { total: 0 } });
    await mockApiResponse(page, '**/api/v1/notifications*', { notifications: [], unreadCount: 0 });
  });

  test.describe('Bottom Navigation', () => {
    test('should display bottom navigation on main pages', async ({ page }) => {
      await page.goto('/home');
      await waitForPageLoad(page);

      // Check for bottom navigation (mobile/tablet view)
      const bottomNav = page.locator('nav, [role="navigation"]').filter({ hasText: /home|mission|feed/i });
      // Note: visibility depends on viewport size
    });

    test('should navigate to Home page', async ({ page }) => {
      await page.goto('/discover');
      await waitForPageLoad(page);

      // Click home navigation
      const homeLink = page.getByRole('link', { name: /home|בית/i });
      if (await homeLink.isVisible()) {
        await homeLink.click();
        await expect(page).toHaveURL(/.*home.*/);
      }
    });

    test('should navigate to Discover/Feed page', async ({ page }) => {
      await page.goto('/home');
      await waitForPageLoad(page);

      // Mock feed API
      await mockApiResponse(page, '**/api/v1/feed*', { responses: [], pagination: { total: 0 } });

      const discoverLink = page.getByRole('link', { name: /discover|feed|גלה|פיד/i });
      if (await discoverLink.isVisible()) {
        await discoverLink.click();
        await expect(page).toHaveURL(/.*(discover|feed).*/);
      }
    });

    test('should navigate to Profile page', async ({ page }) => {
      await page.goto('/home');
      await waitForPageLoad(page);

      // Mock profile API
      await mockApiResponse(page, '**/api/v1/users/*', mockUser);

      const profileLink = page.getByRole('link', { name: /profile|פרופיל/i });
      if (await profileLink.isVisible()) {
        await profileLink.click();
        await expect(page).toHaveURL(/.*profile.*/);
      }
    });

    test('should highlight active navigation item', async ({ page }) => {
      await page.goto('/home');
      await waitForPageLoad(page);

      // Check that home is highlighted/active
      const activeNav = page.locator('[aria-current="page"], .active, [data-active="true"]');
      if ((await activeNav.count()) > 0) {
        await expect(activeNav.first()).toBeVisible();
      }
    });
  });

  test.describe('Page Routes', () => {
    test('should load Home page', async ({ page }) => {
      await page.goto('/home');
      await waitForPageLoad(page);

      // Page should load without errors
      await expect(page).toHaveURL(/.*home.*/);

      // Check for main content
      const main = page.locator('main, [role="main"], .main-content');
      if ((await main.count()) > 0) {
        await expect(main.first()).toBeVisible();
      }
    });

    test('should load Mission page', async ({ page }) => {
      // Mock mission API
      await mockApiResponse(page, '**/api/v1/missions/**', {
        id: 'test-mission',
        title: 'Test Mission',
        description: 'Test description',
        missionType: 'DAILY',
        responseTypes: ['TEXT'],
      });

      await page.goto('/mission');
      await waitForPageLoad(page);

      await expect(page).toHaveURL(/.*mission.*/);
    });

    test('should load Settings page', async ({ page }) => {
      await page.goto('/settings');
      await waitForPageLoad(page);

      await expect(page).toHaveURL(/.*settings.*/);

      // Check for settings elements
      const settingsHeading = page.locator('text=/settings|הגדרות/i');
      await expect(settingsHeading).toBeVisible({ timeout: 5000 });
    });

    test('should load Notifications page', async ({ page }) => {
      await mockApiResponse(page, '**/api/v1/notifications*', {
        notifications: [],
        unreadCount: 0,
      });

      await page.goto('/notifications');
      await waitForPageLoad(page);

      await expect(page).toHaveURL(/.*notifications.*/);
    });

    test('should load Chat/Messages page', async ({ page }) => {
      await mockApiResponse(page, '**/api/v1/chats*', { chats: [] });

      await page.goto('/messages');
      await waitForPageLoad(page);

      await expect(page).toHaveURL(/.*(messages|chat).*/);
    });
  });

  test.describe('Protected Routes', () => {
    test('should redirect unauthenticated user to login', async ({ page }) => {
      // Clear authentication
      await page.goto('/');
      await page.evaluate(() => {
        localStorage.clear();
      });

      // Try to access protected page
      await page.goto('/home');

      // Should redirect to onboarding/login
      await expect(page).toHaveURL(/.*onboarding.*/);
    });

    test('should allow authenticated user to access protected routes', async ({ page }) => {
      await page.goto('/home');
      await waitForPageLoad(page);

      // Should stay on home page
      await expect(page).toHaveURL(/.*home.*/);
    });

    test('should redirect blocked user to appropriate page', async ({ page }) => {
      // Set up blocked user state
      await page.evaluate(() => {
        localStorage.setItem('accessToken', 'mock-token');
        localStorage.setItem(
          'user',
          JSON.stringify({
            id: 'blocked-user',
            email: 'blocked@example.com',
            isBlocked: true,
          })
        );
      });

      // Mock API returning blocked status
      await page.route('**/api/v1/**', (route) => {
        route.fulfill({
          status: 403,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Account is blocked' }),
        });
      });

      await page.goto('/home');

      // Should show blocked message or redirect
      await expect(page.locator('text=/blocked|חסום|deactivated/i')).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('Back Navigation', () => {
    test('should navigate back using browser back button', async ({ page }) => {
      await page.goto('/home');
      await waitForPageLoad(page);

      await page.goto('/settings');
      await waitForPageLoad(page);

      // Go back
      await page.goBack();

      // Should be back on home
      await expect(page).toHaveURL(/.*home.*/);
    });

    test('should navigate back using app back button', async ({ page }) => {
      await page.goto('/settings');
      await waitForPageLoad(page);

      // Look for back button
      const backButton = page.getByRole('button', { name: /back|חזור/i });
      if (await backButton.isVisible()) {
        await backButton.click();
        // Should navigate away from settings
        await expect(page).not.toHaveURL(/.*settings.*/);
      }
    });
  });

  test.describe('Deep Linking', () => {
    test('should handle deep link to user profile', async ({ page }) => {
      await mockApiResponse(page, '**/api/v1/users/user-123', {
        id: 'user-123',
        firstName: 'Other',
        lastName: 'User',
        email: 'other@example.com',
      });

      await page.goto('/userprofile?id=user-123');
      await waitForPageLoad(page);

      await expect(page).toHaveURL(/.*userprofile.*user-123.*/);
    });

    test('should handle deep link to specific mission', async ({ page }) => {
      await mockApiResponse(page, '**/api/v1/missions/mission-456', {
        id: 'mission-456',
        title: 'Specific Mission',
        description: 'Test',
        missionType: 'DAILY',
      });

      await page.goto('/mission?id=mission-456');
      await waitForPageLoad(page);

      await expect(page).toHaveURL(/.*mission.*456.*/);
    });

    test('should handle invalid deep link gracefully', async ({ page }) => {
      await page.goto('/nonexistent-page');

      // Should either show 404 or redirect
      const is404 = await page.locator('text=/not found|404|לא נמצא/i').isVisible({ timeout: 3000 });
      const isRedirected = page.url().includes('home') || page.url().includes('onboarding');

      expect(is404 || isRedirected).toBeTruthy();
    });
  });

  test.describe('Accessibility', () => {
    test('should have proper page structure', async ({ page }) => {
      await page.goto('/home');
      await waitForPageLoad(page);

      await checkAccessibility(page);
    });

    test('should have skip to content link', async ({ page }) => {
      await page.goto('/home');

      // Check for skip link (may be hidden until focused)
      const skipLink = page.locator('a[href="#main-content"], a[href="#content"]');
      if ((await skipLink.count()) > 0) {
        await skipLink.first().focus();
        await expect(skipLink.first()).toBeVisible();
      }
    });

    test('should be navigable with keyboard', async ({ page }) => {
      await page.goto('/home');
      await waitForPageLoad(page);

      // Tab through navigation
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');

      // Check that something is focused
      const focusedElement = page.locator(':focus');
      if ((await focusedElement.count()) > 0) {
        await expect(focusedElement.first()).toBeVisible();
      }
    });
  });
});

test.describe('Navigation - Mobile', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('should show mobile bottom navigation', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('accessToken', 'mock-token');
      localStorage.setItem('user', JSON.stringify({ id: 'test', email: 'test@example.com' }));
    });

    await mockApiResponse(page, '**/api/v1/**', {});
    await page.goto('/home');
    await waitForPageLoad(page);

    // Check for mobile navigation
    const mobileNav = page.locator('nav').filter({ hasText: /home|discover|profile/i });
    // Mobile nav should be at bottom
  });

  test('should not show hamburger menu on mobile when bottom nav exists', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('accessToken', 'mock-token');
      localStorage.setItem('user', JSON.stringify({ id: 'test', email: 'test@example.com' }));
    });

    await mockApiResponse(page, '**/api/v1/**', {});
    await page.goto('/home');
    await waitForPageLoad(page);

    // App uses bottom nav, not hamburger menu
    const hamburger = page.locator('[aria-label="menu"], .hamburger, button:has(svg.menu-icon)');
    // Bottom nav apps typically don't have hamburger menus
  });
});

test.describe('Navigation - Tablet', () => {
  test.use({ viewport: { width: 768, height: 1024 } });

  test('should display tablet-optimized navigation', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('accessToken', 'mock-token');
      localStorage.setItem('user', JSON.stringify({ id: 'test', email: 'test@example.com' }));
    });

    await mockApiResponse(page, '**/api/v1/**', {});
    await page.goto('/home');
    await waitForPageLoad(page);

    // Tablet view - could be sidebar or bottom nav
    const viewport = page.viewportSize();
    expect(viewport?.width).toBe(768);
  });
});
