# 05 — Handover Checklist

A combined, actionable checklist for both sides of the handover.

---

## Part A — For the previous maintainer (Tal)

Things you need to do to complete the handover. Check each off as you finish.

### Repository

- [ ] Decide: **transfer ownership** of the GitHub repo to the new team's account, OR **add them as collaborators with admin role**.
  - **Transfer:** GitHub → repo → Settings → General → scroll to "Danger Zone" → **Transfer ownership**. Cleanest option; transfers issues, PRs, Actions history.
  - **Collaborator:** Settings → Collaborators and teams → **Add people** → grant **Admin** role. You retain ownership but they can do everything.
- [ ] Confirm they accepted the invitation and can clone the repo.
- [ ] Send them this entire `handover/` folder (zip it or commit it to a branch they can clone).

### GitHub Actions / Container Registry

- [ ] Verify they can pull container images from `ghcr.io/TalWayn72/Bellor_MVP/api` and `/web` (depends on repo permissions — Admin role is enough).
- [ ] If you transferred ownership, the registry URL changes too. New URL will be `ghcr.io/<their-org>/Bellor_MVP/...`. Existing pushed images stay accessible at the old URL for a while but stop receiving new builds.

### External services — decide for each

For every external service you currently own, choose one:

| Service | Option A: transfer to them | Option B: they create their own |
|---------|---------------------------|----------------------------------|
| Cloudflare R2 | Add them as a member of your Cloudflare account, then later they can move the bucket to their own account | They follow `02-EXTERNAL-SERVICES.md` and create new bucket from scratch (recommended since no real data exists) |
| Resend | Add their email as a Team member in Resend | They create their own account (recommended) |
| Google Cloud (OAuth) | Transfer the project ownership in IAM | They create their own project (recommended) |
| Domain (`bellor.app`?) | Transfer at registrar (Cloudflare/Namecheap/etc.) | They register their own domain |
| Server / VPS / K8s cluster | Transfer access | They provision their own (recommended for cleaner separation) |

**Recommended path:** Since there are no real users and no production data, **option B for everything**. The new team gets a 100% clean slate, you owe them nothing afterward, no shared dependencies. The handover guide is built for this.

### Secrets handover

- [ ] If they're starting clean (recommended): **don't share any secrets.** They'll generate their own. You're done.
- [ ] If they want continuity: share the **production `.env` files** via a secure channel (1Password / Bitwarden shared vault). **Never** via email or Slack.
  - `.env` (root)
  - `apps/api/.env`
  - GitHub Actions secrets (export the names; they re-create the values)

### Knowledge transfer

- [ ] Optional but valuable: schedule a 30-minute call to walk them through the architecture and answer questions.
- [ ] Make sure they have your contact info for follow-up questions during the first 1–2 weeks.

### Final cleanup (after they confirm everything works)

- [ ] Revoke your access to their external services accounts.
- [ ] Delete or rotate your old production secrets so they can't be reused.
- [ ] Archive your local copy of the project if you no longer need it.

---

## Part B — For the new team

Run this checklist top to bottom on day one.

### Setup

- [ ] Accept GitHub repo invitation
- [ ] Verify `gh repo view <repo>` works
- [ ] Read [`README.md`](./README.md) (this handover folder's index)
- [ ] Read [`04-PROJECT-OVERVIEW.md`](./04-PROJECT-OVERVIEW.md)
- [ ] Skim [`docs/product/PRD.md`](./docs/product/PRD.md) for product context

### Local development

- [ ] Follow [`01-GETTING-STARTED.md`](./01-GETTING-STARTED.md) end to end
- [ ] App runs locally on `http://localhost:5173`
- [ ] Can log in with `demo_sarah@bellor.app` / `Demo123!`
- [ ] `npm run test:p0` passes
- [ ] `npm run lint` passes

### External services

- [ ] Cloudflare R2 account created, bucket created, env vars set
- [ ] Resend account created, sender domain verified, API key set
- [ ] Google OAuth project created, credentials set
- [ ] All three smoke-tested (upload photo, password reset email arrives, Google sign-in works)
- [ ] (Optional) Sentry, Twilio, Firebase configured if needed

### Production deployment

- [ ] Provision your hosting (K8s cluster / VPS / Oracle Cloud free tier — see [`docs/deployment/`](./docs/deployment/) for options)
- [ ] Provision production PostgreSQL + Redis
- [ ] Provision a domain
- [ ] Configure DNS (point to your hosting; nginx config in `infrastructure/`)
- [ ] Set all GitHub Actions secrets per [`03-CI-CD-SECRETS.md`](./03-CI-CD-SECRETS.md)
- [ ] Push to master → `cd.yml` workflow runs → app deploys
- [ ] Run database migrations: `npx prisma migrate deploy` (in production environment)
- [ ] Optionally seed demo data: `npx prisma db seed`
- [ ] Verify production health: `curl https://api.yourdomain.com/health`
- [ ] Verify frontend loads: `https://yourdomain.com`

### Mobile (optional, if publishing apps)

- [ ] Apple Developer account ($99/year) — only if you'll publish iOS
- [ ] Google Play Developer account ($25 one-time) — only if you'll publish Android
- [ ] Generate Android keystore (`keytool -genkey ...`) and store in 1Password
- [ ] Configure mobile-related GitHub Actions secrets (`ANDROID_KEYSTORE_BASE64` etc.)
- [ ] Follow [`docs/deployment/MOBILE_RELEASE_CHECKLIST.md`](./docs/deployment/MOBILE_RELEASE_CHECKLIST.md)

### Operational readiness

- [ ] Set up Sentry alerts (errors, performance regressions)
- [ ] Set up uptime monitoring (UptimeRobot, Better Stack, etc.)
- [ ] Configure backup strategy for PostgreSQL (`pg_dump` cron OR managed backups via DB provider)
- [ ] Read [`docs/security/INCIDENT_RESPONSE.md`](./docs/security/INCIDENT_RESPONSE.md)
- [ ] Read [`docs/security/SECURITY_CHECKLIST.md`](./docs/security/SECURITY_CHECKLIST.md)
- [ ] Read [`docs/security/DATA_RETENTION_POLICY.md`](./docs/security/DATA_RETENTION_POLICY.md) — relevant for GDPR / app store compliance

### Knowledge transfer

- [ ] Have all developers on the team complete steps 1–3 of "Local development" individually
- [ ] One developer reads [`docs/architecture/ARCHITECTURE.md`](./docs/architecture/ARCHITECTURE.md) end-to-end and presents it to the team
- [ ] Review [`docs/project/OPEN_ISSUES.md`](./docs/project/OPEN_ISSUES.md) — these are the known TODOs / bugs you're inheriting
- [ ] Decide whether to keep the project's coding conventions (`CLAUDE.md`) or replace with your own

---

## Common questions

**Q: Can we delete `CLAUDE.md`?**
Yes. It's specific to the previous maintainer's workflow with the Claude AI assistant. The conventions inside it are still useful, but the file isn't load-bearing for the build or runtime. If you're not using Claude, feel free to delete or replace.

**Q: The repo is huge — what can we delete safely?**
Probably nothing without analysis. The repo includes load tests, mutation testing, mobile native code, and infrastructure-as-code. All of it is referenced somewhere. Recommend keeping everything until you've fully onboarded.

**Q: Do we need all 10 MCP servers listed in `.mcp.json`?**
No. Those are AI-assistant integrations for the Claude Code editor extension. If your team doesn't use Claude, you can delete `.mcp.json`. Doesn't affect the app at all.

**Q: What's the test count claim — 3,400+?**
Approximate. Run `npm run test` and check the actual number for your environment. The README has it as a milestone benchmark; some tests may be skipped depending on what's running (Docker required for integration tests).

**Q: We don't want to use Capacitor — can we just delete the mobile parts?**
Yes. Delete `apps/web/android/`, `apps/web/ios/`, `apps/web/capacitor.config.ts`, and remove `@capacitor/*` from `package.json`. The web app stands alone.

**Q: Do we have to deploy on Kubernetes?**
No. The repo includes K8s manifests, but `docker-compose.prod.yml` works for single-server deployment. See [`docs/deployment/CLOUD_AGNOSTIC_DEPLOYMENT.md`](./docs/deployment/CLOUD_AGNOSTIC_DEPLOYMENT.md) for alternatives.

---

## Sign-off

Once both Part A and Part B are 100% checked, the handover is complete.

Welcome to Bellor. Good luck.
