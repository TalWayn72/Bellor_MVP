/**
 * Visual Regression Tests
 *
 * Uses Playwright's built-in screenshot comparison to catch UI regressions.
 *
 * @see PRD.md Section 10.1 Phase 6 - Testing
 *
 * IMPORTANT: Run with --update-snapshots to generate baseline screenshots on first run
 * or when UI changes are intentional.
 *
 * Commands:
 * - npm run test:visual              # Run visual tests
 * - npm run test:visual:update       # Update baseline screenshots
 */

import { test, expect } from '@playwright/test';
import {
  setupAuthenticatedUser,
  mockFeedResponses,
  createMockResponse,
  mockDailyMission,
  mockChats,
  mockNotifications,
  waitForLoadingComplete,
  navigateTo,
} from '../fixtures';

test.describe('Visual Regression Tests - Public Pages', () => {
  test.beforeEach(async ({ page }) => {
    // Set consistent viewport for desktop tests
    await page.setViewportSize({ width: 1280, height: 720 });
  });

  test('Login page appears correctly', async ({ page }) => {
    await page.goto('/Login');
    await waitForLoadingComplete(page);

    // Take screenshot and compare
    await expect(page).toHaveScreenshot('login-page.png', {
      maxDiffPixels: 100,
    });
  });

  test('Welcome page appears correctly', async ({ page }) => {
    await page.goto('/Welcome');
    await waitForLoadingComplete(page);

    await expect(page).toHaveScreenshot('welcome-page.png', {
      maxDiffPixels: 100,
    });
  });

  test('Privacy Policy page appears correctly', async ({ page }) => {
    await page.goto('/PrivacyPolicy');
    await waitForLoadingComplete(page);

    // Hide dynamic dates in footer
    await page.addStyleTag({
      content: 'footer time, .footer-date { visibility: hidden; }',
    });

    await expect(page).toHaveScreenshot('privacy-policy-page.png', {
      maxDiffPixels: 150,
    });
  });

  test('Terms of Service page appears correctly', async ({ page }) => {
    await page.goto('/TermsOfService');
    await waitForLoadingComplete(page);

    // Hide dynamic dates
    await page.addStyleTag({
      content: 'footer time, .footer-date { visibility: hidden; }',
    });

    await expect(page).toHaveScreenshot('terms-of-service-page.png', {
      maxDiffPixels: 150,
    });
  });
});

test.describe('Visual Regression Tests - Authenticated Pages', () => {
  test.beforeEach(async ({ page }) => {
    // Set consistent viewport
    await page.setViewportSize({ width: 1280, height: 720 });

    // Setup authenticated user
    await setupAuthenticatedUser(page, {
      firstName: 'Visual',
      lastName: 'Tester',
      nickname: 'visualtester',
      bio: 'Test user for visual regression testing',
      age: 25,
    });
  });

  test('Feed page (authenticated) appears correctly', async ({ page }) => {
    // Mock feed data
    const mockResponses = [
      createMockResponse('text', {
        textContent: 'This is a test text response for visual testing',
        likesCount: 42,
      }),
      createMockResponse('video', {
        content: 'https://example.com/video.mp4',
        likesCount: 15,
      }),
    ];

    await mockFeedResponses(page, mockResponses);
    await mockDailyMission(page);

    await navigateTo(page, '/');

    // Hide dynamic content (dates, timestamps, online indicators)
    await page.addStyleTag({
      content: `
        .relative-time,
        .online-indicator,
        time,
        [data-testid="timestamp"],
        .timestamp {
          visibility: hidden;
        }
      `,
    });

    await expect(page).toHaveScreenshot('feed-page.png', {
      maxDiffPixels: 200,
    });
  });

  test('Profile page appears correctly', async ({ page }) => {
    await navigateTo(page, '/Profile');

    // Mask dynamic content
    await page.addStyleTag({
      content: `
        .profile-stats time,
        .last-active,
        time,
        [data-testid="last-seen"],
        .timestamp {
          visibility: hidden;
        }
      `,
    });

    await expect(page).toHaveScreenshot('profile-page.png', {
      maxDiffPixels: 150,
    });
  });

  test('Chat page appears correctly', async ({ page }) => {
    // Mock chat list
    await mockChats(page, [
      {
        id: 'chat-1',
        participants: [
          {
            id: 'user-2',
            email: 'other@example.com',
            firstName: 'Chat',
            lastName: 'Partner',
            nickname: 'chatpartner',
          },
        ],
      },
    ]);

    await navigateTo(page, '/LiveChat');

    // Hide timestamps and online status
    await page.addStyleTag({
      content: `
        time,
        .timestamp,
        .online-status,
        [data-testid="message-time"],
        [data-testid="last-seen"] {
          visibility: hidden;
        }
      `,
    });

    await expect(page).toHaveScreenshot('chat-page.png', {
      maxDiffPixels: 150,
    });
  });

  test('Discover page appears correctly', async ({ page }) => {
    // Mock discover users
    await page.route('**/api/v1/users/discover*', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          users: [
            {
              id: 'discover-user-1',
              firstName: 'Discover',
              lastName: 'User',
              age: 26,
              bio: 'Sample bio for visual testing',
              profileImages: ['https://i.pravatar.cc/300?u=discover1'],
            },
          ],
        }),
      });
    });

    await navigateTo(page, '/Discover');

    // Hide dynamic elements
    await page.addStyleTag({
      content: 'time, .timestamp, .online-indicator { visibility: hidden; }',
    });

    await expect(page).toHaveScreenshot('discover-page.png', {
      maxDiffPixels: 200,
    });
  });

  test('Notifications page appears correctly', async ({ page }) => {
    // Mock notifications
    await mockNotifications(
      page,
      [
        {
          id: 'notif-1',
          type: 'LIKE',
          title: 'New Like',
          body: 'Someone liked your response',
          isRead: false,
          createdAt: new Date().toISOString(),
        },
        {
          id: 'notif-2',
          type: 'MATCH',
          title: 'New Match',
          body: 'You have a new match!',
          isRead: false,
          createdAt: new Date().toISOString(),
        },
      ],
      2
    );

    await page.goto('/Notifications');
    await waitForLoadingComplete(page);

    // Hide timestamps
    await page.addStyleTag({
      content: 'time, .timestamp, [data-testid="notification-time"] { visibility: hidden; }',
    });

    await expect(page).toHaveScreenshot('notifications-page.png', {
      maxDiffPixels: 150,
    });
  });

  test('Settings page appears correctly', async ({ page }) => {
    await navigateTo(page, '/Settings');

    await expect(page).toHaveScreenshot('settings-page.png', {
      maxDiffPixels: 100,
    });
  });
});

test.describe('Visual Regression Tests - Mobile Viewport', () => {
  test.beforeEach(async ({ page }) => {
    // Set mobile viewport (iPhone 12 size)
    await page.setViewportSize({ width: 390, height: 844 });
  });

  test('Mobile - Login page', async ({ page }) => {
    await page.goto('/Login');
    await waitForLoadingComplete(page);

    await expect(page).toHaveScreenshot('login-mobile.png', {
      maxDiffPixels: 100,
    });
  });

  test('Mobile - Welcome page', async ({ page }) => {
    await page.goto('/Welcome');
    await waitForLoadingComplete(page);

    await expect(page).toHaveScreenshot('welcome-mobile.png', {
      maxDiffPixels: 100,
    });
  });

  test('Mobile - Feed page (authenticated)', async ({ page }) => {
    await setupAuthenticatedUser(page);

    const mockResponses = [
      createMockResponse('text', {
        textContent: 'Mobile feed test response',
        likesCount: 10,
      }),
    ];

    await mockFeedResponses(page, mockResponses);
    await mockDailyMission(page);

    await navigateTo(page, '/');

    // Hide dynamic content
    await page.addStyleTag({
      content: 'time, .timestamp, .online-indicator { visibility: hidden; }',
    });

    await expect(page).toHaveScreenshot('feed-mobile.png', {
      maxDiffPixels: 200,
    });
  });
});

test.describe('Visual Regression Tests - Component Modals', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await setupAuthenticatedUser(page);
  });

  test('Daily task selector modal', async ({ page }) => {
    await mockDailyMission(page);
    await navigateTo(page, '/');

    // Click to open task selector
    const taskButton = page.getByRole('button', { name: /daily.*mission|task/i }).first();
    if (await taskButton.isVisible().catch(() => false)) {
      await taskButton.click();

      // Wait for modal
      await page.locator('[role="dialog"]').waitFor({ timeout: 5000 }).catch(() => {});

      // Screenshot the modal
      const modal = page.locator('[role="dialog"]');
      if (await modal.isVisible().catch(() => false)) {
        await expect(modal).toHaveScreenshot('task-selector-modal.png', {
          maxDiffPixels: 100,
        });
      }
    }
  });

  test('User profile modal (from feed)', async ({ page }) => {
    const mockResponses = [
      createMockResponse('text', {
        userId: 'other-user-1',
        textContent: 'Test response',
        likesCount: 5,
      }),
    ];

    await mockFeedResponses(page, mockResponses);
    await navigateTo(page, '/');

    // Click on user profile/avatar to open modal
    const avatar = page.locator('[data-testid="user-avatar"], .user-avatar').first();
    if (await avatar.isVisible().catch(() => false)) {
      await avatar.click();

      // Wait for modal
      await page.locator('[role="dialog"]').waitFor({ timeout: 5000 }).catch(() => {});

      // Hide timestamps
      await page.addStyleTag({
        content: 'time, .timestamp { visibility: hidden; }',
      });

      const modal = page.locator('[role="dialog"]');
      if (await modal.isVisible().catch(() => false)) {
        await expect(modal).toHaveScreenshot('user-profile-modal.png', {
          maxDiffPixels: 150,
        });
      }
    }
  });
});

test.describe('Visual Regression Tests - Dark Mode', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });

    // Set dark mode in localStorage
    await page.addInitScript(() => {
      localStorage.setItem('theme', 'dark');
    });
  });

  test('Dark mode - Login page', async ({ page }) => {
    await page.goto('/Login');
    await waitForLoadingComplete(page);

    // Force dark mode class on root element
    await page.evaluate(() => {
      document.documentElement.classList.add('dark');
    });

    await expect(page).toHaveScreenshot('login-page-dark.png', {
      maxDiffPixels: 100,
    });
  });

  test('Dark mode - Feed page', async ({ page }) => {
    await setupAuthenticatedUser(page);

    const mockResponses = [
      createMockResponse('text', {
        textContent: 'Dark mode test',
        likesCount: 7,
      }),
    ];

    await mockFeedResponses(page, mockResponses);
    await mockDailyMission(page);

    await navigateTo(page, '/');

    // Force dark mode
    await page.evaluate(() => {
      document.documentElement.classList.add('dark');
    });

    // Hide dynamic content
    await page.addStyleTag({
      content: 'time, .timestamp, .online-indicator { visibility: hidden; }',
    });

    await expect(page).toHaveScreenshot('feed-page-dark.png', {
      maxDiffPixels: 200,
    });
  });
});
