/**
 * E2E Full-Stack Authentication Helpers
 * Utilities for real authentication against running backend
 */
import { test as base, Page } from '@playwright/test';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/** Storage state paths for full-stack tests */
export const FULLSTACK_AUTH = {
  user: resolve(__dirname, '../../playwright/.auth/user.json'),
  user2: resolve(__dirname, '../../playwright/.auth/user2.json'),
  admin: resolve(__dirname, '../../playwright/.auth/admin.json'),
} as const;

/** Full-stack test fixture with real authentication (no catch-all mock) */
export const fullstackTest = base.extend<{ authenticatedPage: Page }>({
  authenticatedPage: async ({ browser }, use) => {
    const context = await browser.newContext({
      storageState: FULLSTACK_AUTH.user,
    }).catch(() => browser.newContext());

    const page = await context.newPage();
    await use(page);
    await context.close();
  },
});

/** Login using real credentials against the running backend */
export async function loginWithRealCredentials(
  page: Page,
  email: string,
  password: string,
): Promise<void> {
  await page.goto('/Login');
  await page.waitForLoadState('networkidle');

  const emailInput = page.locator(
    'input[type="email"], input[placeholder*="email" i], input[placeholder*="אימייל" i]',
  ).first();
  const passwordInput = page.locator(
    'input[type="password"], input[placeholder*="password" i], input[placeholder*="סיסמ" i]',
  ).first();

  await emailInput.fill(email);
  await passwordInput.fill(password);

  const submitBtn = page.locator(
    'button[type="submit"], button:has-text("login"), button:has-text("התחבר"), button:has-text("כניסה")',
  ).first();
  await submitBtn.click();

  await page.waitForURL(/\/(Home|SharedSpace|Feed)/, { timeout: 15000 });
}

/** Register a new user through the real onboarding flow */
export async function registerNewUser(
  page: Page,
  userData: {
    email: string;
    password: string;
    nickname: string;
    birthDate?: string;
  },
): Promise<void> {
  await page.goto('/Onboarding');
  await page.waitForLoadState('networkidle');

  const emailInput = page.locator(
    'input[type="email"], input[placeholder*="email" i], input[placeholder*="אימייל" i]',
  ).first();
  if (await emailInput.isVisible().catch(() => false)) {
    await emailInput.fill(userData.email);
  }

  const passwordInput = page.locator(
    'input[type="password"], input[placeholder*="password" i], input[placeholder*="סיסמ" i]',
  ).first();
  if (await passwordInput.isVisible().catch(() => false)) {
    await passwordInput.fill(userData.password);
  }
}

/** Get auth tokens from localStorage */
export async function getAuthTokens(page: Page) {
  return page.evaluate(() => ({
    accessToken:
      localStorage.getItem('bellor_access_token') ||
      localStorage.getItem('accessToken'),
    refreshToken:
      localStorage.getItem('bellor_refresh_token') ||
      localStorage.getItem('refreshToken'),
    user:
      localStorage.getItem('bellor_user') ||
      localStorage.getItem('user'),
  }));
}

/** Check if user is currently authenticated */
export async function isAuthenticated(page: Page): Promise<boolean> {
  const tokens = await getAuthTokens(page);
  return tokens.accessToken !== null;
}
