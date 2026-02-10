/**
 * E2E UI Helpers
 * Utilities for UI interactions, dialogs, toasts, and accessibility checks
 */
import { Page, expect } from '@playwright/test';

export async function waitForToast(page: Page, text: string) {
  await page.locator('[data-sonner-toast]').filter({ hasText: text }).waitFor({ timeout: 10000 });
}

export async function expectToast(page: Page, message: string | RegExp) {
  await expect(page.locator('[data-sonner-toast], [role="alert"], .toast')).toContainText(message, { timeout: 5000 });
}

export async function expectEmptyState(page: Page, variant?: string) {
  const emptyState = page.locator('[data-testid="empty-state"], .empty-state');
  await expect(emptyState).toBeVisible({ timeout: 5000 });
  if (variant) {
    await expect(emptyState).toContainText(new RegExp(variant, 'i'));
  }
}

export async function waitForDialog(page: Page) {
  await page.locator('[role="dialog"], [data-state="open"]').waitFor({ timeout: 5000 });
}

export async function closeDialog(page: Page) {
  const closeButton = page.locator('[role="dialog"] button[aria-label="Close"], [data-state="open"] button:has-text("×")');
  if (await closeButton.isVisible()) {
    await closeButton.click();
  } else {
    await page.keyboard.press('Escape');
  }
}

export async function scrollToElement(page: Page, selector: string) {
  await page.locator(selector).scrollIntoViewIfNeeded();
}

export async function checkAccessibility(page: Page) {
  const title = await page.title();
  expect(title).toBeTruthy();
  const main = page.locator('main, [role="main"]');
  if ((await main.count()) > 0) {
    await expect(main.first()).toBeVisible();
  }
}

export async function isMobileView(page: Page): Promise<boolean> {
  const viewport = page.viewportSize();
  return viewport ? viewport.width < 768 : false;
}

export async function takeDebugScreenshot(page: Page, name: string) {
  if (process.env.DEBUG) {
    await page.screenshot({ path: `playwright-report/debug-${name}-${Date.now()}.png` });
  }
}
