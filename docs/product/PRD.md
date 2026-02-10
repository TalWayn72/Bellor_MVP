# Bellor -- Product Requirements Document

**Document Version:** 2.0.0 | **Date:** February 10, 2026 | **App Version:** 1.0.0-beta | **Status:** Production Ready | **Classification:** Confidential

---

## 1. Executive Summary

**Bellor** is a modern dating and social networking platform that fosters genuine connections through interactive daily missions, ephemeral stories, real-time chat, and gamified achievements. Unlike swipe-based dating apps, Bellor encourages users to express themselves through audio, video, drawings, and writing before discovering matches.

**Target market:** Adults aged 25-45 seeking romantic relationships or meaningful friendships, globally, with support for 5 languages (EN, HE, ES, DE, FR). Available on web, Android, and iOS.

| Differentiator | Description |
|----------------|-------------|
| Mission-driven matching | Daily challenges reveal personality before swiping |
| Multi-format expression | Text, audio, video, and drawing responses -- not just photos |
| Gamification layer | Achievements, XP, badges reward engagement and reduce churn |
| Ephemeral stories | 24-hour content encourages daily return visits |
| Temporary-to-permanent chat | Time-limited conversations; mutual interest converts them to permanent |
| Fully self-hosted | Zero vendor lock-in -- any cloud, on-prem, or free-tier hosting |

**Current state:** 9 of 10 phases complete. 3054+ automated tests, zero TypeScript errors, multi-layer security, production-grade Docker/Kubernetes infrastructure.

---

## 2. Product Vision

**Mission:** Build a dating platform where authentic self-expression leads to meaningful connections, powered by an engaging daily-challenge format that rewards genuine participation.

| Goal | Target | Timeframe |
|------|--------|-----------|
| Public beta | 100 active users | Q1 2026 |
| Mobile store presence | Android + iOS | Q2 2026 |
| D30 retention | > 25% | Q2 2026 |
| Premium conversion | > 5% of active users | Q3 2026 |
| Mission completion | > 40% of DAU | Ongoing |
| API p95 latency | < 200 ms | Ongoing |
| Uptime | > 99.9% | Ongoing |

---

## 3. User Personas

**Maya, 29 -- "The Intentional Dater":** Marketing manager in Tel Aviv. Tired of shallow swipe culture, completes daily missions and records audio responses. Bellor's missions surface personality; temporary chat creates urgency to connect authentically.

**Carlos, 34 -- "The Social Explorer":** Freelance photographer in Barcelona. Seeks both friendships and romance. Engages with video tasks and stories. Bellor's positive-like system enables platonic connections; SharedSpace creates community.

**Lena, 27 -- "The Achiever":** Software engineer in Berlin. Gamification enthusiast who tracks XP, unlocks achievements, and maintains streaks. Bellor's achievement system and referral program sustain engagement.

**Admin Team -- "Platform Administrators":** Internal operations managing moderation and safety. Uses the 7-page admin dashboard for analytics, user management, report review, and system configuration.

---

## 4. Feature Catalog

### 4.1 Authentication & Onboarding

Email+password registration (bcrypt 12 rounds, Zod validation), JWT auth (15-min access + 7-day refresh in Redis), Google OAuth, brute force protection (5 attempts / 15-min lockout), password reset via email (Resend API, 1-hour token), and a **14-step onboarding**: welcome, name, birthdate (18+), gender, photos (up to 6), bio, interests, occupation/education, preferences (gender/age/distance), location, canvas drawing, language, notification prefs, privacy settings.

### 4.2 User Profiles & Discovery

Profile viewing/editing (photos, bio, interests, occupation, drawing, achievements), user search (name/email, case-insensitive, paginated), discovery feed with filters, user statistics, privacy controls (online status, distance, age visibility, private profile), GDPR data export and right to erasure, profile boost (premium).

### 4.3 Matchmaking & Compatibility

Three like types: romantic, positive (friendship), super (premium). Mutual match auto-notification. Compatibility quiz. Like history (sent/received). Unlike capability.

### 4.4 Real-Time Chat & Messaging

Socket.io with JWT handshake. Temporary chats (auto-expire) and permanent chats. 5 message types: text, voice, image, video, drawing. Typing indicators, read receipts, message deletion, unread count. Redis-backed online presence with heartbeat. FCM push fallback for offline recipients. Live chat interface.

| WebSocket Events | Client-to-Server | Server-to-Client |
|-----------------|-----------------|-----------------|
| Presence | `presence:online`, `presence:heartbeat` | `user:online`, `user:offline` |
| Chat | `chat:join`, `chat:send`, `chat:typing`, `chat:read` | `chat:message`, `chat:typing`, `chat:read` |
| Delete | `chat:message:delete` | `chat:message:deleted` |

### 4.5 Stories & Ephemeral Content

Upload image/video with caption, 24-hour auto-expiry, story feed grouped by user, view tracking, full-screen viewer modal (auto-advance, left/right navigation), per-user story views, statistics, admin cleanup.

### 4.6 Daily Missions & Tasks

4 mission types: daily, weekly, special, ice_breaker. Difficulty 1-5. Response types: text, audio, video, drawing. SharedSpace public feed with likes and view counts. XP rewards per completion. Dedicated task pages: AudioTask, VideoTask, WriteTask, Drawing creation (canvas tool).

### 4.7 Achievements & Gamification

Named badges with icon, description, JSON-based unlock requirements. Auto-unlock on server. XP rewards per achievement. User history with timestamps. Achievement statistics. Profile display of earned badges.

### 4.8 Premium & Subscriptions

Stripe-integrated: monthly/yearly plans, Checkout Sessions, Customer Portal, cancel/reactivate, payment history, webhook lifecycle events. Profile boost, referral program (invite friends, earn rewards). Admin plan management.

### 4.9 Push Notifications

Firebase Cloud Messaging (server-side via Admin SDK). Device registration (iOS/Android/Web). Offline chat push. In-app notification center (9 types: message, match, like, follow, mission, achievement, chat request, story view, system). Unread badge. Mark read (individual/bulk). Admin broadcast. Token cleanup.

### 4.10 Social Features

Follow/unfollow, follower/following lists (paginated), follow stats, follow status checks, blocked user management.

### 4.11 Admin Dashboard & Moderation

7 admin pages (admin-only middleware): **Dashboard** (metrics, health), **User Management** (search, block/unblock/verify, export), **Report Management** (review by status/priority, actions), **Chat Monitoring**, **Activity Monitoring**, **System Settings** (feature flags, AppSettings), **Pre-Registration** (waitlist). Analytics endpoints: user growth, content metrics, moderation stats, top users. Maintenance: story cleanup, background jobs, data export (JSON/CSV).

### 4.12 Content Moderation

Report users for 6 reasons (spam, harassment, inappropriate, fake profile, underage, other). Link to content type (message, response, story, profile). Priority 1-5. Workflow: pending -> reviewed -> action taken / dismissed. Admin review with notes and timestamps.

### 4.13 File Upload & Media

Profile images (6 max), story media, audio recordings, drawings, video, response media, presigned URLs (S3-compatible), local storage + optional Cloudflare R2, HTML5 audio playback in feed.

### 4.14 Additional Pages

SharedSpace (feed), Matches, Notifications, Settings (theme/privacy/notifications/filters/blocked/language), Premium, Analytics, Discover, DateIdeas, IceBreakers, SafetyCenter, FAQ, Feedback, VirtualEvents, VideoDate, EmailSupport, HelpSupport, PrivacyPolicy, TermsOfService, UserVerification, Splash/Welcome, OAuthCallback.

---

## 5. Technical Architecture

For detailed Mermaid diagrams see [docs/architecture/ARCHITECTURE.md](../architecture/ARCHITECTURE.md) (8 diagrams: system overview, backend/frontend architecture, ER diagram, deployment, CI/CD, WebSocket flow, auth flow).

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| Frontend | React, Vite, TypeScript, Tailwind CSS, Radix UI | 18.2, 6.1, 5.8, 3.4 | SPA with 50+ components |
| State/Routing | TanStack Query, React Router, Framer Motion | 5.84, 6.26, 11.16 | Server state, routing, animations |
| Backend | Node.js, Fastify, Prisma, Zod, Socket.io | 20+, 5.2, 6.19, 3.23, 4.8 | API, ORM, validation, real-time |
| Payments/Push | Stripe SDK, Firebase Admin | 20.3, 13.6 | Subscriptions, FCM |
| Database | PostgreSQL, Redis | 16, 7 | Primary store (40+ indexes), cache/sessions/presence |
| Storage | Cloudflare R2 (optional) | -- | S3-compatible media storage |
| DevOps | Docker, Kubernetes, GitHub Actions | 24+, 1.28+ | Containers, orchestration, CI/CD |
| Monitoring | Prometheus, Grafana, Loki, Alertmanager | -- | Metrics, dashboards, logs, alerts |
| Mobile | Capacitor | -- | iOS + Android from web codebase |

**Key decisions:** Monorepo (npm workspaces) for shared types; Fastify over Express (2-3x throughput); Prisma for type-safe DB; Socket.io for auto-reconnect + Redis scaling; TanStack Query over Redux; Radix UI for accessible unstyled primitives; R2 for zero-egress media.

---

## 6. API Reference

All prefixed `/api/v1`. Auth via `Authorization: Bearer <JWT>` unless noted. **17 route groups, 100+ endpoints.**

### Auth & OAuth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | Register (returns tokens) |
| POST | `/auth/login` | Login (brute-force protected) |
| POST | `/auth/refresh` | Refresh access token |
| POST | `/auth/logout` | Invalidate session |
| GET | `/auth/me` | Current user |
| POST | `/auth/change-password` | Change password |
| POST | `/auth/forgot-password` | Request reset email |
| POST | `/auth/reset-password` | Reset with token |
| GET | `/oauth/google` | Google OAuth redirect |
| GET | `/oauth/google/callback` | Google callback |
| GET | `/oauth/status` | OAuth provider status |

### Users
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/users`, `/users/search`, `/users/:id` | List, search, get by ID |
| PATCH | `/users/:id`, `/users/:id/language` | Update profile, language |
| GET | `/users/:id/stats`, `/users/:id/export` | Stats, GDPR export |
| DELETE | `/users/:id`, `/users/:id/gdpr` | Deactivate, GDPR erasure |

### Chats
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/chats`, `/chats/:id`, `/chats/:id/messages` | List chats, get chat, get messages |
| POST | `/chats`, `/chats/:id/messages` | Create/get chat, send message |
| PATCH | `/chats/:id/messages/:mid/read` | Mark read |
| DELETE | `/chats/:id/messages/:mid` | Delete message |

### Missions & Responses
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/missions`, `/missions/today`, `/missions/:id` | List, today's, by ID |
| POST/PATCH/DELETE | `/missions`, `/missions/:id` | CRUD (admin) |
| GET | `/responses`, `/responses/my`, `/responses/:id` | List, mine, by ID |
| POST | `/responses`, `/responses/:id/like` | Create, like |
| DELETE | `/responses/:id` | Delete |

### Stories
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/stories/feed`, `/stories/my`, `/stories/stats` | Feed, mine, stats |
| GET | `/stories/:id`, `/stories/user/:uid` | By ID, by user |
| POST | `/stories`, `/stories/:id/view`, `/stories/cleanup` | Create, view, cleanup |
| DELETE | `/stories/:id` | Delete |

### Likes & Follows
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST/DELETE | `/likes/user`, `/likes/response` | Like/unlike user or response |
| GET | `/likes/received`, `/likes/sent`, `/likes/check/:id` | Received, sent, check |
| POST/DELETE | `/follows`, `/follows/:uid` | Follow/unfollow |
| GET | `/follows/followers`, `/follows/following`, `/follows/stats` | Lists, stats |
| GET | `/follows/check/:uid`, `/follows/user/:uid/*` | Check, user's followers/following |

### Notifications & Achievements
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/notifications`, `/notifications/unread-count` | List, unread count |
| POST/PATCH/DELETE | `/notifications/read-all`, `/:id/read`, `/:id` | Mark read, delete |
| GET | `/achievements`, `/achievements/my`, `/achievements/:id` | List, mine, by ID |
| POST | `/achievements/check` | Check and unlock |
| GET | `/achievements/user/:uid`, `/achievements/:id/stats` | User's, stats |

### Subscriptions & Payments
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/subscriptions/plans`, `/plans/:id`, `/my`, `/payments` | Plans, my sub, history |
| POST | `/subscriptions/checkout`, `/portal`, `/cancel`, `/reactivate`, `/plans` | Checkout, portal, manage |
| POST | `/webhooks/stripe` | Stripe webhook (signature-verified) |

### Uploads & Device Tokens
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/uploads/profile-image`, `/story-media`, `/audio`, `/drawing`, `/video`, `/response-media` | Upload media |
| GET/DELETE | `/uploads/status`, `/presigned-url`, `/profile-image` | Status, presign, delete |
| POST | `/device-tokens/register`, `/unregister`, `/test`, `/broadcast`, `/cleanup` | Push management |
| GET | `/device-tokens/my` | My devices |

### Admin (all admin-only)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/dashboard`, `/health` | Metrics, health |
| GET | `/admin/analytics/users`, `/content`, `/moderation`, `/top-users` | Analytics |
| GET/POST | `/admin/users`, `/users/action` | User management |
| GET/POST | `/admin/reports`, `/reports/action` | Report moderation |
| POST | `/admin/achievements`, `/cleanup/stories`, `/jobs/run` | Create, cleanup, jobs |
| GET | `/admin/export/users`, `/jobs` | Export, job status |

---

## 7. Database Schema

PostgreSQL 16, Prisma ORM. **18 entities, 17 enums, 40+ indexes.** Full schema: `apps/api/prisma/schema.prisma`.

| Entity | Purpose | Key Fields |
|--------|---------|------------|
| User | Profile, auth, preferences | email, passwordHash, googleId, profileImages[], interests[], location (JSON), privacy/notification flags |
| Chat | Conversation pair | user1Id, user2Id, status, isTemporary/isPermanent, expiresAt, messageCount |
| Message | Chat message | chatId, senderId, messageType (5 types), content, isRead |
| Mission | Challenge definition | title, missionType (4 types), difficulty 1-5, xpReward, activeFrom/Until |
| Response | Mission submission | userId, missionId, responseType (4 types), viewCount, likeCount |
| Story | 24h ephemeral | userId, mediaType (IMAGE/VIDEO), mediaUrl, viewCount, expiresAt |
| Achievement / UserAchievement | Badge system | name, requirement (JSON), xpReward / userId, unlockedAt |
| Like | Interest signal | userId, targetUserId/targetResponseId, likeType (ROMANTIC/POSITIVE/SUPER) |
| Follow | Social graph | followerId, followingId |
| Notification | In-app alerts | userId, type (9 types), title, message, isRead |
| Report | Moderation | reporterId, reportedUserId, reason (6 types), status, priority |
| SubscriptionPlan / Subscription / Payment | Billing | Stripe integration fields, status enums, billing cycle |
| DeviceToken | Push tokens | userId, token, platform (IOS/ANDROID/WEB) |
| AppSetting | Config KV | key, value, dataType, category |
| Referral | Invite tracking | referrerUserId, referredEmail, status |

---

## 8. Non-Functional Requirements

| Category | Requirement | Target / Implementation |
|----------|-------------|------------------------|
| **Performance** | API p50 / p95 / p99 | < 50ms / < 200ms / < 500ms (baseline: 12ms / 23ms smoke) |
| | WebSocket delivery | < 50ms |
| | Frontend TTI | < 3 seconds |
| **Scalability** | Concurrent users | 10,000+ (K8s HPA: 3-20 API pods, 2-10 web pods) |
| | WebSocket scaling | Redis adapter for cross-pod routing |
| | DB connections | PgBouncer pooling available |
| **Security** | Standards | OWASP Top 10, ASVS L2, CIS Docker, GDPR |
| | Input | Server sanitization, injection detection, Zod validation, field whitelists |
| | Auth | bcrypt 12 rounds, JWT (15min/7d), brute force lockout |
| | Media | Magic bytes, EXIF strip, re-encode, SVG blocked, size/resolution limits |
| | HTTP | CSP, HSTS, CORS, X-Frame-Options, COEP/COOP/CORP |
| | Container | Non-root, read-only FS, cap-drop ALL, no-new-privileges |
| | Client | SecureTextInput, SecureImageUpload, paste guards, secure hooks |
| | Audit | Security checklist 71/75 verified |
| **Reliability** | Uptime | 99.9% (K8s rolling updates, PDB minAvailable=2, health probes) |
| | Data durability | PostgreSQL WAL, Redis AOF |
| | DB transaction safety | Atomic paired writes via `prisma.$transaction()` - responses, likes, chat messages |
| | Circuit breaker | Fault tolerance for external APIs (Stripe, Firebase, Resend) - auto-open on failures |
| | Global error handler | Standardized AppError class with code+status, unhandled rejection/exception capture |
| | Incident response | P1-P4 procedures ([INCIDENT_RESPONSE.md](../security/INCIDENT_RESPONSE.md)) |
| **Rate Limiting** | Endpoint-specific | Login 5/15min, register 3/hr, chat 30/min, search 20/min, upload 10/min |
| **Caching** | Redis cache-aside | User profiles (5min), stories (2min), missions (5min), achievements (10min) |
| **WebSocket** | Heartbeat | Ping 25s / timeout 20s, TTL 300s, stale socket cleanup every 60s |
| **Network Security** | K8s NetworkPolicy | Pod-to-pod traffic restriction (web→api→db), RBAC with least privilege |
| **DB Performance** | Optimized indexes | 40+ indexes including compound (isActive+gender, isActive+lastActiveAt, chatRoomId+createdAt) |
| **Auth Optimization** | JWT admin caching | `isAdmin` in JWT payload eliminates N+1 DB queries on admin endpoints |
| **Frontend** | Auth guards | ProtectedRoute component with splash screen, admin route validation |
| | Context optimization | useMemo on AuthContext and SocketProvider to prevent unnecessary re-renders |
| | Image lazy loading | `loading="lazy"` across all image-rendering components (15+) |
| | Accessibility | aria-labels, htmlFor, focus management on interactive components |
| | Type safety | All 14 API services in TypeScript with typed interfaces and return values |
| **Observability** | Metrics / Dashboards | Prometheus + Grafana (request rate, latency, errors, WS, DB) |
| | Business metrics | Custom counters: chat_messages_total, matches_total, registrations_total, payment_attempts_total |
| | Logs / Alerts | Loki + Promtail (structured JSON, correlation IDs) / Alertmanager |

---

## 9. Deployment & Infrastructure

| Method | Command | Scale |
|--------|---------|-------|
| Dev | `npm run docker:up && npm run dev:all` | Single |
| Prod (Docker) | `docker compose -f docker-compose.prod.yml up -d` | Single |
| Prod (scale) | `docker compose -f infrastructure/docker/docker-compose.production.yml up -d --scale api=5` | 3-20 replicas |
| All-in-one | `docker compose -f infrastructure/docker/docker-compose.all-in-one.yml up -d` | 275 MB |
| Kubernetes | `kubectl apply -f infrastructure/kubernetes/` | 3-10+ HPA pods |

**CI/CD (GitHub Actions):** `ci.yml` (lint, test, build, security), `test.yml` (unit+E2E), `docker-build.yml` (multi-platform build, Trivy, GHCR push on `v*.*.*`), `cd.yml` (deploy, migrate, verify).

**Container Registry:** `ghcr.io/TalWayn72/bellor_mvp/{api,web}:<version>`

**Monitoring:** Prometheus (:9090), Grafana (:3001), Loki (:3100), Alertmanager (:9093) via `infrastructure/docker/docker-compose.monitoring.yml`.

---

## 10. Mobile Application

Capacitor wraps the React web app for Android and iOS (single codebase).

| Item | Status |
|------|--------|
| Capacitor config + both platforms | Complete |
| npm scripts (cap:sync, cap:build, cap:open:*) | Complete |
| Android keystore + AAB build + Play Store listing | Pending |
| iOS App Store submission | Pending |

---

## 11. Roadmap

| Phase | Description | Status |
|-------|-------------|--------|
| 1-9 | Foundation, Backend, Real-time, Frontend, Admin, Testing, Deployment, Universal Deploy, Final Polish | Complete |
| 10 | Mobile App (Capacitor, Android/iOS) | 30% |
| 11 | Beta launch (100 users) | Planned |
| 12 | Production cloud deployment | Planned |
| 13-18 | Feature flags, Apple Sign-In, ML matching, WebRTC video, recommendation engine, GDPR enhancements | Future |

---

## 12. Success Metrics

| Metric | Current | Target |
|--------|---------|--------|
| Automated tests | 3054+ | > 3500 |
| TypeScript errors | 0 | 0 |
| Backend service coverage | 14/14 (100%) | 100% |
| Security checklist | 71/75 | 75/75 |
| API p95 (smoke/stress) | 23ms / 230ms | < 200ms / < 500ms |
| Registered users (post-launch) | -- | 1,000 (3 months) |
| DAU (post-launch) | -- | 200 (3 months) |
| D30 retention | -- | > 25% |
| Premium conversion | -- | > 5% (6 months) |
| App store rating | -- | > 4.2 |

---

## 13. Appendix

### Glossary

| Term | Definition |
|------|-----------|
| SharedSpace | Public feed of mission responses |
| Mission | Daily/weekly challenge (text/audio/video/drawing) |
| Response | User's submission to a mission |
| Story | 24-hour ephemeral image/video content |
| Temporary/Permanent Chat | Time-limited vs. converted persistent conversation |
| Romantic/Positive/Super Like | Three tiers of interest signals |
| XP | Experience points from missions and achievements |
| HPA / PDB | Kubernetes auto-scaling / availability guarantees |
| FCM / R2 / GHCR | Firebase push / Cloudflare storage / GitHub container registry |

### Related Documents

| Document | Path |
|----------|------|
| Architecture Diagrams (8 Mermaid) | `docs/architecture/ARCHITECTURE.md` |
| Security Plan + Checklist | `docs/security/SECURITY_PLAN.md`, `docs/security/SECURITY_CHECKLIST.md` |
| Incident Response (P1-P4) | `docs/security/INCIDENT_RESPONSE.md` |
| Performance Baseline (k6) | `docs/reports/PERFORMANCE_BASELINE.md` |
| Open Issues (523+ tracked) | `docs/project/OPEN_ISSUES.md` |
| Database Schema | `apps/api/prisma/schema.prisma` |
| Development Guidelines | `docs/development/GUIDELINES.md` |
| Mobile Requirements | `docs/product/MOBILE_APP_REQUIREMENTS.md` |

### Test Coverage

| Category | Count | Framework | Files |
|----------|-------|-----------|-------|
| Backend unit + integration | 1371 | Vitest | 37 |
| Database migration | 97 | Vitest + PostgreSQL | 3 |
| Frontend unit + accessibility | 1123 | Vitest + axe | 27 |
| E2E + accessibility | 280 | Playwright + axe-core | 12 |
| Visual regression | 20+ | Playwright | 1 |
| Load tests | 7 | k6 | smoke, sustained, stress, spike, WS, DB, memory |
| Memory leak detection | Automated | Custom AST + Vitest | 5 |
| Mutation testing | Critical services | Stryker | Auth, Chat, Security |
| **Total** | **3054+** | | **81+** |

---

**Document Owner:** Bellor Product Team | **Last Updated:** February 10, 2026 | **Repository:** github.com/TalWayn72/Bellor_MVP
