/**
 * Visual Regression Tests - Mission Pages
 * Pages: IceBreakers, CompatibilityQuiz, Creation, DateIdeas, VideoDate, VirtualEvents
 */
import {
  test, expect, setupAuthenticatedUser, navigateTo,
} from '../fixtures';
import { DESKTOP_VIEWPORT, maskDynamicContent } from './visual-helpers';
import { mockMissionData } from './visual-mocks';

test.describe('Visual - Mission Pages', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize(DESKTOP_VIEWPORT);
    await setupAuthenticatedUser(page);
    await mockMissionData(page);
  });

  test('Ice Breakers page', async ({ page }) => {
    await navigateTo(page, '/IceBreakers');
    await expect(page).toHaveScreenshot('icebreakers-page.png', { maxDiffPixels: 150 });
  });

  test('Compatibility Quiz page', async ({ page }) => {
    await navigateTo(page, '/CompatibilityQuiz');
    await expect(page).toHaveScreenshot('compatibility-quiz-page.png', { maxDiffPixels: 150 });
  });

  test('Creation page', async ({ page }) => {
    await navigateTo(page, '/Creation');
    await expect(page).toHaveScreenshot('creation-page.png', { maxDiffPixels: 150 });
  });

  test('Date Ideas page', async ({ page }) => {
    await navigateTo(page, '/DateIdeas');
    await expect(page).toHaveScreenshot('date-ideas-page.png', { maxDiffPixels: 150 });
  });

  test('Video Date page', async ({ page }) => {
    await navigateTo(page, '/VideoDate');
    await maskDynamicContent(page);
    await expect(page).toHaveScreenshot('video-date-page.png', { maxDiffPixels: 150 });
  });

  test('Virtual Events page', async ({ page }) => {
    await navigateTo(page, '/VirtualEvents');
    await maskDynamicContent(page);
    await expect(page).toHaveScreenshot('virtual-events-page.png', { maxDiffPixels: 150 });
  });
});
