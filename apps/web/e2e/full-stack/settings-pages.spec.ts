/**
 * Full-Stack E2E: Settings Pages
 * Tests all settings sub-pages, toggles, and preferences
 *
 * Covers:
 * - /Settings main page (profile card, menu items, logout)
 * - /NotificationSettings (5 toggle switches)
 * - /PrivacySettings (4 privacy toggles, Blocked Users/Safety Center links, GDPR section)
 * - /FilterSettings (age slider, distance slider, gender + religion buttons)
 * - /BlockedUsers (empty state or list)
 * - /FollowingList (Following/Followers tabs)
 * - /HelpSupport (FAQ, Live Chat, Email Support links)
 * - /ThemeSettings (admin-only, non-admin sees "Admin Only" message)
 */
import { test, expect, Page } from '@playwright/test';
import {
  waitForPageLoad,
  FULLSTACK_AUTH,
  collectConsoleMessages,
} from '../fixtures/index.js';

/**
 * Ensures the page is authenticated and not redirected to Onboarding.
 * When the JWT access token expires and refresh fails, the app redirects
 * to /Onboarding. This helper detects that and skips the test gracefully.
 *
 * @param page - Playwright page
 * @param expectedContent - A locator or text pattern expected on the real page
 * @returns true if authenticated and page loaded, false if auth expired
 */
async function ensureAuthenticated(page: Page): Promise<boolean> {
  // Wait a moment for any redirects to settle
  await page.waitForTimeout(2000);

  const url = page.url();

  // If redirected to Onboarding or Welcome, auth has expired
  if (url.includes('/Onboarding') || url.includes('/Welcome') || url.includes('/Login')) {
    test.skip(true, 'Auth token expired - redirected to Onboarding/Welcome');
    return false;
  }

  return true;
}

test.describe('[P2][profile] Settings Pages - Full Stack', () => {
  test.use({ storageState: FULLSTACK_AUTH.user });

  // ── Main Settings Page ──────────────────────────────────────────────

  test('should load settings page with profile card and menu items', async ({ page }) => {
    const cc = collectConsoleMessages(page);
    await page.goto('/Settings', { waitUntil: 'domcontentloaded' });
    await waitForPageLoad(page);

    if (!(await ensureAuthenticated(page))) return;

    // Header says "Settings"
    await expect(
      page.locator('h1').filter({ hasText: 'Settings' }),
    ).toBeVisible({ timeout: 15000 });

    // Profile card: should show "Edit Profile" button
    await expect(
      page.getByRole('button', { name: /edit profile/i }),
    ).toBeVisible({ timeout: 10000 });

    // Settings menu items: Notifications, Privacy & Security, Help & Support
    await expect(
      page.locator('text=Notifications').first(),
    ).toBeVisible({ timeout: 5000 });
    await expect(
      page.locator('text=Privacy & Security').first(),
    ).toBeVisible({ timeout: 5000 });
    await expect(
      page.locator('text=Help & Support').first(),
    ).toBeVisible({ timeout: 5000 });

    // Logout button (contains "Logout" text)
    await expect(
      page.getByRole('button', { name: /logout/i }),
    ).toBeVisible({ timeout: 5000 });

    // Footer version
    await expect(
      page.locator('text=Bellor v1.0.0'),
    ).toBeVisible({ timeout: 5000 });
    cc.assertClean();
  });

  // ── Notification Settings ───────────────────────────────────────────

  test('should navigate to notification settings from Settings page', async ({ page }) => {
    await page.goto('/Settings', { waitUntil: 'domcontentloaded' });
    await waitForPageLoad(page);

    if (!(await ensureAuthenticated(page))) return;

    await page.locator('text=Notifications').first().click();
    await page.waitForURL(/NotificationSettings/, { timeout: 10000 });
    await waitForPageLoad(page);

    // Header
    await expect(
      page.locator('h1').filter({ hasText: 'Notification Settings' }),
    ).toBeVisible({ timeout: 10000 });

    // Should have exactly 5 switches (newMatches, newMessages, chatRequests, dailyMissions, emailNotifications)
    const switches = page.locator('[role="switch"]');
    await expect(switches.first()).toBeVisible({ timeout: 10000 });
    const count = await switches.count();
    expect(count).toBe(5);
  });

  test('should toggle notification switches', async ({ page }) => {
    await page.goto('/NotificationSettings', { waitUntil: 'domcontentloaded' });
    await waitForPageLoad(page);

    if (!(await ensureAuthenticated(page))) return;

    const firstSwitch = page.locator('[role="switch"]').first();
    await expect(firstSwitch).toBeVisible({ timeout: 10000 });

    const initialState = await firstSwitch.getAttribute('data-state');
    await firstSwitch.click();

    // Wait for the state to update (API call + re-render)
    await page.waitForTimeout(1500);
    const newState = await firstSwitch.getAttribute('data-state');
    expect(newState).not.toBe(initialState);

    // Toggle back to restore original state
    await firstSwitch.click();
    await page.waitForTimeout(1500);
    const restoredState = await firstSwitch.getAttribute('data-state');
    expect(restoredState).toBe(initialState);
  });

  test('should display all notification labels', async ({ page }) => {
    await page.goto('/NotificationSettings', { waitUntil: 'domcontentloaded' });
    await waitForPageLoad(page);

    if (!(await ensureAuthenticated(page))) return;

    const labels = ['New Matches', 'New Messages', 'Chat Requests', 'Daily Missions', 'Email Notifications'];
    for (const label of labels) {
      await expect(
        page.locator(`text=${label}`).first(),
      ).toBeVisible({ timeout: 10000 });
    }
  });

  // ── Privacy Settings ────────────────────────────────────────────────

  test('should navigate to privacy settings from Settings page', async ({ page }) => {
    await page.goto('/Settings', { waitUntil: 'domcontentloaded' });
    await waitForPageLoad(page);

    if (!(await ensureAuthenticated(page))) return;

    await page.locator('text=Privacy & Security').first().click();
    await page.waitForURL(/PrivacySettings/, { timeout: 10000 });
    await waitForPageLoad(page);

    // Header
    await expect(
      page.locator('h1').filter({ hasText: 'Privacy & Security' }),
    ).toBeVisible({ timeout: 10000 });
  });

  test('should show privacy toggles and security options', async ({ page }) => {
    await page.goto('/PrivacySettings', { waitUntil: 'domcontentloaded' });
    await waitForPageLoad(page);

    if (!(await ensureAuthenticated(page))) return;

    // 4 privacy toggles: showOnline, showDistance, showAge, privateProfile
    const privacyLabels = ['Show Online Status', 'Show Distance', 'Show Age', 'Private Profile'];
    for (const label of privacyLabels) {
      await expect(
        page.locator(`text=${label}`).first(),
      ).toBeVisible({ timeout: 10000 });
    }

    // Privacy toggles are switches
    const switches = page.locator('[role="switch"]');
    await expect(switches.first()).toBeVisible({ timeout: 10000 });
    // At least 4 privacy + 1 GDPR (doNotSell) = 5
    const count = await switches.count();
    expect(count).toBeGreaterThanOrEqual(4);

    // Security navigation buttons: Blocked Users, Safety Center
    await expect(
      page.locator('text=Blocked Users').first(),
    ).toBeVisible({ timeout: 5000 });
    await expect(
      page.locator('text=Safety Center').first(),
    ).toBeVisible({ timeout: 5000 });

    // GDPR section heading: "Data Rights (GDPR/CCPA)"
    await expect(
      page.locator('text=/Data Rights/i').first(),
    ).toBeVisible({ timeout: 5000 });
    await expect(
      page.locator('text=Delete My Account').first(),
    ).toBeVisible({ timeout: 5000 });
  });

  // ── Filter Settings ─────────────────────────────────────────────────

  test('should load filter settings with sliders and buttons', async ({ page }) => {
    await page.goto('/FilterSettings', { waitUntil: 'domcontentloaded' });
    await waitForPageLoad(page);

    if (!(await ensureAuthenticated(page))) return;

    // Header
    await expect(
      page.locator('h1').filter({ hasText: 'Discover Filters' }),
    ).toBeVisible({ timeout: 10000 });

    // Age Range slider label (rendered via CardTitle)
    await expect(
      page.locator('text=Age Range').first(),
    ).toBeVisible({ timeout: 10000 });

    // Distance slider label: "Maximum Distance (km)"
    await expect(
      page.locator('text=/Maximum Distance/i').first(),
    ).toBeVisible({ timeout: 5000 });

    // Radix sliders ([role="slider"])
    const sliders = page.locator('[role="slider"]');
    await expect(sliders.first()).toBeVisible({ timeout: 10000 });
    const sliderCount = await sliders.count();
    // Age range has 2 thumbs + distance has 1 thumb = at least 2
    expect(sliderCount).toBeGreaterThanOrEqual(2);

    // Gender buttons: All, Men, Women
    await expect(page.locator('text=Preferred Gender').first()).toBeVisible({ timeout: 5000 });
    for (const label of ['All', 'Men', 'Women']) {
      await expect(
        page.locator(`button:has-text("${label}")`).first(),
      ).toBeVisible({ timeout: 5000 });
    }

    // Religious preference buttons
    await expect(page.locator('text=Religious Preference').first()).toBeVisible({ timeout: 5000 });

    // Save button
    await expect(
      page.getByRole('button', { name: /save preferences/i }),
    ).toBeVisible({ timeout: 5000 });
  });

  // ── Blocked Users ───────────────────────────────────────────────────

  test('should load blocked users page with empty state or list', async ({ page }) => {
    await page.goto('/BlockedUsers', { waitUntil: 'domcontentloaded' });
    await waitForPageLoad(page);

    if (!(await ensureAuthenticated(page))) return;

    // Header
    await expect(
      page.locator('h1').filter({ hasText: 'Blocked Users' }),
    ).toBeVisible({ timeout: 15000 });

    // Either shows empty state "No Blocked Users" or the "About Blocking" info section
    // Both are always present in the page; empty state means no blocked user cards
    const emptyState = page.locator('text=No Blocked Users');
    const aboutBlocking = page.locator('text=About Blocking');

    const hasEmpty = await emptyState.isVisible({ timeout: 5000 }).catch(() => false);
    const hasAbout = await aboutBlocking.isVisible({ timeout: 3000 }).catch(() => false);
    expect(hasEmpty || hasAbout).toBe(true);
  });

  // ── Following List ──────────────────────────────────────────────────

  test('should load following list with tabs', async ({ page }) => {
    await page.goto('/FollowingList', { waitUntil: 'domcontentloaded' });
    await waitForPageLoad(page);

    if (!(await ensureAuthenticated(page))) return;

    // Header: "Connections" or "User Connections"
    await expect(
      page.locator('h1').filter({ hasText: /Connections/i }),
    ).toBeVisible({ timeout: 15000 });

    // Tab buttons: "Following (count)" and "Followers (count)"
    await expect(
      page.getByRole('button', { name: /following/i }).first(),
    ).toBeVisible({ timeout: 10000 });
    await expect(
      page.getByRole('button', { name: /followers/i }).first(),
    ).toBeVisible({ timeout: 10000 });
  });

  // ── Help & Support ──────────────────────────────────────────────────

  test('should navigate to Help & Support from Settings page', async ({ page }) => {
    await page.goto('/Settings', { waitUntil: 'domcontentloaded' });
    await waitForPageLoad(page);

    if (!(await ensureAuthenticated(page))) return;

    await page.locator('text=Help & Support').first().click();
    await page.waitForURL(/HelpSupport/, { timeout: 10000 });
    await waitForPageLoad(page);

    // Header
    await expect(
      page.locator('h1').filter({ hasText: 'Help & Support' }),
    ).toBeVisible({ timeout: 10000 });

    // Support options: FAQ, Live Chat, Email Support
    await expect(page.locator('text=FAQ').first()).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=Live Chat').first()).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=Email Support').first()).toBeVisible({ timeout: 5000 });

    // About section uses special character: "About Bellor" with ø
    await expect(
      page.locator('text=/About Bell/i').first(),
    ).toBeVisible({ timeout: 5000 });
  });

  // ── Theme Settings (Admin-Only) ─────────────────────────────────────

  test('should show admin-only message on ThemeSettings for non-admin user', async ({ page }) => {
    await page.goto('/ThemeSettings', { waitUntil: 'domcontentloaded' });
    await waitForPageLoad(page);

    if (!(await ensureAuthenticated(page))) return;

    // Non-admin user should see the "Admin Only" heading (h2)
    await expect(
      page.locator('text=Admin Only').first(),
    ).toBeVisible({ timeout: 15000 });

    // Message: "Only administrators can change the app theme."
    await expect(
      page.locator('text=/administrators/i').first(),
    ).toBeVisible({ timeout: 5000 });

    // Should have a "Back to Settings" button
    await expect(
      page.getByRole('button', { name: /back to settings/i }),
    ).toBeVisible({ timeout: 5000 });
  });

  // ── Navigation: Back buttons ────────────────────────────────────────

  test('should have back navigation on sub-pages', async ({ page }) => {
    const subPages = [
      { url: '/NotificationSettings', header: 'Notification Settings' },
      { url: '/PrivacySettings', header: 'Privacy & Security' },
      { url: '/FilterSettings', header: 'Discover Filters' },
      { url: '/BlockedUsers', header: 'Blocked Users' },
      { url: '/HelpSupport', header: 'Help & Support' },
    ];

    for (const subPage of subPages) {
      await page.goto(subPage.url, { waitUntil: 'domcontentloaded' });
      await waitForPageLoad(page);

      if (!(await ensureAuthenticated(page))) return;

      // Verify the page loaded by checking the header
      await expect(
        page.locator('h1').filter({ hasText: subPage.header }),
      ).toBeVisible({ timeout: 10000 });

      // Check for a back button (BackButton component renders a button with an arrow SVG icon)
      const backBtn = page.locator(
        'button:has(svg), [role="button"]:has(svg)',
      ).first();

      const hasBackBtn = await backBtn.isVisible({ timeout: 3000 }).catch(() => false);
      expect(hasBackBtn).toBe(true);
    }
  });
});
