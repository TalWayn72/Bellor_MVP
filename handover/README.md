# Bellor MVP — Handover Package

Welcome. This folder contains everything you need to take ownership of the **Bellor** dating/social-networking application and run it independently.

> **Repository:** https://github.com/TalWayn72/Bellor_MVP
> **Status:** Production-ready MVP, no real users yet — safe to start fresh.
> **Stack (TL;DR):** React + Vite (web) · Fastify + Prisma + PostgreSQL + Redis (api) · Capacitor (mobile) · Docker + Kubernetes (deploy)

---

## How to use this folder

Read the documents **in order**. Each one builds on the previous:

| # | File | What it covers |
|---|------|----------------|
| 1 | [`01-GETTING-STARTED.md`](./01-GETTING-STARTED.md) | Clone the repo, install dependencies, set up `.env`, start Docker, run the app locally. End-to-end from zero to a working dev environment. |
| 2 | [`02-EXTERNAL-SERVICES.md`](./02-EXTERNAL-SERVICES.md) | The 3rd-party accounts you must create yourself: Cloudflare R2 (file storage), Resend (email), Google OAuth (login). Step-by-step for each. |
| 3 | [`03-CI-CD-SECRETS.md`](./03-CI-CD-SECRETS.md) | The GitHub Actions secrets you need to set so CI/CD passes and Docker images publish. |
| 4 | [`04-PROJECT-OVERVIEW.md`](./04-PROJECT-OVERVIEW.md) | High-level tour of the codebase: monorepo layout, key folders, conventions, where things live. |
| 5 | [`05-HANDOVER-CHECKLIST.md`](./05-HANDOVER-CHECKLIST.md) | Combined checklist for the receiving team: every action from "got the repo link" through "fully running in your own production environment". |

After those, dig into the deeper documentation in [`docs/`](./docs/) and the original repo files in [`repo-files/`](./repo-files/).

---

## What's in `docs/`

A complete copy of the project documentation as it exists in the repo. Same content, organized by topic:

### Architecture & API
- [`docs/architecture/ARCHITECTURE.md`](./docs/architecture/ARCHITECTURE.md) — Mermaid diagrams: system overview, backend/frontend architecture, database ERD, deployment, CI/CD, real-time flows, auth flow.
- [`docs/api/API_ENDPOINTS.md`](./docs/api/API_ENDPOINTS.md) — Full REST API reference, every endpoint with request/response shape.
- [`docs/api/NEW_API_CLIENT.md`](./docs/api/NEW_API_CLIENT.md) — Frontend API client structure (Axios + service layer).

### Product
- [`docs/product/PRD.md`](./docs/product/PRD.md) — Product Requirements Document. Read first if you're new to the *product*, not just the code.
- [`docs/product/MOBILE_APP_REQUIREMENTS.md`](./docs/product/MOBILE_APP_REQUIREMENTS.md) — Mobile-specific (Capacitor) requirements.

### Deployment
- [`docs/deployment/QUICK_DEPLOY_GUIDE.md`](./docs/deployment/QUICK_DEPLOY_GUIDE.md) — Fastest path to production.
- [`docs/deployment/CLOUD_AGNOSTIC_DEPLOYMENT.md`](./docs/deployment/CLOUD_AGNOSTIC_DEPLOYMENT.md) — Deploy on any cloud (recommended reading).
- [`docs/deployment/ORACLE_CLOUD_QA_DEPLOYMENT.md`](./docs/deployment/ORACLE_CLOUD_QA_DEPLOYMENT.md) — Free-tier QA setup using Oracle Cloud.
- [`docs/deployment/FREE_HOSTING_OPTIONS.md`](./docs/deployment/FREE_HOSTING_OPTIONS.md) — Comparison of free hosting providers.
- [`docs/deployment/BETA_LAUNCH_CHECKLIST.md`](./docs/deployment/BETA_LAUNCH_CHECKLIST.md) — Pre-launch verification steps.
- [`docs/deployment/MOBILE_RELEASE_CHECKLIST.md`](./docs/deployment/MOBILE_RELEASE_CHECKLIST.md) — Mobile app release process.
- [`docs/deployment/GOOGLE_PLAY_DEPLOYMENT.md`](./docs/deployment/GOOGLE_PLAY_DEPLOYMENT.md) — Publishing to Google Play Store.
- [`docs/deployment/DEPLOYMENT_INFRASTRUCTURE_COMPLETE.md`](./docs/deployment/DEPLOYMENT_INFRASTRUCTURE_COMPLETE.md) — Detailed infrastructure reference.

### Development
- [`docs/development/GUIDELINES.md`](./docs/development/GUIDELINES.md) — Coding conventions, file-length rule, testing expectations, security rules.
- [`docs/development/DOCKER_SETUP_WINDOWS.md`](./docs/development/DOCKER_SETUP_WINDOWS.md) — Docker Desktop on Windows.

### Security
- [`docs/security/SECURITY_PLAN.md`](./docs/security/SECURITY_PLAN.md) — Overall security strategy.
- [`docs/security/SECURITY_CHECKLIST.md`](./docs/security/SECURITY_CHECKLIST.md) — Pre-commit security checks.
- [`docs/security/INCIDENT_RESPONSE.md`](./docs/security/INCIDENT_RESPONSE.md) — What to do when something goes wrong.
- [`docs/security/DATA_RETENTION_POLICY.md`](./docs/security/DATA_RETENTION_POLICY.md) — User data retention/deletion policy.

### Testing
- [`docs/testing/CONVENTIONS.md`](./docs/testing/CONVENTIONS.md) — How tests are written and organized.
- [`docs/testing/TEST_REGISTRY.md`](./docs/testing/TEST_REGISTRY.md) — Inventory of every test suite.
- [`docs/testing/E2E_FULLSTACK.md`](./docs/testing/E2E_FULLSTACK.md) — End-to-end full-stack testing.

### Project Status
- [`docs/project/OPEN_ISSUES.md`](./docs/project/OPEN_ISSUES.md) — Live tracker of open bugs/tasks. Important.
- [`docs/project/PROJECT_STATUS.md`](./docs/project/PROJECT_STATUS.md) — Current state of the MVP.

### Reports
- [`docs/reports/PERFORMANCE_BASELINE.md`](./docs/reports/PERFORMANCE_BASELINE.md) — Performance benchmarks.
- [`docs/reports/TECHNICAL_REPORT.md`](./docs/reports/TECHNICAL_REPORT.md) — Technical health report.

---

## What's in `hebrew-docs/`

Project documentation originally written in Hebrew (Microsoft Word format). These complement — but don't replace — the English docs in `docs/`. If your team includes Hebrew readers, start here for a higher-level perspective from the original maintainer.

- [`hebrew-docs/20260103_סקירה כללית.docx`](./hebrew-docs/20260103_סקירה כללית.docx) — General overview (Jan 2026).
- [`hebrew-docs/מסמך ניהול המוצר.docx`](./hebrew-docs/מסמך ניהול המוצר.docx) — Product management document.
- [`hebrew-docs/20260328_Bellor_דוח טכני.docx`](./hebrew-docs/20260328_Bellor_דוח טכני.docx) — Technical report (Mar 2026, ~2.6 MB — includes images/diagrams).

For non-Hebrew readers: the same information is covered in English across `docs/architecture/`, `docs/product/PRD.md`, and `docs/reports/TECHNICAL_REPORT.md`.

---

## What's in `repo-files/`

Copies of the most important top-level files from the repository, for reference without having to clone:

- [`repo-files/README.md`](./repo-files/README.md) — The repo's main README (quick-start instructions, demo accounts, badges).
- [`repo-files/CLAUDE.md`](./repo-files/CLAUDE.md) — Original AI-assistant instructions. Useful as a "house style" reference even if you don't use Claude. Lists conventions, commands, MCP setup.
- [`repo-files/DOCKER_SETUP.md`](./repo-files/DOCKER_SETUP.md) — Docker quick-start.
- [`repo-files/env.example.txt`](./repo-files/env.example.txt) — Template for the `.env` file. Every variable you need, with placeholder values.

---

## Quick orientation

If you have **15 minutes**, read in this order:
1. This file (you're done).
2. [`01-GETTING-STARTED.md`](./01-GETTING-STARTED.md) — sections 1-3.
3. [`04-PROJECT-OVERVIEW.md`](./04-PROJECT-OVERVIEW.md).
4. Skim [`docs/product/PRD.md`](./docs/product/PRD.md) for product context.

If you have **a full day**, follow the entire chain `01 → 02 → 03 → 04 → 05`, then read all of `docs/architecture/` and `docs/security/`.

---

## Important context

- **No real production users.** The database is empty in production. You can wipe and re-seed freely without notifying anyone. The `prisma db seed` command creates 50 demo users (English/Hebrew/Spanish/German/French) with realistic data.
- **Hebrew language support is built-in.** The app supports RTL/LTR. Code is in English; some original docs and commit messages may be in Hebrew.
- **The repo is private.** You'll receive collaborator access (or full ownership transfer) on GitHub.
- **Container images are published to GitHub Container Registry** (`ghcr.io/TalWayn72/Bellor_MVP/api` and `/web`). Once you have repo access, `docker pull` works automatically.
- **`.env` files are NOT in git.** All real secrets (JWT keys, API keys) must be created or generated by you — see `02-EXTERNAL-SERVICES.md`.

---

## Questions?

The original maintainer's contact info will be provided alongside this folder. For everything else: every command, every endpoint, every architectural decision is documented somewhere in `docs/`. When in doubt, grep.
