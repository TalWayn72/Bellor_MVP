/**
 * Full-Stack E2E: Chat Messaging
 * Tests real chat functionality - send, receive, history
 */
import { test, expect } from '@playwright/test';
import {
  waitForPageLoad,
  sendChatMessage,
  waitForMessage,
  FULLSTACK_AUTH,
  SPECIAL_INPUTS,
} from '../fixtures/index.js';

test.describe('[P1][chat] Chat Messaging - Full Stack', () => {
  test.use({ storageState: FULLSTACK_AUTH.user });

  test('should load temporary chats list', async ({ page }) => {
    await page.goto('/TemporaryChats');
    await waitForPageLoad(page);

    // Page should load
    await expect(
      page.locator('text=/temporary.*chat|צ\'אטים|chats/i').first(),
    ).toBeVisible({ timeout: 15000 });
  });

  test('should display chat filter buttons', async ({ page }) => {
    await page.goto('/TemporaryChats');
    await waitForPageLoad(page);

    // Filter buttons: All, Pending, Active
    const allFilter = page.locator('button:has-text("All")').first();
    const pendingFilter = page.locator('button:has-text("Pending")').first();
    const activeFilter = page.locator('button:has-text("Active")').first();

    // At least one filter should be visible
    const anyVisible = await allFilter.isVisible().catch(() => false)
      || await pendingFilter.isVisible().catch(() => false)
      || await activeFilter.isVisible().catch(() => false);
    expect(anyVisible).toBe(true);
  });

  test('should switch between chat filters', async ({ page }) => {
    await page.goto('/TemporaryChats');
    await waitForPageLoad(page);

    const filters = ['All', 'Pending', 'Active'];
    for (const filter of filters) {
      const btn = page.locator(`button:has-text("${filter}")`).first();
      if (await btn.isVisible().catch(() => false)) {
        await btn.click();
        await page.waitForTimeout(500);
      }
    }
  });

  test('should navigate to private chat', async ({ page }) => {
    await page.goto('/TemporaryChats');
    await waitForPageLoad(page);
    await page.waitForTimeout(3000);

    // Click on first chat item
    const chatItem = page.locator(
      'a[href*="PrivateChat"], [data-testid*="chat-item"], [class*="chat-card"]',
    ).first();

    if (await chatItem.isVisible({ timeout: 5000 }).catch(() => false)) {
      await chatItem.click();
      await page.waitForURL(/PrivateChat/, { timeout: 10000 });
    }
  });

  test('should display chat input and send button', async ({ page }) => {
    await page.goto('/TemporaryChats');
    await waitForPageLoad(page);
    await page.waitForTimeout(2000);

    // Navigate to first available chat
    const chatItem = page.locator(
      'a[href*="PrivateChat"], [data-testid*="chat-item"]',
    ).first();

    if (await chatItem.isVisible({ timeout: 5000 }).catch(() => false)) {
      await chatItem.click();
      await page.waitForURL(/PrivateChat/, { timeout: 10000 });
      await waitForPageLoad(page);

      // Message input should be visible
      const input = page.locator(
        'input[placeholder*="message" i], input[placeholder*="הודעה" i], textarea[placeholder*="message" i]',
      ).first();
      await expect(input).toBeVisible({ timeout: 10000 });
    }
  });

  test('should send a text message', async ({ page }) => {
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

      const testMessage = `E2E test message ${Date.now()}`;
      await sendChatMessage(page, testMessage);

      // Message should appear in the chat
      await waitForMessage(page, testMessage, 10000);
    }
  });

  test('should persist messages after page reload', async ({ page }) => {
    await page.goto('/TemporaryChats');
    await waitForPageLoad(page);
    await page.waitForTimeout(2000);

    const chatItem = page.locator(
      'a[href*="PrivateChat"], [data-testid*="chat-item"]',
    ).first();

    if (await chatItem.isVisible({ timeout: 5000 }).catch(() => false)) {
      await chatItem.click();
      await page.waitForURL(/PrivateChat/, { timeout: 10000 });

      const testMessage = `Persist test ${Date.now()}`;
      await sendChatMessage(page, testMessage);
      await waitForMessage(page, testMessage, 10000);

      // Reload page
      await page.reload();
      await waitForPageLoad(page);

      // Message should still be visible
      await waitForMessage(page, testMessage, 15000);
    }
  });

  test('should handle Hebrew messages', async ({ page }) => {
    await page.goto('/TemporaryChats');
    await waitForPageLoad(page);
    await page.waitForTimeout(2000);

    const chatItem = page.locator(
      'a[href*="PrivateChat"], [data-testid*="chat-item"]',
    ).first();

    if (await chatItem.isVisible({ timeout: 5000 }).catch(() => false)) {
      await chatItem.click();
      await page.waitForURL(/PrivateChat/, { timeout: 10000 });

      await sendChatMessage(page, 'שלום, זו הודעת בדיקה!');
      await waitForMessage(page, 'שלום', 10000);
    }
  });

  test('should handle XSS in chat messages', async ({ page }) => {
    await page.goto('/TemporaryChats');
    await waitForPageLoad(page);
    await page.waitForTimeout(2000);

    const chatItem = page.locator(
      'a[href*="PrivateChat"], [data-testid*="chat-item"]',
    ).first();

    if (await chatItem.isVisible({ timeout: 5000 }).catch(() => false)) {
      await chatItem.click();
      await page.waitForURL(/PrivateChat/, { timeout: 10000 });

      await sendChatMessage(page, SPECIAL_INPUTS.xss);

      // Script should NOT execute
      await expect(page.locator('script:not([src])')).toHaveCount(0);
    }
  });

  test('should navigate back from chat to list', async ({ page }) => {
    await page.goto('/TemporaryChats');
    await waitForPageLoad(page);
    await page.waitForTimeout(2000);

    const chatItem = page.locator(
      'a[href*="PrivateChat"], [data-testid*="chat-item"]',
    ).first();

    if (await chatItem.isVisible({ timeout: 5000 }).catch(() => false)) {
      await chatItem.click();
      await page.waitForURL(/PrivateChat/, { timeout: 10000 });

      // Click back button
      const backBtn = page.locator(
        'button[aria-label*="back" i], button:has(path[d*="15 19l-7-7"])',
      ).first();

      if (await backBtn.isVisible().catch(() => false)) {
        await backBtn.click();
      } else {
        await page.goBack();
      }

      // Should return to chat list or shared space
      await page.waitForURL(/\/(TemporaryChats|SharedSpace)/, { timeout: 10000 });
    }
  });

  test('should show empty state for empty chat filters', async ({ page }) => {
    await page.goto('/TemporaryChats');
    await waitForPageLoad(page);

    // Try the Pending or Active filter - may have empty results
    const pendingBtn = page.locator('button:has-text("Pending")').first();
    if (await pendingBtn.isVisible().catch(() => false)) {
      await pendingBtn.click();
      await page.waitForTimeout(2000);

      // Check if empty state or content appears
      const hasContent = await page.locator(
        '[data-testid*="chat-item"], [class*="chat-card"]',
      ).count() > 0;
      const hasEmptyState = await page.locator(
        'text=/no.*chat|אין צ\'אטים/i',
      ).isVisible().catch(() => false);

      // Either content or empty state should be visible
      expect(hasContent || hasEmptyState).toBe(true);
    }
  });
});
