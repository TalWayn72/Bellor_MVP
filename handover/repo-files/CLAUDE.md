# Bellor - AI Assistant Configuration

## Project Context
- **Type:** Dating/Social App - Production MVP
- **Stack:** React 18 + Vite 6 + Tailwind + Radix UI | Fastify 5 + Prisma + PostgreSQL 16 + Redis 7
- **Monorepo:** npm workspaces - `apps/web`, `apps/api`, `packages/shared`, `packages/ui`
- **Repository:** https://github.com/TalWayn72/Bellor_MVP
- **Node:** >=18.0.0 | **npm:** >=9.0.0

## Boundaries
| Path | Reason |
|------|--------|
| `C:\Users\talwa\bellor` | Old project - DO NOT access |
| `C:\Users\talwa\bellor_OLD.zip` | Old archive - DO NOT access |

**Active project only:** `C:\Users\talwa\.claude\projects\Bellor_MVP`

## Language & Permissions
- **Communication:** Hebrew | **Code & Docs:** English
- **Auto-approved:** File ops, Git, npm, bash, docker, VS Code extensions
- **Requires user approval:** Git commit only

## Architecture & Patterns

### Backend (`apps/api`)
- **Pattern:** Routes → Controllers (thin) → Services (business logic) → Prisma ORM
- **Routes:** Versioned under `/v1/` (auth, users, chats, missions, uploads, etc.)
- **Validation:** Zod schemas on auth routes, input sanitization middleware globally
- **Auth:** JWT (15m access + 7d refresh), bcrypt 12 rounds, brute force protection, Google OAuth
- **Logging:** Pino logger (NOT console.log) - levels: trace/debug/info/warn/error/fatal
- **WebSocket:** Socket.io for real-time chat
- **Middleware stack:** security → logging → auth → rate-limit → route handler

### Frontend (`apps/web`)
- **State:** TanStack React Query for server state, React contexts for app state
- **Forms:** React Hook Form + Zod resolvers
- **API Client:** Axios with interceptors (`src/api/client/apiClient.ts`) + service layer (`src/api/services/`)
- **Routing:** React Router v6
- **UI:** Radix UI primitives wrapped in `packages/ui/` + Tailwind + CVA
- **Path alias:** `@/*` maps to `src/*`
- **Mobile:** Capacitor 8 (Android + iOS) - `npm run cap:sync`, `npm run cap:build`

### Shared Packages
- `packages/shared` - TypeScript types, utilities
- `packages/ui` - 50+ Radix UI component wrappers (exempt from 150-line limit)

## Core Rules
1. Always read a file before modifying it
2. Auto-fix errors without asking - identify and resolve issues autonomously
3. **Max 150 lines per file** - exceptions: tests, Prisma schema, `packages/ui/`, entry points
4. Create barrel files (`index.ts`) when splitting files - preserve import compatibility
5. TypeScript strict, ESLint, Prettier - no `any`, no `console.log` (use Logger)
6. All DB queries via Prisma ORM only - never raw SQL
7. Document every task in `docs/project/OPEN_ISSUES.md` with status tracking
8. Update docs at end of each task - sync numbers between CLAUDE.md and README.md

## Environment Setup

### Required `.env` Variables (copy from `.env.example`)
| Category | Key Variables |
|----------|--------------|
| Frontend | `VITE_API_URL` (must include `/api/v1` suffix), `VITE_WS_URL` |
| Backend | `NODE_ENV`, `PORT`, `HOST`, `FRONTEND_URL` |
| Database | `DATABASE_URL` (PostgreSQL connection string) |
| Redis | `REDIS_URL` |
| JWT | `JWT_SECRET`, `JWT_REFRESH_SECRET` (min 32 chars each) |
| Storage | `R2_ENDPOINT`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `CDN_URL` |
| Email | `RESEND_API_KEY`, `EMAIL_FROM` |
| OAuth | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` |

### Service Startup (required at session start)
| Step | Command | Verify |
|------|---------|--------|
| 1. Docker | `npm run docker:up` | `docker ps` - bellor_postgres + bellor_redis |
| 2. API | `npm run dev:api` | `curl http://localhost:3000/health` |
| 3. Frontend | `npm run dev` | http://localhost:5173 |

**Empty DB?** → `cd apps/api && npx prisma db seed`

### Nginx Upload Config (required on QA/PROD servers)
| Setting | Value | Location |
|---------|-------|----------|
| `client_max_body_size` | `20m` | `/etc/nginx/sites-enabled/bellor` server block |

## Commands Reference

### Development
| Command | Description |
|---------|-------------|
| `npm run dev` | Frontend (port 5173) |
| `npm run dev:api` | Backend (port 3000) |
| `npm run dev:all` | Both (concurrently) |
| `npm run build` | Build all workspaces |
| `npm run lint` / `lint:fix` | Lint all workspaces |

### Database (Prisma)
| Command | Description |
|---------|-------------|
| `npm run prisma:generate` | Generate Prisma client after schema changes |
| `npm run prisma:migrate` | Create and apply migrations |
| `npm run prisma:studio` | Open Prisma Studio GUI |
| `cd apps/api && npx prisma db seed` | Seed database |

### Testing
| Command | Description |
|---------|-------------|
| `npm run test` | All tests |
| `npm run test:api` / `test:web` | Backend / Frontend only |
| `npm run test:e2e` | E2E (Playwright mocked) |
| `npm run test:e2e:fullstack` | E2E with real backend |
| `npm run test:e2e:fullstack:headed` | E2E headed mode (debug) |
| `npm run test:visual` | Visual regression (Playwright) |
| `npm run test:mutation` | Mutation testing (Stryker) |
| `npm run test:memory-leak` | Memory leak detection |
| `npm run check:memory-leaks` | AST-based leak scanning |
| `npm run test:p0` | Critical P0 smoke tests |
| `npm run test:domain:auth` | Domain: auth tests |
| `npm run test:domain:chat` | Domain: chat tests |
| `npm run test:domain:safety` | Domain: safety tests |
| `npm run test:domain:profile` | Domain: profile tests |
| `npm run check:file-length` | Enforce 150-line limit |
| `npm run check:build-urls` | Detect Mixed Content HTTP URLs in production build |

### Load Testing (k6)
| Command | Description |
|---------|-------------|
| `npm run load:smoke` | Quick smoke test |
| `npm run load:sustained` | Sustained load |
| `npm run load:stress` | Stress test |
| `npm run load:spike` | Spike test |
| `npm run load:memory` | Memory leak test |
| `npm run load:db` | DB performance |
| `npm run load:websocket` | WebSocket test |

### Mobile (Capacitor)
| Command | Description |
|---------|-------------|
| `npm run cap:build` | Build + sync to mobile |
| `npm run cap:sync` | Sync web assets to native |
| `npm run cap:open:android` / `ios` | Open in Android Studio / Xcode |

## Code Conventions

### Error Handling
- **Backend:** Fastify error handler + typed error responses. Throw `FastifyError` or custom errors with status codes
- **Frontend:** React Error Boundaries for UI crashes, try/catch in API calls, toast notifications for user errors
- **Always** return meaningful error messages - never expose internal details to client

### Validation
- **Auth routes:** Zod schemas (`apps/api/src/routes/v1/auth/auth-schemas.ts`)
- **All other routes:** Input sanitization via security middleware + field-level validation in services
- **Frontend:** React Hook Form + Zod for client-side validation before API calls

### Logging
- **Backend only:** Use Pino logger (`import { logger } from '../lib/logger'`)
- **Never** use `console.log` in production code
- **Log levels:** `error` for failures, `warn` for recoverable issues, `info` for key events, `debug` for development

## Testing Requirements

| Change Type | Required Tests |
|-------------|---------------|
| New feature | Unit + Integration + Memory Leak Detection |
| Bug fix | Regression test + Memory Leak Detection |
| API change | Integration tests for affected endpoints |
| UI change | Component tests + E2E |
| Code with timers/listeners/WebSocket | **Mandatory:** Memory Leak Detection |

### Test File Locations
| Type | Location |
|------|----------|
| Backend unit | `apps/api/src/services/*.test.ts` |
| Backend integration | `apps/api/src/test/integration/*.test.ts` |
| Frontend unit | `apps/web/src/**/*.test.{ts,tsx}` |
| E2E | `apps/web/e2e/*.spec.ts` |
| Full-stack E2E | `apps/web/e2e/full-stack/*.spec.ts` |
| Memory leak | `apps/*/src/test/memory-leak-detection.test.ts` |

**No merge/deploy without passing tests + memory leak checks.**

## Security

### Pre-commit Gate (every code change)
| Check | Rule |
|-------|------|
| XSS | No unsanitized HTML/JS injection |
| SQL Injection | All queries via Prisma ORM only |
| Command Injection | Never execute user input as commands |
| Secrets | No API keys, passwords, or tokens in code |
| Input Validation | All input validated (client + server) |
| File Upload | Magic bytes validation, filename sanitization |

**Iron rule:** No commit may weaken existing security (auth, validation, sanitization, middleware).
**Full checklist:** `docs/security/SECURITY_CHECKLIST.md`

## CI/CD (GitHub Actions)

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| `ci.yml` | Push/PR to main/master/develop | Lint + type check + security scan + load tests |
| `test.yml` | Push/PR to main/master/develop | Full test suite (PostgreSQL + Redis services) |
| `p0-gate.yml` | Push/PR to main/master/develop | Critical P0 smoke tests gate |
| `docker-build.yml` | PR to main/master/develop + tags | Multi-stage Docker builds + Trivy scan |
| `cd.yml` | Push to main/master | Deployment pipeline (K8s + Docker Compose) |
| `mutation.yml` | Manual/scheduled | Stryker mutation testing |
| `memory-leak-check.yml` | Manual/scheduled | Memory leak detection |

**Pre-commit hooks (Husky + lint-staged):** Auto-runs ESLint fix + file length check on staged files.

### Post-Push CI Verification (required after every push)
After every `git push`, verify that GitHub Actions workflows are running:

| Step | Command | Expected |
|------|---------|----------|
| 1. Check runs | `gh run list --limit 5` | Recent workflow runs visible |
| 2. Watch run | `gh run watch` | Live status of current run |
| 3. On failure | `gh run view <run-id> --log-failed` | View failure logs |

**Iron rule:** Every push must trigger CI. If `gh run list` shows no new runs after push, investigate workflow triggers immediately.

**Common issue:** Workflow branch filters (`branches: [main, develop]`) must include the actual branch name (`master`). All workflows must list `[main, master, develop]`.

## Git Policy

| Trigger | Action |
|---------|--------|
| Bug fix | Commit immediately |
| Complete feature | Commit at completion |
| Refactoring | Commit after logical change |
| End of day | Commit + Push for backup |

**Flow:** Claude proposes commit → User approves → Claude executes.
**Never auto-commit without user approval.**

## Bug Fix Protocol

1. **Read logs first** - API, DB, Redis, Frontend console. No fix without reading logs
2. **If no logs exist** - add logging as part of the fix
3. **Fix** the root cause
4. **Create regression tests** (unit/integration)
5. **Document** in `docs/project/OPEN_ISSUES.md`:
   - Status: 🔴 Open → 🟡 In Progress → ✅ Fixed
   - Severity: 🔴 Critical / 🟡 Medium / 🟢 Low
   - Files, problem, solution, tests

**Iron rule:** Never fix a bug without reading the logs first. No logs = part of the bug.

## Parallel Execution (Agents)

- Before each task - check if it can be split into independent parts
- **Always prefer parallel over sequential** when no dependencies exist
- Every Agent output must pass security review before merging
- **Never** run `npx vitest run` on entire monorepo in parallel - run `apps/web` and `apps/api` separately

### Agent Tracking Table (required when running parallel)
| Column | Values |
|--------|--------|
| Agent | Agent-N |
| Task | Description |
| Status | ⏳ Waiting / 🟡 Running / ✅ Done / 🔴 Failed |

### OOM Protection
| Event | Action |
|-------|--------|
| First OOM | Reduce agents by 20% |
| Repeated OOM | Continue reducing until 1 agent |
| Single agent + OOM | `NODE_OPTIONS=--max-old-space-size=8192` |

## Documentation Sync

| File | When to Update | What to Sync |
|------|---------------|--------------|
| `CLAUDE.md` | Work rules change | AI instructions, permissions |
| `README.md` | Stats/numbers change or new feature | Test counts, stage status, Features section |
| `docs/product/PRD.md` | New feature added | Feature docs, user stories, technical requirements |
| `docs/project/OPEN_ISSUES.md` | Every task/bug | Status, history |

## MCP Servers (Mandatory)

Claude **must** use the following MCP servers when they are relevant to the task at hand. Do not fall back to manual alternatives when an MCP tool is available.

**All MCPs in `.mcp.json` (project-level, single source of truth):**
VS Code extension only loads project-level `.mcp.json` reliably. Do NOT put MCPs in `~/.claude/mcp.json`.

| # | Server | Use When |
|---|--------|----------|
| 1 | **github** | CI runs, PRs, issues, Actions workflows, code search on GitHub |
| 2 | **context7** | Looking up docs for React, Fastify, Prisma, Tailwind, Radix, Vite, Capacitor |
| 3 | **figma** | Accessing Figma design files and components |
| 4 | **tavily** | Deep web research, documentation lookup, technical research |
| 5 | **postgres** | DB schema inspection, data queries (requires Docker running) |
| 6 | **prisma** | Migration status, schema exploration (built-in `prisma mcp`) |
| 7 | **memory** | Persisting knowledge across sessions (architectural decisions, gotchas) |
| 8 | **sequential-thinking** | Complex architectural decisions, multi-step debugging, planning |
| 9 | **eslint** | Linting files proactively during code generation |
| 10 | **playwright** | Browser automation, debugging E2E tests, validating UI in real time |

### Skipped (no safe npm alternative)
- ~~redis~~ - npm options immature, use `redis-cli` via bash
- ~~docker~~ - npm options immature, use `docker` CLI via bash

### MCP Usage Rules
1. **CI Verification:** After every `git push`, use the `github` MCP to check CI status.
2. **Library Docs:** Before writing code that uses external libraries, use `context7` to fetch current documentation.
3. **UI Validation:** When fixing UI bugs or adding visual changes, use `playwright` MCP to navigate and verify.
4. **DB Debugging:** When investigating data issues, use `postgres` MCP for queries or `prisma` MCP for schema/migrations.
5. **Structured Reasoning:** For architectural decisions or complex debugging spanning 3+ services, use `sequential-thinking`.
6. **Code Quality:** Use `eslint` MCP to lint modified files before committing.
7. **Cross-Session Memory:** Use `memory` MCP to store and retrieve project-specific patterns and gotchas.
8. **Deep Research:** Use `tavily` MCP for web research when built-in search is insufficient.

**Iron rule:** If an MCP server provides a tool for the task, use it. Do not bypass MCP tools with manual bash commands or workarounds.

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Docker not running | `npm run docker:up` |
| API down (3000) | `npm run dev:api` |
| Frontend down (5173) | `npm run dev` |
| Empty DB | `cd apps/api && npx prisma db seed` |
| Prisma schema out of sync | `npm run prisma:generate` |
| Migration needed | `npm run prisma:migrate` |
| OOM during tests | Run `apps/web` and `apps/api` tests separately |
| Pre-commit hook fails | Run `npm run lint:fix` then re-stage |
| Upload 413 error | Add `client_max_body_size 20m;` to nginx server block |
