/**
 * Console Warning Detection Helpers
 * Shared utilities for detecting React console warnings/errors in E2E tests
 */
import { Page, expect } from '@playwright/test';
import { waitForPageLoad } from './navigation.helpers.js';

// Patterns that FAIL the test (React warnings/errors)
const FAIL_PATTERNS = [
  'Unknown event handler property',
  'unknown prop',
  '[ProtectedRoute] Unauthenticated',
  'unique "key" prop',
  'Cannot update a component',
  'findDOMNode is deprecated',
  'Cannot update during an existing state transition',
  'Invalid DOM property',
];

// Patterns to IGNORE (dev tools, HMR, network)
const IGNORE_PATTERNS = [
  'DevTools',
  'react-devtools',
  'Download the React DevTools',
  'favicon.ico',
  '[HMR]',
  '[vite]',
  'ERR_CONNECTION_REFUSED',
  'net::ERR_',
  'Failed to load resource',
  'the server responded with a status of',
];

interface ConsoleCollector {
  warnings: string[];
  errors: string[];
  assertClean(options?: { allowedWarnings?: RegExp[] }): void;
}

interface PageHealthCheckOptions {
  allowedWarnings?: RegExp[];
  settleMs?: number;
}

function shouldIgnore(text: string): boolean {
  return IGNORE_PATTERNS.some((p) => text.includes(p));
}

function findFailures(messages: string[], allowed?: RegExp[]): string[] {
  return messages.filter((msg) => {
    if (shouldIgnore(msg)) return false;
    const isFailPattern = FAIL_PATTERNS.some((p) => msg.includes(p));
    if (!isFailPattern) return false;
    if (allowed?.some((re) => re.test(msg))) return false;
    return true;
  });
}

/**
 * Attach a console listener to the page and collect warnings/errors.
 * Call `assertClean()` at the end of the test to verify no React warnings.
 */
export function collectConsoleMessages(page: Page): ConsoleCollector {
  const warnings: string[] = [];
  const errors: string[] = [];

  page.on('console', (msg) => {
    const text = msg.text();
    if (shouldIgnore(text)) return;
    if (msg.type() === 'warning') warnings.push(text);
    if (msg.type() === 'error') errors.push(text);
  });

  return {
    warnings,
    errors,
    assertClean(options?: { allowedWarnings?: RegExp[] }) {
      const failedWarnings = findFailures(warnings, options?.allowedWarnings);
      const failedErrors = findFailures(errors, options?.allowedWarnings);
      const all = [...failedWarnings, ...failedErrors];
      expect(all, `Unexpected console messages:\n${all.join('\n')}`).toHaveLength(0);
    },
  };
}

/**
 * Navigate to a route, wait for it to settle, then assert no React warnings.
 */
export async function assertPageHealthy(
  page: Page,
  route: string,
  options?: PageHealthCheckOptions,
): Promise<void> {
  const cc = collectConsoleMessages(page);
  await page.goto(route, { waitUntil: 'domcontentloaded' });
  await waitForPageLoad(page);
  await page.waitForTimeout(options?.settleMs ?? 3000);
  cc.assertClean({ allowedWarnings: options?.allowedWarnings });
}
