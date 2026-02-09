# Accessibility Testing Suite

Comprehensive accessibility (a11y) testing for the Bellor MVP application, ensuring WCAG 2.1 AA compliance across all components and pages.

## Overview

This test suite includes:
- **E2E Accessibility Tests**: Full-page accessibility audits using `@axe-core/playwright`
- **Component Tests**: Unit-level accessibility tests using `jest-axe` and `vitest-axe`

## Test Coverage

### E2E Tests (`apps/web/e2e/accessibility.spec.ts`)

Tests all major pages and user flows across desktop (1280x720) and mobile (375x667) viewports:

**Unauthenticated Pages:**
- Login page (form labels, ARIA, keyboard navigation)
- Register page
- Landing page

**Authenticated Pages:**
- Feed page (cards, semantic HTML, action buttons)
- Profile page (tabs, images with alt text)
- Chat page (messages list, input field)
- Settings page (form controls)
- Discover page (swipe actions, keyboard alternatives)
- Matches page
- Notifications page

**Specialized Tests:**
- Onboarding flow (multi-step forms, ARIA progressbar)
- Navigation (keyboard accessibility, ARIA landmarks)
- Color contrast compliance
- Focus management and focus traps

### Component Tests (`apps/web/src/test/a11y/components/`)

#### SecureTextInput (`SecureTextInput.a11y.test.tsx`)
- Proper labeling (labels, aria-label, aria-describedby)
- Keyboard navigation (Tab, Shift+Tab, Arrow keys)
- ARIA attributes (required, invalid, busy)
- Error states and validation
- Character counter accessibility
- Disabled and read-only states
- Focus management

#### SecureTextArea (`SecureTextArea.a11y.test.tsx`)
- Multi-line text handling
- Keyboard interactions (Enter for newlines, Tab navigation)
- Character counter announcements
- All standard input accessibility patterns

#### Dialog (`Dialog.a11y.test.tsx`)
- Modal dialog patterns (role, aria-modal)
- Focus trap implementation
- Keyboard controls (Escape to close)
- Accessible labeling (aria-labelledby, aria-describedby)
- Form submission within dialogs
- Nested interactive elements

#### Button (`Button.a11y.test.tsx`)
- Keyboard activation (Enter, Space)
- Focus indicators
- Disabled states
- Loading states (aria-busy)
- Icon-only buttons (aria-label)
- Toggle buttons (aria-pressed)
- Dropdown triggers (aria-expanded)
- All variant and size combinations

#### Form (`Form.a11y.test.tsx`)
- Label associations (htmlFor, aria-labelledby)
- Required field indicators (required, aria-required)
- Error messaging (aria-invalid, role="alert")
- Fieldset and legend for grouped inputs
- Radio and checkbox groups
- Help text (aria-describedby)
- Multi-step forms with progressbar
- Autocomplete attributes

#### Navigation (`Navigation.a11y.test.tsx`)
- Semantic nav elements
- Skip links
- Current page indication (aria-current)
- Keyboard navigation
- ARIA landmarks (multiple nav regions)
- Breadcrumb navigation
- Mobile menu toggle
- Tab navigation (tablist, tab, tabpanel)

#### Image (`Image.a11y.test.tsx`)
- Alt text requirements
- Decorative images (empty alt, role="presentation")
- Images in links
- Figure and figcaption
- Responsive images (srcset, sizes)
- SVG accessibility (title, desc)
- Background images with text alternatives
- Image galleries
- Lazy loading
- Error states and fallbacks

## Running Tests

### All Accessibility Tests
```bash
npm run test:e2e -- accessibility.spec.ts
npm run test -- a11y
```

### E2E Tests Only
```bash
npm run test:e2e -- accessibility.spec.ts
```

### Component Tests Only
```bash
npm run test -- src/test/a11y
```

### Watch Mode
```bash
npm run test:watch -- src/test/a11y
```

### With Coverage
```bash
npm run test:coverage -- src/test/a11y
```

## WCAG 2.1 AA Criteria Covered

### Perceivable
- **1.1.1 Non-text Content**: All images have alt text or proper role
- **1.3.1 Info and Relationships**: Semantic HTML, proper labels, ARIA landmarks
- **1.3.2 Meaningful Sequence**: Logical DOM order, proper heading hierarchy
- **1.4.3 Contrast (Minimum)**: Color contrast checked via axe-core
- **1.4.4 Resize Text**: Responsive design tested at multiple viewports

### Operable
- **2.1.1 Keyboard**: All interactive elements keyboard accessible
- **2.1.2 No Keyboard Trap**: Focus not trapped except in modals
- **2.4.1 Bypass Blocks**: Skip links implemented
- **2.4.3 Focus Order**: Logical tab order maintained
- **2.4.6 Headings and Labels**: Descriptive labels on all form controls
- **2.4.7 Focus Visible**: Focus indicators tested

### Understandable
- **3.2.1 On Focus**: No context changes on focus
- **3.2.2 On Input**: Predictable form behavior
- **3.3.1 Error Identification**: Errors clearly identified
- **3.3.2 Labels or Instructions**: All inputs labeled
- **3.3.3 Error Suggestion**: Error messages provide guidance

### Robust
- **4.1.2 Name, Role, Value**: Proper ARIA roles and attributes
- **4.1.3 Status Messages**: Live regions for dynamic content

## Tools Used

- **@axe-core/playwright**: Automated accessibility testing for E2E tests
- **axe-playwright**: Integration between axe-core and Playwright
- **jest-axe/vitest-axe**: Component-level accessibility testing
- **@testing-library/react**: Accessible query methods
- **@testing-library/user-event**: Realistic user interactions

## Writing New Tests

### E2E Test Pattern
```typescript
test('Page should be accessible', async ({ page }) => {
  await page.goto('/your-page');
  await page.waitForLoadState('networkidle');

  const accessibilityScanResults = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();

  expect(accessibilityScanResults.violations).toEqual([]);
});
```

### Component Test Pattern
```typescript
it('should have no accessibility violations', async () => {
  const { container } = render(
    <YourComponent aria-label="Accessible name" />
  );

  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

## Continuous Integration

These tests run automatically on:
- Every pull request
- Pre-commit hooks (for component tests)
- CI/CD pipeline

Accessibility violations will fail the build.

## Best Practices

1. **Always provide labels**: Every form control must have an accessible name
2. **Use semantic HTML**: Prefer `<button>` over `<div onClick>`
3. **Manage focus**: Ensure logical tab order and visible focus indicators
4. **Test with keyboard**: All functionality must work without a mouse
5. **Provide text alternatives**: All non-text content needs text equivalents
6. **Use ARIA sparingly**: Only when semantic HTML isn't sufficient
7. **Test at multiple viewports**: Mobile and desktop experiences differ

## Resources

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [axe-core Rules](https://github.com/dequelabs/axe-core/blob/develop/doc/rule-descriptions.md)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [WebAIM](https://webaim.org/)

## Current Test Count

- **E2E Tests**: ~35 comprehensive page/flow tests
- **Component Tests**: ~90+ unit-level accessibility tests
- **Total**: ~125 accessibility tests

## Maintenance

- Review and update tests when components change
- Add new tests for new features
- Keep axe-core and testing libraries up to date
- Regularly check for new WCAG guidelines
