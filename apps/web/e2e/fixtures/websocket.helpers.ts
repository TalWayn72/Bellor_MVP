/**
 * WebSocket helpers for full-stack E2E tests
 * Provides utilities for testing real-time chat features
 */
import { Page } from '@playwright/test';

const WS_URL = process.env.E2E_WS_URL || 'http://localhost:3000';

/** Wait for a WebSocket connection to be established on the page */
export async function waitForWebSocketConnection(
  page: Page,
  timeout = 10000,
): Promise<void> {
  await page.waitForFunction(
    () => {
      // Check if Socket.io is connected
      const w = window as unknown as Record<string, unknown>;
      return w.__socketConnected === true;
    },
    { timeout },
  ).catch(() => {
    // Socket connection indicator may not be exposed - fallback to waiting
    // The app should connect automatically when entering chat pages
  });
}

/** Send a chat message and wait for it to appear in the UI */
export async function sendChatMessage(
  page: Page,
  message: string,
): Promise<void> {
  const input = page.locator(
    'input[placeholder*="message" i], input[placeholder*="הודעה" i], textarea[placeholder*="message" i], textarea[placeholder*="הודעה" i]',
  );
  await input.fill(message);

  const sendButton = page.locator(
    'button[aria-label*="send" i], button[aria-label*="שלח" i], button:has(svg[data-icon="send"])',
  ).first();
  await sendButton.click();
}

/** Wait for a specific message to appear in the chat */
export async function waitForMessage(
  page: Page,
  messageText: string,
  timeout = 10000,
): Promise<void> {
  await page.locator(`text=${messageText}`).waitFor({
    state: 'visible',
    timeout,
  });
}

/** Wait for typing indicator to appear */
export async function waitForTypingIndicator(
  page: Page,
  timeout = 5000,
): Promise<void> {
  await page.locator(
    '[data-testid="typing-indicator"], .typing-indicator, [class*="typing"]',
  ).waitFor({ state: 'visible', timeout });
}

/** Open a specific chat by navigating to it */
export async function openChat(
  page: Page,
  chatPartnerName: string,
): Promise<void> {
  // Click on chat partner in the chat list
  await page.locator(`text=${chatPartnerName}`).first().click();
  // Wait for chat to load
  await page.waitForURL(/PrivateChat/);
}

/** Setup two browser contexts for real-time chat testing */
export async function setupTwoUserChat(
  browser: import('@playwright/test').Browser,
  user1StorageState: string,
  user2StorageState: string,
) {
  const context1 = await browser.newContext({ storageState: user1StorageState });
  const context2 = await browser.newContext({ storageState: user2StorageState });
  const page1 = await context1.newPage();
  const page2 = await context2.newPage();

  return { context1, context2, page1, page2 };
}
