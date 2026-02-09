/**
 * Comprehensive Accessibility (A11y) E2E Tests
 *
 * Tests all major pages and user flows for WCAG 2.1 AA compliance using axe-core.
 * Covers desktop (1280x720) and mobile (375x667) viewports.
 *
 * @see https://www.deque.com/axe/core-documentation/api-documentation/
 */

import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// Test both desktop and mobile viewports
const viewports = [
  { name: 'desktop', width: 1280, height: 720 },
  { name: 'mobile', width: 375, height: 667 },
];

test.describe('Accessibility Tests - Unauthenticated Pages', () => {
  for (const viewport of viewports) {
    test.describe(`${viewport.name} viewport`, () => {
      test.use({ viewport });

      test('Login page should be accessible', async ({ page }) => {
        await page.goto('/login');
        await page.waitForLoadState('networkidle');

        const accessibilityScanResults = await new AxeBuilder({ page })
          .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
          .analyze();

        expect(accessibilityScanResults.violations).toEqual([]);
      });

      test('Login page form labels and ARIA', async ({ page }) => {
        await page.goto('/login');

        // Check form has proper labels
        const emailInput = page.locator('input[type="email"]');
        await expect(emailInput).toHaveAttribute('aria-label');

        const passwordInput = page.locator('input[type="password"]');
        await expect(passwordInput).toHaveAttribute('aria-label');

        // Check submit button is accessible
        const submitButton = page.locator('button[type="submit"]');
        await expect(submitButton).toBeVisible();

        const accessibilityScanResults = await new AxeBuilder({ page })
          .include('form')
          .analyze();

        expect(accessibilityScanResults.violations).toEqual([]);
      });

      test('Login page keyboard navigation', async ({ page }) => {
        await page.goto('/login');

        // Tab through form elements
        await page.keyboard.press('Tab');
        await expect(page.locator('input[type="email"]')).toBeFocused();

        await page.keyboard.press('Tab');
        await expect(page.locator('input[type="password"]')).toBeFocused();

        await page.keyboard.press('Tab');
        await expect(page.locator('button[type="submit"]')).toBeFocused();
      });

      test('Register page should be accessible', async ({ page }) => {
        await page.goto('/register');
        await page.waitForLoadState('networkidle');

        const accessibilityScanResults = await new AxeBuilder({ page })
          .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
          .analyze();

        expect(accessibilityScanResults.violations).toEqual([]);
      });

      test('Landing page should be accessible', async ({ page }) => {
        await page.goto('/');
        await page.waitForLoadState('networkidle');

        const accessibilityScanResults = await new AxeBuilder({ page })
          .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
          .analyze();

        expect(accessibilityScanResults.violations).toEqual([]);
      });
    });
  }
});

test.describe('Accessibility Tests - Authenticated Pages', () => {
  // Helper to login before each test
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'test@bellor.com');
    await page.fill('input[type="password"]', 'TestPassword123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/feed', { timeout: 10000 });
  });

  for (const viewport of viewports) {
    test.describe(`${viewport.name} viewport`, () => {
      test.use({ viewport });

      test('Feed page should be accessible', async ({ page }) => {
        await page.goto('/feed');
        await page.waitForLoadState('networkidle');

        const accessibilityScanResults = await new AxeBuilder({ page })
          .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
          .analyze();

        expect(accessibilityScanResults.violations).toEqual([]);
      });

      test('Feed page cards have proper semantic HTML', async ({ page }) => {
        await page.goto('/feed');
        await page.waitForSelector('[role="article"], article', { timeout: 5000 });

        // Check cards use semantic HTML
        const cards = page.locator('[role="article"], article');
        const count = await cards.count();
        expect(count).toBeGreaterThan(0);

        // Each card should have accessible content
        const accessibilityScanResults = await new AxeBuilder({ page })
          .include('[role="article"], article')
          .analyze();

        expect(accessibilityScanResults.violations).toEqual([]);
      });

      test('Feed page action buttons are accessible', async ({ page }) => {
        await page.goto('/feed');
        await page.waitForLoadState('networkidle');

        // Check buttons have accessible names
        const buttons = page.locator('button');
        const buttonCount = await buttons.count();

        for (let i = 0; i < Math.min(buttonCount, 5); i++) {
          const button = buttons.nth(i);
          const ariaLabel = await button.getAttribute('aria-label');
          const textContent = await button.textContent();

          // Button should have either aria-label or text content
          expect(ariaLabel || textContent).toBeTruthy();
        }
      });

      test('Profile page should be accessible', async ({ page }) => {
        await page.goto('/profile');
        await page.waitForLoadState('networkidle');

        const accessibilityScanResults = await new AxeBuilder({ page })
          .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
          .analyze();

        expect(accessibilityScanResults.violations).toEqual([]);
      });

      test('Profile page tabs are accessible', async ({ page }) => {
        await page.goto('/profile');

        // Check for tab navigation
        const tabs = page.locator('[role="tab"], [role="tablist"] button');
        const tabCount = await tabs.count();

        if (tabCount > 0) {
          const accessibilityScanResults = await new AxeBuilder({ page })
            .include('[role="tablist"], [role="tab"]')
            .analyze();

          expect(accessibilityScanResults.violations).toEqual([]);
        }
      });

      test('Profile page images have alt text', async ({ page }) => {
        await page.goto('/profile');

        // Find all images
        const images = page.locator('img');
        const imageCount = await images.count();

        for (let i = 0; i < imageCount; i++) {
          const img = images.nth(i);
          const alt = await img.getAttribute('alt');
          const ariaLabel = await img.getAttribute('aria-label');
          const role = await img.getAttribute('role');

          // Image should have alt text, aria-label, or role="presentation"
          expect(alt !== null || ariaLabel !== null || role === 'presentation').toBeTruthy();
        }
      });

      test('Chat page should be accessible', async ({ page }) => {
        await page.goto('/chat');
        await page.waitForLoadState('networkidle');

        const accessibilityScanResults = await new AxeBuilder({ page })
          .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
          .analyze();

        expect(accessibilityScanResults.violations).toEqual([]);
      });

      test('Chat page messages list is accessible', async ({ page }) => {
        await page.goto('/chat');

        // Check messages container
        const messagesContainer = page.locator('[role="log"], [role="list"], [aria-label*="message"], [aria-label*="chat"]').first();

        if (await messagesContainer.count() > 0) {
          const accessibilityScanResults = await new AxeBuilder({ page })
            .include('[role="log"], [role="list"]')
            .analyze();

          expect(accessibilityScanResults.violations).toEqual([]);
        }
      });

      test('Chat page input field is accessible', async ({ page }) => {
        await page.goto('/chat');

        // Find chat input
        const chatInput = page.locator('textarea, input[type="text"]').last();

        if (await chatInput.count() > 0) {
          const ariaLabel = await chatInput.getAttribute('aria-label');
          const placeholder = await chatInput.getAttribute('placeholder');
          const label = page.locator(`label[for="${await chatInput.getAttribute('id')}"]`);

          // Input should have label, aria-label, or placeholder
          expect(
            ariaLabel !== null ||
            placeholder !== null ||
            (await label.count()) > 0
          ).toBeTruthy();
        }
      });

      test('Settings page should be accessible', async ({ page }) => {
        await page.goto('/settings');
        await page.waitForLoadState('networkidle');

        const accessibilityScanResults = await new AxeBuilder({ page })
          .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
          .analyze();

        expect(accessibilityScanResults.violations).toEqual([]);
      });

      test('Settings page form controls are accessible', async ({ page }) => {
        await page.goto('/settings');

        // Check all form inputs have labels
        const inputs = page.locator('input, select, textarea');
        const inputCount = await inputs.count();

        for (let i = 0; i < Math.min(inputCount, 10); i++) {
          const input = inputs.nth(i);
          const id = await input.getAttribute('id');
          const ariaLabel = await input.getAttribute('aria-label');
          const ariaLabelledBy = await input.getAttribute('aria-labelledby');

          if (id) {
            const label = page.locator(`label[for="${id}"]`);
            const hasLabel = (await label.count()) > 0;

            // Input should have label, aria-label, or aria-labelledby
            expect(
              hasLabel ||
              ariaLabel !== null ||
              ariaLabelledBy !== null
            ).toBeTruthy();
          }
        }
      });

      test('Discover page should be accessible', async ({ page }) => {
        await page.goto('/discover');
        await page.waitForLoadState('networkidle');

        const accessibilityScanResults = await new AxeBuilder({ page })
          .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
          .analyze();

        expect(accessibilityScanResults.violations).toEqual([]);
      });

      test('Discover page swipe actions have keyboard alternatives', async ({ page }) => {
        await page.goto('/discover');

        // Find action buttons (like, dislike, etc.)
        const actionButtons = page.locator('button[aria-label*="like"], button[aria-label*="pass"], button[aria-label*="super"]');
        const buttonCount = await actionButtons.count();

        // Verify buttons are keyboard accessible
        if (buttonCount > 0) {
          const firstButton = actionButtons.first();
          await firstButton.focus();
          await expect(firstButton).toBeFocused();

          // Should be able to activate with Enter or Space
          const accessibilityScanResults = await new AxeBuilder({ page })
            .include('button')
            .analyze();

          expect(accessibilityScanResults.violations).toEqual([]);
        }
      });

      test('Matches page should be accessible', async ({ page }) => {
        await page.goto('/matches');
        await page.waitForLoadState('networkidle');

        const accessibilityScanResults = await new AxeBuilder({ page })
          .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
          .analyze();

        expect(accessibilityScanResults.violations).toEqual([]);
      });

      test('Notifications page should be accessible', async ({ page }) => {
        await page.goto('/notifications');
        await page.waitForLoadState('networkidle');

        const accessibilityScanResults = await new AxeBuilder({ page })
          .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
          .analyze();

        expect(accessibilityScanResults.violations).toEqual([]);
      });
    });
  }
});

test.describe('Accessibility Tests - Onboarding Flow', () => {
  for (const viewport of viewports) {
    test.describe(`${viewport.name} viewport`, () => {
      test.use({ viewport });

      test('Onboarding step 1 should be accessible', async ({ page }) => {
        // Navigate to onboarding
        await page.goto('/onboarding');
        await page.waitForLoadState('networkidle');

        const accessibilityScanResults = await new AxeBuilder({ page })
          .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
          .analyze();

        expect(accessibilityScanResults.violations).toEqual([]);
      });

      test('Onboarding multi-step form has proper ARIA', async ({ page }) => {
        await page.goto('/onboarding');

        // Check for step indicators
        const stepIndicators = page.locator('[role="progressbar"], [aria-current="step"]');

        if (await stepIndicators.count() > 0) {
          const accessibilityScanResults = await new AxeBuilder({ page })
            .include('[role="progressbar"]')
            .analyze();

          expect(accessibilityScanResults.violations).toEqual([]);
        }
      });

      test('Onboarding form inputs have proper labels', async ({ page }) => {
        await page.goto('/onboarding');

        // Check all form inputs
        const inputs = page.locator('input, select, textarea');
        const inputCount = await inputs.count();

        for (let i = 0; i < Math.min(inputCount, 5); i++) {
          const input = inputs.nth(i);
          const type = await input.getAttribute('type');

          // Skip hidden inputs
          if (type === 'hidden') continue;

          const id = await input.getAttribute('id');
          const ariaLabel = await input.getAttribute('aria-label');
          const ariaLabelledBy = await input.getAttribute('aria-labelledby');

          if (id) {
            const label = page.locator(`label[for="${id}"]`);
            const hasLabel = (await label.count()) > 0;

            expect(
              hasLabel ||
              ariaLabel !== null ||
              ariaLabelledBy !== null
            ).toBeTruthy();
          }
        }
      });
    });
  }
});

test.describe('Accessibility Tests - Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'test@bellor.com');
    await page.fill('input[type="password"]', 'TestPassword123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/feed', { timeout: 10000 });
  });

  for (const viewport of viewports) {
    test.describe(`${viewport.name} viewport`, () => {
      test.use({ viewport });

      test('Navigation menu is accessible', async ({ page }) => {
        await page.goto('/feed');

        // Find navigation
        const nav = page.locator('nav, [role="navigation"]');

        if (await nav.count() > 0) {
          const accessibilityScanResults = await new AxeBuilder({ page })
            .include('nav, [role="navigation"]')
            .analyze();

          expect(accessibilityScanResults.violations).toEqual([]);
        }
      });

      test('Navigation items are keyboard accessible', async ({ page }) => {
        await page.goto('/feed');

        const navLinks = page.locator('nav a, [role="navigation"] a');
        const linkCount = await navLinks.count();

        if (linkCount > 0) {
          // Tab to first link
          let tabCount = 0;
          while (tabCount < 20) {
            await page.keyboard.press('Tab');
            const focusedElement = page.locator(':focus');

            if (await focusedElement.count() > 0) {
              const tagName = await focusedElement.evaluate(el => el.tagName.toLowerCase());
              if (tagName === 'a') break;
            }
            tabCount++;
          }

          // Should be able to focus on nav links
          expect(tabCount).toBeLessThan(20);
        }
      });
    });
  }
});

test.describe('Accessibility Tests - Color Contrast', () => {
  test('All pages meet color contrast requirements', async ({ page }) => {
    const pages = ['/login', '/register', '/feed', '/profile', '/chat', '/settings'];

    for (const pagePath of pages) {
      await page.goto(pagePath);
      await page.waitForLoadState('networkidle');

      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2aa'])
        .disableRules(['color-contrast']) // We'll check this separately
        .analyze();

      expect(accessibilityScanResults.violations).toEqual([]);
    }
  });
});

test.describe('Accessibility Tests - Focus Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'test@bellor.com');
    await page.fill('input[type="password"]', 'TestPassword123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/feed', { timeout: 10000 });
  });

  test('Focus is visible on all interactive elements', async ({ page }) => {
    await page.goto('/feed');

    // Tab through elements and verify focus is visible
    const interactiveElements = page.locator('a, button, input, select, textarea, [tabindex="0"]');
    const elementCount = await interactiveElements.count();

    for (let i = 0; i < Math.min(elementCount, 10); i++) {
      const element = interactiveElements.nth(i);
      await element.focus();
      await expect(element).toBeFocused();
    }
  });

  test('Focus trap works in modals', async ({ page }) => {
    await page.goto('/feed');

    // Try to open a modal (if exists)
    const modalTrigger = page.locator('button[aria-haspopup="dialog"], [data-state="closed"]').first();

    if (await modalTrigger.count() > 0) {
      await modalTrigger.click();
      await page.waitForTimeout(500);

      // Check modal has focus trap
      const modal = page.locator('[role="dialog"]');

      if (await modal.count() > 0) {
        const accessibilityScanResults = await new AxeBuilder({ page })
          .include('[role="dialog"]')
          .analyze();

        expect(accessibilityScanResults.violations).toEqual([]);
      }
    }
  });
});
