/**
 * Visual Regression Tests - Profile Pages
 * Pages: Profile, EditProfile, UserProfile, UserVerification
 */
import {
  test, expect, setupAuthenticatedUser,
  navigateTo, mockUserProfile,
} from '../fixtures';
import { DESKTOP_VIEWPORT, maskDynamicContent } from './visual-helpers';

test.describe('Visual - Profile Pages', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize(DESKTOP_VIEWPORT);
    await setupAuthenticatedUser(page, {
      firstName: 'Visual',
      lastName: 'Tester',
      nickname: 'visualtester',
      bio: 'Test user for visual regression testing',
      age: 25,
    });
  });

  test('Profile page (own)', async ({ page }) => {
    await navigateTo(page, '/Profile');
    await maskDynamicContent(page);
    await expect(page).toHaveScreenshot('profile-page.png', { maxDiffPixels: 150 });
  });

  test('Edit Profile page', async ({ page }) => {
    await navigateTo(page, '/EditProfile');
    await maskDynamicContent(page);
    await expect(page).toHaveScreenshot('edit-profile-page.png', { maxDiffPixels: 150 });
  });

  test('User Profile page (other user)', async ({ page }) => {
    await mockUserProfile(page, 'other-user-1', {
      firstName: 'Other',
      lastName: 'User',
      nickname: 'otheruser',
      age: 28,
      bio: 'Other user bio',
    });
    await navigateTo(page, '/UserProfile?userId=other-user-1');
    await maskDynamicContent(page);
    await expect(page).toHaveScreenshot('user-profile-page.png', { maxDiffPixels: 150 });
  });

  test('User Verification page', async ({ page }) => {
    await navigateTo(page, '/UserVerification');
    await expect(page).toHaveScreenshot('user-verification-page.png', { maxDiffPixels: 150 });
  });
});
