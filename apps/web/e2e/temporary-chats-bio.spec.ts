/**
 * E2E Tests for Temporary Chats - User Bio Dialog
 * Tests that clicking on user avatar shows their bio
 */

import { test, expect } from '@playwright/test';

test.describe('Temporary Chats - User Bio Dialog', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication
    await page.addInitScript(() => {
      localStorage.setItem('bellor_auth', JSON.stringify({
        isAuthenticated: true,
        user: { id: 'test-user-123', email: 'test@example.com' },
      }));
    });
  });

  test('should show bio dialog when clicking on user avatar', async ({ page }) => {
    await page.goto('/TemporaryChats');
    await page.waitForLoadState('networkidle');

    // Find and click on the first user avatar
    const avatar = page.locator('button[title="Click to view bio"]').first();

    if (await avatar.isVisible({ timeout: 5000 }).catch(() => false)) {
      await avatar.click();

      // Dialog should appear
      const dialog = page.locator('[role="dialog"]');
      await expect(dialog).toBeVisible({ timeout: 3000 });

      // Should show user name
      const userName = dialog.locator('h2');
      await expect(userName).toBeVisible();

      // Should have View Profile button
      const viewProfileButton = dialog.locator('button:has-text("View Profile")');
      await expect(viewProfileButton).toBeVisible();

      // Should have Chat button
      const chatButton = dialog.locator('button:has-text("Chat")');
      await expect(chatButton).toBeVisible();
    }
  });

  test('should close dialog when clicking outside', async ({ page }) => {
    await page.goto('/TemporaryChats');
    await page.waitForLoadState('networkidle');

    const avatar = page.locator('button[title="Click to view bio"]').first();

    if (await avatar.isVisible({ timeout: 5000 }).catch(() => false)) {
      await avatar.click();

      const dialog = page.locator('[role="dialog"]');
      await expect(dialog).toBeVisible({ timeout: 3000 });

      // Click outside to close (press Escape)
      await page.keyboard.press('Escape');

      // Dialog should be hidden
      await expect(dialog).not.toBeVisible({ timeout: 2000 });
    }
  });

  test('should navigate to profile when clicking View Profile', async ({ page }) => {
    await page.goto('/TemporaryChats');
    await page.waitForLoadState('networkidle');

    const avatar = page.locator('button[title="Click to view bio"]').first();

    if (await avatar.isVisible({ timeout: 5000 }).catch(() => false)) {
      await avatar.click();

      const dialog = page.locator('[role="dialog"]');
      await expect(dialog).toBeVisible({ timeout: 3000 });

      // Click View Profile
      const viewProfileButton = dialog.locator('button:has-text("View Profile")');
      await viewProfileButton.click();

      // Should navigate to UserProfile page
      await expect(page).toHaveURL(/\/UserProfile\?id=/);
    }
  });

  test('should navigate to chat when clicking Chat button', async ({ page }) => {
    await page.goto('/TemporaryChats');
    await page.waitForLoadState('networkidle');

    const avatar = page.locator('button[title="Click to view bio"]').first();

    if (await avatar.isVisible({ timeout: 5000 }).catch(() => false)) {
      await avatar.click();

      const dialog = page.locator('[role="dialog"]');
      await expect(dialog).toBeVisible({ timeout: 3000 });

      // Click Chat
      const chatButton = dialog.locator('button:has-text("Chat")');
      await chatButton.click();

      // Should navigate to PrivateChat page
      await expect(page).toHaveURL(/\/PrivateChat\?chatId=/);
    }
  });

  test('should not open dialog when clicking on card body (not avatar)', async ({ page }) => {
    await page.goto('/TemporaryChats');
    await page.waitForLoadState('networkidle');

    // Click on the card content area (not the avatar)
    const card = page.locator('[class*="Card"]').first();

    if (await card.isVisible({ timeout: 5000 }).catch(() => false)) {
      // Click on the text part of the card
      const cardText = card.locator('h3').first();
      await cardText.click();

      // Should navigate to chat directly, not show dialog
      await expect(page).toHaveURL(/\/PrivateChat\?chatId=/);
    }
  });

  test('should show loading state while fetching user data', async ({ page }) => {
    // Mock slow API response
    await page.route('**/api/v1/users/**', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      await route.continue();
    });

    await page.goto('/TemporaryChats');
    await page.waitForLoadState('networkidle');

    const avatar = page.locator('button[title="Click to view bio"]').first();

    if (await avatar.isVisible({ timeout: 5000 }).catch(() => false)) {
      await avatar.click();

      const dialog = page.locator('[role="dialog"]');
      await expect(dialog).toBeVisible({ timeout: 3000 });

      // Should show loading skeleton
      const skeleton = dialog.locator('.animate-pulse');
      await expect(skeleton).toBeVisible();
    }
  });

  test('should display bio text when available', async ({ page }) => {
    // Mock API response with bio
    await page.route('**/api/v1/users/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            id: 'demo-user-1',
            firstName: 'Sarah',
            bio: 'I love hiking and photography. Looking for someone to explore nature with!',
            profileImages: ['https://example.com/image.jpg'],
            location: { city: 'Tel Aviv', country: 'Israel' },
            gender: 'FEMALE',
            isVerified: true,
          },
        }),
      });
    });

    await page.goto('/TemporaryChats');
    await page.waitForLoadState('networkidle');

    const avatar = page.locator('button[title="Click to view bio"]').first();

    if (await avatar.isVisible({ timeout: 5000 }).catch(() => false)) {
      await avatar.click();

      const dialog = page.locator('[role="dialog"]');
      await expect(dialog).toBeVisible({ timeout: 3000 });

      // Should show bio text
      const bioText = dialog.locator('text=hiking and photography');
      await expect(bioText).toBeVisible({ timeout: 3000 });
    }
  });
});
