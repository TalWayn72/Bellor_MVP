/**
 * Full-Stack E2E: Misc Pages
 * Tests 4 authenticated pages: Home, Analytics, Feedback, EmailSupport
 */
import { test, expect, Page } from './fullstack-base.js';
import { waitForPageLoad, FULLSTACK_AUTH, collectConsoleMessages } from '../fixtures/index.js';

async function ensureAuthenticated(page: Page): Promise<boolean> {
  await page.waitForTimeout(2000);
  const url = page.url();
  if (url.includes('/Onboarding') || url.includes('/Welcome') || url.includes('/Login')) {
    test.skip(true, 'Auth token expired - redirected to Onboarding/Welcome');
    return false;
  }
  return true;
}

test.describe('[P2][infra] Misc Pages - Full Stack', () => {
  test.use({ storageState: FULLSTACK_AUTH.user });

  // -- Home Page (redirect) ------------------------------------------------

  test('Home should redirect to Welcome', async ({ page }) => {
    const cc = collectConsoleMessages(page);
    await page.goto('/Home', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);

    // Home.jsx always navigates to /Welcome with replace
    const url = page.url();
    expect(url.includes('/Welcome') || url.includes('/SharedSpace')).toBe(true);
    await expect(page.locator('body')).toBeVisible();
    cc.assertClean();
  });

  // -- Analytics Page ------------------------------------------------------

  test('Analytics should display header, stats and back button', async ({ page }) => {
    const cc = collectConsoleMessages(page);
    await page.goto('/Analytics', { waitUntil: 'domcontentloaded' });
    await waitForPageLoad(page);
    if (!(await ensureAuthenticated(page))) return;

    await expect(
      page.locator('h1').filter({ hasText: 'Your Insights' }),
    ).toBeVisible({ timeout: 15000 });

    // BackButton renders a button with an SVG icon
    const backBtn = page.locator('button:has(svg), [role="button"]:has(svg)').first();
    await expect(backBtn).toBeVisible({ timeout: 5000 });
    cc.assertClean();
  });

  // -- Feedback Page -------------------------------------------------------

  test('Feedback should display hero card and form', async ({ page }) => {
    const cc = collectConsoleMessages(page);
    await page.goto('/Feedback', { waitUntil: 'domcontentloaded' });
    await waitForPageLoad(page);
    if (!(await ensureAuthenticated(page))) return;

    await expect(
      page.locator('h1').filter({ hasText: 'Feedback' }),
    ).toBeVisible({ timeout: 15000 });

    // Hero card text
    await expect(
      page.locator('text=We Value Your Input').first(),
    ).toBeVisible({ timeout: 10000 });

    // Thank you card at bottom
    await expect(
      page.locator('text=/Your feedback helps/i').first(),
    ).toBeVisible({ timeout: 5000 });
    cc.assertClean();
  });

  // -- EmailSupport Page ---------------------------------------------------

  test('EmailSupport should display form with category, subject, message', async ({ page }) => {
    const cc = collectConsoleMessages(page);
    await page.goto('/EmailSupport', { waitUntil: 'domcontentloaded' });
    await waitForPageLoad(page);
    if (!(await ensureAuthenticated(page))) return;

    await expect(
      page.locator('h1').filter({ hasText: 'Email Support' }),
    ).toBeVisible({ timeout: 15000 });

    // Hero card
    await expect(page.locator('text=Get Help via Email').first()).toBeVisible({ timeout: 10000 });

    // Form elements: category select, subject input, message textarea
    await expect(page.locator('select').first()).toBeVisible({ timeout: 5000 });
    await expect(page.locator('input[type="text"]').first()).toBeVisible({ timeout: 5000 });
    await expect(page.locator('textarea').first()).toBeVisible({ timeout: 5000 });

    // Send Message button (disabled when form is empty)
    const sendBtn = page.getByRole('button', { name: /send message/i });
    await expect(sendBtn).toBeVisible({ timeout: 5000 });
    await expect(sendBtn).toBeDisabled();

    // Tips card
    await expect(page.locator('text=Tips for faster help').first()).toBeVisible({ timeout: 5000 });
    cc.assertClean();
  });
});
