/**
 * Visual Regression Tests - Social & Navigation Pages
 * Pages: Home, Discover, Matches, SharedSpace, Stories, CreateStory, FollowingList
 */
import {
  test, expect, setupAuthenticatedUser,
  navigateTo, waitForLoadingComplete,
} from '../fixtures';
import { DESKTOP_VIEWPORT, maskDynamicContent } from './visual-helpers';
import {
  mockFeedData, mockDiscoverData, mockMatchesData, mockStoriesData,
} from './visual-mocks';

test.describe('Visual - Social Pages', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize(DESKTOP_VIEWPORT);
    await setupAuthenticatedUser(page);
  });

  test('Home/Feed page', async ({ page }) => {
    await mockFeedData(page);
    await navigateTo(page, '/');
    await maskDynamicContent(page);
    await expect(page).toHaveScreenshot('home-page.png', { maxDiffPixels: 200 });
  });

  test('Discover page', async ({ page }) => {
    await mockDiscoverData(page);
    await navigateTo(page, '/Discover');
    await maskDynamicContent(page);
    await expect(page).toHaveScreenshot('discover-page.png', { maxDiffPixels: 200 });
  });

  test('Matches page', async ({ page }) => {
    await mockMatchesData(page);
    await navigateTo(page, '/Matches');
    await maskDynamicContent(page);
    await expect(page).toHaveScreenshot('matches-page.png', { maxDiffPixels: 150 });
  });

  test('SharedSpace page', async ({ page }) => {
    await mockFeedData(page);
    await navigateTo(page, '/SharedSpace');
    await maskDynamicContent(page);
    await expect(page).toHaveScreenshot('shared-space-page.png', { maxDiffPixels: 150 });
  });

  test('Stories page', async ({ page }) => {
    await mockStoriesData(page);
    await navigateTo(page, '/Stories');
    await maskDynamicContent(page);
    await expect(page).toHaveScreenshot('stories-page.png', { maxDiffPixels: 150 });
  });

  test('Create Story page', async ({ page }) => {
    await navigateTo(page, '/CreateStory');
    await expect(page).toHaveScreenshot('create-story-page.png', { maxDiffPixels: 150 });
  });

  test('Following List page', async ({ page }) => {
    await navigateTo(page, '/FollowingList');
    await maskDynamicContent(page);
    await expect(page).toHaveScreenshot('following-list-page.png', { maxDiffPixels: 150 });
  });
});
