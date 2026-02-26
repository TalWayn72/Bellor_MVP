/**
 * Shared Visual Test Helpers
 * Utilities used across all visual regression test files
 */
import type { Page } from '@playwright/test';
import {
  setupAuthenticatedUser,
  mockApiResponse,
  createMockUser,
} from '../fixtures';

export const DESKTOP_VIEWPORT = { width: 1280, height: 720 };
export const MOBILE_VIEWPORT = { width: 390, height: 844 };

export const HIDE_DYNAMIC_CSS = `
  time, .timestamp, .relative-time, .online-indicator,
  .online-status, [data-testid="timestamp"],
  [data-testid="message-time"], [data-testid="last-seen"],
  [data-testid="notification-time"], .footer-date,
  footer time { visibility: hidden; }
`;

/** Mask timestamps and dynamic content for deterministic screenshots */
export async function maskDynamicContent(page: Page, extraCSS = '') {
  await page.addStyleTag({ content: HIDE_DYNAMIC_CSS + extraCSS });
}

/** Enable dark mode via localStorage and DOM class */
export async function enableDarkMode(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem('theme', 'dark');
  });
}

/** Force dark class after page load (call after navigation) */
export async function applyDarkClass(page: Page) {
  await page.evaluate(() => {
    document.documentElement.classList.add('dark');
  });
}

/** Setup admin user with is_admin flag */
export async function setupAdminUser(page: Page) {
  const adminUser = createMockUser({
    firstName: 'Admin',
    lastName: 'User',
    nickname: 'admin',
  });

  const mockUser = await setupAuthenticatedUser(page, adminUser);

  await mockApiResponse(page, '**/api/v1/auth/me', {
    ...mockUser,
    is_admin: true,
    full_name: 'Admin User',
    role: 'admin',
  });
  await mockApiResponse(page, '**/api/v1/users/me', {
    ...mockUser,
    is_admin: true,
    full_name: 'Admin User',
    role: 'admin',
  });

  return mockUser;
}
