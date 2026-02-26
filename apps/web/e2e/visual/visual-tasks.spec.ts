/**
 * Visual Regression Tests - Task Pages
 * Pages: AudioTask, VideoTask, WriteTask
 */
import {
  test, expect, setupAuthenticatedUser, navigateTo,
} from '../fixtures';
import { DESKTOP_VIEWPORT } from './visual-helpers';
import { mockMissionData } from './visual-mocks';

test.describe('Visual - Task Pages', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize(DESKTOP_VIEWPORT);
    await setupAuthenticatedUser(page);
    await mockMissionData(page);
  });

  test('Audio Task page', async ({ page }) => {
    await navigateTo(page, '/AudioTask');
    await expect(page).toHaveScreenshot('audio-task-page.png', { maxDiffPixels: 150 });
  });

  test('Video Task page', async ({ page }) => {
    await navigateTo(page, '/VideoTask');
    await expect(page).toHaveScreenshot('video-task-page.png', { maxDiffPixels: 150 });
  });

  test('Write Task page', async ({ page }) => {
    await navigateTo(page, '/WriteTask');
    await expect(page).toHaveScreenshot('write-task-page.png', { maxDiffPixels: 150 });
  });
});
