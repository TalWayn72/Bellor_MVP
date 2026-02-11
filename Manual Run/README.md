# Manual Run - Test Runners

## Quick Start

```bash
# Run manual/full-stack E2E tests (replaces manual QA)
"Manual Run\run-manual-tests.bat"

# Run ALL tests (unit + memory + mocked E2E + full-stack E2E)
"Manual Run\run-all-tests.bat"
```

## Scripts

### `run-manual-tests.bat` - Manual QA Replacement

Runs the full-stack Playwright E2E suite that simulates real human interaction against the **real backend** (not mocked).

| Flag | Description |
|------|-------------|
| *(none)* | Headless mode (default) |
| `--headed` | Visible browser window |
| `--debug` | Step-by-step debug mode |
| `--ui` | Playwright Test UI |
| `--mobile` | Mobile viewport (Pixel 5) |

**Prerequisites (checked automatically):**
1. Docker running (PostgreSQL + Redis)
2. Backend API on port 3000
3. Frontend on port 5173

**Test files:** `apps/web/e2e/full-stack/*.spec.ts`

### `run-all-tests.bat` - Complete Test Suite

Runs all 4 test layers sequentially. Each layer runs independently.

| Flag | Description |
|------|-------------|
| *(none)* | Run all layers |
| `--quick` | Skip full-stack E2E (faster) |
| `--e2e-only` | Only E2E tests (skip unit + memory) |

**Layers:**

| # | Layer | Location | Command |
|---|-------|----------|---------|
| 1 | Unit & Integration | `apps/*/src/**/*.test.ts` | `npm run test` |
| 2 | Memory Leak Detection | AST scanner + runtime tests | `npm run check:memory-leaks` |
| 3 | Mocked E2E | `apps/web/e2e/*.spec.ts` | `npm run test:e2e` |
| 4 | Full-Stack E2E | `apps/web/e2e/full-stack/*.spec.ts` | `npm run test:e2e:fullstack` |

## Adding New Tests

All test runners use glob patterns, so new tests are **automatically included**:

| Test Type | Where to Add | Auto-Included? |
|-----------|-------------|----------------|
| Unit test | `*.test.ts` next to source file | Yes |
| Mocked E2E | `apps/web/e2e/*.spec.ts` | Yes |
| Full-stack E2E | `apps/web/e2e/full-stack/*.spec.ts` | Yes |
| Memory leak | Add patterns to detection test files | Yes |

## Prerequisites Setup

```bash
# Terminal 1: Start Docker services
npm run docker:up

# Terminal 2: Start Backend API
npm run dev:api

# Terminal 3: Start Frontend
npm run dev

# Terminal 4: Run tests
"Manual Run\run-manual-tests.bat"
```
