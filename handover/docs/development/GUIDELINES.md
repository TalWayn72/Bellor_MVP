# Bellor MVP - Development Standards & Guidelines

**Version:** 2.0.0 | **Last Updated:** February 8, 2026

This document defines the professional development standards for the Bellor platform. Every contributor -- human or AI -- must follow these standards without exception. Bellor serves hundreds of thousands of users; our code quality directly impacts their experience and safety.

---

## Table of Contents

1. [Code Standards](#1-code-standards)
2. [API Standards](#2-api-standards)
3. [Database Standards](#3-database-standards)
4. [Security Standards](#4-security-standards)
5. [Logging Standards](#5-logging-standards)
6. [Performance Budget](#6-performance-budget)
7. [Accessibility (a11y)](#7-accessibility-a11y)
8. [Data Privacy & GDPR](#8-data-privacy--gdpr)
9. [Dependency Management](#9-dependency-management)
10. [Feature Flags](#10-feature-flags)
11. [Deployment Standards](#11-deployment-standards)
12. [Monitoring & SLOs](#12-monitoring--slos)
13. [Testing Standards](#13-testing-standards)
14. [Git Workflow](#14-git-workflow)
15. [PR Review Process](#15-pr-review-process)

---

## 1. Code Standards

### 1.1 TypeScript Rules

- **Strict mode enabled** -- follow `tsconfig.json` strict settings at all times.
- **No `any` type** -- use `unknown` with type guards, or define proper interfaces.
- **Explicit return types** on all exported functions and public methods.
- **No unused variables** -- remove them or prefix with `_` if structurally required.
- **No plain JavaScript files** except root-level config (e.g., `vite.config.ts`, `tailwind.config.js`).

```typescript
// CORRECT
export async function getUserById(userId: string): Promise<User | null> {
  return prisma.user.findUnique({ where: { id: userId } });
}

// INCORRECT -- uses `any`, no return type
export async function getUserById(userId: any) {
  return prisma.user.findUnique({ where: { id: userId } });
}
```

### 1.2 Naming Conventions

| Element | Convention | Example |
|---------|-----------|---------|
| Files (backend) | `kebab-case.ts` | `auth.service.ts`, `users.controller.ts` |
| Files (components) | `PascalCase.tsx` | `UserProfile.tsx`, `ChatMessage.tsx` |
| Functions | `camelCase` | `getUserById`, `sendMessage` |
| Constants | `UPPER_SNAKE_CASE` | `MAX_FILE_SIZE`, `JWT_EXPIRES_IN` |
| Interfaces / Types | `PascalCase` | `User`, `AuthResponse`, `JWTPayload` |
| Enums | `PascalCase` name, `UPPER_SNAKE_CASE` values | `enum Role { ADMIN, USER }` |
| Database tables | `PascalCase` (Prisma convention) | `User`, `ChatRoom`, `PushSubscription` |

### 1.3 File Size Limit

- **150 lines maximum** per source file.
- When a file approaches this limit, extract sub-components, utilities, constants, or types into separate modules.
- Always create barrel files (`index.ts`) when splitting to maintain backward-compatible imports.
- **Exceptions:** test files, `schema.prisma`, Radix UI wrappers (`apps/web/src/components/ui/`), app entry points.

### 1.4 Code Organization

**Backend** (`apps/api/src/`):
```
config/          # App configuration & environment
controllers/     # Request handlers (thin -- delegate to services)
middleware/      # Fastify hooks & middleware
routes/          # API route definitions
services/        # Business logic (testable, framework-agnostic)
lib/             # Shared singletons (prisma, redis, logger)
security/        # Input sanitization, file validation, headers
utils/           # Pure utility functions
websocket/       # Socket.io handlers
```

**Frontend** (`apps/web/src/`):
```
api/             # API client layer (axios instances, typed methods)
components/      # React components (ui/, admin/, states/, secure/)
hooks/           # Custom React hooks
pages/           # Route-level page components
security/        # Client-side security utilities
styles/          # Global CSS / Tailwind config
utils/           # Pure utility functions
```

### 1.5 Error Handling Patterns

**Backend** -- always log with the `Logger` singleton, never `console.log`:
```typescript
import { logger } from '../lib/logger';

try {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  return user;
} catch (error) {
  logger.error('USER', 'Failed to fetch user', error as Error, { userId });
  throw error; // Never silently swallow errors
}
```

**Frontend** -- show user-friendly messages via toast, log details to console in dev only:
```typescript
try {
  await api.updateProfile(data);
  toast.success('Profile updated successfully');
} catch (error) {
  toast.error('Failed to update profile. Please try again.');
}
```

### 1.6 Import Order Convention

Organize imports in this order, separated by blank lines:

```typescript
// 1. External packages
import { FastifyRequest } from 'fastify';
import { z } from 'zod';

// 2. Internal packages (monorepo)
import { UserRole } from '@bellor/shared';

// 3. Relative imports (services, utils, components)
import { UsersService } from '../services/users.service';
import { validateInput } from '../utils/validation';

// 4. Type-only imports
import type { AuthPayload } from '../types/auth';
```

---

## 2. API Standards

### 2.1 API Versioning Policy

- All endpoints live under `/api/v1/`.
- **Breaking changes** (removed fields, changed semantics) require a new version (`/api/v2/`).
- Non-breaking additions (new optional fields, new endpoints) stay in the current version.
- Publish a **90-day deprecation notice** before removing an old API version.
- Support the `Accept-Version` header as an alternative to URL versioning.
- Maintain a changelog entry for every version bump.

### 2.2 Error Response Standard

Every error response must follow this structure:

```json
{
  "success": false,
  "error": {
    "code": "USER_NOT_FOUND",
    "message": "The requested user does not exist.",
    "details": [],
    "requestId": "req_a1b2c3d4"
  }
}
```

**Error code naming:** `DOMAIN_ACTION_REASON` (e.g., `AUTH_LOGIN_INVALID_CREDENTIALS`, `CHAT_SEND_RATE_LIMITED`).

| HTTP Status | Usage |
|-------------|-------|
| 200 | Success |
| 201 | Resource created |
| 204 | Success, no content (delete) |
| 400 | Validation error / bad request |
| 401 | Authentication required |
| 403 | Forbidden (insufficient permissions) |
| 404 | Resource not found |
| 409 | Conflict (duplicate resource) |
| 422 | Unprocessable entity (business rule violation) |
| 429 | Rate limited |
| 500 | Internal server error |

- **Never expose stack traces** in production responses.
- Include `requestId` in every error for traceability.

### 2.3 Request/Response Conventions

**Pagination:**
```json
{
  "data": [],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 243,
    "totalPages": 13
  }
}
```

**Filtering:** Use query params -- `?status=active&role=admin&createdAfter=2026-01-01`.

**Sorting:** `?sort=createdAt:desc,name:asc` -- comma-separated `field:direction` pairs.

**Success response:**
```json
{
  "success": true,
  "data": { ... }
}
```

---

## 3. Database Standards

### 3.1 Migration Safety Rules

| Rule | Details |
|------|---------|
| Reversible migrations | Every migration MUST include a rollback strategy. |
| No destructive DDL without approval | Never `DROP TABLE`, `DROP COLUMN` without explicit team approval. |
| Backup before production changes | Always snapshot the database before applying schema changes. |
| Staging first | Test all migrations on staging before production. |
| Dev vs. Deploy | Use `prisma migrate dev` locally, `prisma migrate deploy` in CI/production. |
| Lock migrations in CI | Prevent concurrent migration runs with advisory locks. |
| Forward-compatible | New schema must work with the previous code version (for zero-downtime deploys). |

### 3.2 Query Performance

- **Index every query path** -- verify with `EXPLAIN ANALYZE` for slow queries (> 50ms).
- **Prevent N+1 queries** -- use Prisma `include` or `select` to batch related data.
- **Connection pooling** -- use PgBouncer in production; configure `connection_limit` in Prisma.
- **Avoid `SELECT *`** -- use `select` to fetch only the fields you need.
- **Paginate all list queries** -- never return unbounded result sets.

```typescript
// CORRECT -- selective fields, pagination, indexed lookup
const users = await prisma.user.findMany({
  where: { isActive: true },
  select: { id: true, displayName: true, avatarUrl: true },
  take: 20,
  skip: (page - 1) * 20,
  orderBy: { createdAt: 'desc' },
});

// INCORRECT -- fetches all fields for all users
const users = await prisma.user.findMany();
```

---

## 4. Security Standards

### 4.1 Authentication & Authorization

| Mechanism | Configuration |
|-----------|--------------|
| Access tokens | JWT, 15-minute expiry, signed with RS256 or HS256 |
| Refresh tokens | Opaque token, 7-day expiry, stored in Redis |
| Password hashing | bcrypt with 12 salt rounds |
| Token validation | Every protected route, via Fastify `preHandler` hook |
| Authorization | Check resource ownership before mutations |
| Brute force protection | Lock account after 5 failed attempts for 15 minutes |

### 4.2 Input Validation

- **Zod schema on every endpoint** -- validate request body, params, and query.
- **TypeScript** for compile-time type safety.
- **Prisma** for parameterized queries (SQL injection prevention).
- **Server-side sanitization** via `apps/api/src/security/input-sanitizer.ts`.

```typescript
const updateProfileSchema = z.object({
  displayName: z.string().min(2).max(50),
  bio: z.string().max(500).optional(),
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

// Validate at the controller layer
const validated = updateProfileSchema.parse(request.body);
```

### 4.3 Secrets Management

- **Never commit** `.env` files, API keys, private keys, or credentials.
- Maintain `.env.example` with placeholder values only.
- Use Kubernetes Secrets or a secrets manager (e.g., AWS Secrets Manager) in production.
- Rotate secrets on a regular schedule (minimum quarterly).

### 4.4 OWASP Top 10 Prevention

| Vulnerability | Mitigation |
|--------------|------------|
| Injection (SQL, NoSQL, Command) | Prisma parameterized queries, input sanitization |
| Broken Authentication | JWT + refresh tokens, bcrypt, rate limiting |
| Sensitive Data Exposure | TLS everywhere, encrypt PII at rest, no secrets in logs |
| XML External Entities (XXE) | No XML parsing; JSON-only API |
| Broken Access Control | Ownership checks on every mutation, RBAC middleware |
| Security Misconfiguration | Hardened headers, minimal Docker images, no debug in prod |
| Cross-Site Scripting (XSS) | React auto-escaping, CSP headers, input sanitization |
| Insecure Deserialization | Zod schema validation on all inputs |
| Insufficient Logging | Structured Logger with security event tracking |
| SSRF | URL allowlisting for external requests |

### 4.5 Security Headers

All responses include the following headers (configured in `apps/api/src/security/headers.ts`):

| Header | Value |
|--------|-------|
| `Content-Security-Policy` | Strict CSP with nonce-based script loading |
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains; preload` |
| `X-Content-Type-Options` | `nosniff` |
| `X-Frame-Options` | `DENY` |
| `X-XSS-Protection` | `0` (rely on CSP instead) |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Permissions-Policy` | Camera, microphone, geolocation restricted |

### 4.6 File Upload Security

- **Magic bytes validation** -- verify file type by content, not just extension.
- **EXIF stripping** -- remove metadata from uploaded images.
- **Image re-encoding** -- re-process images through a safe codec to neutralize payloads.
- **Size limits** -- images: 10MB, audio: 25MB, video: 100MB.
- **Filename sanitization** -- strip path traversal characters, generate random filenames.
- **Storage** -- all uploads go to Cloudflare R2; never store on the application server filesystem.

---

## 5. Logging Standards

### 5.1 Log Levels

Use the `Logger` singleton from `apps/api/src/lib/logger.ts`. Never use raw `console.log` in backend code.

| Level | When to Use | Example |
|-------|-------------|---------|
| `DEBUG` | Development troubleshooting, flow tracing | Variable values, query parameters |
| `INFO` | Normal operations worth recording | User logged in, payment processed |
| `WARN` | Unexpected but handled situations | Rate limit approaching, retry triggered |
| `ERROR` | Failures that need attention | DB connection failed, payment gateway error |
| `FATAL` | System cannot continue operating | Out of memory, corrupted state |

### 5.2 What to Log

- All API requests: method, path, status code, response duration.
- Authentication events: login success/failure, token refresh, logout.
- Security events: blocked requests, injection attempts, rate limit hits.
- Business events: user registered, subscription created, report submitted.
- Performance anomalies: queries exceeding 200ms, timeout occurrences.

### 5.3 What NEVER to Log

- Passwords (even hashed).
- JWT access or refresh tokens.
- Credit card numbers or CVV.
- PII without masking (use `t***@example.com`, not the full email).
- Session tokens or API keys.
- Request/response bodies containing sensitive user data.

Use the `sanitizeForLog()` helper from `apps/api/src/lib/logger.ts` to automatically redact sensitive fields.

### 5.4 Structured Logging Format

```typescript
import { logger } from '../lib/logger';

// Standard format: logger.LEVEL('CATEGORY', 'message', { contextData })
logger.info('AUTH', 'User logged in successfully', { userId: user.id });
logger.error('PAYMENT', 'Stripe charge failed', error, { userId, amount });
logger.warn('SECURITY', 'Rate limit approached', { ip, endpoint, count });
```

**Categories:** `AUTH`, `CHAT`, `USER`, `PAYMENT`, `ADMIN`, `SECURITY`, `SYSTEM`, `STORAGE`, `NOTIFICATION`, `WEBSOCKET`.

---

## 6. Performance Budget

### 6.1 Backend Targets

| Metric | Target | Alert Threshold |
|--------|--------|-----------------|
| API p95 latency | < 200ms | > 500ms |
| API p99 latency | < 500ms | > 1000ms |
| DB query p95 | < 100ms | > 200ms |
| Error rate | < 0.1% | > 1% |
| Throughput | 500+ req/s | < 200 req/s |
| WebSocket message latency p95 | < 50ms | > 150ms |
| WebSocket connection time p95 | < 1s | > 3s |

### 6.2 Frontend Targets

| Metric | Target | Alert Threshold |
|--------|--------|-----------------|
| Bundle size (gzip) | < 500KB | > 750KB |
| First Contentful Paint (FCP) | < 1.5s | > 3s |
| Largest Contentful Paint (LCP) | < 2.5s | > 4s |
| Time to Interactive (TTI) | < 3.5s | > 5s |
| Cumulative Layout Shift (CLS) | < 0.1 | > 0.25 |
| First Input Delay (FID) | < 100ms | > 300ms |

### 6.3 Enforcement

- Run Lighthouse CI on every PR; fail the build if LCP > 4s or CLS > 0.25.
- Monitor bundle size with `vite-plugin-visualizer`; review any PR that increases it by > 10KB.
- Use k6 load tests (`docs/reports/PERFORMANCE_BASELINE.md`) before releases to validate backend targets.
- Lazy-load routes and heavy components with `React.lazy()` and `Suspense`.

---

## 7. Accessibility (a11y)

### 7.1 WCAG 2.1 AA Compliance

| Requirement | Standard |
|-------------|----------|
| Keyboard navigation | All interactive elements reachable and operable via keyboard |
| Color contrast | Minimum 4.5:1 for normal text, 3:1 for large text (18px+ or 14px bold) |
| Alt text | All meaningful images must have descriptive `alt` attributes |
| Form labels | Every input must have an associated `<label>` or `aria-label` |
| Focus indicators | Visible focus ring on all focusable elements |
| Motion | Respect `prefers-reduced-motion`; provide option to disable animations |

### 7.2 ARIA Guidelines

- **Semantic HTML first** -- use `<button>`, `<nav>`, `<main>`, `<dialog>` instead of generic `<div>`.
- Use `aria-label` on icon-only buttons (e.g., close button, menu toggle).
- Use `aria-live="polite"` for dynamic content updates (new messages, notifications).
- Apply `role` attributes only for custom widgets not covered by semantic elements.
- Connect error messages to inputs with `aria-describedby`.

```tsx
// CORRECT -- semantic HTML with accessible attributes
<button aria-label="Close dialog" onClick={onClose}>
  <XIcon />
</button>

// INCORRECT -- div acting as button, no keyboard support
<div onClick={onClose}>
  <XIcon />
</div>
```

### 7.3 Testing

- Run **axe-core** automated checks in CI via `@axe-core/playwright`.
- Perform keyboard-only navigation testing for all critical flows (onboarding, chat, profile).
- Test with screen readers (NVDA on Windows, VoiceOver on macOS) before major releases.

---

## 8. Data Privacy & GDPR

### 8.1 PII Handling Rules

| Rule | Implementation |
|------|---------------|
| Encrypt at rest | Database-level encryption for PII columns |
| Mask in logs | Use `sanitizeForLog()` -- see Logging Standards |
| Minimize collection | Only collect data that serves a stated purpose |
| Retention policy | Delete inactive accounts after 2 years of inactivity |
| Data isolation | PII queries scoped to authenticated user unless admin |

### 8.2 User Rights Implementation

| Right | Endpoint | Behavior |
|-------|----------|----------|
| Access (data export) | `GET /api/v1/users/me/data-export` | Returns all user data as JSON |
| Deletion | `DELETE /api/v1/users/me` | Soft-delete immediately; hard-delete after 30-day grace period |
| Rectification | `PUT /api/v1/users/me` | User can update their own personal data |
| Consent management | Explicit opt-in | Marketing communications require affirmative consent |
| Portability | `GET /api/v1/users/me/data-export?format=json` | Machine-readable export |

### 8.3 Data Processing

- All third-party data sharing (analytics, crash reporting) requires explicit user consent.
- Analytics data must be anonymized -- no raw user IDs in analytics pipelines.
- Document every data processing activity in the privacy policy and internal records.
- Cookie consent banner for web; App Tracking Transparency for mobile.

---

## 9. Dependency Management

### 9.1 Adding New Dependencies

Before adding any new package, evaluate:

| Check | Criteria |
|-------|----------|
| License | MIT or Apache 2.0 preferred; no GPL in production code |
| Bundle impact | Check on [bundlephobia.com](https://bundlephobia.com); reject if > 50KB gzipped without justification |
| Security | Run `npm audit` -- no known critical vulnerabilities |
| Maintenance | Last publish < 6 months; > 1,000 weekly downloads; responsive maintainers |
| Alternatives | Prefer built-in APIs or smaller utilities over large frameworks |

### 9.2 Updating Dependencies

- Run `npm audit` weekly; address **critical** vulnerabilities within 24 hours.
- **Patch/minor** updates: apply with automated CI verification.
- **Major** version updates: require manual review, testing, and team approval.
- Keep `package-lock.json` committed -- never `.gitignore` it.
- Pin exact versions for production dependencies (`"fastify": "4.26.2"`, not `"^4.26.2"`).

### 9.3 Forbidden Patterns

- No importing from CDNs in production code.
- No `eval()`, `Function()` constructor, or `new Function()`.
- No polyfills without an explicit documented reason.
- No `require()` in ESM code -- use `import` exclusively.
- No dependency on packages with fewer than 100 weekly downloads (supply chain risk).

---

## 10. Feature Flags

### 10.1 Implementation

- Store flags in the database (`AppSettings` table) or environment variables for infrastructure flags.
- **Frontend:** check the flag before rendering the component tree for that feature.
- **Backend:** check the flag before executing request logic.
- **Default:** all new features are OFF until explicitly enabled.

```typescript
// Backend
if (await featureFlags.isEnabled('STORY_REACTIONS', userId)) {
  return processStoryReaction(storyId, reaction);
}
return reply.status(404).send({ error: 'Feature not available' });

// Frontend
{featureFlags.STORY_REACTIONS && <StoryReactions storyId={storyId} />}
```

### 10.2 Rollout Strategy

| Stage | Audience | Duration |
|-------|----------|----------|
| Internal | Team members only | 1-3 days |
| Canary | 1% of users | 2-3 days |
| Limited | 10% of users | 3-5 days |
| Broad | 50% of users | 3-5 days |
| General Availability | 100% of users | Permanent |

- **Kill switch:** ability to disable any feature in under 1 minute via admin panel or environment variable.
- Monitor error rates and latency during each rollout stage; halt if thresholds are exceeded.

### 10.3 Flag Lifecycle

1. **Create** flag with descriptive name and owner.
2. **Enable** via gradual rollout.
3. **Monitor** for 2 weeks after full rollout.
4. **Remove** flag code -- clean up conditionals and dead branches.
5. **Maximum lifespan:** 90 days. After 90 days, a flag must either become permanent code or be removed entirely.

---

## 11. Deployment Standards

### 11.1 Rollback Strategy

| Requirement | Target |
|-------------|--------|
| Time to rollback | < 5 minutes |
| Available rollback versions | Last 3 successful deployments |
| Migration compatibility | New schema must work with previous code version |
| Automated rollback | Trigger on health check failure after deploy |

```bash
# Kubernetes rollback
kubectl rollout undo deployment/bellor-api -n bellor

# Docker Compose rollback
docker compose -f docker-compose.prod.yml down
docker compose -f docker-compose.prod.yml up -d --pull=never  # uses cached previous image
```

### 11.2 Zero-Downtime Deployment

- **Rolling updates only** -- Kubernetes `rollingUpdate` strategy with `maxSurge: 1`, `maxUnavailable: 0`.
- **Health checks mandatory** on every pod: readiness probe (HTTP `/health`) and liveness probe (HTTP `/health/live`).
- **Connection draining:** 30-second graceful shutdown period (`SIGTERM` handling).
- **Blue-green** for database schema changes that cannot be backward-compatible.

### 11.3 Deployment Checklist

| Step | Description | Responsible |
|------|-------------|-------------|
| 1 | All CI checks pass (lint, test, build, security scan) | Automated |
| 2 | Database backup completed | DevOps / Automated |
| 3 | Migration tested on staging | Developer |
| 4 | Docker images built and pushed to GHCR | CI (GitHub Actions) |
| 5 | Deploy to staging, run smoke tests | CI / Developer |
| 6 | Deploy to production (rolling update) | DevOps |
| 7 | Monitor error rates and latency for 15 minutes | On-call engineer |
| 8 | Confirm health checks green, mark deployment as stable | DevOps |
| 9 | Rollback if error rate > 1% or p99 > 2s within first 15 minutes | On-call engineer |

---

## 12. Monitoring & SLOs

### 12.1 Service Level Objectives

| SLO | Target | Measurement |
|-----|--------|-------------|
| Availability | 99.9% (43 min downtime/month max) | Health check uptime (Prometheus) |
| API Latency | p99 < 500ms | Prometheus histogram |
| Error Rate | < 0.1% of total requests | 5xx count / total count |
| Data Freshness | < 5s for real-time data | WebSocket message lag |
| Chat Delivery | 99.95% message delivery rate | Sent vs. delivered counters |

### 12.2 Alerting Rules

| Severity | Condition | Response Time | Notification |
|----------|-----------|---------------|-------------|
| P1 Critical | Service down, data loss risk, security breach | 15 minutes | PagerDuty + phone call |
| P2 High | Error rate > 5%, p99 > 2s, payment failures | 1 hour | Slack + email |
| P3 Medium | Error rate > 1%, p95 > 500ms, degraded feature | 4 hours | Slack |
| P4 Low | Non-functional issues, cosmetic bugs | Next business day | Ticket |

### 12.3 On-Call Expectations

- **Acknowledge** P1 alerts within 15 minutes.
- **Mitigate** (rollback, disable feature, scale up) before investigating root cause.
- **Root cause analysis** (RCA) document within 48 hours for P1/P2 incidents.
- **Post-mortem** meeting for every P1 and P2 -- blameless, focused on systemic improvements.
- Rotate on-call weekly; handoff includes current incident status and known issues.

---

## 13. Testing Standards

### 13.1 Test Coverage Targets

| Component | Target | Enforcement |
|-----------|--------|-------------|
| Backend services | 80%+ | CI gate |
| Controllers / routes | 70%+ | CI gate |
| Utility functions | 90%+ | CI gate |
| React components | 60%+ | Advisory |
| E2E critical flows | 100% of P1 flows | CI gate |

### 13.2 What to Test

**Priority 1 -- Must test (blocks merge):**
- Authentication and authorization logic.
- Input validation and sanitization.
- Business logic in service layer.
- Payment and subscription flows.
- Data mutation endpoints (create, update, delete).

**Priority 2 -- Should test:**
- Utility and helper functions.
- Custom React hooks.
- Complex UI components with conditional logic.
- WebSocket event handlers.

**Priority 3 -- Nice to have:**
- Presentational components with no logic.
- Static pages.
- CSS/styling regression (visual snapshot tests).

### 13.3 Testing Best Practices

- **Arrange-Act-Assert** (AAA) pattern in every test.
- **One logical assertion per test** (closely related assertions are acceptable).
- **Descriptive names** using "should" format: `it('should return 401 when token is expired')`.
- **Mock external dependencies** -- never hit real APIs or databases in unit tests.
- **Test edge cases** -- empty inputs, null, undefined, boundary values, Unicode, very long strings.
- **No test interdependence** -- every test must pass in isolation.
- **Factories over fixtures** -- use helper functions to generate test data dynamically.

```typescript
describe('AuthService.register', () => {
  it('should create a user with hashed password', async () => {
    // Arrange
    const input = { email: 'test@example.com', password: 'Str0ngP@ss!' };

    // Act
    const result = await AuthService.register(input);

    // Assert
    expect(result.user.email).toBe(input.email);
    expect(result.accessToken).toBeDefined();
    expect(result.user.password).toBeUndefined(); // Never return password
  });

  it('should throw on duplicate email', async () => {
    const input = { email: 'existing@example.com', password: 'Str0ngP@ss!' };
    await expect(AuthService.register(input)).rejects.toThrow('AUTH_REGISTER_EMAIL_EXISTS');
  });
});
```

### 13.4 Test File Locations and Commands

| Type | Location | Suffix |
|------|----------|--------|
| Backend unit | `apps/api/src/services/*.test.ts` | `.test.ts` |
| Backend integration | `apps/api/src/test/integration/*.test.ts` | `.test.ts` |
| Frontend unit | `apps/web/src/**/*.test.{ts,tsx}` | `.test.ts` / `.test.tsx` |
| E2E | `apps/web/e2e/*.spec.ts` | `.spec.ts` |

```bash
npm run test          # All tests (Vitest)
npm run test:api      # Backend only
npm run test:web      # Frontend only
npm run test:e2e      # Playwright E2E (Chromium, Firefox, Mobile)
```

### 13.5 Testing Requirements by Change Type

**New Backend Service:**
- Unit tests for every public method (happy path + error cases + edge cases)
- Integration tests if dependent on DB/Redis/external APIs
- Minimum 80% coverage

**New API Route:**
- Unit tests for the associated service
- Integration tests for the route (201 success, 401 auth, 400 validation, 403 forbidden)
- Validation tests (Zod schema)

**New WebSocket Event:**
- Integration tests with socket.io-client
- Auth on connection, send/receive events, error handling, room broadcast

**New UI Component:**
- Unit tests with Vitest + React Testing Library (render, interactions, a11y)
- E2E tests via Playwright for critical flows

**New Security Feature:**
- Unit + integration tests, security-specific tests (injection, XSS)
- Rate limiting tests if applicable
- Add to `security.integration.test.ts`

---

## 14. Git Workflow

### 14.1 Branch Strategy

| Branch | Purpose | Merges To |
|--------|---------|-----------|
| `main` | Production-ready, always stable | -- |
| `develop` | Integration branch for features | `main` |
| `feature/*` | New features (e.g., `feature/story-reactions`) | `develop` |
| `bugfix/*` | Non-critical bug fixes (e.g., `bugfix/chat-scroll`) | `develop` |
| `hotfix/*` | Urgent production fixes (e.g., `hotfix/auth-token-leak`) | `main` + `develop` |

- Feature branches must be short-lived (< 1 week).
- Rebase on `develop` before opening a PR to minimize merge conflicts.
- Delete branches after merge.

### 14.2 Commit Message Convention

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**

| Type | Description |
|------|-------------|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation only |
| `style` | Formatting, no logic change |
| `refactor` | Code restructuring, no behavior change |
| `perf` | Performance improvement |
| `test` | Adding or updating tests |
| `chore` | Build, CI, dependencies |
| `ci` | CI/CD pipeline changes |

**Examples:**
```
feat(chat): add message reactions with emoji picker

- Add ReactionPicker component with 6 default emojis
- Store reactions in ChatReaction table
- Broadcast reactions via WebSocket

Closes #234
```

```
fix(auth): prevent token refresh race condition

Multiple simultaneous refresh requests could invalidate each other.
Added mutex lock on refresh token rotation.

Fixes #567
```

### 14.3 Pre-Commit Checklist

Before every commit, verify:

- [ ] `npm run lint` passes with zero errors.
- [ ] `npm run test` passes all tests.
- [ ] `npm run build` completes without TypeScript errors.
- [ ] No sensitive data (passwords, keys, tokens) in the diff.
- [ ] Relevant documentation updated if behavior changed.
- [ ] Commit message follows Conventional Commits format.

---

## 15. PR Review Process

### 15.1 PR Template

```markdown
## Description
Brief description of what this PR does and why.

## Type of Change
- [ ] Bug fix (non-breaking fix for an issue)
- [ ] New feature (non-breaking addition)
- [ ] Breaking change (fix or feature that changes existing behavior)
- [ ] Refactoring (no functional change)
- [ ] Documentation update

## Changes Made
- Bullet list of specific changes

## Related Issues
Closes #___
Related to #___

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] E2E tests added/updated
- [ ] Manual testing completed

## Checklist
- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] No TypeScript errors or lint warnings
- [ ] No sensitive data committed
- [ ] Documentation updated (if applicable)
- [ ] All tests pass
```

### 15.2 Review Guidelines

**Reviewers must check:**

| Area | What to Verify |
|------|----------------|
| Correctness | Logic is sound; edge cases handled |
| Security | No new vulnerabilities; auth checks present |
| Performance | No N+1 queries; no unbounded loops; lazy loading used |
| Testing | Adequate coverage; meaningful assertions; no flaky tests |
| Types | No `any` usage; proper interfaces defined |
| Error handling | Errors caught, logged, and surfaced appropriately |
| Accessibility | Semantic HTML; ARIA attributes; keyboard navigable |
| Documentation | JSDoc on public APIs; README updated if needed |

**Feedback conventions:**
- `[blocking]` -- must be fixed before merge.
- `[suggestion]` -- improvement idea, not required.
- `[question]` -- request for clarification.
- `[nit]` -- style/formatting preference, non-blocking.

### 15.3 Merge Requirements

| Requirement | Details |
|-------------|---------|
| Approvals | Minimum 1 approval from a code owner |
| CI status | All checks green (lint, test, build, security) |
| Conflicts | Branch must be up to date with target branch |
| Coverage | No decrease in test coverage percentage |
| Commit history | Squash-merge for feature branches; merge commit for hotfixes |

---

**End of Document**

*These guidelines are a living document. Propose changes via PR with the `docs` commit type. All team members are expected to know and follow these standards.*
