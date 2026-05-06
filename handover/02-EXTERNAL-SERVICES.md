# 02 — External Services Setup

The app depends on third-party services for storage, email, and authentication. The previous maintainer's accounts will **not** be transferred — you'll create your own. This guide walks you through each one.

> **You can skip this if you only want a local dev environment without uploads/email/Google login.** Set the related env vars to empty strings and the corresponding features will simply be disabled.

---

## Summary table

| Service | Purpose | Required for | Free tier? | Estimated setup time |
|---------|---------|-------------|-----------|---------------------|
| **Cloudflare R2** | File storage (profile photos, story media, chat attachments) | Uploads | Yes (10 GB free) | 20 min |
| **Resend** | Transactional email (verification, password reset) | Email features | Yes (3,000/month free) | 20 min (incl. domain verification) |
| **Google Cloud OAuth** | "Sign in with Google" | Google login | Yes | 20 min |
| **Twilio** *(optional)* | SMS verification | Phone-based signup | No (paid) | Skip unless needed |
| **Sentry** *(optional)* | Error tracking | Production monitoring | Yes (5K events/month) | 10 min |
| **Firebase Cloud Messaging** *(optional)* | Push notifications (mobile) | Mobile push | Yes | 30 min |

The first three are **strongly recommended**. The optional ones can wait until you're ready to launch.

---

## 1. Cloudflare R2 (file storage)

R2 is Cloudflare's S3-compatible object storage. The app uses it for all user-uploaded media.

### Steps

1. **Create a Cloudflare account** at https://cloudflare.com (free).
2. **Enable R2** from the dashboard: left sidebar → **R2 Object Storage** → **Purchase R2** (the free 10 GB tier requires a credit card on file but won't be charged at low usage).
3. **Create a bucket:**
   - Name: `bellor-media` (or any name you prefer; remember it)
   - Location: pick the closest to your users
4. **Make uploads readable via CDN:**
   - Bucket → **Settings** → **Public Access** → enable **Allow Access**
   - Or set up a Cloudflare Worker / custom domain for serving (production)
5. **Generate API credentials:**
   - R2 dashboard → **Manage R2 API Tokens** → **Create API token**
   - Permissions: **Object Read & Write**
   - Specify bucket: select the bucket you created
   - Save the **Access Key ID** and **Secret Access Key** — you only see the secret once
6. **Find your endpoint URL:**
   - Bucket → **Settings** → **S3 API** → copy the endpoint (looks like `https://<account-id>.r2.cloudflarestorage.com`)

### `.env` values

```bash
R2_ENDPOINT=https://<your-account-id>.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=<from step 5>
R2_SECRET_ACCESS_KEY=<from step 5>
R2_BUCKET=bellor-media
CDN_URL=https://<your-public-bucket-url-or-custom-domain>
```

### Verify

After filling in env vars and restarting the API:
```bash
curl -X POST http://localhost:3000/api/v1/uploads/test
```
Or upload a profile photo via the app UI and verify it appears in the R2 bucket browser.

---

## 2. Resend (transactional email)

Used for email verification, password reset, and notifications. The codebase uses the [`resend`](https://www.npmjs.com/package/resend) Node SDK in `apps/api/src/lib/email.ts`.

### Steps

1. **Create a Resend account** at https://resend.com (free tier: 3,000 emails/month, 100/day).
2. **Verify a sender domain** (required for production):
   - Resend dashboard → **Domains** → **Add Domain**
   - Enter your domain (e.g., `yourdomain.com`)
   - Add the DNS records Resend provides (SPF, DKIM, DMARC) to your domain registrar
   - Wait for verification (usually 5–30 minutes)
   - For dev/testing, Resend lets you send from `onboarding@resend.dev` to any verified email — no DNS setup needed
3. **Create an API key:**
   - Dashboard → **API Keys** → **Create API Key**
   - Name: `bellor-api`
   - Permission: **Sending access** (or **Full access** if you want to manage domains via API)
   - Copy the key — you only see it once. Format: `re_xxxxxxxxxxxxxxxxxxxxxxxxxxxx`

### `.env` values

```bash
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxx
EMAIL_FROM=Bellor <noreply@yourdomain.com>    # must use a verified domain (or onboarding@resend.dev for testing)
```

> **Note:** `EMAIL_FROM` accepts the `Name <email>` format. The display name is what users see in their inbox.

### Verify

Trigger a password reset from the login page. Check the inbox for `noreply@yourdomain.com` (or whatever address you set), or check the Resend dashboard → **Logs** to see the delivery status.

---

## 3. Google OAuth (Sign in with Google)

### Steps

1. **Go to Google Cloud Console:** https://console.cloud.google.com
2. **Create a new project** (or pick an existing one). Name it whatever you want, e.g., `Bellor`.
3. **Configure OAuth consent screen:**
   - APIs & Services → **OAuth consent screen**
   - User Type: **External** (unless you have Google Workspace and only employees use it)
   - Fill in: app name, support email, developer contact email
   - Scopes: add `userinfo.email`, `userinfo.profile`, `openid`
   - Test users (while in testing mode): add your own email
   - Save & continue through all steps
4. **Create OAuth credentials:**
   - APIs & Services → **Credentials** → **Create Credentials** → **OAuth client ID**
   - Application type: **Web application**
   - Authorized JavaScript origins:
     - `http://localhost:5173` (dev)
     - `https://yourdomain.com` (production)
   - Authorized redirect URIs:
     - `http://localhost:3000/api/v1/auth/google/callback` (dev)
     - `https://api.yourdomain.com/api/v1/auth/google/callback` (production)
   - Save → copy **Client ID** and **Client Secret**
5. **Publish the app** (when ready for real users):
   - OAuth consent screen → **Publish App**
   - For more than 100 users, Google may require app verification (takes 1–6 weeks)

### `.env` values

```bash
GOOGLE_CLIENT_ID=xxxxxxxxxxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxxxxxxxxxxx
```

### Verify

Click "Sign in with Google" in the app. The Google consent screen should appear. After approving, you should land back in the app, logged in.

---

## 4. (Optional) Apple Sign In

Required only if you'll publish on iOS App Store **and** offer Google Sign-In (Apple's policy mandates Apple SSO if you offer any third-party SSO).

Requires a paid Apple Developer account ($99/year). Process documented at https://developer.apple.com/sign-in-with-apple/.

### `.env` values

```bash
APPLE_CLIENT_ID=com.yourcompany.bellor
APPLE_TEAM_ID=ABCDE12345
APPLE_KEY_ID=ABCDE12345
```

---

## 5. (Optional) Twilio (SMS)

Used if you implement phone-number signup/verification. Currently the app supports it but it's optional.

Sign up at https://twilio.com → buy a phone number → get Account SID + Auth Token from the console.

### `.env` values

```bash
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxx
TWILIO_PHONE_NUMBER=+1234567890
```

---

## 6. (Optional) Sentry (error tracking)

Highly recommended for production. Free tier covers 5K events/month.

1. Sign up at https://sentry.io
2. Create two projects: one for `bellor-api` (Node.js), one for `bellor-web` (React)
3. Copy the **DSN** from each project's settings

### `.env` values

```bash
SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx        # backend
VITE_SENTRY_DSN=https://yyy@yyy.ingest.sentry.io/yyy   # frontend
```

---

## 7. (Optional) Firebase Cloud Messaging (mobile push)

Required for mobile push notifications on Android (and iOS via APNs bridge).

1. Go to https://console.firebase.google.com
2. Create a project → add an Android app and/or iOS app
3. Download `google-services.json` (Android) and place in `apps/web/android/app/`
4. Download `GoogleService-Info.plist` (iOS) and place in `apps/web/ios/App/App/`
5. For server-side sending: Firebase project → Settings → **Service accounts** → **Generate new private key** → save the JSON. Set the path in env or use it as `FIREBASE_SERVICE_ACCOUNT_JSON`.

See [`docs/product/MOBILE_APP_REQUIREMENTS.md`](./docs/product/MOBILE_APP_REQUIREMENTS.md) for full mobile setup.

---

## After all services are configured

Restart the API and frontend:
```bash
# Stop existing dev servers (Ctrl+C), then:
npm run dev:all
```

Run a smoke test of every service:
- Upload a profile photo → R2 ✓
- Trigger password reset → Resend ✓
- Click "Sign in with Google" → Google OAuth ✓

If all three work, you're fully provisioned. Move on to [`03-CI-CD-SECRETS.md`](./03-CI-CD-SECRETS.md) to add the same secrets to GitHub Actions for automated deployments.
