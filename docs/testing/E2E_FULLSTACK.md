# Full-Stack E2E Testing Guide

## Overview

Full-stack E2E tests simulate real human interaction with the running application (frontend + backend + database). Unlike the mocked E2E tests that intercept API calls, these tests run against the **real backend** with seeded data.

### Two-Layer Strategy

| Layer | Directory | Backend | Speed | Purpose |
|-------|-----------|---------|-------|---------|
| Mocked | `e2e/*.spec.ts` | Mocked via `page.route()` | ~30 sec | Fast UI smoke tests |
| Full-Stack | `e2e/full-stack/*.spec.ts` | Real Fastify + PostgreSQL + Redis | ~5-10 min | True integration testing |

## Prerequisites

Before running full-stack tests:

1. **Docker** running with PostgreSQL + Redis: `npm run docker:up`
2. **Database seeded**: `cd apps/api && npx prisma db seed`
3. **API running**: `npm run dev:api` (port 3000)
4. **Frontend running**: `npm run dev` (port 5173)

Or let the test runner start them automatically via `webServer` config.

## Running Tests

```bash
# Run all full-stack tests (Desktop Chrome)
npm run test:e2e:fullstack

# Run with visible browser
npm run test:e2e:fullstack:headed

# Run with Playwright debugger
npm run test:e2e:fullstack:debug

# Run with interactive UI
npm run test:e2e:fullstack:ui

# Run mobile viewport tests
npm run test:e2e:fullstack:mobile
```

## Test Files (22 specs, ~268 tests)

### Phase 1: Auth & Onboarding (P0)
| File | Tests | Description |
|------|-------|-------------|
| `auth-registration.spec.ts` | ~12 | Registration, validation, XSS |
| `auth-login.spec.ts` | ~10 | Login, wrong password, tokens |
| `auth-session.spec.ts` | ~8 | Session persistence, logout |
| `onboarding-flow.spec.ts` | ~20 | All 14 steps |

### Phase 2: Core UX (P1)
| File | Tests | Description |
|------|-------|-------------|
| `feed-interactions.spec.ts` | ~12 | Feed, likes, mission card |
| `chat-messaging.spec.ts` | ~10 | Send, receive, history |
| `chat-realtime.spec.ts` | ~4 | Two-context WebSocket |
| `profile-management.spec.ts` | ~12 | View, edit, photo upload |
| `discover-swiping.spec.ts` | ~8 | Like, pass, filters |
| `notifications.spec.ts` | ~8 | Tabs, click-through |

### Phase 3: Navigation & UI (P1-P2)
| File | Tests | Description |
|------|-------|-------------|
| `navigation-history.spec.ts` | ~10 | Back/forward, drawer, 404 |
| `modals-dialogs.spec.ts` | ~9 | Open, close, Escape, overlay |
| `forms-validation.spec.ts` | ~16 | XSS, SQL, Hebrew, emoji |
| `file-uploads.spec.ts` | ~8 | Valid, invalid, oversized |
| `infinite-scroll.spec.ts` | ~5 | Feed, chat, notifications |
| `search.spec.ts` | ~7 | English, Hebrew, special chars |

### Phase 4: Settings & Admin (P2)
| File | Tests | Description |
|------|-------|-------------|
| `settings-pages.spec.ts` | ~14 | Toggles, sub-pages |
| `admin-pages.spec.ts` | ~10 | Dashboard, management |
| `matches-likes.spec.ts` | ~6 | Matches, quiz, ice breakers |
| `stories.spec.ts` | ~7 | View, create, write task |

### Phase 5: Error & Edge Cases (P2)
| File | Tests | Description |
|------|-------|-------------|
| `error-states.spec.ts` | ~10 | 404, 500, offline, slow |
| `edge-cases.spec.ts` | ~14 | Rapid clicks, long text, RTL |

## Seeded Test Users

| User | Email | Password |
|------|-------|----------|
| Admin | `admin@bellor.app` | `Demo123!` |
| Sarah | `demo_sarah@bellor.app` | `Demo123!` |
| David | `demo_david@bellor.app` | `Demo123!` |
| Maya | `demo_maya@bellor.app` | `Demo123!` |

## Test Assets

Located in `e2e/test-assets/`:
- `valid-image.jpg` - 1x1 JPEG
- `sample-avatar.png` - 1x1 PNG
- `oversized-image.jpg` - 11MB (rejected by upload)
- `invalid-image.txt` - Text file (wrong type)
- `valid-audio.mp3` - Minimal MP3

## Adding New Tests

1. Create file in `e2e/full-stack/`
2. Use `FULLSTACK_AUTH.user` for storage state
3. Import helpers from `../fixtures/index.js`
4. Follow naming: `[P<tier>][<domain>] <Description>`
5. Update this doc and `TEST_REGISTRY.md`

## Debugging

```bash
# Run single test file
cd apps/web && FULLSTACK=1 npx playwright test e2e/full-stack/auth-login.spec.ts

# Run with trace
cd apps/web && FULLSTACK=1 npx playwright test --trace on e2e/full-stack/

# View report
cd apps/web && npx playwright show-report
```

## Security Test Inputs

All forms are tested with:
- `<script>alert("xss")</script>` - XSS
- `<img src=x onerror=alert(1)>` - HTML injection
- `' OR 1=1 --` - SQL injection
- `../../etc/passwd` - Path traversal
- Hebrew, emoji, unicode, 10K chars
