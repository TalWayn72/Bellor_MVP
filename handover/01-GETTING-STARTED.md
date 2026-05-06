# 01 — Getting Started (Zero to Running App)

This guide takes you from "I have nothing" to "the app is running on my laptop, I can log in, I can see chats and stories." Follow it top to bottom.

**Estimated time:** 30–60 minutes for local dev. Add ~2 hours if you also do step 7 (external services).

---

## 1. Prerequisites

Install these on your development machine:

| Tool | Minimum version | Why |
|------|-----------------|-----|
| **Node.js** | 20.x or higher | Runtime for both frontend and backend |
| **npm** | 9.x or higher | Comes with modern Node — verify with `npm -v` |
| **Docker Desktop** | latest | Runs PostgreSQL + Redis locally |
| **Git** | any recent | Cloning, pushing |
| **GitHub CLI (`gh`)** | optional but recommended | Easier CI/CD verification |

**Verify everything:**
```bash
node -v        # should print v20.x.x or higher
npm -v         # should print 9.x.x or higher
docker -v      # should print Docker version
git --version
```

---

## 2. Get Repository Access

Before you can clone, the previous maintainer must add you as a collaborator (or transfer ownership).

1. Accept the GitHub invitation in your email or at https://github.com/notifications.
2. Verify access:
   ```bash
   gh auth login                       # only first time
   gh repo view TalWayn72/Bellor_MVP   # should print repo metadata, no error
   ```
3. Verify you can pull container images from the registry:
   ```bash
   echo $YOUR_GITHUB_TOKEN | docker login ghcr.io -u YOUR_USERNAME --password-stdin
   docker pull ghcr.io/talwayn72/bellor_mvp/api:latest
   ```
   *(You need a GitHub personal access token with `read:packages` scope.)*

---

## 3. Clone & Install

```bash
git clone https://github.com/TalWayn72/Bellor_MVP.git
cd Bellor_MVP
npm install
```

This installs all workspaces (`apps/web`, `apps/api`, `packages/shared`, `packages/ui`). It will take 3–5 minutes the first time.

If you see warnings about peer dependencies — ignore them. Errors only matter if `npm install` actually exits non-zero.

---

## 4. Configure Environment

Copy the template and fill it in:

```bash
cp .env.example .env
cp .env.example apps/api/.env
```

Open `.env` and `apps/api/.env`. Every variable is documented in `02-EXTERNAL-SERVICES.md`. **For local dev, you only need to fill these to start:**

| Variable | Value for local dev |
|----------|-------------------|
| `NODE_ENV` | `development` |
| `PORT` | `3000` |
| `HOST` | `0.0.0.0` |
| `FRONTEND_URL` | `http://localhost:5173` |
| `DATABASE_URL` | `postgresql://bellor:bellor_dev@localhost:5432/bellor` |
| `REDIS_URL` | `redis://localhost:6379` |
| `JWT_SECRET` | Generate: `openssl rand -base64 48` |
| `JWT_REFRESH_SECRET` | Generate another: `openssl rand -base64 48` |
| `VITE_API_URL` | `http://localhost:3000/api/v1` *(must include `/api/v1` suffix)* |
| `VITE_WS_URL` | `ws://localhost:3000` |

The R2/Resend/Google OAuth variables can be **omitted entirely** for first-pass dev — uploads, email, and Google login won't work, but everything else will. To enable them, see `02-EXTERNAL-SERVICES.md`. (Note: leave optional URL fields like `SENTRY_DSN`, `R2_ENDPOINT`, `CDN_URL` either set with a real URL or **delete the line entirely** — empty values are now safely ignored, but commenting them out / removing the line is the cleanest signal.)

> **Windows users:** PowerShell equivalent for the `openssl` command:
> ```powershell
> [Convert]::ToBase64String((1..48 | ForEach-Object { Get-Random -Maximum 256 } | ForEach-Object { [byte]$_ }))
> ```
> Or just install Git Bash and run `openssl rand -base64 48` there.

---

## 5. Start Database & Redis

```bash
npm run docker:up
```

This starts two containers: `bellor_postgres` (PostgreSQL 16) and `bellor_redis` (Redis 7). Verify:

```bash
docker ps
```

You should see both containers in `Up` state. If not:
- Make sure Docker Desktop is actually running.
- Check ports 5432 and 6379 aren't already taken: `netstat -an | grep 5432`.

---

## 6. Set Up Database

```bash
npm run prisma:generate    # generate Prisma client
npm run prisma:migrate     # apply schema migrations
cd apps/api && npx prisma db seed && cd ../..
```

The seed creates **50 demo users** with realistic profiles, photos, chats, stories, and matches across 5 languages (English, Hebrew, Spanish, German, French). All demo accounts use password `Demo123!`.

**Verify the seed:**
```bash
npm run prisma:studio
```
Opens Prisma Studio at http://localhost:5555 — you should see all the tables populated.

---

## 7. (Optional) Set Up External Services

If you want full functionality (file uploads, password-reset emails, Google sign-in), follow [`02-EXTERNAL-SERVICES.md`](./02-EXTERNAL-SERVICES.md). You can skip this for first-pass local dev.

---

## 8. Run the App

```bash
npm run dev:all
```

This starts both servers concurrently:
- **Backend:** http://localhost:3000 (Fastify API)
- **Frontend:** http://localhost:5173 (Vite dev server)

If you prefer separate terminals:
```bash
npm run dev:api    # terminal 1
npm run dev        # terminal 2
```

**Verify it works:**
- Open http://localhost:5173 in a browser.
- Click "Login" and sign in with `demo_sarah@bellor.app` / `Demo123!`.
- You should land on the home feed with stories, missions, and chat threads visible.

---

## 9. Run the Tests

The repo has **3,400+ tests**. Smoke-test that you can run them:

```bash
npm run test:p0        # critical tests only — should be fast
npm run lint           # static checks
```

Full test suites:
```bash
npm run test:api       # backend unit + integration
npm run test:web       # frontend unit
npm run test:e2e       # Playwright end-to-end (mocked backend)
npm run test:visual    # visual regression
```

> **OOM warning:** Don't run `npx vitest run` at the monorepo root in parallel — it will out-of-memory. Always run `apps/web` and `apps/api` test suites separately.

---

## 10. Mobile (optional, only if you'll publish iOS/Android)

```bash
npm run cap:build           # build web + sync to native projects
npm run cap:open:android    # opens Android Studio
npm run cap:open:ios        # opens Xcode (Mac only)
```

See [`docs/deployment/MOBILE_RELEASE_CHECKLIST.md`](./docs/deployment/MOBILE_RELEASE_CHECKLIST.md) for the full release process.

---

## Common Issues

| Problem | Fix |
|---------|-----|
| `Docker not running` | Start Docker Desktop, then re-run `npm run docker:up` |
| `Prisma Client errors` | `npm run prisma:generate` |
| `EADDRINUSE :3000` | `npx kill-port 3000` |
| `EADDRINUSE :5173` | `npx kill-port 5173` |
| Empty database after seed | `cd apps/api && npx prisma migrate reset` (re-seeds automatically) |
| Frontend can't reach API | Check `VITE_API_URL` includes `/api/v1` suffix |
| Pre-commit hook blocks commit | Run `npm run lint:fix`, re-stage files, commit again |

For more, see [`docs/development/GUIDELINES.md`](./docs/development/GUIDELINES.md) and the original [`repo-files/CLAUDE.md`](./repo-files/CLAUDE.md).

---

## Next Steps

- [`02-EXTERNAL-SERVICES.md`](./02-EXTERNAL-SERVICES.md) — Set up Cloudflare R2, Resend, Google OAuth so all features work.
- [`03-CI-CD-SECRETS.md`](./03-CI-CD-SECRETS.md) — Configure GitHub Actions secrets.
- [`04-PROJECT-OVERVIEW.md`](./04-PROJECT-OVERVIEW.md) — Tour of the codebase.
