/**
 * E2E Navigation Helpers
 * Utilities for page navigation and loading in Playwright tests
 */
import { Page } from '@playwright/test';

export async function waitForPageLoad(page: Page) {
  await page.waitForLoadState('networkidle');
}

export async function waitForNavigation(page: Page, path: string) {
  await page.waitForURL(`**${path}**`, { timeout: 10000 });
}

export async function navigateTo(page: Page, path: string) {
  await page.goto(path);
  await waitForPageLoad(page);
  await waitForLoadingComplete(page);
}

export async function waitForLoadingComplete(page: Page) {
  await page.locator('.animate-pulse, [data-loading="true"]').first().waitFor({ state: 'hidden', timeout: 10000 }).catch(() => {});
  await page.waitForLoadState('networkidle').catch(() => {});
}

export async function clearLocalStorage(page: Page) {
  await page.evaluate(() => localStorage.clear());
}

export async function getLocalStorageItem(page: Page, key: string): Promise<string | null> {
  return page.evaluate((k) => localStorage.getItem(k), key);
}

export async function setLocalStorageItem(page: Page, key: string, value: string) {
  await page.evaluate(([k, v]) => localStorage.setItem(k, v), [key, value]);
}
