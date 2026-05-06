# 03 — CI/CD Secrets Configuration

The repo's GitHub Actions workflows expect a set of **repository secrets** to be present in your GitHub repo settings. Without them, CI tests will run but deployment workflows will fail.

This guide lists every secret used by every workflow, how to set it, and which ones are mandatory vs. optional.

---

## Where to set secrets

GitHub → your fork/repo → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**

Or via `gh` CLI:
```bash
gh secret set SECRET_NAME --body "value"
gh secret set SECRET_NAME < secret.txt    # for multi-line secrets like SSH keys
```

---

## Mandatory secrets (deployment will fail without these)

These are needed for the `cd.yml` workflow to deploy to your Kubernetes cluster.

| Secret | Where it comes from | Notes |
|--------|---------------------|-------|
| `DATABASE_URL` | Your production PostgreSQL URL | e.g., `postgresql://user:pass@host:5432/bellor` |
| `REDIS_URL` | Your production Redis URL | e.g., `redis://host:6379` |
| `JWT_SECRET` | Generate with `openssl rand -base64 48` | Different from your dev value |
| `JWT_REFRESH_SECRET` | Generate with `openssl rand -base64 48` | Different from `JWT_SECRET` |
| `R2_ENDPOINT` | Cloudflare R2 dashboard | See `02-EXTERNAL-SERVICES.md` |
| `R2_ACCESS_KEY_ID` | Cloudflare R2 API token | |
| `R2_SECRET_ACCESS_KEY` | Cloudflare R2 API token | Only shown once at creation |
| `R2_BUCKET` | Your bucket name | e.g., `bellor-media-prod` |
| `CDN_URL` | Your public R2/CDN URL | Where uploaded files are served from |
| `FRONTEND_URL` | Your production frontend URL | e.g., `https://bellor.app` |
| `API_URL` | Your production API URL | e.g., `https://api.bellor.app` |
| `VITE_API_URL` | API URL with `/api/v1` suffix | e.g., `https://api.bellor.app/api/v1` |
| `VITE_WS_URL` | WebSocket URL | e.g., `wss://api.bellor.app` |
| `VITE_CDN_URL` | Same as `CDN_URL` | Used by frontend bundler at build time |
| `KUBECONFIG` | Your Kubernetes cluster config file | Paste the entire kubeconfig YAML as the secret value |

---

## Already provided by GitHub

These are **automatic** — you don't need to set them.

| Secret | Provided by | Used for |
|--------|-------------|----------|
| `GITHUB_TOKEN` | GitHub Actions | Pushing Docker images to `ghcr.io` |

---

## Optional — staging deployment

Only needed if you deploy to a separate staging environment via SSH (the workflow's `deploy-staging` job).

| Secret | Notes |
|--------|-------|
| `STAGING_HOST` | IP or hostname of your staging server |
| `STAGING_USER` | SSH username (e.g., `ubuntu`) |
| `STAGING_SSH_KEY` | Private SSH key (paste the entire `id_rsa` contents) |

If you don't deploy to a separate staging server, leave these unset and the staging job will be skipped.

---

## Optional — code coverage

| Secret | Notes |
|--------|-------|
| `CODECOV_TOKEN` | Get from https://codecov.io after linking your repo. Without it, coverage uploads in CI will fail silently — tests still pass. |

---

## Optional — mobile (Android / Google Play)

Only needed if you build signed Android APKs / publish to Google Play via CI.

| Secret | Notes |
|--------|-------|
| `ANDROID_KEYSTORE_BASE64` | Your release keystore, base64-encoded: `base64 -w 0 release.keystore` |
| `KEYSTORE_PASSWORD` | Keystore password |
| `KEY_PASSWORD` | Key alias password |
| `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON` | Full JSON of Google Play service account (one line). Create at Google Play Console → Setup → API access. |

If unset, the mobile workflow builds an unsigned debug APK (still useful for testing).

See [`docs/deployment/GOOGLE_PLAY_DEPLOYMENT.md`](./docs/deployment/GOOGLE_PLAY_DEPLOYMENT.md) for full mobile signing setup.

---

## Recommended — email + error tracking

| Secret | Notes |
|--------|-------|
| `RESEND_API_KEY` | Resend API key for transactional email (password reset, etc.). Without it, email features silently no-op. |
| `EMAIL_FROM` | Sender address, format `Name <email@verified-domain.com>`. Domain must be verified in Resend. |
| `SENTRY_DSN` | Sentry project DSN for the API |
| `VITE_SENTRY_DSN` | Sentry project DSN for the frontend |

> **Heads-up about the deployment workflow:** The current `cd.yml` does **not** auto-inject `RESEND_API_KEY` / `EMAIL_FROM` / `SENTRY_DSN` into the Kubernetes secret. If you use email in production, either:
> - Add them to the `kubectl create secret` command in `.github/workflows/cd.yml` (and reference them in the deployment manifest), OR
> - Set them manually on the cluster: `kubectl create secret generic bellor-email --from-literal=resend-api-key="..."`

---

## Verifying your secrets

After setting all the mandatory secrets, push a commit to `master` (or trigger the workflow manually):

```bash
gh workflow run cd.yml
gh run watch
```

Common failures:
| Error in CI logs | Cause |
|------------------|-------|
| `Error: Process completed with exit code 1` in "Login to GHCR" | `GITHUB_TOKEN` permissions issue. Settings → Actions → General → Workflow permissions → enable "Read and write permissions". |
| `kubectl: command not found` or kube errors | `KUBECONFIG` is missing or malformed. Paste the entire contents of `~/.kube/config` as the secret. |
| `Image push denied` | Your repo needs Packages write permission. Settings → Actions → General → Workflow permissions. |
| Build args undefined | A `VITE_*` secret is missing — frontend build needs them at build time. |

---

## Secret rotation policy

Recommended rotation schedule:
- **JWT secrets:** every 6 months (will sign out all users when rotated — plan accordingly).
- **R2 keys:** every 12 months or when an employee leaves.
- **Resend API key:** every 12 months (or rotate immediately if leaked).
- **Google Play service account:** when an admin leaves.

To rotate without downtime: create the new secret, update the GitHub secret, redeploy. The new pods pick up the new value.

---

## Going further

- For full deployment infrastructure context: [`docs/deployment/CLOUD_AGNOSTIC_DEPLOYMENT.md`](./docs/deployment/CLOUD_AGNOSTIC_DEPLOYMENT.md)
- For the actual CI/CD workflow files: see `.github/workflows/` in the repo root
- For deployment troubleshooting: [`docs/deployment/DEPLOYMENT_INFRASTRUCTURE_COMPLETE.md`](./docs/deployment/DEPLOYMENT_INFRASTRUCTURE_COMPLETE.md)
