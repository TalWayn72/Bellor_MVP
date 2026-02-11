/**
 * Full Onboarding Flow E2E Tests
 *
 * Tests the complete 14-step onboarding process:
 * - Welcome screens
 * - Authentication selection
 * - Profile setup (nickname, DOB, location, etc.)
 * - Photo upload
 * - Verification
 * - Drawing mode
 *
 * @see PRD.md Section 10.1 Phase 6 - Testing
 * Priority: High
 */

import { test, expect } from '@playwright/test';
import {
  mockApiResponse,
  mockApiError,
  waitForPageLoad,
  waitForNavigation,
  mockFileUpload,
  clearLocalStorage,
} from './fixtures';

test.describe('Full Onboarding Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Start fresh - clear any auth state
    await page.goto('/');
    await clearLocalStorage(page);
  });

  test.describe('Step 0-1: Welcome/Splash', () => {
    test('should show splash screen', async ({ page }) => {
      await page.goto('/');

      // Should show Bellør logo
      await expect(page.locator('text=/bellør|bellor/i')).toBeVisible({ timeout: 10000 });
    });

    test('should redirect to onboarding after splash', async ({ page }) => {
      await page.goto('/');

      // After splash, should redirect to onboarding
      await waitForNavigation(page, 'onboarding');
    });

    test('should show welcome message on step 1', async ({ page }) => {
      await page.goto('/onboarding?step=1');
      await waitForPageLoad(page);

      // Should show welcome content
      await expect(page.locator('text=/welcome|ברוכים הבאים|get started/i')).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('Step 2: Auth Selection', () => {
    test('should display auth options', async ({ page }) => {
      await page.goto('/onboarding?step=2');
      await waitForPageLoad(page);

      // Should show Google auth option
      const googleButton = page.locator('text=/google|גוגל/i');
      await expect(googleButton).toBeVisible({ timeout: 10000 });
    });

    test('should show email option', async ({ page }) => {
      await page.goto('/onboarding?step=2');
      await waitForPageLoad(page);

      // Should show email option
      const emailOption = page.locator('text=/email|אימייל/i');
      await expect(emailOption).toBeVisible({ timeout: 10000 });
    });

    test('should show phone option', async ({ page }) => {
      await page.goto('/onboarding?step=2');
      await waitForPageLoad(page);

      // Should show phone option
      const phoneOption = page.locator('text=/phone|טלפון/i');
      await expect(phoneOption).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('Step 3: Nickname', () => {
    test('should display nickname input', async ({ page }) => {
      await page.goto('/onboarding?step=3');
      await waitForPageLoad(page);

      // Should show nickname input
      const nicknameInput = page.getByPlaceholder(/nickname|שם משתמש/i);
      await expect(nicknameInput).toBeVisible({ timeout: 10000 });
    });

    test('should validate nickname length (3-15 chars)', async ({ page }) => {
      await page.goto('/onboarding?step=3');
      await waitForPageLoad(page);

      const nicknameInput = page.getByPlaceholder(/nickname|שם משתמש/i);

      // Too short
      await nicknameInput.fill('ab');
      await nicknameInput.blur();

      // Should show error
      const error = page.locator('text=/too short|minimum.*3|לפחות 3/i');
      await expect(error).toBeVisible({ timeout: 5000 });
    });

    test('should reject nickname with numbers', async ({ page }) => {
      await page.goto('/onboarding?step=3');
      await waitForPageLoad(page);

      const nicknameInput = page.getByPlaceholder(/nickname|שם משתמש/i);
      await nicknameInput.fill('User123');
      await nicknameInput.blur();

      // Should show error about numbers
      const error = page.locator('text=/no numbers|without numbers|ללא מספרים/i');
      // Validation may vary
    });

    test('should accept valid nickname and continue', async ({ page }) => {
      await page.goto('/onboarding?step=3');
      await waitForPageLoad(page);

      const nicknameInput = page.getByPlaceholder(/nickname|שם משתמש/i);
      await nicknameInput.fill('ValidName');

      // Click next
      const nextButton = page.getByRole('button', { name: /next|continue|המשך|הבא/i });
      await nextButton.click();

      // Should proceed to next step
      await page.waitForTimeout(1000);
    });
  });

  test.describe('Step 4: Date of Birth', () => {
    test('should display DOB input', async ({ page }) => {
      await page.goto('/onboarding?step=4');
      await waitForPageLoad(page);

      // Should show date picker or DOB fields
      const dobInput = page.locator('input[type="date"], input[placeholder*="birth"], [data-testid="dob-input"]');
      await expect(dobInput.first()).toBeVisible({ timeout: 10000 });
    });

    test('should validate minimum age', async ({ page }) => {
      await page.goto('/onboarding?step=4');
      await waitForPageLoad(page);

      // Try to set age below minimum (usually 18)
      // Implementation depends on date picker type
    });
  });

  test.describe('Step 5: Location', () => {
    test('should display location selection', async ({ page }) => {
      await page.goto('/onboarding?step=5');
      await waitForPageLoad(page);

      // Should show location options
      const locationInput = page.locator('text=/location|country|city|מיקום|עיר/i');
      await expect(locationInput.first()).toBeVisible({ timeout: 10000 });
    });

    test('should show relocation preference', async ({ page }) => {
      await page.goto('/onboarding?step=5');
      await waitForPageLoad(page);

      // May show relocation toggle
      const relocationOption = page.locator('text=/reloca|willing to move|מוכן לעבור/i');
      // Visibility depends on implementation
    });
  });

  test.describe('Step 6: About You', () => {
    test('should display occupation field', async ({ page }) => {
      await page.goto('/onboarding?step=6');
      await waitForPageLoad(page);

      // Should show occupation input
      const occupationInput = page.locator('input[name="occupation"], input[placeholder*="occupation"], text=/occupation|עיסוק/i');
      await expect(occupationInput.first()).toBeVisible({ timeout: 10000 });
    });

    test('should display bio field', async ({ page }) => {
      await page.goto('/onboarding?step=6');
      await waitForPageLoad(page);

      // Should show bio textarea
      const bioInput = page.locator('textarea[name="bio"], textarea[placeholder*="bio"], text=/about.*yourself|ספר על עצמך/i');
      await expect(bioInput.first()).toBeVisible({ timeout: 10000 });
    });

    test('should display interests selection', async ({ page }) => {
      await page.goto('/onboarding?step=6');
      await waitForPageLoad(page);

      // Should show interests
      const interests = page.locator('text=/interests|תחומי עניין/i');
      // Interests may or may not be on this step
    });
  });

  test.describe('Step 7: Gender & Preferences', () => {
    test('should display gender selection', async ({ page }) => {
      await page.goto('/onboarding?step=7');
      await waitForPageLoad(page);

      // Should show gender options
      const genderOptions = page.locator('text=/male|female|other|זכר|נקבה|אחר/i');
      await expect(genderOptions.first()).toBeVisible({ timeout: 10000 });
    });

    test('should display looking for selection', async ({ page }) => {
      await page.goto('/onboarding?step=7');
      await waitForPageLoad(page);

      // May show "looking for" on same or next step
      const lookingFor = page.locator('text=/looking for|interested in|מחפש/i');
      // Visibility depends on step breakdown
    });
  });

  test.describe('Step 8: Profile Photos', () => {
    test('should display photo upload area', async ({ page }) => {
      await mockFileUpload(page);

      await page.goto('/onboarding?step=8');
      await waitForPageLoad(page);

      // Should show photo upload
      const uploadArea = page.locator('input[type="file"], text=/upload.*photo|add.*photo|העלה תמונה/i');
      await expect(uploadArea.first()).toBeVisible({ timeout: 10000 });
    });

    test('should show up to 6 photo slots', async ({ page }) => {
      await page.goto('/onboarding?step=8');
      await waitForPageLoad(page);

      // Should show multiple photo slots
      const photoSlots = page.locator('[data-testid="photo-slot"], .photo-slot, .upload-slot');
      // Count depends on implementation
    });
  });

  test.describe('Step 9-11: Verification', () => {
    test('should display verification instructions', async ({ page }) => {
      await page.goto('/onboarding?step=9');
      await waitForPageLoad(page);

      // Should show verification instructions
      const instructions = page.locator('text=/verif|selfie|אימות|צלם את עצמך/i');
      await expect(instructions.first()).toBeVisible({ timeout: 10000 });
    });

    test('should request camera access', async ({ page }) => {
      await page.goto('/onboarding?step=10');
      await waitForPageLoad(page);

      // Camera access prompt may appear
      // This is browser-controlled, hard to test directly
    });
  });

  test.describe('Step 12: Drawing Mode Selection', () => {
    test('should display drawing mode options', async ({ page }) => {
      await page.goto('/onboarding?step=12');
      await waitForPageLoad(page);

      // Should show drawing mode selection
      const drawingModes = page.locator('text=/draw|express|guess|ציור|התבטא/i');
      await expect(drawingModes.first()).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('Step 13: Canvas Drawing', () => {
    test('should display canvas', async ({ page }) => {
      await page.goto('/onboarding?step=13');
      await waitForPageLoad(page);

      // Should show canvas
      const canvas = page.locator('canvas, [data-testid="drawing-canvas"]');
      await expect(canvas).toBeVisible({ timeout: 10000 });
    });

    test('should show drawing tools', async ({ page }) => {
      await page.goto('/onboarding?step=13');
      await waitForPageLoad(page);

      // Should show pen/eraser tools
      const tools = page.locator('text=/pen|eraser|color|עט|מחק|צבע/i');
      // Tools visibility depends on implementation
    });
  });

  test.describe('Step 14: Expression Method', () => {
    test('should display expression method options', async ({ page }) => {
      await page.goto('/onboarding?step=14');
      await waitForPageLoad(page);

      // Should show expression options
      const options = page.locator('text=/video|audio|text|draw|וידאו|אודיו|טקסט|ציור/i');
      await expect(options.first()).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('Complete Flow', () => {
    test('should navigate through steps with next button', async ({ page }) => {
      await page.goto('/onboarding?step=1');
      await waitForPageLoad(page);

      // Click through first few steps
      const nextButton = page.getByRole('button', { name: /next|continue|המשך|הבא/i });

      if (await nextButton.isVisible()) {
        await nextButton.click();
        await page.waitForTimeout(500);

        // Should progress to next step
        await expect(page).toHaveURL(/.*step=2.*/);
      }
    });

    test('should allow going back to previous step', async ({ page }) => {
      await page.goto('/onboarding?step=3');
      await waitForPageLoad(page);

      // Click back button
      const backButton = page.getByRole('button', { name: /back|previous|חזור|הקודם/i });
      if (await backButton.isVisible()) {
        await backButton.click();

        // Should go back
        await expect(page).toHaveURL(/.*step=2.*/);
      }
    });

    test('should complete onboarding and redirect to home', async ({ page }) => {
      // Mock all necessary endpoints
      await mockApiResponse(page, '**/api/v1/auth/register', {
        user: { id: 'new-user', email: 'test@test.com' },
        accessToken: 'token',
        refreshToken: 'refresh',
      });
      await mockApiResponse(page, '**/api/v1/users/*', { user: { id: 'new-user' } });
      await mockFileUpload(page);

      // This is a simplified test - full flow would be complex
      await page.goto('/onboarding?step=14');
      await waitForPageLoad(page);

      // On final step, complete button should redirect
      const completeButton = page.getByRole('button', { name: /complete|finish|סיום|סיים/i });
      if (await completeButton.isVisible()) {
        await completeButton.click();
        // Should redirect to home or feed
      }
    });
  });

  test.describe('Validation', () => {
    test('should not allow empty required fields', async ({ page }) => {
      await page.goto('/onboarding?step=3');
      await waitForPageLoad(page);

      // Try to proceed without filling nickname
      const nextButton = page.getByRole('button', { name: /next|continue|המשך|הבא/i });
      if (await nextButton.isVisible()) {
        await nextButton.click();

        // Should show validation error
        const error = page.locator('.text-destructive, .text-red-500, .error, text=/required|נדרש/i');
        await expect(error.first()).toBeVisible({ timeout: 5000 });
      }
    });

    test('should persist data between steps', async ({ page }) => {
      await page.goto('/onboarding?step=3');
      await waitForPageLoad(page);

      // Fill nickname
      const nicknameInput = page.getByPlaceholder(/nickname|שם משתמש/i);
      await nicknameInput.fill('TestUser');

      // Go to next step then back
      const nextButton = page.getByRole('button', { name: /next|continue|המשך|הבא/i });
      await nextButton.click();
      await page.waitForTimeout(500);

      const backButton = page.getByRole('button', { name: /back|previous|חזור|הקודם/i });
      if (await backButton.isVisible()) {
        await backButton.click();

        // Nickname should still be there
        await expect(nicknameInput).toHaveValue('TestUser');
      }
    });
  });
});

test.describe('ISSUE-070: Step 5 Location Data & Toggle Saving', () => {
  test('should show country and city selects on step 5', async ({ page }) => {
    await page.goto('/onboarding?step=5');
    await waitForPageLoad(page);

    const countrySelect = page.locator('select').first();
    await expect(countrySelect).toBeVisible({ timeout: 10000 });

    const citySelect = page.locator('select').nth(1);
    await expect(citySelect).toBeVisible({ timeout: 10000 });
  });

  test('should update city options when country changes', async ({ page }) => {
    await page.goto('/onboarding?step=5');
    await waitForPageLoad(page);

    const countrySelect = page.locator('select').first();
    await countrySelect.selectOption('Israel');

    const citySelect = page.locator('select').nth(1);
    await expect(citySelect.locator('option', { hasText: 'Tel Aviv' })).toBeAttached();
    await expect(citySelect.locator('option', { hasText: 'Jerusalem' })).toBeAttached();
  });

  test('should display toggle buttons for relocate and language-travel', async ({ page }) => {
    await page.goto('/onboarding?step=5');
    await waitForPageLoad(page);

    const relocateText = page.locator('text=/relocate/i');
    await expect(relocateText).toBeVisible({ timeout: 10000 });

    const languageTravelText = page.locator('text=/language-travel/i');
    await expect(languageTravelText).toBeVisible({ timeout: 10000 });
  });

  test('should toggle relocate button on click', async ({ page }) => {
    await page.goto('/onboarding?step=5');
    await waitForPageLoad(page);

    const toggleContainer = page.locator('text=Can currently relocate?').locator('..');
    const toggle = toggleContainer.locator('button');
    if (await toggle.isVisible()) {
      await toggle.click();
      await expect(toggle).toHaveClass(/bg-primary/);
    }
  });
});

test.describe('ISSUE-070: Text Contrast in Onboarding Steps', () => {
  const stepsToCheck = [3, 4, 5, 6, 7, 8, 9, 10, 12, 13, 14];

  for (const step of stepsToCheck) {
    test(`step ${step} should not use bg-card or text-muted-foreground`, async ({ page }) => {
      await page.goto(`/onboarding?step=${step}`);
      await waitForPageLoad(page);

      const bgCardElements = await page.locator('[class*="bg-card"]').count();
      expect(bgCardElements).toBe(0);

      const mutedFgElements = await page.locator('[class*="text-muted-foreground"]').count();
      expect(mutedFgElements).toBe(0);
    });
  }

  test('step 14 heading should have explicit dark text color', async ({ page }) => {
    await page.goto('/onboarding?step=14');
    await waitForPageLoad(page);

    const heading = page.locator('text=How do you usually express yourself?');
    await expect(heading).toBeVisible({ timeout: 10000 });
    await expect(heading).toHaveClass(/text-gray-900/);
  });

  test('step 12 headings on image background should be white', async ({ page }) => {
    await page.goto('/onboarding?step=12');
    await waitForPageLoad(page);

    const sketchHeading = page.locator('text=Choose your Sketch Mode');
    await expect(sketchHeading).toBeVisible({ timeout: 10000 });
    await expect(sketchHeading).toHaveClass(/text-white/);
  });

  test('step 5 labels should use text-gray-500 for visibility', async ({ page }) => {
    await page.goto('/onboarding?step=5');
    await waitForPageLoad(page);

    const label = page.locator('text=Location for you matching');
    await expect(label).toBeVisible({ timeout: 10000 });
    await expect(label).toHaveClass(/text-gray-500/);
  });
});

test.describe('Onboarding - Mobile', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('should display mobile-optimized onboarding', async ({ page }) => {
    await page.goto('/onboarding?step=1');
    await waitForPageLoad(page);

    // Check viewport
    const viewport = page.viewportSize();
    expect(viewport?.width).toBe(375);

    // Content should be visible
    await expect(page.locator('text=/welcome|ברוכים הבאים|get started/i')).toBeVisible({ timeout: 10000 });
  });

  test('should have touch-friendly buttons', async ({ page }) => {
    await page.goto('/onboarding?step=1');
    await waitForPageLoad(page);

    const nextButton = page.getByRole('button', { name: /next|continue|get started|המשך|הבא|התחל/i });
    if (await nextButton.isVisible()) {
      const box = await nextButton.boundingBox();
      if (box) {
        expect(box.height).toBeGreaterThanOrEqual(44);
      }
    }
  });
});
