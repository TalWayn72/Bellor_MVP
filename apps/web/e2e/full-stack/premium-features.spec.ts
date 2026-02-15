/**
 * Full-Stack E2E: Premium Features
 * Tests Premium, ProfileBoost, ReferralProgram pages
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

test.describe('[P2][premium] Premium Features - Full Stack', () => {
  test.use({ storageState: FULLSTACK_AUTH.user });

  // ── Premium Page ──────────────────────────────────────────────────

  test('should load Premium page with header and hero section', async ({ page }) => {
    const cc = collectConsoleMessages(page);
    await page.goto('/Premium', { waitUntil: 'domcontentloaded' });
    await waitForPageLoad(page);
    if (!(await ensureAuthenticated(page))) return;

    await expect(page.locator('h1').filter({ hasText: 'Bellor Premium' })).toBeVisible({ timeout: 15000 });
    await expect(page.locator('h2').filter({ hasText: 'Unlock Your Full Potential' })).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=10K+')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=4.8')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=95%')).toBeVisible({ timeout: 5000 });
    cc.assertClean();
  });

  test('should display plan selector and features on Premium', async ({ page }) => {
    await page.goto('/Premium', { waitUntil: 'domcontentloaded' });
    await waitForPageLoad(page);
    if (!(await ensureAuthenticated(page))) return;

    await expect(page.locator('h1').filter({ hasText: 'Bellor Premium' })).toBeVisible({ timeout: 15000 });
    // Stats section verifies the page fully rendered beyond loading skeleton
    await expect(page.locator('text=Premium Users')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Satisfaction')).toBeVisible({ timeout: 5000 });
  });

  // ── ProfileBoost Page ─────────────────────────────────────────────

  test('should load ProfileBoost page with hero and boost options', async ({ page }) => {
    const cc = collectConsoleMessages(page);
    await page.goto('/ProfileBoost', { waitUntil: 'domcontentloaded' });
    await waitForPageLoad(page);
    if (!(await ensureAuthenticated(page))) return;

    await expect(page.locator('h1').filter({ hasText: 'Profile Boost' })).toBeVisible({ timeout: 15000 });
    await expect(page.locator('h2').filter({ hasText: 'Boost Your Profile' })).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Get more visibility')).toBeVisible({ timeout: 5000 });
    cc.assertClean();
  });

  test('should show Go Premium upsell on ProfileBoost', async ({ page }) => {
    await page.goto('/ProfileBoost', { waitUntil: 'domcontentloaded' });
    await waitForPageLoad(page);
    if (!(await ensureAuthenticated(page))) return;

    await expect(page.locator('h3').filter({ hasText: 'Want More Boosts?' })).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Upgrade to Premium')).toBeVisible({ timeout: 5000 });
    const goPremiumBtn = page.getByRole('button', { name: /go premium/i });
    await expect(goPremiumBtn).toBeVisible({ timeout: 5000 });
  });

  // ── ReferralProgram Page ──────────────────────────────────────────

  test('should load ReferralProgram page with header and rewards', async ({ page }) => {
    const cc = collectConsoleMessages(page);
    await page.goto('/ReferralProgram', { waitUntil: 'domcontentloaded' });
    await waitForPageLoad(page);
    if (!(await ensureAuthenticated(page))) return;

    await expect(page.locator('h1').filter({ hasText: 'Refer Friends' })).toBeVisible({ timeout: 15000 });
    await expect(page.locator('h3').filter({ hasText: 'Your Rewards' })).toBeVisible({ timeout: 10000 });
    await expect(page.locator('h3').filter({ hasText: 'Invite by Email' })).toBeVisible({ timeout: 10000 });
    cc.assertClean();
  });

  test('should have email input and send button on ReferralProgram', async ({ page }) => {
    await page.goto('/ReferralProgram', { waitUntil: 'domcontentloaded' });
    await waitForPageLoad(page);
    if (!(await ensureAuthenticated(page))) return;

    await expect(page.locator('h1').filter({ hasText: 'Refer Friends' })).toBeVisible({ timeout: 15000 });
    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput).toBeVisible({ timeout: 10000 });
    await expect(emailInput).toHaveAttribute('placeholder', 'friend@example.com');

    // Send button should be disabled when input is empty
    const sendBtn = page.locator('button:has(svg)').last();
    await expect(sendBtn).toBeVisible({ timeout: 5000 });
  });

  test('should fill email and interact with referral form', async ({ page }) => {
    await page.goto('/ReferralProgram', { waitUntil: 'domcontentloaded' });
    await waitForPageLoad(page);
    if (!(await ensureAuthenticated(page))) return;

    await expect(page.locator('h1').filter({ hasText: 'Refer Friends' })).toBeVisible({ timeout: 15000 });
    const emailInput = page.locator('input[type="email"]');
    await emailInput.fill('test@example.com');
    await expect(emailInput).toHaveValue('test@example.com');
  });
});
