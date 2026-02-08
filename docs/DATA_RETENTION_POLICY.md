# Bellor MVP - Data Retention & Privacy Policy

**Version:** 1.0.0 | **Date:** February 8, 2026
**Compliance:** GDPR (EU 2016/679), CCPA (Cal. Civ. Code 1798.100)
**Related:** [SECURITY_PLAN.md](./SECURITY_PLAN.md), [GUIDELINES.md](../GUIDELINES.md) Section 8

---

## 1. Data Classification

### 1.1 PII (Personally Identifiable Information)

| Data Field | Model | Sensitivity | Encrypted at Rest |
|-----------|-------|------------|-------------------|
| email | User | High | Yes (AES-256) |
| passwordHash | User | Critical | bcrypt hashed |
| firstName, lastName | User | High | Yes |
| birthDate | User | High | Yes |
| phone | User | High | Yes |
| location (lat, lng, city) | User | High | Yes |
| profileImages | User | Medium | Storage-level |
| drawingUrl | User | Low | No |
| bio, occupation, education | User | Medium | No |
| gender, interests | User | Medium | No |
| deviceId, deviceName | DeviceToken | Medium | No |
| referredEmail, phoneNumber | Referral | High | Yes |

### 1.2 Operational Data

| Data | Model | Description |
|------|-------|-------------|
| Chat messages (content) | Message | User-generated text, media URLs |
| Voice/video transcriptions | Message (textContent) | Transcribed media content |
| Task responses | Response | User task submissions |
| Stories | Story | Ephemeral media (24h) |
| Likes, Follows | Like, Follow | Social graph edges |
| Reports | Report | Moderation records |
| Notifications | Notification | System-generated alerts |

### 1.3 Analytics / System Data

| Data | Model | Description |
|------|-------|-------------|
| responseCount, chatCount | User | Aggregate counters |
| viewCount, likeCount | Response, Story | Content metrics |
| Achievements, XP | UserAchievement | Gamification progress |
| Payment records | Payment | Transaction history (7-year legal hold) |
| Subscription status | Subscription | Billing state |
| AppSettings | AppSetting | System configuration |

---

## 2. Retention Schedule

| Data Type | Retention | Action |
|-----------|----------|--------|
| Active user profile | Indefinite | Retained while active |
| Inactive user profile | 2 years from last activity | Warning at 23mo, delete at 24 |
| Deleted account data | 30-day grace period | Soft-delete, then hard-delete |
| Chat messages | 2 years | Anonymize sender after retention |
| Temporary chat messages | 72h after chat expiry | Hard delete |
| Stories | 24 hours | Auto-deleted by `storyCleanupJob` |
| Expired temporary chats | 30 days after expiry | Hard delete |
| Notifications | 90 days | Hard delete |
| Device tokens | 90 days inactive | Hard delete stale tokens |
| Application logs | 90 days | Rotate and purge |
| Security audit logs | 1 year | Archive, then purge |
| Payment records | 7 years | Legal/tax requirement |
| Reports (moderation) | 3 years | Compliance requirement |
| Referral records | 1 year | Hard delete |
| Session tokens (Redis) | 7 days | Auto-expire via Redis TTL |

---

## 3. Data Deletion Procedures

### 3.1 User-Initiated Account Deletion

1. User calls `DELETE /api/v1/users/me`
2. Account enters **soft-delete** state (30-day grace period)
3. User receives confirmation email with reactivation instructions
4. After 30 days, `deleteUserGDPR()` executes hard deletion:
   - All messages, responses, stories, achievements permanently deleted
   - All chats, reports, likes, follows removed
   - User record permanently deleted; cache purged via `cacheDel()`

**Implementation:** `apps/api/src/services/users/users-gdpr.service.ts`

### 3.2 Automated Cleanup Jobs

| Job | Schedule | Action |
|-----|----------|--------|
| Story Cleanup | Every 15 min | Delete stories past `expiresAt` |
| Chat Cleanup | Every 30 min | Expire temporary chats past `expiresAt` |
| Premium Expiration | Every 60 min | Remove expired premium status |
| Inactive User Reminder | Every 24 hours | Notify users inactive >7 days |
| Database Health | Every 5 min | Monitor query latency |

**Implementation:** `apps/api/src/jobs/index.ts`, `apps/api/src/jobs/cleanup-jobs.ts`

### 3.3 Deletion Methods

| Method | Data Types | Description |
|--------|-----------|-------------|
| **Hard Delete** | Messages, stories, tokens, notifications | Permanent removal |
| **Soft Delete** | User accounts (30-day grace) | Reversible flag |
| **Anonymization** | Chat messages >2 years | Replace sender with `DELETED_USER` |
| **Expiration** | Redis sessions, stories | TTL-based automatic removal |

---

## 4. User Rights (GDPR Articles 15-22)

| Right | Endpoint | Implementation |
|-------|----------|---------------|
| **Access** (Art. 15) | `GET /api/v1/users/me/data-export` | Full JSON export |
| **Portability** (Art. 20) | `GET /api/v1/users/me/data-export?format=json` | Machine-readable |
| **Rectification** (Art. 16) | `PUT /api/v1/users/me` | Update personal fields |
| **Erasure** (Art. 17) | `DELETE /api/v1/users/me` | 30-day grace deletion |
| **Restriction** (Art. 18) | `PUT /api/v1/users/me` (`privateProfile: true`) | Restrict processing |
| **Objection** (Art. 21) | `PUT /api/v1/users/me` (`doNotSell: true`) | Opt out of data sale |

**Export includes:** Personal info, preferences, messages, responses, stories, achievements, statistics.
**Implementation:** `apps/api/src/services/users/users-gdpr.service.ts` (`exportUserData`)

---

## 5. Compliance

**GDPR:** Lawful basis via consent (registration) + legitimate interest. Data minimization enforced. Breach notification within 72 hours (Art. 33, see `docs/INCIDENT_RESPONSE.md`). DPO contact: `privacy@bellor.app`.

**CCPA:** Right to know (data export), right to delete (account deletion), right to opt-out (`doNotSell` flag), non-discrimination guaranteed.

---

## 6. Audit Trail

| Event | Logged Fields |
|-------|--------------|
| Account deletion request | userId, timestamp, IP, reason |
| Account hard-delete execution | userId, timestamp, data types deleted |
| Story/chat auto-cleanup | count, timestamp |
| Data export request | userId, timestamp, format |
| GDPR right exercise | userId, right type, timestamp |

**Log retention:** 1 year, then purged. **Implementation:** `apps/api/src/lib/logger.ts`

---

**Maintained by:** Bellor Privacy Team | **Last updated:** February 8, 2026
