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

// --- Full-stack form interaction helpers ---

/** Move a Radix UI slider to a target percentage (0-100) */
export async function moveSlider(
  page: Page,
  selector: string,
  targetPercent: number,
): Promise<void> {
  const slider = page.locator(selector);
  const box = await slider.boundingBox();
  if (!box) throw new Error(`Slider not found: ${selector}`);

  const targetX = box.x + (box.width * targetPercent) / 100;
  const targetY = box.y + box.height / 2;

  await slider.click({ position: { x: (box.width * targetPercent) / 100, y: box.height / 2 } });

  // Fallback: use keyboard if click didn't work
  const thumb = page.locator(`${selector} [role="slider"]`);
  if (await thumb.isVisible()) {
    await thumb.focus();
    const steps = Math.round(targetPercent / 10);
    for (let i = 0; i < steps; i++) {
      await page.keyboard.press('ArrowRight');
    }
  }
}

/** Toggle a Radix UI switch */
export async function toggleSwitch(page: Page, selector: string): Promise<void> {
  const switchEl = page.locator(selector);
  await switchEl.click();
}

/** Select an option from a Radix UI dropdown/select */
export async function selectDropdownOption(
  page: Page,
  triggerSelector: string,
  optionText: string,
): Promise<void> {
  // Click trigger to open dropdown
  await page.locator(triggerSelector).click();

  // Wait for dropdown content to appear
  const option = page.locator(`[role="option"]:has-text("${optionText}"), [role="menuitem"]:has-text("${optionText}")`).first();
  await option.waitFor({ state: 'visible', timeout: 5000 });
  await option.click();
}

/** Select a date in a date picker */
export async function selectDate(
  page: Page,
  triggerSelector: string,
  date: { year: number; month: number; day: number },
): Promise<void> {
  await page.locator(triggerSelector).click();

  // Try native input first
  const dateInput = page.locator(`${triggerSelector} input[type="date"]`);
  if (await dateInput.isVisible().catch(() => false)) {
    const dateStr = `${date.year}-${String(date.month).padStart(2, '0')}-${String(date.day).padStart(2, '0')}`;
    await dateInput.fill(dateStr);
    return;
  }

  // Fallback: click through calendar UI
  await page.locator(`text=${date.day}`).first().click();
}

/** Special characters for security testing */
export const SPECIAL_INPUTS = {
  xss: '<script>alert("xss")</script>',
  htmlInjection: '<img src=x onerror=alert(1)>',
  sqlInjection: "' OR 1=1 --",
  pathTraversal: '../../etc/passwd',
  longText: 'A'.repeat(10000),
  hebrew: 'שלום עולם, זהו טקסט בעברית',
  mixed: 'Hello שלום <script> world',
  emoji: 'Test 😀🎉🚀 emoji',
  unicode: 'Ünïcödé テスト тест',
  empty: '',
  whitespace: '   ',
} as const;

/** Fill a field with special characters for security testing */
export async function fillWithSpecialInput(
  page: Page,
  selector: string,
  inputType: keyof typeof SPECIAL_INPUTS,
): Promise<void> {
  const value = SPECIAL_INPUTS[inputType];
  await page.locator(selector).fill(value);
}

/** Get all clickable elements on the current page */
export async function getAllClickableElements(page: Page) {
  return page.locator('button, a[href], [role="button"], [onclick], [tabindex="0"]').all();
}

/** Get all form inputs on the current page */
export async function getAllFormInputs(page: Page) {
  return page.locator('input:not([type="hidden"]), textarea, select, [role="combobox"], [role="slider"]').all();
}
