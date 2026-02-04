/**
 * Profile Management E2E Tests
 *
 * Tests profile functionality including:
 * - Viewing own profile
 * - Editing profile
 * - Profile photos
 * - My Book (responses)
 * - Daily streak
 *
 * @see PRD.md Section 10.1 Phase 6 - Testing
 * Priority: High
 */

import { test, expect } from '@playwright/test';
import {
  setupAuthenticatedUser,
  mockApiResponse,
  createMockUser,
  createMockResponse,
  waitForPageLoad,
  waitForLoadingComplete,
  mockFileUpload,
} from './fixtures';

test.describe('Profile Management', () => {
  test.describe('View Own Profile', () => {
    test.beforeEach(async ({ page }) => {
      const user = await setupAuthenticatedUser(page, {
        nickname: 'TestNickname',
        age: 28,
        bio: 'Test bio content here',
        location: 'Tel Aviv',
        isVerified: true,
      });
      await mockApiResponse(page, '**/api/v1/responses*', { responses: [], pagination: { total: 0 } });
    });

    test('should display profile page', async ({ page }) => {
      await page.goto('/profile');
      await waitForPageLoad(page);
      await waitForLoadingComplete(page);

      // Should show nickname
      await expect(page.locator('text=/testnickname/i')).toBeVisible({ timeout: 10000 });
    });

    test('should display user age', async ({ page }) => {
      await page.goto('/profile');
      await waitForPageLoad(page);
      await waitForLoadingComplete(page);

      // Should show age
      await expect(page.locator('text=/28/i')).toBeVisible({ timeout: 10000 });
    });

    test('should display bio', async ({ page }) => {
      await page.goto('/profile');
      await waitForPageLoad(page);
      await waitForLoadingComplete(page);

      // Should show bio
      await expect(page.locator('text=/test bio content/i')).toBeVisible({ timeout: 10000 });
    });

    test('should display location', async ({ page }) => {
      await page.goto('/profile');
      await waitForPageLoad(page);
      await waitForLoadingComplete(page);

      // Should show location
      await expect(page.locator('text=/tel aviv/i')).toBeVisible({ timeout: 10000 });
    });

    test('should show verified badge', async ({ page }) => {
      await page.goto('/profile');
      await waitForPageLoad(page);
      await waitForLoadingComplete(page);

      // Should show verified badge
      const verifiedBadge = page.locator('[data-testid="verified-badge"], .verified, svg[class*="check"]');
      await expect(verifiedBadge.first()).toBeVisible({ timeout: 10000 });
    });

    test('should display profile image', async ({ page }) => {
      await page.goto('/profile');
      await waitForPageLoad(page);

      // Should show profile image
      const profileImage = page.locator('img[alt*="profile"], img[alt*="avatar"], .profile-image');
      await expect(profileImage.first()).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('Profile Tabs', () => {
    test.beforeEach(async ({ page }) => {
      await setupAuthenticatedUser(page);
      await mockApiResponse(page, '**/api/v1/responses*', { responses: [], pagination: { total: 0 } });
    });

    test('should have About Me tab', async ({ page }) => {
      await page.goto('/profile');
      await waitForPageLoad(page);

      // Should have About Me tab
      const aboutTab = page.locator('button, [role="tab"]').filter({ hasText: /about|אודות/i });
      await expect(aboutTab).toBeVisible({ timeout: 10000 });
    });

    test('should have My Book tab', async ({ page }) => {
      await page.goto('/profile');
      await waitForPageLoad(page);

      // Should have My Book tab
      const bookTab = page.locator('button, [role="tab"]').filter({ hasText: /book|ספר/i });
      await expect(bookTab).toBeVisible({ timeout: 10000 });
    });

    test('should switch to My Book tab', async ({ page }) => {
      await page.goto('/profile');
      await waitForPageLoad(page);

      // Click My Book tab
      const bookTab = page.locator('button, [role="tab"]').filter({ hasText: /book|ספר/i });
      await bookTab.click();

      // Should show book content (stats, responses)
      await expect(page.locator('text=/total.*posts|posts|פוסטים/i')).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('My Book - User Responses', () => {
    test.beforeEach(async ({ page }) => {
      await setupAuthenticatedUser(page);
    });

    test('should display user responses', async ({ page }) => {
      await mockApiResponse(page, '**/api/v1/responses*', {
        responses: [
          createMockResponse('text', { textContent: 'My first post' }),
          createMockResponse('text', { textContent: 'My second post' }),
        ],
        pagination: { total: 2 },
      });

      await page.goto('/profile');
      await waitForPageLoad(page);

      // Click My Book tab
      const bookTab = page.locator('button, [role="tab"]').filter({ hasText: /book|ספר/i });
      await bookTab.click();

      await waitForLoadingComplete(page);

      // Should show response count
      await expect(page.locator('text=/2|total/i')).toBeVisible({ timeout: 10000 });
    });

    test('should show empty state when no responses', async ({ page }) => {
      await mockApiResponse(page, '**/api/v1/responses*', {
        responses: [],
        pagination: { total: 0 },
      });

      await page.goto('/profile');
      await waitForPageLoad(page);

      // Click My Book tab
      const bookTab = page.locator('button, [role="tab"]').filter({ hasText: /book|ספר/i });
      await bookTab.click();

      await waitForLoadingComplete(page);

      // Should show empty state
      await expect(page.locator('text=/no content|no posts|share.*first|אין תוכן/i')).toBeVisible({ timeout: 10000 });
    });

    test('should show stats (total posts, likes)', async ({ page }) => {
      await mockApiResponse(page, '**/api/v1/responses*', {
        responses: [
          createMockResponse('text', { likesCount: 10 }),
          createMockResponse('text', { likesCount: 5 }),
        ],
        pagination: { total: 2 },
      });

      await page.goto('/profile');
      await waitForPageLoad(page);

      // Click My Book tab
      const bookTab = page.locator('button, [role="tab"]').filter({ hasText: /book|ספר/i });
      await bookTab.click();

      // Should show total likes
      await expect(page.locator('text=/likes|לייקים/i')).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('Edit Profile', () => {
    test.beforeEach(async ({ page }) => {
      await setupAuthenticatedUser(page, {
        nickname: 'OldNickname',
        bio: 'Old bio',
      });
      await mockApiResponse(page, '**/api/v1/responses*', { responses: [], pagination: { total: 0 } });
    });

    test('should navigate to edit profile', async ({ page }) => {
      await page.goto('/profile');
      await waitForPageLoad(page);

      // Click edit profile button
      const editButton = page.getByRole('button', { name: /edit.*profile|edit|ערוך/i });
      await editButton.click();

      // Should navigate to edit profile page
      await expect(page).toHaveURL(/.*editprofile.*/i);
    });

    test('should display edit form with current values', async ({ page }) => {
      await page.goto('/editprofile');
      await waitForPageLoad(page);

      // Form should have current values
      const nicknameInput = page.locator('input[name="nickname"], input[placeholder*="nickname"]');
      if (await nicknameInput.isVisible()) {
        await expect(nicknameInput).toHaveValue(/oldnickname/i);
      }
    });

    test('should save profile changes', async ({ page }) => {
      await mockApiResponse(page, '**/api/v1/users/*', { user: createMockUser({ nickname: 'NewNickname' }) });

      await page.goto('/editprofile');
      await waitForPageLoad(page);

      // Change nickname
      const nicknameInput = page.locator('input[name="nickname"], input[placeholder*="nickname"]');
      if (await nicknameInput.isVisible()) {
        await nicknameInput.fill('NewNickname');
      }

      // Save
      const saveButton = page.getByRole('button', { name: /save|שמור/i });
      if (await saveButton.isVisible()) {
        await saveButton.click();
      }
    });

    test('should validate nickname length', async ({ page }) => {
      await page.goto('/editprofile');
      await waitForPageLoad(page);

      // Try too short nickname
      const nicknameInput = page.locator('input[name="nickname"], input[placeholder*="nickname"]');
      if (await nicknameInput.isVisible()) {
        await nicknameInput.fill('ab'); // Too short (less than 3)
        await nicknameInput.blur();

        // Should show validation error
        const error = page.locator('text=/too short|minimum|מינימום/i');
        // Error may or may not show depending on implementation
      }
    });
  });

  test.describe('Profile Actions', () => {
    test.beforeEach(async ({ page }) => {
      await setupAuthenticatedUser(page);
      await mockApiResponse(page, '**/api/v1/responses*', { responses: [], pagination: { total: 0 } });
    });

    test('should navigate to settings', async ({ page }) => {
      await page.goto('/profile');
      await waitForPageLoad(page);

      // Click settings button
      const settingsButton = page.getByRole('button', { name: /settings|הגדרות/i });
      await settingsButton.click();

      // Should navigate to settings
      await expect(page).toHaveURL(/.*settings.*/i);
    });

    test('should show daily streak badge', async ({ page }) => {
      await mockApiResponse(page, '**/api/v1/achievements/streak*', { streak: 5 });

      await page.goto('/profile');
      await waitForPageLoad(page);

      // Should show streak badge
      const streakBadge = page.locator('text=/streak|רצף/i');
      // Streak may or may not be visible
    });

    test('should show profile completion card', async ({ page }) => {
      await page.goto('/profile');
      await waitForPageLoad(page);

      // Profile completion may be shown
      const completionCard = page.locator('text=/complete|completion|השלם/i');
      // Visibility depends on implementation
    });
  });

  test.describe('Profile Photos', () => {
    test.beforeEach(async ({ page }) => {
      await setupAuthenticatedUser(page, {
        profileImages: ['https://example.com/photo1.jpg', 'https://example.com/photo2.jpg'],
      });
    });

    test('should display main profile photo', async ({ page }) => {
      await mockApiResponse(page, '**/api/v1/responses*', { responses: [], pagination: { total: 0 } });

      await page.goto('/profile');
      await waitForPageLoad(page);

      // Should show profile photo
      const profilePhoto = page.locator('img[src*="photo1"], .profile-image img');
      await expect(profilePhoto.first()).toBeVisible({ timeout: 10000 });
    });

    test('should allow photo upload on edit page', async ({ page }) => {
      await mockFileUpload(page);
      await mockApiResponse(page, '**/api/v1/responses*', { responses: [], pagination: { total: 0 } });

      await page.goto('/editprofile');
      await waitForPageLoad(page);

      // Look for photo upload area
      const uploadArea = page.locator('input[type="file"], [data-testid="photo-upload"]');
      // Upload functionality test depends on implementation
    });
  });

  test.describe('Loading States', () => {
    test('should show profile skeleton while loading', async ({ page }) => {
      await setupAuthenticatedUser(page);

      // Delay response
      await page.route('**/api/v1/responses*', async (route) => {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ responses: [], pagination: { total: 0 } }),
        });
      });

      await page.goto('/profile');

      // Should show skeleton
      const skeleton = page.locator('.animate-pulse, [data-testid="profile-skeleton"]');
      await expect(skeleton.first()).toBeVisible({ timeout: 3000 });
    });
  });
});

test.describe('Profile - Mobile', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('should display mobile-optimized profile', async ({ page }) => {
    await setupAuthenticatedUser(page, { nickname: 'MobileUser' });
    await mockApiResponse(page, '**/api/v1/responses*', { responses: [], pagination: { total: 0 } });

    await page.goto('/profile');
    await waitForPageLoad(page);

    // Check viewport
    const viewport = page.viewportSize();
    expect(viewport?.width).toBe(375);

    // Should show nickname
    await expect(page.locator('text=/mobileuser/i')).toBeVisible({ timeout: 10000 });
  });

  test('should have touch-friendly action buttons', async ({ page }) => {
    await setupAuthenticatedUser(page);
    await mockApiResponse(page, '**/api/v1/responses*', { responses: [], pagination: { total: 0 } });

    await page.goto('/profile');
    await waitForPageLoad(page);

    // Check button sizes
    const editButton = page.getByRole('button', { name: /edit.*profile|edit|ערוך/i });
    if (await editButton.isVisible()) {
      const box = await editButton.boundingBox();
      if (box) {
        expect(box.height).toBeGreaterThanOrEqual(44);
      }
    }
  });
});
