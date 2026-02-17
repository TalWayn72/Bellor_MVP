/**
 * Vitest matcher augmentation for jest-axe toHaveNoViolations
 * This file must be a module (have import/export) for proper augmentation
 */

import 'vitest';

interface CustomMatchers {
  toHaveNoViolations(): void;
}

declare module 'vitest' {
  interface Assertion extends CustomMatchers {}
  interface AsymmetricMatchersContaining extends CustomMatchers {}
}
