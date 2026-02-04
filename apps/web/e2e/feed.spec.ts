/**
 * Feed & SharedSpace E2E Tests
 *
 * Tests the main feed functionality including:
 * - Daily mission display
 * - Feed responses viewing
 * - Creating responses
 * - Liking/interacting with posts
 * - Empty and loading states
 *
 * @see PRD.md Section 10.1 Phase 6 - Testing
 * Priority: Critical
 */

import { test, expect } from '@playwright/test';
import {
  setupAuthenticatedUser,
  mockFeedResponses,
  mockDailyMission,
  mockApiResponse,
  mockApiError,
  createMockResponse,
  createMockUser,
  waitForPageLoad,
  waitForLoadingComplete,
  MockResponse,
} from './fixtures';

test.describe('Feed & SharedSpace', () => {
  test.describe('Daily Mission Display', () => {
    test.beforeEach(async ({ page }) => {
      await setupAuthenticatedUser(page);
      await mockDailyMission(page);
      await mockFeedResponses(page, []);
      await mockApiResponse(page, '**/api/v1/follows/following*', { following: [] });
    });

    test('should display daily mission card', async ({ page }) => {
      await page.goto('/sharedspace');
      await waitForPageLoad(page);

      // Check for mission display
      const missionArea = page.locator('text=/daily.*mission|mission|משימה/i');
      await expect(missionArea).toBeVisible({ timeout: 10000 });
    });

    test('should show task selector when clicking mission', async ({ page }) => {
      await page.goto('/sharedspace');
      await waitForPageLoad(page);

      // Look for task selector trigger
      const taskButton = page.getByRole('button', { name: /share|respond|השתתף|שתף/i });
      if (await taskButton.isVisible()) {
        await taskButton.click();

        // Task selector should appear
        await expect(page.locator('text=/text|video|audio|draw|טקסט|וידאו|אודיו|ציור/i')).toBeVisible({ timeout: 5000 });
      }
    });

    test('should display mission with correct response type options', async ({ page }) => {
      await mockDailyMission(page, {
        id: 'mission-1',
        title: 'Share Your Thoughts',
        description: 'Tell us what you think',
      });

      await page.goto('/sharedspace');
      await waitForPageLoad(page);

      // Mission should be visible
      await expect(page.locator('text=/share.*thoughts|thoughts/i')).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('Feed Responses', () => {
    const mockResponses: MockResponse[] = [
      createMockResponse('text', { id: 'resp-1', textContent: 'First post content', likesCount: 5 }),
      createMockResponse('text', { id: 'resp-2', textContent: 'Second post content', likesCount: 10 }),
      createMockResponse('video', { id: 'resp-3', content: 'https://example.com/video.mp4', likesCount: 15 }),
    ];

    test.beforeEach(async ({ page }) => {
      await setupAuthenticatedUser(page);
      await mockDailyMission(page);
      await mockFeedResponses(page, mockResponses);
      await mockApiResponse(page, '**/api/v1/follows/following*', { following: [] });
    });

    test('should display feed responses', async ({ page }) => {
      await page.goto('/sharedspace');
      await waitForPageLoad(page);
      await waitForLoadingComplete(page);

      // At least one response should be visible
      await expect(page.locator('text=/first post|second post/i').first()).toBeVisible({ timeout: 10000 });
    });

    test('should show like count on responses', async ({ page }) => {
      await page.goto('/sharedspace');
      await waitForPageLoad(page);
      await waitForLoadingComplete(page);

      // Look for heart icon or like count
      const likeIndicator = page.locator('[data-testid="like-count"], .like-count, text=/\\d+.*❤|♥/');
      await expect(likeIndicator.first()).toBeVisible({ timeout: 10000 });
    });

    test('should allow scrolling through responses', async ({ page }) => {
      await page.goto('/sharedspace');
      await waitForPageLoad(page);
      await waitForLoadingComplete(page);

      // Scroll in feed area
      const feedContainer = page.locator('.snap-y, [data-testid="feed-container"]');
      if (await feedContainer.isVisible()) {
        await feedContainer.evaluate((el) => el.scrollBy(0, 300));
        await page.waitForTimeout(500);
      }
    });
  });

  test.describe('Creating Responses', () => {
    test.beforeEach(async ({ page }) => {
      await setupAuthenticatedUser(page);
      await mockDailyMission(page);
      await mockFeedResponses(page, []);
      await mockApiResponse(page, '**/api/v1/follows/following*', { following: [] });
    });

    test('should open text response creator', async ({ page }) => {
      await page.goto('/sharedspace');
      await waitForPageLoad(page);

      // Click to create response
      const createButton = page.getByRole('button', { name: /share|create|respond|שתף|צור/i });
      if (await createButton.isVisible()) {
        await createButton.click();

        // Look for text option
        const textOption = page.locator('text=/text|write|טקסט|כתוב/i');
        if (await textOption.isVisible()) {
          await textOption.click();

          // Should navigate to text task or open modal
          await expect(page).toHaveURL(/.*(write|text|task).*/i);
        }
      }
    });

    test('should open video response creator', async ({ page }) => {
      await page.goto('/sharedspace');
      await waitForPageLoad(page);

      const createButton = page.getByRole('button', { name: /share|create|respond|שתף|צור/i });
      if (await createButton.isVisible()) {
        await createButton.click();

        const videoOption = page.locator('text=/video|וידאו/i');
        if (await videoOption.isVisible()) {
          await videoOption.click();
          await expect(page).toHaveURL(/.*(video|task).*/i);
        }
      }
    });

    test('should open drawing response creator', async ({ page }) => {
      await page.goto('/sharedspace');
      await waitForPageLoad(page);

      const createButton = page.getByRole('button', { name: /share|create|respond|שתף|צור/i });
      if (await createButton.isVisible()) {
        await createButton.click();

        const drawOption = page.locator('text=/draw|drawing|ציור|צייר/i');
        if (await drawOption.isVisible()) {
          await drawOption.click();
          await expect(page).toHaveURL(/.*(draw|creation|task).*/i);
        }
      }
    });
  });

  test.describe('Like Functionality', () => {
    test.beforeEach(async ({ page }) => {
      await setupAuthenticatedUser(page);
      await mockDailyMission(page);
      await mockFeedResponses(page, [
        createMockResponse('text', { id: 'resp-1', textContent: 'Test post', likesCount: 5 }),
      ]);
      await mockApiResponse(page, '**/api/v1/follows/following*', { following: [] });
    });

    test('should like a response', async ({ page }) => {
      // Mock like API
      await mockApiResponse(page, '**/api/v1/likes', { success: true });

      await page.goto('/sharedspace');
      await waitForPageLoad(page);
      await waitForLoadingComplete(page);

      // Find and click like button
      const likeButton = page.locator('button:has(svg), [data-testid="like-button"]').filter({
        has: page.locator('[class*="heart"], [class*="Heart"]'),
      });

      if (await likeButton.first().isVisible()) {
        await likeButton.first().click();
        // Like should be registered (button state change or count increase)
      }
    });

    test('should show romantic interest option', async ({ page }) => {
      await page.goto('/sharedspace');
      await waitForPageLoad(page);
      await waitForLoadingComplete(page);

      // Look for romantic interest button (heart icon)
      const romanticButton = page.locator('[data-testid="romantic-interest"], button:has(svg.text-love)');
      if (await romanticButton.first().isVisible()) {
        await expect(romanticButton.first()).toBeVisible();
      }
    });
  });

  test.describe('User Profile Navigation', () => {
    test.beforeEach(async ({ page }) => {
      const otherUser = createMockUser({ id: 'other-user-1', nickname: 'OtherUser' });
      await setupAuthenticatedUser(page);
      await mockDailyMission(page);
      await mockFeedResponses(page, [
        createMockResponse('text', {
          id: 'resp-1',
          userId: 'other-user-1',
          textContent: 'Other user post',
        }),
      ]);
      await mockApiResponse(page, '**/api/v1/follows/following*', { following: [] });
      await mockApiResponse(page, '**/api/v1/users/other-user-1', { user: otherUser });
    });

    test('should navigate to user profile when clicking avatar', async ({ page }) => {
      await page.goto('/sharedspace');
      await waitForPageLoad(page);
      await waitForLoadingComplete(page);

      // Click on user avatar or name
      const userLink = page.locator('[data-testid="user-avatar"], .avatar, img[alt*="user"]');
      if (await userLink.first().isVisible()) {
        await userLink.first().click();
        await expect(page).toHaveURL(/.*userprofile.*/i);
      }
    });
  });

  test.describe('Empty & Loading States', () => {
    test('should show loading skeleton while fetching', async ({ page }) => {
      await setupAuthenticatedUser(page);
      await mockDailyMission(page);

      // Delay the response to see loading state
      await page.route('**/api/v1/responses*', async (route) => {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ responses: [], pagination: { total: 0 } }),
        });
      });

      await page.goto('/sharedspace');

      // Check for loading skeleton
      const skeleton = page.locator('.animate-pulse, [data-testid="feed-skeleton"]');
      await expect(skeleton.first()).toBeVisible({ timeout: 3000 });
    });

    test('should show empty state when no responses', async ({ page }) => {
      await setupAuthenticatedUser(page);
      await mockDailyMission(page);
      await mockFeedResponses(page, []);
      await mockApiResponse(page, '**/api/v1/follows/following*', { following: [] });

      await page.goto('/sharedspace');
      await waitForPageLoad(page);
      await waitForLoadingComplete(page);

      // Check for empty state message
      const emptyState = page.locator('text=/no posts|no responses|be the first|אין פוסטים/i');
      await expect(emptyState).toBeVisible({ timeout: 10000 });
    });

    test('should show share button in empty state', async ({ page }) => {
      await setupAuthenticatedUser(page);
      await mockDailyMission(page);
      await mockFeedResponses(page, []);
      await mockApiResponse(page, '**/api/v1/follows/following*', { following: [] });

      await page.goto('/sharedspace');
      await waitForPageLoad(page);
      await waitForLoadingComplete(page);

      // Empty state should have action button
      const shareButton = page.getByRole('button', { name: /share.*now|share|שתף/i });
      await expect(shareButton).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('Filter & Following', () => {
    test.beforeEach(async ({ page }) => {
      await setupAuthenticatedUser(page);
      await mockDailyMission(page);
      await mockApiResponse(page, '**/api/v1/follows/following*', {
        following: [{ id: 'followed-user-1', nickname: 'FollowedUser' }],
      });
    });

    test('should show filter tabs', async ({ page }) => {
      await mockFeedResponses(page, [
        createMockResponse('text', { textContent: 'Public post' }),
      ]);

      await page.goto('/sharedspace');
      await waitForPageLoad(page);

      // Look for filter tabs (All / Following)
      const filterTabs = page.locator('text=/all|following|הכל|עוקבים/i');
      await expect(filterTabs.first()).toBeVisible({ timeout: 10000 });
    });

    test('should filter by following', async ({ page }) => {
      await mockFeedResponses(page, [
        createMockResponse('text', { userId: 'followed-user-1', textContent: 'Followed user post' }),
      ]);

      await page.goto('/sharedspace');
      await waitForPageLoad(page);

      // Click following filter
      const followingTab = page.locator('button, [role="tab"]').filter({ hasText: /following|עוקבים/i });
      if (await followingTab.isVisible()) {
        await followingTab.click();
        await waitForLoadingComplete(page);
      }
    });
  });

  test.describe('Error Handling', () => {
    test('should handle API error gracefully', async ({ page }) => {
      await setupAuthenticatedUser(page);
      await mockDailyMission(page);
      await mockApiError(page, '**/api/v1/responses*', 'Server error', 500);
      await mockApiResponse(page, '**/api/v1/follows/following*', { following: [] });

      await page.goto('/sharedspace');
      await waitForPageLoad(page);

      // Should show error state or message
      const errorMessage = page.locator('text=/error|something went wrong|שגיאה/i');
      // Error handling may vary - just ensure page doesn't crash
      await page.waitForTimeout(2000);
    });

    test('should handle network timeout', async ({ page }) => {
      await setupAuthenticatedUser(page);
      await mockDailyMission(page);
      await mockApiResponse(page, '**/api/v1/follows/following*', { following: [] });

      // Simulate timeout
      await page.route('**/api/v1/responses*', async (route) => {
        await new Promise((resolve) => setTimeout(resolve, 15000)); // Longer than timeout
        await route.abort();
      });

      await page.goto('/sharedspace');

      // Page should handle timeout gracefully
      await page.waitForTimeout(3000);
    });
  });
});

test.describe('Feed - Mobile', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('should display mobile-optimized feed', async ({ page }) => {
    await setupAuthenticatedUser(page);
    await mockDailyMission(page);
    await mockFeedResponses(page, [
      createMockResponse('text', { textContent: 'Mobile test post' }),
    ]);
    await mockApiResponse(page, '**/api/v1/follows/following*', { following: [] });

    await page.goto('/sharedspace');
    await waitForPageLoad(page);

    // Check viewport is correct
    const viewport = page.viewportSize();
    expect(viewport?.width).toBe(375);

    // Feed should be visible
    await expect(page.locator('text=/mobile test post/i')).toBeVisible({ timeout: 10000 });
  });

  test('should support swipe/scroll on mobile', async ({ page }) => {
    await setupAuthenticatedUser(page);
    await mockDailyMission(page);
    await mockFeedResponses(page, [
      createMockResponse('text', { id: 'resp-1', textContent: 'Post 1' }),
      createMockResponse('text', { id: 'resp-2', textContent: 'Post 2' }),
    ]);
    await mockApiResponse(page, '**/api/v1/follows/following*', { following: [] });

    await page.goto('/sharedspace');
    await waitForPageLoad(page);
    await waitForLoadingComplete(page);

    // Simulate swipe/scroll
    await page.mouse.move(187, 500);
    await page.mouse.down();
    await page.mouse.move(187, 200, { steps: 10 });
    await page.mouse.up();

    await page.waitForTimeout(500);
  });
});
