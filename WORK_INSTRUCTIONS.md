# Bellor MVP - Project Status & Reference

**Last Updated:** February 8, 2026
**Repository:** https://github.com/TalWayn72/Bellor_MVP
**Status:** Production Ready (Phases 1-9 Complete)
**Version:** 1.0.0-beta

---

## Project Overview

Bellor is a modern dating and social networking application, fully standalone and independent from Base44.
Built as a monorepo with npm workspaces: React frontend, Fastify backend, PostgreSQL, Redis, real-time WebSocket.
Supports 5 languages (EN, HE, ES, DE, FR), 50+ UI components, production-ready with CI/CD and K8s deployment.

## Tech Stack

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| **Frontend** | React | 18.2 | UI Framework |
| | Vite | 6.1 | Build Tool |
| | TypeScript | 5.8 | Type Safety |
| | Tailwind CSS | 3.4 | Styling |
| | Radix UI | Latest | Component Library |
| | TanStack Query | 5.84 | Data Fetching |
| | React Router | 6.26 | Routing |
| | Framer Motion | 11.16 | Animations |
| **Backend** | Node.js | 20+ | Runtime |
| | Fastify | 5.2 | Web Framework |
| | Prisma | 6.19 | ORM |
| | PostgreSQL | 16 | Database |
| | Redis | 7 | Cache & Sessions |
| | Socket.io | 4.8 | Real-time WebSocket |
| | Zod | 3.23 | Validation |
| | Stripe | 20.3 | Payments |
| | Firebase Admin | 13.6 | Push Notifications |
| | Vitest | 2.1 | Testing |
| **DevOps** | Docker | 24+ | Containerization |
| | Kubernetes | 1.28+ | Orchestration |
| | GitHub Actions | Latest | CI/CD |
| | Prometheus/Grafana | Latest | Monitoring |
| | Loki/Alertmanager | Latest | Logs & Alerts |

## Project Structure

```
Bellor_MVP/
├── apps/
│   ├── web/                    # React Frontend
│   │   ├── src/                # api/, components/, hooks/, pages/, security/, styles/, utils/
│   │   ├── e2e/                # Playwright E2E tests
│   │   ├── android/            # Capacitor Android
│   │   └── ios/                # Capacitor iOS
│   └── api/                    # Node.js Backend
│       ├── src/                # config/, controllers/, middleware/, routes/, services/, security/, websocket/, lib/, utils/
│       └── prisma/             # schema.prisma
├── packages/                   # shared/ (types), ui/ (design system)
├── infrastructure/             # docker/, kubernetes/, monitoring/
├── .github/workflows/          # CI/CD pipelines
├── scripts/                    # Deployment & utility scripts
├── docs/                       # Documentation
├── docker-compose.yml          # Development
├── docker-compose.prod.yml     # Production
├── docker-compose.all-in-one.yml  # Self-contained (275MB)
└── docker-compose.monitoring.yml  # Monitoring stack
```

## Commands Reference

| Category | Command | Description |
|----------|---------|-------------|
| **Dev** | `npm run dev` | Frontend only (port 5173) |
| | `npm run dev:api` | Backend only (port 3000) |
| | `npm run dev:all` | Both frontend and backend |
| | `npm run build` | Build all workspaces |
| | `npm run lint` / `lint:fix` | Lint all / auto-fix |
| | `npm run type-check` | TypeScript compilation check |
| **DB** | `npm run prisma:generate` | Generate Prisma client |
| | `npm run prisma:migrate` | Run migrations (dev) |
| | `npm run prisma:studio` | Prisma Studio (port 5555) |
| | `npm run prisma:seed` | Seed demo data (20 users) |
| **Test** | `npm run test` | All tests |
| | `npm run test:api` / `test:web` | Backend / Frontend only |
| | `npm run test:e2e` | E2E (Playwright) |
| | `npm run test:e2e:ui` | E2E UI debug mode |
| | `npm run test:coverage` | Tests with coverage |
| **Docker** | `npm run docker:up` / `docker:down` | Start/Stop PostgreSQL + Redis |
| **Deploy** | `./scripts/deploy.sh docker prod` | Docker Compose production |
| | `./scripts/deploy.sh k8s prod` | Kubernetes production |
| **Mobile** | `npm run cap:sync` | Sync web to native |
| | `npm run cap:open:android` | Open Android Studio |
| | `npm run cap:open:ios` | Open Xcode (macOS) |
| | `npm run cap:build` | Build web + sync |

## Migration Phases Status

| Phase | Description | Status |
|-------|-------------|--------|
| 1 | Foundation - Monorepo, TypeScript, Prisma, Docker | COMPLETE |
| 2 | Core Backend - Auth, Users, Files, Stories, Achievements, Premium, Push, Email | COMPLETE |
| 3 | Real-time - Socket.io, Chat, Presence, Frontend integration | COMPLETE |
| 4 | Frontend Migration - Remove Base44 dependencies | COMPLETE |
| 5 | Admin & Tools - Dashboard, User/Report/Chat management, API routes | COMPLETE |
| 6 | Testing & QA - 306 unit tests, 224 E2E tests, 100% backend coverage | COMPLETE |
| 7 | Deployment - CI/CD, Docker builds, K8s manifests, universal installers | COMPLETE |
| 8 | Universal Deployment - Cloud-agnostic, free hosting options, one-command deploy | COMPLETE |
| 9 | Final Polish (8 Feb 2026) - Push notifs, audio playback, story viewer, TS cleanup, Logger | COMPLETE |
| 10 | Mobile App - Capacitor configured, Android+iOS platforms added | **30%** |

**Phase 10 remaining:** Upload Keystore (Android), AAB build, Store listing (pending account setup)

## Important Files Reference

| File | Description |
|------|-------------|
| `CLAUDE.md` | AI assistant configuration and work rules |
| `README.md` | Project overview and quick start |
| `GUIDELINES.md` | Development guidelines and standards |
| `docs/OPEN_ISSUES.md` | Bug tracking and testing status (296+ items) |
| `docs/MIGRATION_PLAN.md` | Complete migration strategy |
| `docs/SECURITY_PLAN.md` | Security hardening strategy |
| `docs/SECURITY_CHECKLIST.md` | Pre-release security audit checklist |
| `docs/INCIDENT_RESPONSE.md` | Incident response procedures (P1-P4) |
| `docs/PERFORMANCE_BASELINE.md` | k6 load test results (p95: 23ms smoke, 230ms stress) |
| `docs/PRD.md` | Product Requirements Document |
| `docs/DEPLOYMENT_INFRASTRUCTURE_COMPLETE.md` | Universal deployment status |
| `apps/api/prisma/schema.prisma` | Database schema (all entities) |

## Infrastructure

### Services & Ports

| Service | Port | Start Command | Health Check |
|---------|------|---------------|--------------|
| Frontend (Vite) | 5173 | `npm run dev` | http://localhost:5173 |
| Backend API | 3000 | `npm run dev:api` | http://localhost:3000/health |
| PostgreSQL | 5432 | `npm run docker:up` | `docker ps` |
| Redis | 6379 | `npm run docker:up` | `docker ps` |
| Prisma Studio | 5555 | `npm run prisma:studio` | http://localhost:5555 |
| Grafana | 3001 | monitoring compose | http://localhost:3001 |
| Prometheus | 9090 | monitoring compose | http://localhost:9090 |

### Docker Images & Deployment

Images pushed to GHCR on version tags (`v*.*.*`): `ghcr.io/TalWayn72/bellor_mvp/{api,web}:<version>`

| Method | Command | Scale |
|--------|---------|-------|
| Docker Compose (dev) | `docker compose up -d` | Single |
| Docker Compose (prod) | `docker compose -f docker-compose.prod.yml up -d` | Single |
| Docker All-in-one | `docker compose -f docker-compose.all-in-one.yml up -d` | 275MB min |
| Docker Production | `docker compose -f docker-compose.production.yml up -d` | 3-20 replicas |
| Kubernetes | `kubectl apply -f infrastructure/kubernetes/` | 3-10 pods (HPA) |

### Monitoring Stack
Prometheus (metrics: request rates, p50/p95/p99, errors, WebSocket), Grafana (dashboards),
Loki+Promtail (structured logs with correlation IDs), Alertmanager (downtime, errors, resources).

## Testing Status

| Category | Count | Framework | Files |
|----------|-------|-----------|-------|
| Backend Unit | 306 | Vitest | 14 test files |
| E2E | 224 | Playwright | 11 test files |
| **Total** | **530** | | **25 test files** |

### E2E Test Files
| File | Coverage |
|------|----------|
| `auth.spec.ts` | Login, register, logout |
| `navigation.spec.ts` | Routing, back nav, deep links |
| `feed.spec.ts` | SharedSpace, missions, responses, likes |
| `chat.spec.ts` | Messages, typing indicators |
| `profile.spec.ts` | View, edit, my book |
| `matches.spec.ts` | Romantic, positive matches |
| `onboarding.spec.ts` | Full 14-step onboarding |
| `notifications.spec.ts` | List, mark read |
| `settings.spec.ts` | Theme, privacy, blocked users |
| `api-client.spec.ts` | API client transformers |
| `onboarding-drawing.spec.ts` | Canvas drawing |

Browsers: Chromium, Mobile Chrome, Mobile Safari, Firefox (CI).

## Security Status

Multi-layer security hardening implemented. Key areas:
- **Input Sanitization** - Client + server, injection detection, field-level rules
- **File Upload** - Magic bytes, EXIF stripping, re-encoding, filename sanitization
- **Auth** - Brute force protection, security logging, password strength
- **HTTP** - CSP, HSTS, CORS, X-Frame-Options, COEP/COOP/CORP
- **Container** - Non-root, read-only FS, capability dropping, resource limits
- **Client** - SecureTextInput, SecureImageUpload, useSecureInput/useSecureUpload

Files: `apps/api/src/security/`, `apps/web/src/security/` | Audit: `docs/SECURITY_CHECKLIST.md`

## Design System Status

All 12 groups completed (50+ components): Home, Profile, Feed, Chat, Matches, Settings,
Tasks, Premium, Support, Legal, Admin. State components (Loading/Empty/Error) on 40+ pages.
Location: `apps/web/src/components/states/`

## CI/CD Pipelines

| Workflow | Trigger | Actions |
|----------|---------|---------|
| `ci.yml` | Push/PR | Lint, Tests, Build, Security Scan |
| `docker-build.yml` | Tags (`v*.*.*`) | Multi-platform Docker build, push to GHCR |
| `cd.yml` | Post-CI | Deploy to production |
| `test.yml` | Push/PR | Testing workflows |

## Current Open Items

Tracking: `docs/OPEN_ISSUES.md` (296+ items documented, 75+ bugs fixed)

**Pending:** Phase 10 Mobile (30%), beta testing (100 users), production cloud deployment.
