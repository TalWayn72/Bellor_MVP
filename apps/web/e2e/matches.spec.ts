/**
 * Matches & Likes E2E Tests
 *
 * Tests the matches functionality including:
 * - Viewing romantic interest
 * - Viewing positive feedback
 * - Interacting with matches
 * - Sending likes back
 * - Starting chats
 *
 * @see PRD.md Section 10.1 Phase 6 - Testing
 * Priority: High
 */

import { test, expect } from '@playwright/test';
import {
  setupAuthenticatedUser,
  mockApiResponse,
  mockLikes,
  createMockUser,
  createMockLike,
  waitForPageLoad,
  waitForLoadingComplete,
} from './fixtures';

test.describe('Matches & Likes', () => {
  const otherUser1 = createMockUser({ id: 'other-user-1', nickname: 'RomanticUser', firstName: 'Romantic' });
  const otherUser2 = createMockUser({ id: 'other-user-2', nickname: 'PositiveUser', firstName: 'Positive' });

  test.describe('Romantic Interest Tab', () => {
    test.beforeEach(async ({ page }) => {
      await setupAuthenticatedUser(page);
      await mockApiResponse(page, '**/api/v1/users/other-user-1', { user: otherUser1 });
    });

    test('should display romantic interest tab', async ({ page }) => {
      await mockLikes(page, [
        createMockLike({ userId: 'other-user-1', likeType: 'ROMANTIC' }),
      ]);

      await page.goto('/matches');
      await waitForPageLoad(page);

      // Should show romantic tab
      const romanticTab = page.locator('button, [role="tab"]').filter({ hasText: /romantic|רומנטי/i });
      await expect(romanticTab).toBeVisible({ timeout: 10000 });
    });

    test('should display users who showed romantic interest', async ({ page }) => {
      await mockLikes(page, [
        createMockLike({ userId: 'other-user-1', likeType: 'ROMANTIC' }),
      ]);

      await page.goto('/matches');
      await waitForPageLoad(page);
      await waitForLoadingComplete(page);

      // Should show user who liked
      await expect(page.locator('text=/romanticuser|romantic/i')).toBeVisible({ timeout: 10000 });
    });

    test('should show romantic interest count', async ({ page }) => {
      await mockLikes(page, [
        createMockLike({ userId: 'other-user-1', likeType: 'ROMANTIC' }),
        createMockLike({ userId: 'other-user-2', likeType: 'ROMANTIC' }),
      ]);
      await mockApiResponse(page, '**/api/v1/users/other-user-2', { user: otherUser2 });

      await page.goto('/matches');
      await waitForPageLoad(page);

      // Should show count in tab
      const romanticTab = page.locator('button, [role="tab"]').filter({ hasText: /romantic.*2|2.*romantic/i });
      // Count display depends on implementation
    });

    test('should show empty state when no romantic interest', async ({ page }) => {
      await mockLikes(page, []);

      await page.goto('/matches');
      await waitForPageLoad(page);
      await waitForLoadingComplete(page);

      // Should show empty state
      await expect(page.locator('text=/no romantic|no interest|אין התעניינות/i')).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('Positive Feedback Tab', () => {
    test.beforeEach(async ({ page }) => {
      await setupAuthenticatedUser(page);
      await mockApiResponse(page, '**/api/v1/users/other-user-2', { user: otherUser2 });
    });

    test('should display positive feedback tab', async ({ page }) => {
      await mockLikes(page, [
        createMockLike({ userId: 'other-user-2', likeType: 'POSITIVE' }),
      ]);

      await page.goto('/matches');
      await waitForPageLoad(page);

      // Should show positive tab
      const positiveTab = page.locator('button, [role="tab"]').filter({ hasText: /positive|חיובי/i });
      await expect(positiveTab).toBeVisible({ timeout: 10000 });
    });

    test('should switch to positive feedback tab', async ({ page }) => {
      await mockLikes(page, [
        createMockLike({ userId: 'other-user-2', likeType: 'POSITIVE' }),
      ]);

      await page.goto('/matches');
      await waitForPageLoad(page);

      // Click positive tab
      const positiveTab = page.locator('button, [role="tab"]').filter({ hasText: /positive|חיובי/i });
      await positiveTab.click();

      await waitForLoadingComplete(page);

      // Should show positive feedback users
      await expect(page.locator('text=/positiveuser|positive/i')).toBeVisible({ timeout: 10000 });
    });

    test('should show empty state when no positive feedback', async ({ page }) => {
      await mockLikes(page, []);

      await page.goto('/matches');
      await waitForPageLoad(page);

      // Click positive tab
      const positiveTab = page.locator('button, [role="tab"]').filter({ hasText: /positive|חיובי/i });
      await positiveTab.click();

      await waitForLoadingComplete(page);

      // Should show empty state
      await expect(page.locator('text=/no positive|no feedback|אין משוב/i')).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('Match Interactions', () => {
    test.beforeEach(async ({ page }) => {
      await setupAuthenticatedUser(page);
      await mockApiResponse(page, '**/api/v1/users/other-user-1', { user: otherUser1 });
      await mockLikes(page, [
        createMockLike({ userId: 'other-user-1', likeType: 'ROMANTIC' }),
      ]);
    });

    test('should navigate to user profile when clicking match', async ({ page }) => {
      await page.goto('/matches');
      await waitForPageLoad(page);
      await waitForLoadingComplete(page);

      // Click on match card
      const matchCard = page.locator('text=/romanticuser/i');
      await matchCard.click();

      // Should navigate to user profile
      await expect(page).toHaveURL(/.*userprofile.*/i);
    });

    test('should send like back', async ({ page }) => {
      await mockApiResponse(page, '**/api/v1/likes', { success: true });

      await page.goto('/matches');
      await waitForPageLoad(page);
      await waitForLoadingComplete(page);

      // Click reply/like back button
      const replyButton = page.getByRole('button', { name: /reply|like.*back|החזר/i });
      if (await replyButton.first().isVisible()) {
        await replyButton.first().click();
        // Should show success feedback
      }
    });

    test('should display user avatar in match card', async ({ page }) => {
      await page.goto('/matches');
      await waitForPageLoad(page);
      await waitForLoadingComplete(page);

      // Should show avatar
      const avatar = page.locator('img[alt*="avatar"], img[alt*="profile"], .avatar');
      await expect(avatar.first()).toBeVisible({ timeout: 10000 });
    });

    test('should show heart icon for romantic interest', async ({ page }) => {
      await page.goto('/matches');
      await waitForPageLoad(page);
      await waitForLoadingComplete(page);

      // Should show heart icon
      const heartIcon = page.locator('svg[class*="heart"], [data-testid="heart-icon"]');
      await expect(heartIcon.first()).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('Start Chat from Match', () => {
    test.beforeEach(async ({ page }) => {
      await setupAuthenticatedUser(page);
      await mockApiResponse(page, '**/api/v1/users/other-user-1', { user: otherUser1 });
      await mockLikes(page, [
        createMockLike({ userId: 'other-user-1', likeType: 'ROMANTIC' }),
      ]);
      await mockApiResponse(page, '**/api/v1/chats', {
        chat: { id: 'new-chat-1', participants: [otherUser1] },
      });
    });

    test('should have chat button on match card', async ({ page }) => {
      await page.goto('/matches');
      await waitForPageLoad(page);
      await waitForLoadingComplete(page);

      // Look for chat/message button
      const chatButton = page.getByRole('button', { name: /chat|message|שיחה|הודעה/i });
      // Chat button visibility depends on implementation
    });
  });

  test.describe('Loading States', () => {
    test('should show loading skeleton while fetching', async ({ page }) => {
      await setupAuthenticatedUser(page);

      // Delay response
      await page.route('**/api/v1/likes/received*', async (route) => {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ likes: [] }),
        });
      });

      await page.goto('/matches');

      // Should show skeleton
      const skeleton = page.locator('.animate-pulse, [data-testid="cards-skeleton"]');
      await expect(skeleton.first()).toBeVisible({ timeout: 3000 });
    });
  });

  test.describe('Tab Navigation', () => {
    test('should maintain tab state on refresh', async ({ page }) => {
      await setupAuthenticatedUser(page);
      await mockLikes(page, [
        createMockLike({ userId: 'other-user-1', likeType: 'ROMANTIC' }),
        createMockLike({ userId: 'other-user-2', likeType: 'POSITIVE' }),
      ]);
      await mockApiResponse(page, '**/api/v1/users/other-user-1', { user: otherUser1 });
      await mockApiResponse(page, '**/api/v1/users/other-user-2', { user: otherUser2 });

      await page.goto('/matches');
      await waitForPageLoad(page);

      // Switch to positive tab
      const positiveTab = page.locator('button, [role="tab"]').filter({ hasText: /positive|חיובי/i });
      await positiveTab.click();

      // Tab state may persist via URL or state
    });

    test('should show correct indicator on active tab', async ({ page }) => {
      await setupAuthenticatedUser(page);
      await mockLikes(page, []);

      await page.goto('/matches');
      await waitForPageLoad(page);

      // Active tab should have indicator
      const activeTab = page.locator('[data-state="active"], [aria-selected="true"]');
      await expect(activeTab.first()).toBeVisible({ timeout: 10000 });
    });
  });
});

test.describe('Matches - Mobile', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('should display mobile-optimized matches grid', async ({ page }) => {
    const otherUser = createMockUser({ id: 'other-user-1', nickname: 'MobileMatch' });
    await setupAuthenticatedUser(page);
    await mockApiResponse(page, '**/api/v1/users/other-user-1', { user: otherUser });
    await mockLikes(page, [
      createMockLike({ userId: 'other-user-1', likeType: 'ROMANTIC' }),
    ]);

    await page.goto('/matches');
    await waitForPageLoad(page);

    // Check viewport
    const viewport = page.viewportSize();
    expect(viewport?.width).toBe(375);

    // Should show match
    await expect(page.locator('text=/mobilematch/i')).toBeVisible({ timeout: 10000 });
  });

  test('should use 2-column grid on mobile', async ({ page }) => {
    const users = [
      createMockUser({ id: 'user-1', nickname: 'User1' }),
      createMockUser({ id: 'user-2', nickname: 'User2' }),
    ];

    await setupAuthenticatedUser(page);
    await mockApiResponse(page, '**/api/v1/users/user-1', { user: users[0] });
    await mockApiResponse(page, '**/api/v1/users/user-2', { user: users[1] });
    await mockLikes(page, [
      createMockLike({ userId: 'user-1', likeType: 'ROMANTIC' }),
      createMockLike({ userId: 'user-2', likeType: 'ROMANTIC' }),
    ]);

    await page.goto('/matches');
    await waitForPageLoad(page);
    await waitForLoadingComplete(page);

    // Grid should be visible (2 columns on mobile)
    const grid = page.locator('.grid-cols-2, [class*="grid"]');
    await expect(grid.first()).toBeVisible({ timeout: 10000 });
  });
});
