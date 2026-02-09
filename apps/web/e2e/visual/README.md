# Visual Regression Testing

This directory contains visual regression tests for the Bellor application using Playwright's built-in screenshot comparison.

## Overview

Visual regression tests automatically detect UI changes by comparing screenshots of pages against baseline images. This helps catch:
- Unintended CSS/styling changes
- Layout shifts
- Component rendering issues
- Cross-browser inconsistencies
- Responsive design problems

## Test Coverage

### Public Pages
- Login page
- Welcome page
- Privacy Policy
- Terms of Service

### Authenticated Pages
- Feed page
- Profile page
- Chat page
- Discover page
- Notifications page
- Settings page

### Mobile Viewport
- Login (mobile)
- Welcome (mobile)
- Feed (mobile)

### Component Modals
- Daily task selector
- User profile modal

### Dark Mode
- Login (dark mode)
- Feed (dark mode)

## Running Tests

### Local Development

```bash
# Run visual tests (compares against baselines)
npm run test:visual

# Update baseline snapshots (after intentional UI changes)
npm run test:visual:update

# Run with UI mode (interactive)
npm run test:visual:ui

# View test report
npm run test:visual:report
```

### First Time Setup

On first run, you need to generate baseline screenshots:

```bash
npm run test:visual:update
```

This creates baseline snapshots in `e2e/visual/snapshots/`.

## Understanding Results

### Test Pass
All screenshots match the baseline within the configured threshold.

### Test Failure
Visual differences detected. Three images are generated:
- `*-expected.png` - The baseline image
- `*-actual.png` - The current screenshot
- `*-diff.png` - Highlighted differences

### Reviewing Failures

1. **Check the diff images** in `apps/web/e2e/visual/snapshots/`
2. **Determine if changes are intentional:**
   - **Intentional changes:** Run `npm run test:visual:update` to update baselines
   - **Unintentional changes:** Fix the UI issue
3. **Commit updated snapshots** if changes are approved

## Configuration

Visual regression settings are in `playwright.config.ts`:

```typescript
expect: {
  toHaveScreenshot: {
    maxDiffPixels: 100,     // Max pixels allowed to differ
    threshold: 0.2,          // Threshold for pixel difference (0-1)
    animations: 'disabled',  // Disable animations for consistency
  },
},
snapshotDir: './e2e/visual/snapshots',
```

## Best Practices

### 1. Hide Dynamic Content
Always hide timestamps, online indicators, and other dynamic elements:

```typescript
await page.addStyleTag({
  content: 'time, .timestamp, .online-indicator { visibility: hidden; }'
});
```

### 2. Wait for Page Load
Ensure page is fully loaded before taking screenshots:

```typescript
await waitForLoadingComplete(page);
```

### 3. Consistent Viewport
Set consistent viewport sizes:

```typescript
await page.setViewportSize({ width: 1280, height: 720 });
```

### 4. Mock Data
Use consistent mock data to avoid test flakiness:

```typescript
await mockFeedResponses(page, [
  createMockResponse('text', { likesCount: 42 })
]);
```

### 5. Adjust Thresholds
Per-test thresholds for pages with more dynamic content:

```typescript
await expect(page).toHaveScreenshot('feed-page.png', {
  maxDiffPixels: 200,  // Higher tolerance for complex pages
});
```

## CI/CD Integration

Visual regression tests run automatically on pull requests.

### On Failure
- **Diff images** are uploaded as artifacts
- **PR comment** is added with instructions
- **Workflow** fails to prevent merge

### Updating Baselines in CI
1. Run `npm run test:visual:update` locally
2. Review and commit the updated snapshots
3. Push to your branch

## Troubleshooting

### Tests failing locally but passing in CI
- Different OS/browser rendering
- Solution: Use Docker or run in CI environment

### Flaky tests
- Dynamic content not hidden
- Animations still running
- Network requests not mocked
- Solution: Add proper waits and mocks

### Large diff files
- Baseline might be outdated
- Solution: Re-generate baselines with `--update-snapshots`

### Cross-platform differences
- Font rendering varies by OS
- Solution: Increase `threshold` or use consistent CI environment

## File Structure

```
e2e/visual/
├── README.md                      # This file
├── visual-regression.spec.ts      # Test suite
└── snapshots/                     # Baseline screenshots
    ├── chromium/
    │   ├── login-page.png
    │   ├── feed-page.png
    │   └── ...
    ├── firefox/ (optional)
    └── webkit/ (optional)
```

## Snapshot Management

### Versioning
- **Commit baseline snapshots** to git
- **Do NOT commit** diff or actual images (handled by .gitignore)

### Updating After UI Changes
```bash
# 1. Make your UI changes
# 2. Update snapshots
npm run test:visual:update

# 3. Review the changes
git diff apps/web/e2e/visual/snapshots/

# 4. Commit if approved
git add apps/web/e2e/visual/snapshots/
git commit -m "test: update visual regression baselines after UI changes"
```

## Performance Tips

- Visual tests are slower than unit tests
- Run separately from main E2E suite
- Use `--project=chromium` to test single browser
- Consider parallel execution for large suites

## References

- [Playwright Visual Comparisons](https://playwright.dev/docs/test-snapshots)
- [PRD.md Section 10.1](../../docs/PRD.md) - Testing Strategy
- [Playwright Config](../../playwright.config.ts) - Configuration
