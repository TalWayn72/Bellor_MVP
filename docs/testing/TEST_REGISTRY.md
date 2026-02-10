# Bellor Test Registry

## Summary

| Category | Files | Est. Cases | Coverage Target |
|----------|-------|------------|-----------------|
| Backend Unit | 43 | ~800 | 75% |
| Backend Integration | 23 | ~400 | N/A |
| Backend Contract | 6 | ~80 | N/A |
| Backend Migration | 3 | ~30 | N/A |
| Frontend Unit | 63 | ~1200 | 45% (raising) |
| Frontend A11y | 7 | ~125 | N/A |
| Frontend Contract | 2 | ~33 | N/A |
| E2E (Playwright) | 14 | ~200 | N/A |
| Visual Regression | 1 | ~10 | N/A |
| Memory Leak | 2 | ~20 | N/A |
| Load (k6) | 7 | N/A | N/A |
| Mutation (Stryker) | N/A | ~300 mutants | 50%+ |
| **Total** | **~183** | **~3400+** | |

## Domain Coverage Matrix

| Domain | Unit | Integration | Contract | E2E | Gaps |
|--------|------|-------------|----------|-----|------|
| auth | 5 backend + 3 frontend | 4 files | 1 backend + 1 frontend | 1 file | OAuth integration |
| chat | 4 backend + 1 frontend | 6 files (WS) | 1 file | 1 file | WS lifecycle |
| content | 3 backend + 8 frontend | 1 file | 2 files | 1 file | - |
| social | 4 backend + 4 frontend | 1 file | 0 files | 2 files | Contract tests |
| profile | 6 backend + 7 frontend | 2 files | 1 file | 1 file | - |
| admin | 0 backend + 8 frontend | 0 files | 0 files | 0 files | **Major gap** |
| safety | 6 backend + 6 frontend | 1 file | 0 files | 1 file | - |
| payments | 1 backend + 2 frontend | 1 file | 0 files | 0 files | Contract + E2E |
| infra | 9 backend + 3 frontend | 2 files | 1 file | 0 files | - |

## Priority Tier Distribution

### P0 - Critical (must never break)

**Backend:**
- `auth-login.service.test.ts` - Login flow
- `auth-register.service.test.ts` - Registration flow
- `auth-password.service.test.ts` - Password management
- `auth-tokens.service.test.ts` - Token refresh/validation
- `google-oauth.service.test.ts` - OAuth integration
- `auth.middleware.test.ts` - Auth middleware
- `token-validation.test.ts` - Token validation
- `security.middleware.test.ts` - Security middleware
- `auth-hardening.test.ts` - Auth hardening
- `csrf-protection.test.ts` - CSRF protection
- `input-sanitizer.test.ts` - Input sanitization
- `reports.service.test.ts` - User reporting
- `subscriptions.service.test.ts` - Payments
- `users-delete.service.test.ts` - GDPR deletion
- Auth integration tests (3 files)
- Auth controller integration (1 file)

**Frontend:**
- `Login.test.jsx`, `Onboarding.test.jsx`, `Splash.test.jsx`
- `SafetyCenter.test.jsx`, `BlockedUsers.test.jsx`, `UserVerification.test.jsx`
- `Premium.test.jsx`
- `ProtectedRoute.test.jsx`
- `SecureTextInput.test.tsx`, `SecureTextArea.test.tsx`
- `apiClient.test.ts`, `validation.test.js`
- Security tests (3 files)

### P1 - Core (primary UX)

**Backend:**
- Chat service tests (4 files)
- Likes, follows, notifications service tests
- Missions, responses, stories service tests
- WebSocket integration tests (5 files)
- Chat controller integration

**Frontend:**
- Home, Creation, Task pages (write/audio/video)
- Stories, Matches, Discover, Notifications pages
- FeedPost, StarSendersModal components
- Chat/like service tests, responseTransformer

### P2 - Supporting

**Backend:**
- Users profile/data/getby/list/search/language tests
- Achievements, storage tests
- Lib tests (cache, logger, metrics, etc.)
- Config tests, migration tests

**Frontend:**
- Settings, profile editing pages
- Admin pages (8 files)
- Analytics, config tests

### P3 - Enhancement

**Frontend only:**
- DateIdeas, IceBreakers, CompatibilityQuiz
- VirtualEvents, ReferralProgram, VideoDate
- Feedback, EmailSupport, FAQ, HelpSupport

## Known Gaps (Prioritized)

### Critical (P0)
1. ~~Loose assertions in controller integration tests~~ (fixing)
2. Analytics service - no unit tests
3. Feedback service - no unit tests
4. packages/shared schemas - zero tests
5. OAuth routes integration tests
6. WebSocket lifecycle integration tests

### High (P1)
7. Admin controller integration tests
8. Webhooks integration tests
9. Security-events integration tests
10. Frontend hook tests (only 1 exists)
11. Frontend component tests (only 7 exist)

### Medium (P2)
12. Stryker mutation targets expansion
13. Frontend E2E for admin flows
14. Contract tests for social/payments domains

## Test Infrastructure

| Component | Location | Purpose |
|-----------|----------|---------|
| Backend setup | `apps/api/src/test/setup.ts` | Orchestrator + re-exports |
| Backend mocks | `apps/api/src/test/mocks/` | Prisma, Redis, cache, email |
| Backend factories | `apps/api/src/test/factories/` | Mock data + Builder pattern |
| Backend helpers | `apps/api/src/test/helpers/` | Async utilities |
| Frontend setup | `apps/web/src/test/setup.js` | Browser API mocks |
| E2E fixtures | `apps/web/e2e/fixtures/` | Helpers, factories, mocks |
| Memory leak scanner | `scripts/check-memory-leaks.js` | AST-based static analysis |
| Stryker config | `stryker.config.mjs` | Mutation testing |
| k6 tests | `infrastructure/k6/` | Load testing |

## CI/CD Pipeline

```
PR Gate (fast):     P0 tests only (~2 min)
Full CI:            All unit + integration + E2E (~15 min)
Main branch:        + Load tests + Security scans
Weekly:             Mutation testing
Daily:              Memory leak detection
```
