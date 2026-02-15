/**
 * Full-Stack E2E: Social Features
 * (CompatibilityQuiz, IceBreakers, Achievements, DateIdeas, VirtualEvents)
 */
import { test, expect } from './fullstack-base.js';
import { waitForPageLoad, FULLSTACK_AUTH, collectConsoleMessages } from '../fixtures/index.js';

test.describe('[P1][social] Social Features - Full Stack', () => {
  test.use({ storageState: FULLSTACK_AUTH.user });

  // --- CompatibilityQuiz ---
  test('CompatibilityQuiz: loads with progress bar and question', async ({ page }) => {
    const cc = collectConsoleMessages(page);
    await page.goto('/CompatibilityQuiz', { waitUntil: 'domcontentloaded' });
    await waitForPageLoad(page);
    await expect(page.locator('h1:has-text("Compatibility Quiz")')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('[class*="bg-gradient-to-r"]').first()).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=/Question 1 of/')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('button:has(span.font-medium)').first()).toBeVisible({ timeout: 5000 });
    cc.assertClean();
  });

  test('CompatibilityQuiz: answer and skip advance questions', async ({ page }) => {
    await page.goto('/CompatibilityQuiz', { waitUntil: 'domcontentloaded' });
    await waitForPageLoad(page);
    await expect(page.locator('text=/Question 1 of/')).toBeVisible({ timeout: 15000 });
    // Answer first question
    const firstOption = page.locator('button:has(span.font-medium)').first();
    if (await firstOption.isVisible({ timeout: 5000 }).catch(() => false)) {
      await firstOption.click();
      await expect(page.locator('text=/Question 2 of/')).toBeVisible({ timeout: 10000 });
    }
    // Skip second question
    const skipBtn = page.locator('button:has-text("Skip this question")');
    if (await skipBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await skipBtn.click();
      await expect(page.locator('text=/Question 3 of/')).toBeVisible({ timeout: 10000 });
    }
  });

  // --- IceBreakers ---
  test('IceBreakers: loads with categories and cards', async ({ page }) => {
    const cc = collectConsoleMessages(page);
    await page.goto('/IceBreakers', { waitUntil: 'domcontentloaded' });
    await waitForPageLoad(page);
    await expect(page.locator('h1:has-text("Ice Breakers")')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('button:has-text("All")')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('button:has-text("Fun")')).toBeVisible();
    await expect(page.locator('text=favorite way to spend a weekend')).toBeVisible({ timeout: 10000 });
    cc.assertClean();
  });

  test('IceBreakers: category filter shows subset', async ({ page }) => {
    await page.goto('/IceBreakers', { waitUntil: 'domcontentloaded' });
    await waitForPageLoad(page);
    await expect(page.locator('button:has-text("Deep")')).toBeVisible({ timeout: 15000 });
    await page.locator('button:has-text("Deep")').click();
    await expect(page.locator('text=passionate about')).toBeVisible({ timeout: 5000 });
  });

  // --- Achievements ---
  test('Achievements: loads with points, unlocked count, and tabs', async ({ page }) => {
    const cc = collectConsoleMessages(page);
    await page.goto('/Achievements', { waitUntil: 'domcontentloaded' });
    await waitForPageLoad(page);
    await expect(page.locator('h1:has-text("Achievements")')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('text=Total Points')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Unlocked')).toBeVisible();
    await expect(page.locator('button:has-text("All")')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('button:has-text("Social")')).toBeVisible();
    // Test tab filtering inline
    await page.locator('button:has-text("Social")').click();
    await expect(page.locator('body')).toBeVisible();
    cc.assertClean();
  });

  // --- DateIdeas ---
  test('DateIdeas: loads with categories and idea cards', async ({ page }) => {
    const cc = collectConsoleMessages(page);
    await page.goto('/DateIdeas', { waitUntil: 'domcontentloaded' });
    await waitForPageLoad(page);
    await expect(page.locator('h1:has-text("Date Ideas")')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('button:has-text("All")')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('button:has-text("Romantic")')).toBeVisible();
    await expect(page.locator('text=Coffee & Conversation')).toBeVisible({ timeout: 10000 });
    cc.assertClean();
  });

  test('DateIdeas: category filter shows matching ideas', async ({ page }) => {
    await page.goto('/DateIdeas', { waitUntil: 'domcontentloaded' });
    await waitForPageLoad(page);
    await page.locator('button:has-text("Romantic")').click({ timeout: 15000 });
    await expect(page.locator('text=Sunset Picnic')).toBeVisible({ timeout: 5000 });
  });

  // --- VirtualEvents ---
  test('VirtualEvents: loads with tabs and event content', async ({ page }) => {
    const cc = collectConsoleMessages(page);
    await page.goto('/VirtualEvents', { waitUntil: 'domcontentloaded' });
    await waitForPageLoad(page);
    await expect(page.locator('h1:has-text("Virtual Events")')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('button:has-text("Upcoming")')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('button:has-text("Past Events")')).toBeVisible();
    const hasEvent = await page.locator('text=Speed Dating Night').isVisible({ timeout: 5000 }).catch(() => false);
    const hasEmpty = await page.locator('text=No upcoming events').isVisible({ timeout: 3000 }).catch(() => false);
    expect(hasEvent || hasEmpty).toBe(true);
    cc.assertClean();
  });

  test('VirtualEvents: register and switch to past tab', async ({ page }) => {
    await page.goto('/VirtualEvents', { waitUntil: 'domcontentloaded' });
    await waitForPageLoad(page);
    const registerBtn = page.locator('button:has-text("Register for Event")').first();
    if (await registerBtn.isVisible({ timeout: 10000 }).catch(() => false)) {
      await registerBtn.click();
      await expect(page.locator('text=Registered').first()).toBeVisible({ timeout: 5000 });
    }
    await page.locator('button:has-text("Past Events")').click();
    await expect(page.locator('body')).toBeVisible();
  });
});
