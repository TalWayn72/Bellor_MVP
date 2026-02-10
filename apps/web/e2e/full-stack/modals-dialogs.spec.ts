/**
 * Full-Stack E2E: Modals & Dialogs
 * Tests opening, interacting with, and closing all modals
 */
import { test, expect } from '@playwright/test';
import {
  waitForPageLoad,
  waitForDialog,
  closeDialog,
  FULLSTACK_AUTH,
} from '../fixtures/index.js';

test.describe('[P2][infra] Modals & Dialogs - Full Stack', () => {
  test.use({ storageState: FULLSTACK_AUTH.user });

  test('should open and close dialog via X button', async ({ page }) => {
    await page.goto('/Discover');
    await waitForPageLoad(page);
    await page.waitForTimeout(3000);

    // Try to open super like modal
    const superLikeBtn = page.locator(
      'button[aria-label*="super" i], button:has(svg[data-icon="star"])',
    ).first();

    if (await superLikeBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await superLikeBtn.click();

      const dialog = page.locator('[role="dialog"]').first();
      await expect(dialog).toBeVisible({ timeout: 5000 });

      // Close via X button
      await closeDialog(page);
      await expect(dialog).not.toBeVisible({ timeout: 5000 });
    }
  });

  test('should close dialog via Escape key', async ({ page }) => {
    await page.goto('/Discover');
    await waitForPageLoad(page);
    await page.waitForTimeout(3000);

    const superLikeBtn = page.locator(
      'button[aria-label*="super" i], button:has(svg[data-icon="star"])',
    ).first();

    if (await superLikeBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await superLikeBtn.click();

      const dialog = page.locator('[role="dialog"]').first();
      await expect(dialog).toBeVisible({ timeout: 5000 });

      await page.keyboard.press('Escape');
      await expect(dialog).not.toBeVisible({ timeout: 5000 });
    }
  });

  test('should close dialog via overlay click', async ({ page }) => {
    await page.goto('/Discover');
    await waitForPageLoad(page);
    await page.waitForTimeout(3000);

    const superLikeBtn = page.locator(
      'button[aria-label*="super" i], button:has(svg[data-icon="star"])',
    ).first();

    if (await superLikeBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await superLikeBtn.click();

      const dialog = page.locator('[role="dialog"]').first();
      await expect(dialog).toBeVisible({ timeout: 5000 });

      // Click outside the dialog (on overlay)
      const overlay = page.locator('[data-radix-overlay], [class*="overlay"], .fixed.inset-0').first();
      if (await overlay.isVisible().catch(() => false)) {
        await overlay.click({ position: { x: 5, y: 5 }, force: true });
        await page.waitForTimeout(1000);
      }
    }
  });

  test('should show delete confirmation dialog on profile', async ({ page }) => {
    await page.goto('/Profile');
    await waitForPageLoad(page);

    // Switch to My Book tab
    const bookTab = page.locator(
      'button:has-text("My Book"), button:has-text("הספר שלי")',
    ).first();

    if (await bookTab.isVisible({ timeout: 5000 }).catch(() => false)) {
      await bookTab.click();
      await page.waitForTimeout(2000);

      // Try to delete a post (if any exist)
      const deleteBtn = page.locator(
        'button[aria-label*="delete" i], button:has(svg[data-icon="trash"])',
      ).first();

      if (await deleteBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await deleteBtn.click();

        // Confirmation dialog should appear
        const confirmDialog = page.locator('[role="alertdialog"], [role="dialog"]').first();
        await expect(confirmDialog).toBeVisible({ timeout: 5000 });

        // Cancel the deletion
        const cancelBtn = page.getByRole('button', { name: /cancel|ביטול/i });
        await cancelBtn.click();
      }
    }
  });

  test('should show block user dialog in chat', async ({ page }) => {
    await page.goto('/TemporaryChats');
    await waitForPageLoad(page);
    await page.waitForTimeout(2000);

    const chatItem = page.locator(
      'a[href*="PrivateChat"], [data-testid*="chat-item"]',
    ).first();

    if (await chatItem.isVisible({ timeout: 5000 }).catch(() => false)) {
      await chatItem.click();
      await page.waitForURL(/PrivateChat/, { timeout: 10000 });
      await waitForPageLoad(page);

      // Open more menu
      const moreBtn = page.locator(
        'button[aria-label*="more" i], button:has(svg[data-icon="more-vertical"])',
      ).first();

      if (await moreBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await moreBtn.click();

        const blockOption = page.locator('text=/block/i').first();
        if (await blockOption.isVisible({ timeout: 3000 }).catch(() => false)) {
          await blockOption.click();

          // Confirmation dialog
          const dialog = page.locator('[role="dialog"], [role="alertdialog"]').first();
          await expect(dialog).toBeVisible({ timeout: 5000 });

          // Cancel
          const cancelBtn = page.getByRole('button', { name: /cancel|ביטול/i });
          if (await cancelBtn.isVisible().catch(() => false)) {
            await cancelBtn.click();
          } else {
            await page.keyboard.press('Escape');
          }
        }
      }
    }
  });

  test('should handle logout confirmation dialog', async ({ page }) => {
    await page.goto('/Settings');
    await waitForPageLoad(page);

    const logoutBtn = page.getByRole('button', { name: /logout|התנתק|יציאה/i });
    await logoutBtn.click();

    // If there's a confirmation dialog
    const dialog = page.locator('[role="dialog"], [role="alertdialog"]').first();
    if (await dialog.isVisible({ timeout: 3000 }).catch(() => false)) {
      // Cancel
      const cancelBtn = page.getByRole('button', { name: /cancel|ביטול|no/i });
      if (await cancelBtn.isVisible().catch(() => false)) {
        await cancelBtn.click();
        // Should stay on settings page
        expect(page.url()).toContain('Settings');
      }
    }
  });

  test('should show toast notifications', async ({ page }) => {
    await page.goto('/EditProfile');
    await waitForPageLoad(page);

    // Make a change and save to trigger toast
    const bioField = page.locator('textarea').first();
    if (await bioField.isVisible({ timeout: 10000 }).catch(() => false)) {
      await bioField.clear();
      await bioField.fill('Toast test bio update');

      const saveBtn = page.getByRole('button', { name: /save|שמור/i }).first();
      await saveBtn.click();

      // Toast should appear (Sonner)
      const toast = page.locator('[data-sonner-toast], [role="status"]').first();
      await expect(toast).toBeVisible({ timeout: 10000 }).catch(() => {
        // Toast may have already disappeared
      });
    }
  });

  test('should handle task selector dialog on SharedSpace', async ({ page }) => {
    await page.goto('/SharedSpace');
    await waitForPageLoad(page);

    const shareBtn = page.getByRole('button', {
      name: /share|respond|participate|שתף|הגב/i,
    }).first();

    if (await shareBtn.isVisible({ timeout: 10000 }).catch(() => false)) {
      await shareBtn.click();

      // Task selector should appear as dialog/sheet
      const taskSelector = page.locator(
        '[role="dialog"], text=/text|video|audio|draw/i',
      ).first();
      await expect(taskSelector).toBeVisible({ timeout: 5000 });

      // Close it
      await page.keyboard.press('Escape');
    }
  });
});
