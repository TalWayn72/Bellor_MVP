# 04 — Project Overview

A guided tour of the codebase. Read this before diving into specific files. After this, deeper architecture lives in [`docs/architecture/ARCHITECTURE.md`](./docs/architecture/ARCHITECTURE.md).

---

## What is Bellor?

A modern **dating / social networking** platform with these core features:
- User profiles with photos, bio, preferences, location
- Matching algorithm (swipe-style + AI-suggested)
- Real-time 1-to-1 chat (text, photos, voice notes, video calls)
- Stories (24-hour expiring posts)
- Missions (gamified profile-completion + engagement tasks)
- Achievements / badges
- Premium subscriptions (planned)
- Mobile apps (iOS + Android via Capacitor)
- Multi-language support (English, Hebrew, Spanish, German, French)

For full product context: [`docs/product/PRD.md`](./docs/product/PRD.md).

---

## Stack at a glance

### Backend (`apps/api`)
- **Runtime:** Node.js 20.19+ (or 22.12+, or 24+) — older 20.x versions fail with `require() of ES Module` errors due to jsdom@28's transitive ESM deps
- **Framework:** Fastify 5
- **ORM:** Prisma
- **Database:** PostgreSQL 16
- **Cache / Pub-Sub:** Redis 7
- **Real-time:** Socket.io
- **Auth:** JWT (15m access + 7d refresh) + bcrypt + Google OAuth
- **Validation:** Zod (auth) + sanitization middleware (everywhere else)
- **Logging:** Pino
- **File storage:** Cloudflare R2 (S3-compatible)
- **Email:** Resend

### Frontend (`apps/web`)
- **Runtime:** Browser (modern evergreen)
- **Framework:** React 18 + Vite 6
- **State:** TanStack Query (server) + React Context (client)
- **Forms:** React Hook Form + Zod
- **Styling:** Tailwind CSS + Radix UI primitives + class-variance-authority (CVA)
- **Routing:** React Router v6
- **HTTP:** Axios with interceptors
- **Real-time:** Socket.io client
- **Mobile:** Capacitor 8 (Android + iOS)

### Shared (`packages/`)
- `packages/shared` — TypeScript types, utilities used by both web and api
- `packages/ui` — 50+ Radix UI primitive wrappers (exempt from the 150-line file limit)

### Infrastructure (`infrastructure/`)
- `infrastructure/docker/` — Dockerfiles + compose files for production
- `infrastructure/kubernetes/` — K8s manifests (deployments, services, ingress, secrets)
- `infrastructure/k6/` — Load testing scripts
- `infrastructure/monitoring/` — Prometheus, Grafana configs
- `infrastructure/terraform/` — IaC for cloud provisioning

---

## Repository layout (top-level)

```
Bellor_MVP/
├── apps/
│   ├── api/              # Fastify backend
│   │   └── src/
│   │       ├── controllers/    # Thin HTTP handlers
│   │       ├── services/       # Business logic
│   │       ├── routes/         # Versioned routes (v1/)
│   │       ├── middleware/     # Auth, rate limit, security, logging
│   │       ├── security/       # Sanitization, validation helpers
│   │       ├── websocket/      # Socket.io handlers
│   │       ├── jobs/           # Background workers
│   │       ├── lib/            # Logger, prisma client, redis client
│   │       └── test/           # Integration + contract tests
│   └── web/              # React frontend
│       └── src/
│           ├── pages/          # Route-level components
│           ├── components/     # Reusable UI (feature-grouped)
│           ├── contexts/       # React contexts (auth, theme, locale)
│           ├── hooks/          # Custom hooks
│           ├── api/            # API client + service layer
│           │   ├── client/        # Axios instance + interceptors
│           │   └── services/      # One file per domain (auth, users, chat, …)
│           ├── lib/            # Utilities
│           ├── security/       # XSS, sanitization
│           └── styles/         # Tailwind config + globals
├── packages/
│   ├── shared/           # Cross-package types & utils
│   └── ui/               # Radix UI wrappers (Button, Dialog, etc.)
├── infrastructure/       # Docker, K8s, monitoring, IaC
├── docs/                 # All project documentation
├── scripts/              # Build/test/deploy scripts
├── .github/workflows/    # CI/CD pipelines
├── docker-compose.yml    # Local dev (postgres + redis)
├── docker-compose.prod.yml
├── package.json          # npm workspaces root
└── CLAUDE.md             # AI-assistant instructions / coding conventions
```

---

## Key architectural patterns

### Backend: Routes → Controllers → Services → Prisma

```
HTTP request
  → routes/v1/users.routes.ts            (path + middleware definition)
    → controllers/users.controller.ts    (parse req/res, call service)
      → services/users.service.ts        (business logic)
        → prisma client                  (database)
```

**Rules:**
- Controllers stay thin — no business logic
- Services hold all business logic and own DB access
- Never write raw SQL; always use Prisma
- All routes are under `/api/v1/`

### Frontend: Pages → Components → Hooks → API services

```
User clicks button
  → page component
    → calls a custom hook (e.g., useUserProfile)
      → React Query queries an API service
        → axios client → backend
```

**Rules:**
- Server state lives in React Query (cached, refetched, invalidated)
- Client/UI state lives in contexts or local component state
- All API calls go through `src/api/services/*.ts` — never axios directly from a component
- Path alias: `@/*` maps to `apps/web/src/*`

### Real-time

- Backend: Socket.io server initialized in `apps/api/src/websocket/`
- Frontend: Socket.io client wrapped in a context (`apps/web/src/contexts/SocketContext.tsx`)
- Used for: live chat, typing indicators, presence, story views, match notifications

---

## Iron rules (from `CLAUDE.md`)

These are enforced project-wide. The original maintainer takes them seriously — recommend you adopt them too.

1. **150-line max per file.** Exceptions: tests, Prisma schema, `packages/ui/`, framework entry points. Enforced via `npm run check:file-length`.
2. **No `console.log` in backend.** Use the Pino logger: `import { logger } from '../lib/logger'`.
3. **No `any` in TypeScript.** ESLint blocks it.
4. **All DB queries via Prisma.** No raw SQL.
5. **Read before editing.** Never modify a file you haven't read first.
6. **Commit only on user approval.** The previous maintainer never auto-committed without explicit OK.
7. **Document every task in `docs/project/OPEN_ISSUES.md`** with status, severity, files, problem, solution, tests.
8. **Memory leak detection is mandatory** for any code with timers, listeners, or WebSocket: `npm run test:memory-leak` and `npm run check:memory-leaks`.

Full rules: [`repo-files/CLAUDE.md`](./repo-files/CLAUDE.md).

---

## Testing

The repo has **3,400+ tests** across multiple categories. See [`docs/testing/TEST_REGISTRY.md`](./docs/testing/TEST_REGISTRY.md) for the full inventory.

| Type | Location | Run command |
|------|----------|-------------|
| Backend unit | `apps/api/src/services/*.test.ts` | `npm run test:api` |
| Backend integration | `apps/api/src/test/integration/*.test.ts` | `npm run test:api` |
| Frontend unit | `apps/web/src/**/*.test.{ts,tsx}` | `npm run test:web` |
| E2E (mocked) | `apps/web/e2e/*.spec.ts` | `npm run test:e2e` |
| E2E (full-stack) | `apps/web/e2e/full-stack/*.spec.ts` | `npm run test:e2e:fullstack` |
| Visual regression | `apps/web/e2e/visual/*.spec.ts` | `npm run test:visual` |
| Memory leak | `apps/*/src/test/memory-leak-detection.test.ts` | `npm run test:memory-leak` |
| Mutation | (Stryker config) | `npm run test:mutation` |
| Load (k6) | `infrastructure/k6/` | `npm run load:smoke` etc. |

**P0 critical tests** (run on every PR): `npm run test:p0`.

---

## CI/CD

Workflows in `.github/workflows/`:

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| `ci.yml` | Push/PR to main/master/develop | Lint + type check + security scan |
| `test.yml` | Push/PR | Full test suite (with Postgres + Redis services) |
| `p0-gate.yml` | Push/PR | Critical P0 smoke tests gate |
| `docker-build.yml` | Push to main/master, tags | Build + push images to `ghcr.io` + Trivy scan |
| `cd.yml` | Push to main/master | Deploy to K8s |
| `mobile-build.yml` | Manual / tags | Build Android APK + (optional) Google Play upload |
| `mutation.yml` | Manual / scheduled | Stryker mutation testing |
| `memory-leak-check.yml` | Manual / scheduled | Memory leak detection |
| `health-monitor.yml` | Scheduled | Production health check |

---

## What's intentionally NOT here

These were considered and rejected:
- **No GraphQL.** REST + WebSocket only.
- **No Redux / Zustand.** TanStack Query + Context is enough.
- **No Next.js.** Vite SPA. SSR was not a requirement for an MVP.
- **No microservices.** Monolithic Fastify API with clean service boundaries. Easy to split later if needed.
- **No ORM other than Prisma.** Strong opinionation here — don't add raw SQL or Knex.

---

## Where to look for things

| Looking for… | Look in… |
|--------------|----------|
| Database schema | `apps/api/prisma/schema.prisma` |
| API endpoint definition | `apps/api/src/routes/v1/<domain>/` |
| Business logic for X | `apps/api/src/services/<domain>.service.ts` |
| Frontend page for /chat | `apps/web/src/pages/Chat/` |
| Reusable button / dialog / etc. | `packages/ui/` |
| Auth flow | `apps/api/src/services/auth/` + `apps/web/src/contexts/AuthContext.tsx` |
| Real-time socket events | `apps/api/src/websocket/` + `apps/web/src/contexts/SocketContext.tsx` |
| Open bugs / TODOs | [`docs/project/OPEN_ISSUES.md`](./docs/project/OPEN_ISSUES.md) |
| Architecture diagrams | [`docs/architecture/ARCHITECTURE.md`](./docs/architecture/ARCHITECTURE.md) |
| API endpoint reference | [`docs/api/API_ENDPOINTS.md`](./docs/api/API_ENDPOINTS.md) |
| Coding conventions | [`docs/development/GUIDELINES.md`](./docs/development/GUIDELINES.md) |

---

## Next

- [`05-HANDOVER-CHECKLIST.md`](./05-HANDOVER-CHECKLIST.md) — End-to-end checklist for completing the handover.
- [`docs/architecture/ARCHITECTURE.md`](./docs/architecture/ARCHITECTURE.md) — Mermaid diagrams of every system view.
- [`docs/product/PRD.md`](./docs/product/PRD.md) — Product context.
