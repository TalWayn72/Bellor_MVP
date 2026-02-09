# Accessibility Testing - Quick Start Guide

## Installation
Already installed! Dependencies added:
- `@axe-core/playwright`
- `axe-playwright`
- `vitest-axe`
- `jest-axe`

## Running Tests

### All Accessibility Tests
```bash
npm run test -- src/test/a11y --run
```

### Component Tests Only
```bash
npm run test -- src/test/a11y/components --run
```

### Specific Component
```bash
npm run test -- src/test/a11y/components/Button.a11y.test.tsx --run
```

### E2E Accessibility Tests
```bash
npm run test:e2e -- accessibility.spec.ts
```

### Watch Mode (for development)
```bash
npm run test:watch -- src/test/a11y
```

### With Coverage
```bash
npm run test:coverage -- src/test/a11y
```

## Test Files

### Component Tests (138 tests)
- `SecureTextInput.a11y.test.tsx` - 18 tests
- `SecureTextArea.a11y.test.tsx` - 23 tests
- `Dialog.a11y.test.tsx` - 18 tests
- `Button.a11y.test.tsx` - 25 tests
- `Form.a11y.test.tsx` - 17 tests
- `Navigation.a11y.test.tsx` - 16 tests
- `Image.a11y.test.tsx` - 21 tests

### E2E Tests (28 scenarios × 2 viewports = 56 tests)
- `e2e/accessibility.spec.ts` - Comprehensive page testing

## Quick Examples

### Testing a New Component
```typescript
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

describe('MyComponent - Accessibility', () => {
  it('should have no accessibility violations', async () => {
    const { container } = render(<MyComponent />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
```

### Testing a New Page (E2E)
```typescript
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('My page should be accessible', async ({ page }) => {
  await page.goto('/my-page');
  await page.waitForLoadState('networkidle');

  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();

  expect(results.violations).toEqual([]);
});
```

## Common Accessibility Issues

### ❌ Missing Label
```tsx
// Bad
<input type="text" placeholder="Email" />

// Good
<label htmlFor="email">Email</label>
<input id="email" type="text" />

// Or with aria-label
<input type="text" aria-label="Email address" />
```

### ❌ Missing Alt Text
```tsx
// Bad
<img src="/logo.png" />

// Good
<img src="/logo.png" alt="Company Logo" />

// Decorative image
<img src="/decoration.png" alt="" role="presentation" />
```

### ❌ Non-semantic Button
```tsx
// Bad
<div onClick={handleClick}>Click Me</div>

// Good
<button onClick={handleClick}>Click Me</button>
```

### ❌ Missing ARIA for Error States
```tsx
// Bad
<input type="email" className="error" />
<span className="error-text">Invalid email</span>

// Good
<input
  type="email"
  aria-invalid="true"
  aria-describedby="email-error"
/>
<span id="email-error" role="alert">
  Invalid email
</span>
```

### ❌ Keyboard Inaccessible Modal
```tsx
// Bad
<div className="modal" onClick={handleClose}>
  <div className="content">{children}</div>
</div>

// Good - Use Radix UI Dialog
<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogContent>
    <DialogTitle>Title</DialogTitle>
    {children}
  </DialogContent>
</Dialog>
```

## Checklist for New Features

Before submitting a PR with UI changes:

- [ ] All form inputs have labels (htmlFor, aria-label, or aria-labelledby)
- [ ] All images have alt text (or alt="" for decorative)
- [ ] All interactive elements are keyboard accessible (Tab, Enter, Space)
- [ ] Error states use aria-invalid and aria-describedby
- [ ] Modals/dialogs trap focus and close on Escape
- [ ] Color contrast meets WCAG AA (4.5:1 for normal text, 3:1 for large)
- [ ] Component tests include accessibility tests
- [ ] E2E tests pass accessibility audit

## Resources

- **Documentation:** [README.md](./README.md)
- **Implementation Summary:** [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md)
- **WCAG Guidelines:** https://www.w3.org/WAI/WCAG21/quickref/
- **axe-core Rules:** https://github.com/dequelabs/axe-core/blob/develop/doc/rule-descriptions.md
- **ARIA Practices:** https://www.w3.org/WAI/ARIA/apg/

## Getting Help

1. Check existing tests for similar patterns
2. Review WCAG guidelines for specific criteria
3. Run axe DevTools browser extension for debugging
4. Test with keyboard only (Tab, Enter, Space, Escape, Arrow keys)
5. Test with screen reader (NVDA on Windows, VoiceOver on Mac/iOS)

## CI/CD

Accessibility tests run automatically on:
- Pre-commit hooks (component tests)
- Pull requests (all tests)
- Main branch commits (all tests)

Violations will fail the build.
