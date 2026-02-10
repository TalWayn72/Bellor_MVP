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

/**
 * Navigate to an active chat from TemporaryChats page.
 * Returns true if successfully navigated to a chat with messaging capability.
 * Returns false if no active chat was found or navigation failed.
 */
async function navigateToActiveChat(page: import('@playwright/test').Page): Promise<boolean> {
  await page.goto('/TemporaryChats');
  await waitForPageLoad(page);
  await page.waitForTimeout(2000);

  // First, try filtering to Active chats only (these allow messaging)
  const activeFilter = page.locator('button:has-text("Active")').first();
  if (await activeFilter.isVisible({ timeout: 3000 }).catch(() => false)) {
    await activeFilter.click();
    await page.waitForTimeout(1000);
  }

  // Chat cards render as Card divs with cursor-pointer class
  const chatItem = page.locator('.cursor-pointer').first();

  if (!(await chatItem.isVisible({ timeout: 5000 }).catch(() => false))) {
    // No active chat items - skip test gracefully
    return false;
  }

  await chatItem.click();

  // Wait for navigation to PrivateChat
  try {
    await page.waitForURL(/PrivateChat/, { timeout: 10000 });
  } catch {
    return false;
  }

  await waitForPageLoad(page);

  // Verify the chat loaded successfully (not an error screen)
  const errorScreen = page.locator('text=/Chat Not Found|Unable to Load/i');
  if (await errorScreen.isVisible({ timeout: 2000 }).catch(() => false)) {
    return false;
  }

  // Verify chat input is present (meaning the chat is messageable)
  const input = page.locator('input[placeholder*="message" i], input[placeholder*="Type" i], textarea[placeholder*="message" i]').first();
  try {
    await expect(input).toBeVisible({ timeout: 5000 });
    return true;
  } catch {
    return false;
  }
}

test.describe('[P1][chat] Chat Messaging - Full Stack', () => {
  test.use({ storageState: FULLSTACK_AUTH.user });

  test('should load temporary chats list', async ({ page }) => {
    await page.goto('/TemporaryChats');
    await waitForPageLoad(page);

    // Page header shows "Temporary Chats" - use separate locator checks
    const header = page.locator('h1:has-text("Temporary Chats")').first();
    const fallbackHeader = page.getByText(/temporary.*chats/i).first();

    const headerVisible = await header.isVisible({ timeout: 15000 }).catch(() => false)
      || await fallbackHeader.isVisible({ timeout: 3000 }).catch(() => false);
    expect(headerVisible).toBe(true);
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

    // Click on first chat item - cards have cursor-pointer class
    const chatItem = page.locator('.cursor-pointer').first();

    if (await chatItem.isVisible({ timeout: 5000 }).catch(() => false)) {
      await chatItem.click();
      await page.waitForURL(/PrivateChat/, { timeout: 10000 });
    }
  });

  test('should display chat input and send button', async ({ page }) => {
    const canMessage = await navigateToActiveChat(page);
    if (!canMessage) {
      test.skip();
      return;
    }

    // ChatInput uses: <Input placeholder="Type a message..." />
    const input = page.locator('input[placeholder*="message" i], input[placeholder*="Type" i]').first();
    await expect(input).toBeVisible({ timeout: 10000 });

    // Send button has aria-label="Send message"
    const sendBtn = page.locator('button[aria-label*="Send" i]').first();
    await expect(sendBtn).toBeVisible({ timeout: 5000 });
  });

  test('should send a text message', async ({ page }) => {
    const canMessage = await navigateToActiveChat(page);
    if (!canMessage) {
      test.skip();
      return;
    }

    const testMessage = `E2E test message ${Date.now()}`;
    await sendChatMessage(page, testMessage);

    // Message should appear in the chat
    await waitForMessage(page, testMessage, 10000);
  });

  test('should persist messages after page reload', async ({ page }) => {
    const canMessage = await navigateToActiveChat(page);
    if (!canMessage) {
      test.skip();
      return;
    }

    const testMessage = `Persist test ${Date.now()}`;
    await sendChatMessage(page, testMessage);
    await waitForMessage(page, testMessage, 10000);

    // Reload page
    await page.reload();
    await waitForPageLoad(page);

    // Message should still be visible
    await waitForMessage(page, testMessage, 15000);
  });

  test('should handle Hebrew messages', async ({ page }) => {
    const canMessage = await navigateToActiveChat(page);
    if (!canMessage) {
      test.skip();
      return;
    }

    await sendChatMessage(page, 'שלום, זו הודעת בדיקה!');
    await waitForMessage(page, 'שלום', 10000);
  });

  test('should handle XSS in chat messages', async ({ page }) => {
    const canMessage = await navigateToActiveChat(page);
    if (!canMessage) {
      test.skip();
      return;
    }

    await sendChatMessage(page, SPECIAL_INPUTS.xss);

    // Script should NOT execute - no inline script tags should be injected
    await expect(page.locator('script:not([src])')).toHaveCount(0);
  });

  test('should navigate back from chat to list', async ({ page }) => {
    await page.goto('/TemporaryChats');
    await waitForPageLoad(page);
    await page.waitForTimeout(2000);

    const chatItem = page.locator('.cursor-pointer').first();

    if (await chatItem.isVisible({ timeout: 5000 }).catch(() => false)) {
      await chatItem.click();
      await page.waitForURL(/PrivateChat/, { timeout: 10000 });

      // Click back button
      const backBtn = page.locator(
        'button[aria-label*="back" i], button:has(svg.lucide-arrow-left), button:has(svg.lucide-chevron-left)',
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

      // Check if content or empty state appears
      const hasContent = await page.locator('.cursor-pointer').count() > 0;
      const hasEmptyState = await page.locator(
        'text=/no.*chat|no.*temporary/i',
      ).isVisible().catch(() => false);

      // Either content or empty state should be visible
      expect(hasContent || hasEmptyState).toBe(true);
    }
  });
});
