/**
 * E2E Form Helpers
 * Utilities for filling and submitting forms in Playwright tests
 */
import { Page } from '@playwright/test';

export async function fillLoginForm(page: Page, email: string, password: string) {
  await page.getByPlaceholder(/email|אימייל/i).fill(email);
  await page.getByPlaceholder(/password|סיסמה/i).fill(password);
}

export async function submitForm(page: Page, buttonText?: string | RegExp) {
  if (buttonText) {
    await page.getByRole('button', { name: buttonText }).click();
  } else {
    await page.getByRole('button', { name: /submit|sign|login|register|כניסה|הרשמה/i }).click();
  }
}

export async function fillForm(page: Page, fields: Record<string, string>) {
  for (const [name, value] of Object.entries(fields)) {
    const input = page.locator(`input[name="${name}"], textarea[name="${name}"], [data-testid="${name}"]`);
    if (await input.isVisible()) {
      await input.fill(value);
    }
  }
}

export async function clickButton(page: Page, text: string | RegExp) {
  const button = page.getByRole('button', { name: text });
  await button.click();
}
