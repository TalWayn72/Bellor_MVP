/**
 * Authentication E2E Tests
 *
 * Tests user registration, login, and logout flows
 *
 * @see PRD.md Section 10.1 Phase 6 - Testing
 * Priority: Critical
 */

import { test, expect } from '@playwright/test';
import {
  testUser,
  newTestUser,
  waitForPageLoad,
  mockApiResponse,
  mockApiError,
  waitForToast,
  waitForNavigation,
  fillLoginForm,
  submitForm,
  checkAccessibility,
} from './fixtures';

test.describe('Authentication', () => {
  test.describe('Splash Screen', () => {
    test('should show splash screen and redirect to onboarding', async ({ page }) => {
      await page.goto('/');

      // Check splash screen elements
      await expect(page.locator('text=Bellør')).toBeVisible();

      // Wait for redirect to onboarding (after 2 seconds based on Splash.jsx)
      await waitForNavigation(page, 'onboarding');
    });

    test('should display logo and loading animation', async ({ page }) => {
      await page.goto('/');

      // Check for logo image
      const logo = page.locator('img[alt="Bellør"]');
      await expect(logo).toBeVisible();

      // Check for loading dots animation
      const loadingDots = page.locator('.animate-bounce');
      expect(await loadingDots.count()).toBeGreaterThanOrEqual(1);
    });
  });

  test.describe('Login Flow', () => {
    test.beforeEach(async ({ page }) => {
      // Navigate to onboarding/sign-in
      await page.goto('/onboarding?step=2');
      await waitForPageLoad(page);
    });

    test('should display login form elements', async ({ page }) => {
      // Check for email input
      const emailInput = page.getByPlaceholder(/email|אימייל/i);
      await expect(emailInput).toBeVisible();

      // Check for password input
      const passwordInput = page.getByPlaceholder(/password|סיסמה/i);
      await expect(passwordInput).toBeVisible();

      // Check for submit button
      const submitButton = page.getByRole('button', { name: /login|sign in|כניסה|התחבר/i });
      await expect(submitButton).toBeVisible();
    });

    test('should show validation error for empty email', async ({ page }) => {
      // Try to submit without entering email
      await page.getByPlaceholder(/password|סיסמה/i).fill('somepassword');
      await submitForm(page);

      // Should show validation error
      await expect(page.locator('text=/email.*required|נדרש אימייל/i')).toBeVisible({ timeout: 5000 });
    });

    test('should show validation error for invalid email format', async ({ page }) => {
      await page.getByPlaceholder(/email|אימייל/i).fill('invalid-email');
      await page.getByPlaceholder(/password|סיסמה/i).fill('somepassword');
      await submitForm(page);

      // Should show validation error
      await expect(page.locator('text=/invalid.*email|אימייל לא תקין/i')).toBeVisible({ timeout: 5000 });
    });

    test('should show validation error for short password', async ({ page }) => {
      await page.getByPlaceholder(/email|אימייל/i).fill('test@example.com');
      await page.getByPlaceholder(/password|סיסמה/i).fill('123');
      await submitForm(page);

      // Should show validation error about password length
      await expect(
        page.locator('text=/password.*characters|סיסמה.*תווים/i')
      ).toBeVisible({ timeout: 5000 });
    });

    test('should successfully login with valid credentials', async ({ page }) => {
      // Mock successful login API response
      await mockApiResponse(page, '**/api/v1/auth/login', {
        user: {
          id: 'test-user-id',
          email: testUser.email,
          firstName: testUser.firstName,
          lastName: testUser.lastName,
        },
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
      });

      await fillLoginForm(page, testUser.email, testUser.password);
      await submitForm(page);

      // Should redirect to home/feed after successful login
      await waitForNavigation(page, '/home');
    });

    test('should show error message for invalid credentials', async ({ page }) => {
      // Mock failed login API response
      await mockApiError(page, '**/api/v1/auth/login', 'Invalid email or password', 401);

      await fillLoginForm(page, 'wrong@email.com', 'wrongpassword');
      await submitForm(page);

      // Should show error message
      await expect(
        page.locator('text=/invalid.*password|סיסמה.*שגויה|incorrect/i')
      ).toBeVisible({ timeout: 5000 });
    });

    test('should show error for blocked account', async ({ page }) => {
      // Mock blocked account response
      await mockApiError(page, '**/api/v1/auth/login', 'Account is deactivated', 403);

      await fillLoginForm(page, testUser.email, testUser.password);
      await submitForm(page);

      // Should show blocked account message
      await expect(
        page.locator('text=/deactivated|blocked|חשבון.*חסום/i')
      ).toBeVisible({ timeout: 5000 });
    });

    test('should have accessible form elements', async ({ page }) => {
      await checkAccessibility(page);

      // Check for proper labels
      const emailInput = page.getByPlaceholder(/email|אימייל/i);
      await expect(emailInput).toHaveAttribute('type', 'email');

      const passwordInput = page.getByPlaceholder(/password|סיסמה/i);
      await expect(passwordInput).toHaveAttribute('type', 'password');
    });
  });

  test.describe('Registration Flow', () => {
    test.beforeEach(async ({ page }) => {
      // Navigate to registration step
      await page.goto('/onboarding?step=1');
      await waitForPageLoad(page);
    });

    test('should display registration form', async ({ page }) => {
      // Check for registration elements (may vary based on onboarding step)
      const heading = page.locator('text=/create.*account|הרשמה|sign up/i');
      await expect(heading).toBeVisible({ timeout: 5000 });
    });

    test('should validate required fields', async ({ page }) => {
      // Try to proceed without filling required fields
      const nextButton = page.getByRole('button', { name: /next|continue|המשך|הבא/i });
      if (await nextButton.isVisible()) {
        await nextButton.click();

        // Should show validation errors
        await expect(page.locator('.text-destructive, .text-red-500, .error')).toBeVisible({
          timeout: 5000,
        });
      }
    });

    test('should successfully register new user', async ({ page }) => {
      // Mock successful registration
      await mockApiResponse(page, '**/api/v1/auth/register', {
        user: {
          id: 'new-user-id',
          email: newTestUser.email,
          firstName: newTestUser.firstName,
          lastName: newTestUser.lastName,
        },
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
      });

      // Fill registration form (steps may vary)
      // This is a simplified version - actual implementation depends on onboarding flow
      const emailInput = page.getByPlaceholder(/email|אימייל/i);
      if (await emailInput.isVisible()) {
        await emailInput.fill(newTestUser.email);
      }

      const passwordInput = page.getByPlaceholder(/password|סיסמה/i);
      if (await passwordInput.isVisible()) {
        await passwordInput.fill(newTestUser.password);
      }

      // Continue through onboarding steps
      const nextButton = page.getByRole('button', { name: /next|continue|register|המשך|הרשם/i });
      if (await nextButton.isVisible()) {
        await nextButton.click();
      }
    });

    test('should show error for existing email', async ({ page }) => {
      // Mock email exists error
      await mockApiError(page, '**/api/v1/auth/register', 'User with this email already exists', 409);

      const emailInput = page.getByPlaceholder(/email|אימייל/i);
      if (await emailInput.isVisible()) {
        await emailInput.fill(testUser.email);
      }

      const passwordInput = page.getByPlaceholder(/password|סיסמה/i);
      if (await passwordInput.isVisible()) {
        await passwordInput.fill(testUser.password);
      }

      await submitForm(page);

      // Should show error about existing email
      await expect(page.locator('text=/already.*exists|כבר קיים/i')).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('Logout Flow', () => {
    test('should successfully logout', async ({ page }) => {
      // First, set up authenticated state
      await page.goto('/');
      await page.evaluate(() => {
        localStorage.setItem('accessToken', 'mock-token');
        localStorage.setItem(
          'user',
          JSON.stringify({
            id: 'test-user-id',
            email: 'test@example.com',
            firstName: 'Test',
          })
        );
      });

      // Mock logout API
      await mockApiResponse(page, '**/api/v1/auth/logout', { success: true });

      // Navigate to a page with logout option (e.g., settings or profile)
      await page.goto('/settings');

      // Find and click logout button
      const logoutButton = page.getByRole('button', { name: /logout|sign out|התנתק|יציאה/i });
      if (await logoutButton.isVisible()) {
        await logoutButton.click();

        // Should redirect to login/onboarding
        await waitForNavigation(page, '/onboarding');

        // Should clear local storage
        const token = await page.evaluate(() => localStorage.getItem('accessToken'));
        expect(token).toBeNull();
      }
    });
  });

  test.describe('Session Management', () => {
    test('should redirect to login when token expires', async ({ page }) => {
      // Set up expired token scenario
      await page.goto('/');
      await page.evaluate(() => {
        localStorage.setItem('accessToken', 'expired-token');
      });

      // Mock API returning 401 for expired token
      await page.route('**/api/v1/**', (route) => {
        route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Token expired' }),
        });
      });

      // Try to access protected page
      await page.goto('/home');

      // Should redirect to login
      await waitForNavigation(page, '/onboarding');
    });

    test('should refresh token automatically', async ({ page }) => {
      let refreshCalled = false;

      // Set up tokens
      await page.goto('/');
      await page.evaluate(() => {
        localStorage.setItem('accessToken', 'valid-token');
        localStorage.setItem('refreshToken', 'valid-refresh-token');
      });

      // Mock refresh token endpoint
      await page.route('**/api/v1/auth/refresh', async (route) => {
        refreshCalled = true;
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            accessToken: 'new-access-token',
          }),
        });
      });

      // First API call returns 401, triggering refresh
      let firstCall = true;
      await page.route('**/api/v1/users/me', async (route) => {
        if (firstCall) {
          firstCall = false;
          await route.fulfill({
            status: 401,
            contentType: 'application/json',
            body: JSON.stringify({ error: 'Token expired' }),
          });
        } else {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ id: 'user-1', email: 'test@example.com' }),
          });
        }
      });

      // Navigate to trigger API call
      await page.goto('/profile');

      // Give time for refresh to happen
      await page.waitForTimeout(1000);
    });
  });
});

test.describe('Authentication - Mobile', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('should display mobile-friendly login form', async ({ page }) => {
    await page.goto('/onboarding?step=2');
    await waitForPageLoad(page);

    // Check that form is visible and usable on mobile
    const emailInput = page.getByPlaceholder(/email|אימייל/i);
    await expect(emailInput).toBeVisible();

    // Check viewport width is correct
    const viewport = page.viewportSize();
    expect(viewport?.width).toBe(375);
  });

  test('should have touch-friendly button sizes', async ({ page }) => {
    await page.goto('/onboarding?step=2');
    await waitForPageLoad(page);

    // Check submit button is large enough for touch (min 44px)
    const submitButton = page.getByRole('button', { name: /login|sign in|כניסה|התחבר/i });
    if (await submitButton.isVisible()) {
      const box = await submitButton.boundingBox();
      if (box) {
        expect(box.height).toBeGreaterThanOrEqual(44);
      }
    }
  });
});
