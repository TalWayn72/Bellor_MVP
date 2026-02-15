/**
 * Full-Stack E2E: Safety & Legal Pages
 * Tests SafetyCenter, FAQ, TermsOfService, PrivacyPolicy, UserVerification
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

test.describe('[P2][infra] Safety & Legal - Full Stack', () => {
  // ── Authenticated Pages ─────────────────────────────────────────

  test.describe('Authenticated Pages', () => {
    test.use({ storageState: FULLSTACK_AUTH.user });

    test('should load SafetyCenter with hero and quick actions', async ({ page }) => {
      const cc = collectConsoleMessages(page);
      await page.goto('/SafetyCenter', { waitUntil: 'domcontentloaded' });
      await waitForPageLoad(page);
      if (!(await ensureAuthenticated(page))) return;

      await expect(page.locator('h1').filter({ hasText: 'Safety Center' })).toBeVisible({ timeout: 15000 });
      await expect(page.locator('h2').filter({ hasText: 'Your Safety Matters' })).toBeVisible({ timeout: 10000 });
      await expect(page.locator('text=Quick Actions')).toBeVisible({ timeout: 5000 });
      await expect(page.locator('text=Report an Issue')).toBeVisible({ timeout: 5000 });
      await expect(page.locator('text=Blocked Users')).toBeVisible({ timeout: 5000 });
      cc.assertClean();
    });

    test('should show safety tips and emergency contact', async ({ page }) => {
      await page.goto('/SafetyCenter', { waitUntil: 'domcontentloaded' });
      await waitForPageLoad(page);
      if (!(await ensureAuthenticated(page))) return;

      await expect(page.locator('text=Safety Tips')).toBeVisible({ timeout: 10000 });
      await expect(page.locator('text=Trust Your Instincts')).toBeVisible({ timeout: 5000 });
      await expect(page.locator('text=Protect Personal Info')).toBeVisible({ timeout: 5000 });
      await expect(page.locator('text=Need Immediate Help?')).toBeVisible({ timeout: 5000 });
      await expect(page.locator('text=Emergency: 911')).toBeVisible({ timeout: 5000 });
    });

    test('should load FAQ with search and categories', async ({ page }) => {
      const cc = collectConsoleMessages(page);
      await page.goto('/FAQ', { waitUntil: 'domcontentloaded' });
      await waitForPageLoad(page);
      if (!(await ensureAuthenticated(page))) return;

      await expect(page.locator('h1').filter({ hasText: 'FAQ' })).toBeVisible({ timeout: 15000 });
      const searchInput = page.locator('input[placeholder="Search questions..."]');
      await expect(searchInput).toBeVisible({ timeout: 10000 });

      // FAQ categories rendered as section headers
      await expect(page.locator('h2').filter({ hasText: 'Getting Started' })).toBeVisible({ timeout: 5000 });
      await expect(page.locator('text=Still need help?')).toBeVisible({ timeout: 5000 });
      cc.assertClean();
    });

    test('should expand FAQ item on click', async ({ page }) => {
      await page.goto('/FAQ', { waitUntil: 'domcontentloaded' });
      await waitForPageLoad(page);
      if (!(await ensureAuthenticated(page))) return;

      await expect(page.locator('h1').filter({ hasText: 'FAQ' })).toBeVisible({ timeout: 15000 });
      const firstQuestion = page.locator('text=How do I create my profile?');
      await expect(firstQuestion).toBeVisible({ timeout: 10000 });
      await firstQuestion.click();

      // Answer should now be visible
      await expect(page.locator('text=complete the onboarding process')).toBeVisible({ timeout: 5000 });
    });

    test('should filter FAQ by search query', async ({ page }) => {
      await page.goto('/FAQ', { waitUntil: 'domcontentloaded' });
      await waitForPageLoad(page);
      if (!(await ensureAuthenticated(page))) return;

      const searchInput = page.locator('input[placeholder="Search questions..."]');
      await expect(searchInput).toBeVisible({ timeout: 10000 });
      await searchInput.fill('Premium');

      // Should show Premium-related questions, hide others
      await expect(page.locator('text=What do I get with Premium?')).toBeVisible({ timeout: 5000 });
    });

    test('should load UserVerification with instructions and camera button', async ({ page }) => {
      const cc = collectConsoleMessages(page);
      await page.goto('/UserVerification', { waitUntil: 'domcontentloaded' });
      await waitForPageLoad(page);
      if (!(await ensureAuthenticated(page))) return;

      // If user is already verified, they get redirected to Profile
      const url = page.url();
      if (url.includes('/Profile')) {
        test.skip(true, 'User already verified - redirected to Profile');
        return;
      }

      await expect(page.locator('h1').filter({ hasText: 'Photo Verification' })).toBeVisible({ timeout: 15000 });
      await expect(page.locator('h2').filter({ hasText: 'Verify Your Identity' })).toBeVisible({ timeout: 10000 });
      await expect(page.getByRole('button', { name: /start camera/i })).toBeVisible({ timeout: 5000 });
      cc.assertClean();
    });
  });

  // ── Public Pages (no auth needed) ───────────────────────────────

  test.describe('Public Pages', () => {
    test('should load TermsOfService without authentication', async ({ page }) => {
      const cc = collectConsoleMessages(page);
      await page.goto('/TermsOfService', { waitUntil: 'domcontentloaded' });
      await waitForPageLoad(page);

      await expect(page.locator('h1').filter({ hasText: 'Terms of Service' })).toBeVisible({ timeout: 15000 });
      await expect(page.locator('text=Last updated: December 31, 2025')).toBeVisible({ timeout: 10000 });
      await expect(page.locator('h3').filter({ hasText: '1. Acceptance of Terms' })).toBeVisible({ timeout: 5000 });
      await expect(page.locator('h3').filter({ hasText: '13. Contact' })).toBeVisible({ timeout: 5000 });
      await expect(page.getByRole('button', { name: /contact legal team/i })).toBeVisible({ timeout: 5000 });
      cc.assertClean();
    });

    test('should load PrivacyPolicy without authentication', async ({ page }) => {
      const cc = collectConsoleMessages(page);
      await page.goto('/PrivacyPolicy', { waitUntil: 'domcontentloaded' });
      await waitForPageLoad(page);

      await expect(page.locator('h1').filter({ hasText: 'Privacy Policy' })).toBeVisible({ timeout: 15000 });
      await expect(page.locator('h2').filter({ hasText: 'Your Privacy Matters' })).toBeVisible({ timeout: 10000 });
      await expect(page.locator('text=Last updated: December 31, 2025')).toBeVisible({ timeout: 10000 });
      await expect(page.locator('h3').filter({ hasText: '1. Information We Collect' })).toBeVisible({ timeout: 5000 });
      await expect(page.locator('h3').filter({ hasText: '14. GDPR Rights' })).toBeVisible({ timeout: 5000 });
      await expect(page.getByRole('button', { name: /contact privacy team/i })).toBeVisible({ timeout: 5000 });
      cc.assertClean();
    });
  });
});
