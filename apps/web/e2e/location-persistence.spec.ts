/**
 * Location & Select Fields Persistence E2E Tests
 *
 * Tests country/city dropdown UI behavior in Onboarding step 5:
 * - Country/city dropdowns render correctly
 * - City list updates when country changes
 * - Flag emoji updates with country selection
 * - City resets on country change
 *
 * EditProfile tests with auth mocking are in profile.spec.ts
 *
 * @see ISSUE: Country/City selections not persisting
 * Priority: High
 */

import {
  test,
  expect,
  waitForPageLoad,
} from './fixtures';

test.describe('Location Dropdowns - Onboarding Step 5', () => {
  test('should show country and city dropdowns', async ({ page }) => {
    await page.goto('/onboarding?step=5');
    await waitForPageLoad(page);

    const selects = page.locator('select');
    await expect(selects.first()).toBeVisible({ timeout: 10000 });
    await expect(selects.nth(1)).toBeVisible({ timeout: 10000 });
  });

  test('should list Israel in country dropdown', async ({ page }) => {
    await page.goto('/onboarding?step=5');
    await waitForPageLoad(page);

    const countrySelect = page.locator('select').first();
    await expect(countrySelect.locator('option', { hasText: 'Israel' })).toBeAttached();
  });

  test('should show Israeli cities when Israel is selected', async ({ page }) => {
    await page.goto('/onboarding?step=5');
    await waitForPageLoad(page);

    const countrySelect = page.locator('select').first();
    await countrySelect.selectOption('Israel');

    const citySelect = page.locator('select').nth(1);
    await expect(citySelect.locator('option', { hasText: 'Tel Aviv' })).toBeAttached();
    await expect(citySelect.locator('option', { hasText: 'Jerusalem' })).toBeAttached();
    await expect(citySelect.locator('option', { hasText: 'Haifa' })).toBeAttached();
    await expect(citySelect.locator('option', { hasText: 'Beer Sheva' })).toBeAttached();
  });

  test('should reset city when country changes', async ({ page }) => {
    await page.goto('/onboarding?step=5');
    await waitForPageLoad(page);

    const countrySelect = page.locator('select').first();
    const citySelect = page.locator('select').nth(1);

    // Select Israel + Tel Aviv
    await countrySelect.selectOption('Israel');
    await citySelect.selectOption('Tel Aviv');
    await expect(citySelect).toHaveValue('Tel Aviv');

    // Change country to Canada
    await countrySelect.selectOption('Canada');

    // City should reset to empty
    await expect(citySelect).toHaveValue('');

    // Should show Canadian cities
    await expect(citySelect.locator('option', { hasText: 'Toronto' })).toBeAttached();
  });

  test('should update flag when country changes', async ({ page }) => {
    await page.goto('/onboarding?step=5');
    await waitForPageLoad(page);

    const countrySelect = page.locator('select').first();

    // Switch to Israel
    await countrySelect.selectOption('Israel');
    await expect(page.locator('text=\ud83c\uddee\ud83c\uddf1')).toBeVisible();

    // Switch to UK
    await countrySelect.selectOption('United Kingdom');
    await expect(page.locator('text=\ud83c\uddec\ud83c\udde7')).toBeVisible();

    // Switch to Australia
    await countrySelect.selectOption('Australia');
    await expect(page.locator('text=\ud83c\udde6\ud83c\uddfa')).toBeVisible();
  });

  test('should have all 5 countries available', async ({ page }) => {
    await page.goto('/onboarding?step=5');
    await waitForPageLoad(page);

    const countrySelect = page.locator('select').first();
    await expect(countrySelect.locator('option', { hasText: 'United States' })).toBeAttached();
    await expect(countrySelect.locator('option', { hasText: 'Israel' })).toBeAttached();
    await expect(countrySelect.locator('option', { hasText: 'United Kingdom' })).toBeAttached();
    await expect(countrySelect.locator('option', { hasText: 'Canada' })).toBeAttached();
    await expect(countrySelect.locator('option', { hasText: 'Australia' })).toBeAttached();
  });

  test('should select Israel + Tel Aviv and keep both selected', async ({ page }) => {
    await page.goto('/onboarding?step=5');
    await waitForPageLoad(page);

    const countrySelect = page.locator('select').first();
    const citySelect = page.locator('select').nth(1);

    await countrySelect.selectOption('Israel');
    await citySelect.selectOption('Tel Aviv');

    // Both should remain selected
    await expect(countrySelect).toHaveValue('Israel');
    await expect(citySelect).toHaveValue('Tel Aviv');
  });

  test('should show correct cities for each country', async ({ page }) => {
    await page.goto('/onboarding?step=5');
    await waitForPageLoad(page);

    const countrySelect = page.locator('select').first();
    const citySelect = page.locator('select').nth(1);

    // US cities
    await countrySelect.selectOption('United States');
    await expect(citySelect.locator('option', { hasText: 'New York' })).toBeAttached();
    await expect(citySelect.locator('option', { hasText: 'Los Angeles' })).toBeAttached();

    // UK cities
    await countrySelect.selectOption('United Kingdom');
    await expect(citySelect.locator('option', { hasText: 'London' })).toBeAttached();
    await expect(citySelect.locator('option', { hasText: 'Manchester' })).toBeAttached();

    // Canada cities
    await countrySelect.selectOption('Canada');
    await expect(citySelect.locator('option', { hasText: 'Toronto' })).toBeAttached();
    await expect(citySelect.locator('option', { hasText: 'Vancouver' })).toBeAttached();
  });
});

test.describe('Gender & LookingFor Steps - Onboarding', () => {
  test('step 7 should show gender selection text', async ({ page }) => {
    await page.goto('/onboarding?step=7');
    await waitForPageLoad(page);

    await expect(page.locator('text=Gender Selection')).toBeVisible({ timeout: 10000 });
  });

  test('step 7.7 should show looking for options', async ({ page }) => {
    await page.goto('/onboarding?step=7.7');
    await waitForPageLoad(page);

    await expect(page.getByRole('button', { name: 'WOMEN', exact: true })).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('button', { name: 'MEN', exact: true })).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('button', { name: 'EVERYONE', exact: true })).toBeVisible({ timeout: 10000 });
  });

  test('step 7 selecting FEMALE should navigate to step 7.7', async ({ page }) => {
    await page.goto('/onboarding?step=7');
    await waitForPageLoad(page);

    await page.getByRole('button', { name: 'FEMALE', exact: true }).click();
    await expect(page).toHaveURL(/step=7\.7/);
  });

  test('step 7 selecting OTHER should navigate to step 7.5', async ({ page }) => {
    await page.goto('/onboarding?step=7');
    await waitForPageLoad(page);

    await page.getByRole('button', { name: 'OTHER', exact: true }).click();
    await expect(page).toHaveURL(/step=7\.5/);
  });
});
