# Bellor MVP - Remaining Features Plan

**תאריך עדכון:** פברואר 2026
**גרסה:** 1.0.0

---

## סיכום מצב נוכחי

### ✅ מה הושלם (100%)

| קטגוריה | רכיב | סטטוס |
|---------|------|-------|
| **Backend Core** | Authentication (JWT + Google OAuth) | ✅ |
| | User Management (CRUD + Search) | ✅ |
| | Missions API (CRUD) | ✅ |
| | Responses API (CRUD + Likes) | ✅ |
| | WebSocket (Chat, Presence) | ✅ |
| | File Upload (Local Storage) | ✅ |
| **Infrastructure** | Docker Compose (5 configs) | ✅ |
| | Production nginx LB | ✅ |
| | PgBouncer Connection Pooling | ✅ |
| | Kubernetes + Advanced HPA | ✅ |
| | CI/CD + Load Testing | ✅ |
| | Monitoring (Prometheus/Grafana) | ✅ |
| **Frontend** | React 18 + Vite + TypeScript | ✅ |
| | 50+ UI Components | ✅ |
| | 5 Languages (i18n) | ✅ |
| | API Client Layer | ✅ |

---

## 📋 נושאים פתוחים - תוכנית עבודה

### 1. Stories Feature (עדיפות גבוהה)

**תיאור:** תוכן בן 24 שעות - תמונות/וידאו שנמחקים אוטומטית

**משימות:**
- [ ] Backend: Stories Service
  - [ ] Create story (upload media)
  - [ ] List stories by user
  - [ ] List stories from followed users
  - [ ] Mark story as viewed
  - [ ] Auto-delete after 24 hours (cron job)
- [ ] Frontend: Stories components
  - [ ] Story viewer (swipe between stories)
  - [ ] Story creation modal
  - [ ] Story indicators on profile
- [ ] API Endpoints:
  ```
  POST   /api/v1/stories          - Create story
  GET    /api/v1/stories/feed     - Get stories feed
  GET    /api/v1/stories/user/:id - Get user's stories
  POST   /api/v1/stories/:id/view - Mark as viewed
  DELETE /api/v1/stories/:id      - Delete story
  ```

**זמן משוער:** 2 שבועות

---

### 2. Push Notifications (עדיפות גבוהה)

**תיאור:** התראות על הודעות, matches, ומסימות חדשות

**משימות:**
- [ ] Backend: Notifications Service
  - [ ] Store FCM tokens
  - [ ] Send notifications via Firebase Cloud Messaging
  - [ ] Notification types: message, match, mission, achievement
- [ ] Frontend: PWA notifications
  - [ ] Service worker for push notifications
  - [ ] Notification permission flow
  - [ ] In-app notification center
- [ ] API Endpoints:
  ```
  POST   /api/v1/notifications/token    - Register FCM token
  GET    /api/v1/notifications          - Get notifications
  PATCH  /api/v1/notifications/:id/read - Mark as read
  DELETE /api/v1/notifications/:id      - Delete notification
  ```

**תלויות:**
- Firebase project setup
- Service worker configuration

**זמן משוער:** 1.5 שבועות

---

### 3. Apple OAuth (עדיפות בינונית)

**תיאור:** Sign in with Apple לתמיכה באייפון

**משימות:**
- [ ] Backend: Apple OAuth integration
  - [ ] Apple Sign In verification
  - [ ] Handle Apple user ID
  - [ ] Support for name hiding (Apple privacy)
- [ ] Frontend: Apple Sign In button
  - [ ] iOS-style button
  - [ ] Handle Apple JS SDK
- [ ] API Endpoints:
  ```
  GET  /api/v1/oauth/apple          - Redirect to Apple
  GET  /api/v1/oauth/apple/callback - Handle callback
  ```

**תלויות:**
- Apple Developer Account ($99/year)
- App ID configuration

**זמן משוער:** 1 שבוע

---

### 4. Achievements System (עדיפות בינונית)

**תיאור:** מערכת הישגים עם badges ותגמולים

**משימות:**
- [ ] Backend: Achievements Service
  - [ ] Define achievement types
  - [ ] Track user progress
  - [ ] Award achievements automatically
  - [ ] Achievement notifications
- [ ] Frontend: Achievements UI
  - [ ] Achievement badges display
  - [ ] Progress indicators
  - [ ] Achievement unlock animation
- [ ] Achievement Types:
  - First mission completed
  - 7-day streak
  - 30-day streak
  - First match
  - Profile completed
  - Premium subscriber

**זמן משוער:** 1.5 שבועות

---

### 5. Reports & Moderation (עדיפות בינונית)

**תיאור:** דיווח על משתמשים ותוכן לא ראוי

**משימות:**
- [ ] Backend: Reports Service
  - [ ] Create report (user/content)
  - [ ] Report types: spam, harassment, inappropriate, fake
  - [ ] Auto-block after X reports
  - [ ] Admin moderation queue
- [ ] Frontend: Report UI
  - [ ] Report button on profiles/messages
  - [ ] Report reason selection
  - [ ] Confirmation dialog
- [ ] Admin Dashboard:
  - [ ] View pending reports
  - [ ] Take action (warn/block/dismiss)
  - [ ] View report history

**זמן משוער:** 1 שבוע

---

### 6. Premium Subscriptions (עדיפות נמוכה)

**תיאור:** מנויי Premium עם תכונות מתקדמות

**משימות:**
- [ ] Backend: Subscriptions Service
  - [ ] Stripe integration
  - [ ] Subscription plans (monthly/yearly)
  - [ ] Webhook handling
  - [ ] Feature flags based on subscription
- [ ] Frontend: Premium UI
  - [ ] Subscription page
  - [ ] Payment flow
  - [ ] Premium badge
  - [ ] Feature unlock indicators
- [ ] Premium Features:
  - Unlimited messages
  - See who liked you
  - Advanced filters
  - Read receipts
  - No ads
  - Priority support

**תלויות:**
- Stripe account
- Business registration for payments

**זמן משוער:** 2 שבועות

---

### 7. Advanced Matching Algorithm (עדיפות נמוכה)

**תיאור:** אלגוריתם התאמה מתקדם

**משימות:**
- [ ] Backend: Matching Service
  - [ ] Compatibility calculation
  - [ ] Preference matching
  - [ ] Location-based filtering
  - [ ] Activity-based scoring
- [ ] Algorithm Factors:
  - Age preference match
  - Location proximity
  - Shared interests
  - Activity level
  - Response rate
  - Mission compatibility

**זמן משוער:** 2 שבועות

---

### 8. Video/Audio Calls (עדיפות נמוכה)

**תיאור:** שיחות וידאו ואודיו בזמן אמת

**משימות:**
- [ ] Backend: WebRTC signaling server
  - [ ] STUN/TURN server setup
  - [ ] Signaling via WebSocket
  - [ ] Call history
- [ ] Frontend: Call UI
  - [ ] Video call component
  - [ ] Audio call component
  - [ ] Call controls (mute, camera, end)
  - [ ] Incoming call notification

**תלויות:**
- TURN server (Twilio/Coturn)
- WebRTC implementation

**זמן משוער:** 3 שבועות

---

## 📅 תוכנית עבודה מוצעת

### Phase 1: Core Features (4 שבועות)
1. Stories Feature (2 שבועות)
2. Push Notifications (1.5 שבועות)
3. Reports & Moderation (0.5 שבוע)

### Phase 2: Authentication & Engagement (3 שבועות)
4. Apple OAuth (1 שבוע)
5. Achievements System (1.5 שבועות)
6. Bug fixes & optimization (0.5 שבוע)

### Phase 3: Monetization (2 שבועות)
7. Premium Subscriptions (2 שבועות)

### Phase 4: Advanced Features (5 שבועות)
8. Advanced Matching Algorithm (2 שבועות)
9. Video/Audio Calls (3 שבועות)

---

## 🔧 תחזוקה שוטפת

### משימות שוטפות (לכל sprint):
- [ ] עדכון dependencies
- [ ] Security patches
- [ ] Performance monitoring
- [ ] Bug fixes from production
- [ ] User feedback integration

### Monitoring:
- [ ] Track error rates
- [ ] Monitor response times
- [ ] Check database performance
- [ ] Review user analytics

---

## 📊 מדדי הצלחה

| מדד | יעד |
|-----|-----|
| Test Coverage | > 80% |
| API Response Time (p95) | < 200ms |
| Error Rate | < 1% |
| Uptime | > 99.9% |
| User Retention (7 days) | > 40% |
| User Retention (30 days) | > 20% |

---

## הערות

1. **עדיפויות יכולות להשתנות** בהתאם לפידבק מהמשתמשים
2. **זמנים משוערים** לא כוללים QA ו-bug fixes
3. **תלויות חיצוניות** (Apple, Stripe) עלולות לעכב
4. **בדיקות** צריכות להיכתב במקביל לפיתוח

---

**עודכן לאחרונה:** פברואר 2026
**מחבר:** Claude Code
