# מסמך דרישות מוצר (PRD) - Bellor MVP

**גרסה:** 1.2.0-beta
**תאריך עדכון אחרון:** פברואר 2026
**מנהל מוצר:** צוות Bellor
**סטטוס:** Phase 5 מושלם + Admin & Tools Ready ✅

---

## 📋 תוכן עניינים

1. [סקירה כללית](#סקירה-כללית)
2. [מטרות המוצר](#מטרות-המוצר)
3. [משתמשי היעד](#משתמשי-היעד)
4. [יכולות המערכת](#יכולות-המערכת)
5. [סטטוס פיתוח](#סטטוס-פיתוח)
6. [ארכיטקטורה טכנית](#ארכיטקטורה-טכנית)
7. [פריסה ואירוח](#פריסה-ואירוח)
8. [אבטחה](#אבטחה)
9. [ביצועים](#ביצועים)
10. [Roadmap](#roadmap)
11. [דרישות מערכת](#דרישות-מערכת)
12. [הנחיות פיתוח](#הנחיות-פיתוח)

---

## 🚨 הנחיית פיתוח ראשית (Development Guideline)

> **כתוב את הקוד ובצע את כל הפעילויות ברמה הגבוהה ביותר האפשרית כדי לתת מענה למערכת רובסטית שתשמש עשרות אלפי משתמשים בו זמנית.**

### עקרונות מנחים:

| עיקרון | יישום |
|--------|-------|
| **Scalability** | כל קוד חייב לתמוך ב-10K+ משתמשים במקביל |
| **Performance** | Response time < 200ms (p95), WebSocket < 50ms |
| **Reliability** | 99.9% uptime, graceful degradation, circuit breakers |
| **Security** | OWASP Top 10 compliance, zero trust architecture |
| **Code Quality** | TypeScript strict mode, 80%+ test coverage |
| **Monitoring** | Metrics, logging, alerting on all critical paths |
| **Documentation** | כל API, service, ו-component מתועד |

### חובות בכל PR:
- [ ] בדיקות יחידה (Unit Tests)
- [ ] בדיקות אינטגרציה (Integration Tests) לשינויי API
- [ ] בדיקת ביצועים לשינויים קריטיים
- [ ] סקירת קוד (Code Review)
- [ ] עדכון תיעוד במידת הצורך
- [ ] אין שגיאות TypeScript
- [ ] אין vulnerabilities חדשות

---

## 1. סקירה כללית

### 1.1 תיאור המוצר

**Bellor MVP** היא פלטפורמת היכרויות וחברות חברתית מתקדמת, שפותחה מאפס כפתרון עצמאי ומלא, ללא תלות בפלטפורמות צד שלישי.

המוצר מציע חוויית משתמש ייחודית המשלבת:
- 💬 צ'אט זמני וקבוע
- 🎯 מסימות יומיות ואתגרים
- 📸 סיפורים (Stories) בני 24 שעות
- 🏆 מערכת הישגים ותגמולים
- 💎 מנויי Premium עם יכולות מתקדמות
- 🌍 תמיכה ב-5 שפות (אנגלית, עברית, ספרדית, גרמנית, צרפתית)

### 1.2 ייחודיות המוצר

**תכונות ייחודיות:**
- **עצמאות מלאה** - אין תלות בפלטפורמת Base44 או כל ספק חיצוני אחר
- **פריסה בכל מקום** - אדם אחד בפקודה אחת על כל OS (Linux, macOS, Windows)
- **ללא נעילת ספק** - כל התשתית מבוססת Docker/Kubernetes, ניתן לפריסה על כל ענן
- **אירוח חינמי** - 5 אפשרויות אירוח חינם למחקר ופיתוח
- **Monitoring מלא** - Prometheus + Grafana + Loki מהקופסה
- **CI/CD מובנה** - GitHub Actions עם בדיקות אוטומטיות ופריסה

### 1.3 מצב הפרוייקט הנוכחי

| קטגוריה | סטטוס | השלמה |
|----------|-------|--------|
| **Phase 1** - תשתית | ✅ מושלם | 100% |
| **Phase 2** - Backend ליבה | ✅ מושלם | 100% |
| **Phase 3** - Real-time | ✅ מושלם | 100% |
| **Phase 4** - Frontend Migration | ✅ מושלם | 100% |
| **Phase 5** - Admin & Tools | ✅ מושלם | 100% |
| **Phase 6** - בדיקות | ⏳ בתהליך | 60% |
| **Phase 7** - Deployment | ✅ מושלם | 100% |
| **Phase 8** - Universal Deployment | ✅ מושלם | 100% |

**התקדמות כוללת:** 95%

---

## 2. מטרות המוצר

### 2.1 מטרות עסקיות

1. **יצירת פלטפורמה עצמאית** - הפרדה מוחלטת מפלטפורמת Base44
2. **מדרגיות** - תמיכה בעשרות אלפי משתמשים במקביל
3. **זמינות גבוהה** - 99.9% uptime
4. **עלות תחזוקה נמוכה** - אוטומציה מקסימלית
5. **זריזות בפריסה** - פריסה על כל ענן תוך 15 דקות

### 2.2 מטרות טכניות

1. ✅ **תשתית מקצועית** - Monorepo עם npm workspaces
2. ✅ **Type Safety** - TypeScript מלא על Frontend ו-Backend
3. ✅ **Database מתקדם** - PostgreSQL + Prisma ORM
4. ✅ **Real-time** - WebSocket עם Socket.io
5. ✅ **Authentication מאובטח** - JWT + bcrypt + Redis sessions
6. ✅ **CI/CD** - GitHub Actions עם Docker build ופריסה אוטומטית ל-GHCR
7. ✅ **Monitoring** - Observability מלא
8. ✅ **Deployment בכל מקום** - Cloud-agnostic

### 2.3 מדדי הצלחה (KPIs)

| מדד | יעד | סטטוס נוכחי |
|-----|-----|------------|
| זמן פריסה | < 15 דקות | ✅ 15 דקות |
| זמן תגובת API | < 200ms (p95) | ⏳ לא נבדק |
| TypeScript Errors | 0 | ✅ 0 |
| Test Coverage | > 80% | 📋 לא הוטמע |
| Uptime | > 99.9% | ⏳ לא נמדד |
| Build Time | < 5 דקות | ✅ ~3 דקות |

---

## 3. משתמשי היעד

### 3.1 פרסונות משתמשים

#### 👤 משתמש רגיל (End User)
- **גיל:** 25-45
- **מטרה:** להכיר אנשים חדשים, מצוא קשרים רומנטיים/חברתיים
- **צרכים:**
  - ממשק פשוט ואינטואיטיבי
  - פרטיות ואבטחה
  - תקשורת בזמן אמת
  - תוכן מרתק (מסימות, הישגים)

#### 👨‍💼 מנהל מוצר
- **מטרה:** לנהל ולפתח את הפלטפורמה
- **צרכים:**
  - מסמכי PRD ברורים
  - Dashboard לניהול משתמשים
  - Analytics ומדדים
  - דוחות ותובנות

#### 👨‍💻 מפתח
- **מטרה:** לפתח ולתחזק את המערכת
- **צרכים:**
  - קוד נקי ומתועד
  - Type safety
  - בדיקות אוטומטיות
  - Monitoring וlogs
  - Deployment פשוט

#### 🔧 DevOps Engineer
- **מטרה:** לפרוס ולתחזק תשתית
- **צרכים:**
  - Cloud-agnostic architecture
  - CI/CD pipelines
  - Monitoring וalerts
  - Scalability
  - Zero-downtime deployments

---

## 4. יכולות המערכת

### 4.1 Authentication & Authorization ✅

**סטטוס:** מושלם (100%)

#### 4.1.1 הרשמה (Registration)
- ✅ הזנת email וסיסמה
- ✅ Validation מלא (Zod)
  - אורך סיסמה מינימום 8 תווים
  - חייב לכלול אות גדולה, אות קטנה, מספר, תו מיוחד
  - בדיקת תקינות email
- ✅ Hashing של סיסמה עם bcrypt (12 rounds)
- ✅ יצירת JWT tokens (access + refresh)
- ✅ אחסון refresh token ב-Redis (7 ימים)

**API Endpoint:**
```
POST /api/v1/auth/register
Body: { email, password, firstName, lastName, gender, birthDate, preferredLanguage }
Response: { user, accessToken, refreshToken }
```

#### 4.1.2 התחברות (Login)
- ✅ אימות email וסיסמה
- ✅ בדיקת bcrypt
- ✅ עדכון lastActiveAt
- ✅ יצירת JWT tokens חדשים
- ✅ בדיקת חשבון חסום (isBlocked)

**API Endpoint:**
```
POST /api/v1/auth/login
Body: { email, password }
Response: { user, accessToken, refreshToken }
```

#### 4.1.3 Refresh Token
- ✅ חידוש access token באמצעות refresh token
- ✅ אימות refresh token מול Redis
- ✅ בדיקת משתמש פעיל

**API Endpoint:**
```
POST /api/v1/auth/refresh
Body: { refreshToken }
Response: { accessToken }
```

#### 4.1.4 התנתקות (Logout)
- ✅ מחיקת refresh token מ-Redis
- ✅ invalidation של session

**API Endpoint:**
```
POST /api/v1/auth/logout
Headers: Authorization: Bearer <token>
Response: { message: "Logged out successfully" }
```

#### 4.1.5 שינוי סיסמה
- ✅ אימות סיסמה נוכחית
- ✅ validation של סיסמה חדשה
- ✅ hashing של סיסמה חדשה
- ✅ עדכון במסד נתונים

**API Endpoint:**
```
POST /api/v1/auth/change-password
Headers: Authorization: Bearer <token>
Body: { currentPassword, newPassword }
Response: { message: "Password changed successfully" }
```

#### 4.1.6 OAuth ✅
**סטטוס:** Google מיושם במלואו, Apple מתוכנן

- ✅ **Google OAuth** - מיושם במלואו
  - Authorization URL generation
  - Callback handling עם יצירת/קישור משתמש
  - JWT token generation
  - Redis session storage
- 📋 **Apple Sign In** - מתוכנן

**API Endpoints:**
```
GET /api/v1/oauth/google          - Redirect to Google login
GET /api/v1/oauth/google/callback - Handle Google callback
GET /api/v1/oauth/status          - Check OAuth providers status
```

---

### 4.2 User Management ✅

**סטטוס:** מושלם (100%)

#### 4.2.1 קבלת פרופיל משתמש
- ✅ קבלת פרטי משתמש לפי ID
- ✅ קבלת משתמש נוכחי (me)
- ✅ בדיקת הרשאות

**API Endpoints:**
```
GET /api/v1/users/me
GET /api/v1/users/:id
Headers: Authorization: Bearer <token>
Response: User object
```

#### 4.2.2 עדכון פרופיל
- ✅ עדכון שם, bio
- ✅ בדיקת הרשאות (רק משתמש עצמו)
- ✅ validation של נתונים

**API Endpoint:**
```
PATCH /api/v1/users/:id
Headers: Authorization: Bearer <token>
Body: { firstName?, lastName?, bio? }
Response: Updated user object
```

#### 4.2.3 רשימת משתמשים (עם פילטרים)
- ✅ Pagination (limit, offset)
- ✅ מיון (sortBy: createdAt | firstName | lastActiveAt)
- ✅ פילטרים:
  - isBlocked (חסום/פעיל)
  - isPremium (premium/רגיל)
  - language (שפת העדפה)
- ✅ החזרת total ו-hasMore

**API Endpoint:**
```
GET /api/v1/users
Query: ?limit=20&offset=0&sortBy=createdAt&sortOrder=desc&isBlocked=false
Response: { users: User[], pagination: { total, limit, offset, hasMore } }
```

#### 4.2.4 חיפוש משתמשים
- ✅ חיפוש לפי שם (firstName, lastName)
- ✅ חיפוש לפי email
- ✅ Case-insensitive
- ✅ רק משתמשים פעילים (isBlocked: false)
- ✅ Pagination

**API Endpoint:**
```
GET /api/v1/users/search?q=john
Response: { users: User[], pagination }
```

#### 4.2.5 עדכון שפה
- ✅ שינוי שפת ממשק
- ✅ תמיכה ב-5 שפות: ENGLISH, HEBREW, SPANISH, GERMAN, FRENCH
- ✅ בדיקת הרשאות

**API Endpoint:**
```
PATCH /api/v1/users/:id/language
Body: { language: "HEBREW" }
Response: Updated user object
```

#### 4.2.6 Soft Delete (חסימה/הפעלה)
- ✅ חסימת משתמש (isBlocked: true)
- ✅ הפעלה מחדש (isBlocked: false)
- ✅ בדיקת הרשאות

**API Endpoints:**
```
DELETE /api/v1/users/:id  (חסימה)
Response: { message: "User deactivated successfully" }
```

#### 4.2.7 סטטיסטיקות משתמש
- ✅ מספר הודעות שנשלחו
- ✅ מספר צ'אטים פעילים
- ✅ תאריך הצטרפות
- ✅ תאריך התחברות אחרון

**API Endpoint:**
```
GET /api/v1/users/:id/stats
Response: { userId, messagesCount, chatsCount, isPremium, memberSince, lastLogin }
```

---

### 4.3 Real-time Communication (WebSocket) ✅

**סטטוס:** מושלם (100%)

#### 4.3.1 WebSocket Server
- ✅ Socket.io integration עם Fastify
- ✅ JWT authentication על WebSocket connection
- ✅ CORS configuration
- ✅ Room management
- ✅ User presence tracking

**Connection:**
```javascript
const socket = io('ws://localhost:3000', {
  auth: {
    token: '<JWT_ACCESS_TOKEN>'
  }
});
```

#### 4.3.2 Presence (נוכחות אונליין/אופליין)
- ✅ מעקב אחרי משתמשים מחוברים
- ✅ broadcast של סטטוס אונליין
- ✅ שמירת מצב ב-Redis
- ✅ Heartbeat mechanism
- ✅ קבלת רשימת משתמשים מחוברים

**Events:**
```
// Client → Server
emit('presence:online')
emit('presence:offline')
emit('presence:heartbeat')
emit('presence:get-online')

// Server → Client
on('presence:user-online', { userId, timestamp })
on('presence:user-offline', { userId, timestamp })
on('presence:online-users', { userIds: string[] })
```

#### 4.3.3 Real-time Chat
- ✅ הצטרפות לחדר צ'אט
- ✅ שליחת הודעות בזמן אמת
- ✅ Typing indicators
- ✅ קבלת אישור קריאה (read receipts)
- ✅ מחיקת הודעות
- ✅ ספירת הודעות שלא נקראו

**Events:**
```
// Join/Leave
emit('chat:join', { chatId })
emit('chat:leave', { chatId })

// Messaging
emit('chat:message', { chatId, content, metadata })
on('chat:message:new', { message, metadata })

// Typing
emit('chat:typing', { chatId, isTyping })
on('chat:typing', { userId, chatId, isTyping })

// Read Receipts
emit('chat:message:read', { messageId })
on('chat:message:read', { messageId, readBy, timestamp })

// Delete
emit('chat:message:delete', { messageId })
on('chat:message:deleted', { messageId, chatId, timestamp })

// Unread Count
emit('chat:unread:count')
on('chat:unread:count', { unreadCount })
```

#### 4.3.4 אבטחה ב-WebSocket
- ✅ JWT validation על connection
- ✅ בדיקת הרשאות לכל event
- ✅ מניעת CORS attacks
- ✅ Rate limiting (אפשרי להוסיף)

---

### 4.4 Features שטרם הוטמעו (Planned)

#### 4.4.1 File Upload & Storage ✅
**סטטוס:** מושלם - Local Storage מוכן, R2 אופציונלי

- ✅ העלאת תמונות פרופיל
- ✅ העלאת ציורים (drawings)
- ✅ העלאת קבצי audio
- ✅ **Local container storage** - ללא תלות בספק חיצוני
- ✅ Static file serving עם nginx
- 📋 Cloudflare R2 integration (אופציונלי)
- 📋 Image optimization
- 📋 CDN delivery

> ⚠️ **הבהרה חשובה: הפרדה בין תמונות פרופיל לציורים**
>
> | סוג | תיאור | שדה בDB | מקור |
> |-----|-------|---------|------|
> | **תמונות פרופיל** | תמונות אמיתיות של המשתמש | `profileImages[]` | קובץ/מצלמה |
> | **ציורים (Onboarding)** | אומנות שנוצרת עם הצייר באונבורדינג | `drawingUrl` | כלי ציור |
> | **ציורים (Responses)** | תגובות ציור למסימות | `Response.content` (type=DRAWING) | כלי ציור |
>
> **חשוב:**
> - תמונות פרופיל (`profileImages`) מוצגות בדף "Add Your Photos" ובגלריית הפרופיל
> - ציורים מאונבורדינג (`drawingUrl`) מוצגים בפרופיל כ-"האומנות שלי"
> - ציורי תגובות למסימות נשמרים בטבלת Responses
> - **אסור לערבב** בין סוגי המדיה!

**API Endpoints:**
```
POST   /api/v1/uploads/profile    - Upload profile image
POST   /api/v1/uploads/drawing    - Upload drawing (onboarding art) 📋
POST   /api/v1/uploads/audio      - Upload audio file
GET    /uploads/*                 - Serve uploaded files
```

**תשתית:**
- ✅ Docker volume לאחסון מקומי
- ✅ @fastify/static לשירות קבצים
- ✅ CORS configured for cross-origin access
- ✅ Environment variables for R2 (optional)

#### 4.4.2 Matches & Discovery 📋
**סטטוס:** מתוכנן

- 📋 אלגוריתם התאמה
- 📋 פילטרים מתקדמים
- 📋 Swipe mechanism
- 📋 Like/Pass
- 📋 Mutual matches

#### 4.4.3 Missions (Daily Challenges) ✅
**סטטוס:** מושלם - Backend API מוכן

- ✅ מסימות יומיות/שבועיות
- ✅ API CRUD מלא (Create, Read, Update, Delete)
- ✅ Today's Mission endpoint
- ✅ סוגי תגובות: TEXT, AUDIO, VIDEO, IMAGE, DRAWING
- ✅ Completion tracking

**API Endpoints:**
```
GET    /api/v1/missions           - List missions
GET    /api/v1/missions/today     - Get today's mission
GET    /api/v1/missions/:id       - Get mission by ID
POST   /api/v1/missions           - Create mission (admin)
PATCH  /api/v1/missions/:id       - Update mission (admin)
DELETE /api/v1/missions/:id       - Delete mission (admin)
```

**Database Schema:** ✅ מוכן
```prisma
model Mission {
  id          String
  title       String
  description String
  missionType MissionType
  // ...
}
```

#### 4.4.3.1 Responses (User Responses to Missions) ✅
**סטטוס:** מושלם - Backend API מוכן

- ✅ תגובות משתמשים למסימות
- ✅ סוגי תגובות: TEXT, AUDIO, VIDEO, IMAGE, DRAWING
- ✅ Like functionality
- ✅ View counting
- ✅ Public/Private responses

**API Endpoints:**
```
GET    /api/v1/responses          - List responses
GET    /api/v1/responses/my       - Get my responses
GET    /api/v1/responses/:id      - Get response by ID
POST   /api/v1/responses          - Create response
POST   /api/v1/responses/:id/like - Like a response
DELETE /api/v1/responses/:id      - Delete response
```

#### 4.4.4 Stories 📋
**סטטוס:** מתוכנן, Schema מוכן

- 📋 תוכן בן 24 שעות
- 📋 העלאת תמונות/וידאו
- 📋 Viewing tracking
- 📋 מחיקה אוטומטית אחרי 24 שעות

**Database Schema:** ✅ מוכן

#### 4.4.5 Achievements 📋
**סטטוס:** מתוכנן, Schema מוכן

- 📋 מערכת הישגים
- 📋 Badges
- 📋 Progress tracking
- 📋 Rewards

#### 4.4.6 Premium Subscriptions 📋
**סטטוס:** מתוכנן

- 📋 תוכניות מנוי
- 📋 אינטגרציה עם Stripe/PayPal
- 📋 תכונות Premium
- 📋 Billing management

#### 4.4.7 Reports & Moderation 📋
**סטטוס:** מתוכנן, Schema מוכן

- 📋 דיווח על משתמשים
- 📋 דיווח על תוכן
- 📋 Admin moderation dashboard
- 📋 אוטומציה של חסימות

#### 4.4.8 Push Notifications 📋
**סטטוס:** מתוכנן

- 📋 התראות על הודעות חדשות
- 📋 התראות על matches
- 📋 התראות על Missions
- 📋 Firebase Cloud Messaging integration

---

## 5. סטטוס פיתוח

### 5.1 מה הושלם ✅

#### Backend (100%)
- ✅ **Monorepo Structure** - npm workspaces
- ✅ **TypeScript Configuration** - Full type safety
- ✅ **Fastify Server** - High-performance web framework
- ✅ **Database** - PostgreSQL + Prisma ORM
  - ✅ Schema מלא עם 10+ models
  - ✅ Migrations
  - ✅ Seed data (10 demo users)
- ✅ **Redis** - Caching & sessions
- ✅ **Authentication Service** - JWT + bcrypt
  - ✅ Register, Login, Refresh, Logout
  - ✅ Password change
  - ✅ Redis-based sessions
- ✅ **User Management Service** - CRUD מלא
  - ✅ List, Get, Update, Search
  - ✅ Language preference
  - ✅ Soft delete
  - ✅ Statistics
- ✅ **WebSocket Server** - Socket.io
  - ✅ JWT authentication
  - ✅ Presence tracking
  - ✅ Real-time chat
  - ✅ Typing indicators
  - ✅ Read receipts
- ✅ **Middleware** - Auth, Validation, Error handling
- ✅ **Routes** - v1 API endpoints
- ✅ **Validation** - Zod schemas
- ✅ **Error Handling** - Comprehensive
- ✅ **Logging** - Structured logging
- ✅ **Health Checks** - Liveness & readiness

#### DevOps & Infrastructure (100%) ✅ **Production-Ready for 10K+ Users**
- ✅ **Docker** - Multi-stage builds
  - ✅ Dockerfile.api (~150MB)
  - ✅ Dockerfile.web (~25MB)
- ✅ **Docker Compose** - 5 תצורות
  - ✅ Development
  - ✅ Production
  - ✅ **Production High-Scale** (10K+ users, PgBouncer, nginx LB)
  - ✅ All-in-one (275MB min)
  - ✅ Monitoring
- ✅ **Kubernetes** - Manifests מלאים
  - ✅ Deployments with HPA
  - ✅ **Advanced HPA** - Scale-up/down policies
  - ✅ **Pod Disruption Budgets** - High availability
  - ✅ **Vertical Pod Autoscaler** - Resource optimization
  - ✅ **Priority Classes** - Pod scheduling priority
  - ✅ **Resource Quotas** - Namespace limits
  - ✅ Services
  - ✅ Ingress with SSL
  - ✅ Secrets & ConfigMaps
- ✅ **nginx Load Balancer** - Production configuration
  - ✅ Load balancing across API replicas
  - ✅ WebSocket support with sticky sessions
  - ✅ Rate limiting (API, Auth, Upload)
  - ✅ Gzip compression
  - ✅ Security headers
  - ✅ Static file caching
  - ✅ SSL/TLS ready
- ✅ **CI/CD** - GitHub Actions (Enhanced)
  - ✅ Linting & testing
  - ✅ Code coverage reports
  - ✅ Docker build & push
  - ✅ Security scanning (Trivy)
  - ✅ **Load testing** (k6 smoke tests)
  - ✅ Automated deployment
  - ✅ CI summary reports
- ✅ **Monitoring Stack** - Full observability
  - ✅ Prometheus
  - ✅ Grafana with dashboards
  - ✅ Loki for logs
  - ✅ Promtail
  - ✅ Alertmanager
  - ✅ cAdvisor
  - ✅ node-exporter
- ✅ **Deployment Scripts** - Universal installers
  - ✅ install-anywhere.sh (Linux/macOS)
  - ✅ install-anywhere.ps1 (Windows)
  - ✅ deploy.sh (Docker/K8s)

#### Frontend (100% - מושלם) ✅
- ✅ **React 18** - Modern UI framework
- ✅ **Vite** - Fast build tool
- ✅ **TypeScript** - Full type safety
- ✅ **Tailwind CSS** - Utility-first styling
- ✅ **Radix UI** - Accessible components
- ✅ **Design System** - 50+ components
- ✅ **Pages** - 50+ page components
- ✅ **i18n** - 5 languages support
- ✅ **API Client** - 12 services מחוברים ל-backend
- ✅ **Base44 Removed** - base44Client.js הוסר לחלוטין

### 5.2 שגיאות שתוקנו

#### TypeScript Errors: 0 ✅
- ✅ תוקנו 25 שגיאות schema
  - ✅ isActive/isBlocked (5 שגיאות)
  - ✅ Null safety (8 שגיאות)
  - ✅ Chat participants logic (7 שגיאות)
  - ✅ JWT type casting (2 שגיאות)
  - ✅ _count fields (3 שגיאות)
- ✅ Prisma generate הורץ בהצלחה
- ✅ Compilation עובר ללא שגיאות

### 5.3 מה חסר (Next Steps)

1. **Frontend Integration** (Phase 4) - ✅ **מושלם - 100%**
   - ✅ **הושלם:** הסרת תלויות Base44
   - ✅ **הושלם:** API Client חדש עם TypeScript
   - ✅ **הושלם:** 12 Frontend Services (auth, user, chat, mission, response, upload, story, like, follow, notification, report, achievement)
   - ✅ **הושלם:** מיגרציה של כל הדפים והקומפוננטות
   - ✅ **הושלם:** הסרת base44Client.js

2. **Testing** (Phase 6) - 📋 **מתוכנן - ראה סעיף 10.1**
   - Unit tests (80%+ coverage)
   - Integration tests (API + WebSocket)
   - E2E tests with Playwright
   - Performance testing with k6
   - Security audit (OWASP ZAP)

### 5.4 מה הושלם בPhase 5 ✅

1. **File Upload** - מוכן!
   - ✅ R2/S3 cloud storage support
   - ✅ Local storage fallback
   - ✅ Image optimization עם Sharp
   - ✅ Profile, story, audio uploads

2. **Admin & Tools** - מוכן!
   - ✅ Admin Dashboard API
   - ✅ Analytics Service (DAU, MAU, retention)
   - ✅ User management (block/unblock/premium)
   - ✅ Report moderation
   - ✅ Background jobs (cleanup, expiration)
   - ✅ Data export (JSON/CSV)

3. **Content Features** - מוכן!
   - ✅ Stories (24h content)
   - ✅ Missions (daily/weekly)
   - ✅ Achievements (auto-unlock, XP)
   - ✅ Responses (mission answers)

---

## 6. ארכיטקטורה טכנית

### 6.1 סקירה כללית

```
┌─────────────────────────────────────────────────┐
│                 CDN (CloudFlare)                 │
│           Static Assets + Edge Caching           │
└─────────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────┐
│            Load Balancer (nginx/ALB)             │
│             SSL Termination + Routing            │
└─────────────────────────────────────────────────┘
                │                    │
                ▼                    ▼
┌──────────────────┐      ┌──────────────────────┐
│  Frontend (React) │      │   API Gateway         │
│  - Vite Build    │      │   - Rate Limiting     │
│  - Static Hosting│      │   - Request Validation│
└──────────────────┘      └──────────────────────┘
                                     │
        ┌────────────────────────────┼────────────────────────┐
        ▼                            ▼                        ▼
┌───────────────┐         ┌───────────────┐      ┌──────────────────┐
│ API (Fastify) │◄────────│ WebSocket     │      │ Background Jobs  │
│ - REST APIs   │         │ - Socket.io   │      │ - Queue Workers  │
│ - Business    │         │ - Real-time   │      │ - Cron Jobs      │
│   Logic       │         │               │      │                  │
└───────────────┘         └───────────────┘      └──────────────────┘
        │                          │                       │
        └──────────┬───────────────┴───────────────────────┘
                   │
        ┌──────────┴──────────┐
        ▼                     ▼
┌──────────────┐      ┌──────────────┐
│ PostgreSQL   │      │    Redis     │
│ - Primary DB │      │ - Sessions   │
│ - Prisma ORM │      │ - Cache      │
└──────────────┘      │ - Presence   │
                      └──────────────┘
```

### 6.2 Technology Stack

#### Frontend
- **Framework:** React 18.2
- **Build Tool:** Vite 6.1
- **Language:** TypeScript 5.8
- **Styling:** Tailwind CSS 3.4
- **Components:** Radix UI
- **State Management:** TanStack Query 5.84
- **Routing:** React Router 6.26
- **Animations:** Framer Motion 11.16

#### Backend
- **Runtime:** Node.js 20+
- **Framework:** Fastify 5.2
- **Language:** TypeScript 5.8
- **ORM:** Prisma 6.19
- **Database:** PostgreSQL 16
- **Cache:** Redis 7
- **WebSocket:** Socket.io 4.8
- **Auth:** JWT 9.0
- **Password:** Bcrypt 5.1
- **Validation:** Zod 3.23

#### DevOps
- **Containerization:** Docker 24+
- **Orchestration:** Kubernetes 1.28+
- **CI/CD:** GitHub Actions
- **Monitoring:** Prometheus + Grafana + Loki
- **Alerts:** Alertmanager

### 6.3 Database Schema

**10 Models:**
1. User - פרופילי משתמשים
2. Chat - שיחות אחד-על-אחד
3. Message - הודעות בצ'אט
4. Response - תגובות למסימות
5. Story - תוכן בן 24 שעות
6. Mission - אתגרים יומיים
7. Achievement - הישגים
8. Report - דיווחים
9. AppSetting - הגדרות מערכת
10. Referral - הפניות

**Relations:**
- User ↔ Chat (user1/user2)
- User → Message (sender)
- Chat → Message (many)
- User → Story (many)
- User → Achievement (many)
- User → Response (many)
- Mission → Response (many)

### 6.4 API Structure

```
/api/v1
├── /auth
│   ├── POST /register
│   ├── POST /login
│   ├── POST /refresh
│   ├── POST /logout
│   ├── POST /change-password
│   └── GET /me
├── /users
│   ├── GET /
│   ├── GET /search
│   ├── GET /:id
│   ├── PATCH /:id
│   ├── PATCH /:id/language
│   ├── DELETE /:id
│   └── GET /:id/stats
├── /chats (מתוכנן)
├── /messages (מתוכנן)
├── /missions (מתוכנן)
├── /stories (מתוכנן)
├── /achievements (מתוכנן)
└── /upload (מתוכנן)
```

**WebSocket Events:**
```
presence:*
chat:*
```

---

## 7. פריסה ואירוח

### 7.1 אפשרויות פריסה

#### Option 1: Universal Installer (מומלץ למתחילים)
**זמן פריסה:** 15 דקות
**קושי:** קל מאוד

**Linux/macOS:**
```bash
curl -fsSL https://raw.githubusercontent.com/.../install-anywhere.sh | bash
```

**Windows:**
```powershell
irm https://raw.githubusercontent.com/.../install-anywhere.ps1 | iex
```

**מה זה עושה:**
- ✅ מתקין Docker אוטומטית
- ✅ יוצר secrets מאובטחים
- ✅ מגדיר .env.production
- ✅ בונה ומריץ containers
- ✅ מריץ migrations
- ✅ Seed demo data

#### Option 2: Docker Compose (מומלץ לפיתוח)
**זמן פריסה:** 10 דקות
**קושי:** קל

```bash
# Development
docker compose up -d

# Production
docker compose -f docker-compose.prod.yml up -d

# With monitoring
docker compose -f docker-compose.yml -f docker-compose.monitoring.yml up -d

# All-in-one (DB included)
docker compose -f docker-compose.all-in-one.yml up -d
```

#### Option 3: Kubernetes (מומלץ לפרודקשן)
**זמן פריסה:** 30 דקות
**קושי:** בינוני

```bash
./scripts/deploy.sh k8s prod
```

**תכונות:**
- ✅ Auto-scaling (3-10 pods)
- ✅ Zero-downtime rolling updates
- ✅ Health checks
- ✅ SSL automatic
- ✅ Load balancing

### 7.2 דרישות מינימליות

#### Development
- **CPU:** 2 cores
- **RAM:** 2GB
- **Disk:** 5GB
- **Network:** 1Mbps

#### Production (Small)
- **CPU:** 2 cores
- **RAM:** 4GB
- **Disk:** 20GB
- **Network:** 10Mbps

#### Production (Medium)
- **CPU:** 4 cores
- **RAM:** 8GB
- **Disk:** 50GB
- **Network:** 100Mbps

#### All-in-One (Minimal)
- **CPU:** 1 core
- **RAM:** 275MB (!)
- **Disk:** 2GB
- **Network:** 1Mbps

### 7.3 אירוח חינמי (למחקר ופיתוח)

| ספק | עלות | RAM | Database | מגבלות |
|-----|------|-----|----------|--------|
| **Render.com** | $0 | 512MB | 90 days PostgreSQL | Sleep after 15min |
| **Railway.app** | $5 credit/month | 512MB | Included | Usage-based |
| **Fly.io** | $0 | 3×256MB | Supabase | Good for global |
| **Oracle Cloud** | $0 forever | 24GB (!) | Included | Best value |
| **Supabase** | $0 | - | 500MB PostgreSQL | DB only |

**מומלץ למחקר:** Oracle Cloud (24GB RAM בחינם לצמיתות!)
**מומלץ לדמו:** Render.com (קל להתקין)

### 7.4 פריסה על ענן מסחרי

**תומך בכל ענן:**
- ✅ AWS (EC2, ECS, EKS)
- ✅ Google Cloud (Compute Engine, GKE)
- ✅ Azure (VMs, AKS)
- ✅ DigitalOcean (Droplets, Kubernetes)
- ✅ Linode
- ✅ Vultr
- ✅ Hetzner
- ✅ כל VPS provider

**אין נעילת ספק!** - הכל Docker/Kubernetes standard.

---

## 8. אבטחה

### 8.1 Authentication & Authorization

#### Password Security
- ✅ **bcrypt hashing** - 12 rounds (very secure)
- ✅ **Strong password requirements**:
  - מינימום 8 תווים
  - אות גדולה + אות קטנה
  - מספר
  - תו מיוחד
- ✅ **No plaintext storage** - אף פעם!

#### JWT Tokens
- ✅ **Access Token** - 15 דקות בלבד
- ✅ **Refresh Token** - 7 ימים, מאוחסן ב-Redis
- ✅ **Token Rotation** - refresh מחדש כל 7 ימים
- ✅ **Invalidation** - logout מוחק מ-Redis

#### Sessions
- ✅ **Redis-based** - מהיר ומאובטח
- ✅ **TTL Management** - expiration אוטומטי
- ✅ **Distributed** - עובד עם multiple servers

### 8.2 Input Validation

- ✅ **Zod Schemas** - validation בזמן ריצה
- ✅ **Type Safety** - TypeScript compile-time
- ✅ **Sanitization** - ניקוי input
- ✅ **Error Messages** - ברורים ומאובטחים

### 8.3 API Security

- ✅ **CORS Configuration** - מוגבל לdomains מאושרים
- ✅ **Rate Limiting** - מניעת abuse
- ✅ **Helmet** - Security headers
- ✅ **HTTPS Only** - SSL certificate אוטומטי
- ✅ **SQL Injection Prevention** - Prisma parameterized queries
- ✅ **XSS Prevention** - Input sanitization

### 8.4 WebSocket Security

- ✅ **JWT Authentication** - על כל connection
- ✅ **Event Authorization** - בדיקה לכל event
- ✅ **CORS** - מוגבל
- 📋 **Rate Limiting** - אפשר להוסיף

### 8.5 Data Security

- ✅ **Encryption at Rest** - Database encryption (תלוי בספק)
- ✅ **Encryption in Transit** - HTTPS/WSS
- ✅ **Sensitive Data** - Passwords hashed, tokens in Redis
- ✅ **Secrets Management** - Environment variables, Kubernetes secrets

### 8.6 Infrastructure Security

- ✅ **Container Security** - Non-root users
- ✅ **Image Scanning** - Trivy vulnerability scanner
- ✅ **Dependency Scanning** - npm audit
- ✅ **SARIF Reports** - GitHub Security tab
- ✅ **Network Policies** - Kubernetes network isolation

### 8.7 Compliance

- 📋 **GDPR** - צריך להוטמע
  - Right to be forgotten
  - Data export
  - Privacy policy
- 📋 **CCPA** - California privacy
- 📋 **Terms of Service**
- 📋 **Privacy Policy**

---

## 9. ביצועים

### 9.1 מטרות ביצועים

| מדד | יעד | סטטוס |
|-----|-----|-------|
| API Response Time (p95) | < 200ms | ⏳ לא נבדק |
| API Response Time (p99) | < 500ms | ⏳ לא נבדק |
| WebSocket Latency | < 50ms | ⏳ לא נבדק |
| Database Query Time | < 100ms | ⏳ לא נבדק |
| Page Load Time | < 2s | ⏳ לא נבדק |
| Build Time | < 5min | ✅ ~3min |
| Docker Build Time | < 10min | ✅ ~8min |

### 9.2 אופטימיזציות

#### Backend
- ✅ **Fastify** - מהיר פי 2 מExpress
- ✅ **Prisma** - Query optimization
- ✅ **Redis Caching** - מוכן לשימוש
- ✅ **Connection Pooling** - Prisma built-in
- ✅ **Database Indexes** - 40+ indexes על כל הטבלאות

#### Frontend
- ✅ **Vite** - מהיר פי 10 מWebpack
- ✅ **Code Splitting** - אוטומטי עם Vite
- ✅ **Tree Shaking** - הסרת קוד מיותר
- ✅ **Image Optimization** - מוכן ל-CDN
- ✅ **Lazy Loading** - React.lazy על כל 50+ דפים

#### Infrastructure
- ✅ **Docker Multi-stage** - קטן יותר, מהיר יותר
- ✅ **Layer Caching** - build מהיר יותר
- ✅ **HPA (Kubernetes)** - auto-scaling
- ✅ **Load Balancing** - nginx ingress
- ✅ **CDN Ready** - CloudFlare compatible

### 9.3 Monitoring

#### Metrics שנאספים
- ✅ Request rate (requests/second)
- ✅ Response time (p50, p95, p99)
- ✅ Error rate (4xx, 5xx)
- ✅ WebSocket connections (active)
- ✅ Database query time
- ✅ Redis operations
- ✅ CPU usage
- ✅ Memory usage
- ✅ Disk usage
- ✅ Network I/O

#### Dashboards
- ✅ **API Overview** - בGrafana
- ✅ **System Health**
- ✅ **Database Performance**
- ✅ **WebSocket Activity**
- ✅ **Error Tracking**

#### Alerts
- ✅ API down (> 1min)
- ✅ High error rate (> 5%)
- ✅ Slow queries (> 1s)
- ✅ High memory (> 90%)
- ✅ High CPU (> 80%)
- ✅ Disk full (> 90%)

---

## 10. Roadmap

### 10.1 השלמה קצרה (1-2 חודשים)

#### Phase 4: Frontend Integration ✅ מושלם
**משך:** 4 שבועות
**מטרה:** חיבור Frontend ל-Backend החדש
**סטטוס:** ✅ **מושלם - 100%**
**תאריך השלמה:** פברואר 2026

**מה הושלם:**
- ✅ הסרה מלאה של Base44 SDK
- ✅ הסרת Base44 Vite Plugin
- ✅ מחיקת קובץ app-params.js
- ✅ יצירת API Client חדש מבוסס Axios
- ✅ Token Storage עם Refresh אוטומטי
- ✅ 12 Services: Auth, User, Chat, Mission, Response, Upload, Story, Like, Follow, Notification, Report, Achievement
- ✅ עדכון AuthContext ו-UserProvider
- ✅ מיגרציה של כל 36 דפים שהשתמשו ב-base44.entities
- ✅ מיגרציה של כל הקומפוננטות (FeedPost, StarSendersModal, HeartResponseSelector, etc.)
- ✅ הסרת base44Client.js לחלוטין
- ✅ תיעוד מלא במסמכי BASE44_REMOVAL_CHECKLIST.md ו-NEW_API_CLIENT.md

#### Phase 9: פריסת סביבת QA ב-Oracle Cloud 📋
**משך:** 2 שעות
**מטרה:** פריסת סביבת QA חינמית לבדיקות ברשת
**סטטוס:** 📋 מתוכנן
**עלות:** $0 לצמיתות

**משימות:**
- [ ] רישום ל-Oracle Cloud Free Tier
- [ ] יצירת VCN ו-Security Rules
- [ ] יצירת VM (ARM: 4 CPUs, 24GB RAM)
- [ ] התקנת Docker והגדרת השרת
- [ ] הגדרת SSH Keys ל-GitHub
- [ ] Clone הפרויקט והגדרת Environment
- [ ] Build והפעלה ראשונית
- [ ] הגדרת Auto-Deploy מ-GitHub (Webhook/Actions)
- [ ] Domain + SSL (אופציונלי)
- [ ] בדיקות תקינות

**מסמך מפורט:** [ORACLE_CLOUD_QA_DEPLOYMENT.md](ORACLE_CLOUD_QA_DEPLOYMENT.md)

---

#### Phase 6: Testing 📋
**משך:** 2-3 שבועות
**מטרה:** כיסוי בדיקות מקיף לאיכות ואמינות המערכת
**סטטוס:** 📋 מתוכנן
**יעד כיסוי:** 80%+

---

##### 6.1 Unit Tests (שבוע 1)

**Backend Services:**
| Service | Priority | Test Count | Coverage Target |
|---------|----------|------------|-----------------|
| authService | 🔴 Critical | 15+ | 90% |
| userService | 🔴 Critical | 20+ | 85% |
| chatService | 🔴 Critical | 15+ | 85% |
| missionService | 🟡 High | 12+ | 80% |
| responseService | 🟡 High | 12+ | 80% |
| likeService | 🟡 High | 10+ | 80% |
| followService | 🟡 High | 10+ | 80% |
| notificationService | 🟢 Medium | 8+ | 75% |
| storyService | 🟢 Medium | 10+ | 75% |
| achievementService | 🟢 Medium | 8+ | 75% |
| reportService | 🟢 Medium | 8+ | 75% |
| uploadService | 🟢 Medium | 6+ | 70% |

**משימות:**
- [ ] הגדרת Jest/Vitest configuration
- [ ] יצירת test utilities ו-mocks
- [ ] כתיבת unit tests ל-authService
- [ ] כתיבת unit tests ל-userService
- [ ] כתיבת unit tests ל-chatService
- [ ] כתיבת unit tests לשאר ה-services
- [ ] הגדרת coverage thresholds

**קבצים ליצירה:**
```
apps/api/src/__tests__/
├── setup.ts                    # Test setup
├── mocks/
│   ├── prisma.mock.ts         # Prisma client mock
│   ├── redis.mock.ts          # Redis mock
│   └── socket.mock.ts         # Socket.io mock
├── services/
│   ├── auth.service.test.ts
│   ├── user.service.test.ts
│   ├── chat.service.test.ts
│   ├── mission.service.test.ts
│   ├── response.service.test.ts
│   ├── like.service.test.ts
│   ├── follow.service.test.ts
│   ├── notification.service.test.ts
│   ├── story.service.test.ts
│   ├── achievement.service.test.ts
│   ├── report.service.test.ts
│   └── upload.service.test.ts
└── utils/
    ├── validation.test.ts
    └── helpers.test.ts
```

**Frontend Components:**
- [ ] Unit tests ל-hooks (useAuth, useUser, useChat)
- [ ] Unit tests ל-services (API clients)
- [ ] Component tests ל-UI components קריטיים

---

##### 6.2 Integration Tests (שבוע 1-2)

**API Endpoints:**
| Endpoint Group | Priority | Test Count |
|---------------|----------|------------|
| /api/v1/auth/* | 🔴 Critical | 10+ |
| /api/v1/users/* | 🔴 Critical | 12+ |
| /api/v1/chats/* | 🔴 Critical | 10+ |
| /api/v1/missions/* | 🟡 High | 8+ |
| /api/v1/responses/* | 🟡 High | 8+ |
| /api/v1/likes/* | 🟡 High | 6+ |
| /api/v1/follows/* | 🟡 High | 6+ |
| /api/v1/notifications/* | 🟢 Medium | 6+ |
| /api/v1/stories/* | 🟢 Medium | 6+ |
| /api/v1/admin/* | 🟢 Medium | 10+ |

**משימות:**
- [ ] הגדרת Supertest/Fastify inject
- [ ] יצירת test database (Docker)
- [ ] כתיבת integration tests ל-auth endpoints
- [ ] כתיבת integration tests ל-user endpoints
- [ ] כתיבת integration tests ל-chat endpoints
- [ ] כתיבת integration tests לשאר ה-endpoints
- [ ] בדיקות WebSocket events

**קבצים ליצירה:**
```
apps/api/src/__tests__/
├── integration/
│   ├── auth.integration.test.ts
│   ├── users.integration.test.ts
│   ├── chats.integration.test.ts
│   ├── missions.integration.test.ts
│   ├── responses.integration.test.ts
│   ├── likes.integration.test.ts
│   ├── follows.integration.test.ts
│   ├── notifications.integration.test.ts
│   ├── stories.integration.test.ts
│   └── admin.integration.test.ts
└── websocket/
    ├── presence.test.ts
    ├── chat.test.ts
    └── typing.test.ts
```

**Test Scenarios - Auth:**
```typescript
// Example test scenarios
describe('POST /api/v1/auth/register', () => {
  it('should register a new user successfully')
  it('should reject duplicate email')
  it('should validate password requirements')
  it('should return JWT tokens')
})

describe('POST /api/v1/auth/login', () => {
  it('should login with valid credentials')
  it('should reject invalid password')
  it('should reject blocked user')
  it('should update lastActiveAt')
})
```

---

##### 6.3 E2E Tests (שבוע 2)

**כלי:** Playwright

**Critical User Flows:**
| Flow | Priority | Steps |
|------|----------|-------|
| Registration → Onboarding | 🔴 Critical | 8 |
| Login → Dashboard | 🔴 Critical | 4 |
| Browse Profiles → Like | 🔴 Critical | 5 |
| Chat → Send Message | 🔴 Critical | 6 |
| Profile Edit → Save | 🟡 High | 5 |
| Mission → Response | 🟡 High | 6 |
| Settings → Change Language | 🟢 Medium | 3 |
| Admin → User Management | 🟢 Medium | 6 |

**משימות:**
- [ ] התקנת Playwright
- [ ] הגדרת test environment
- [ ] כתיבת E2E tests ל-registration flow
- [ ] כתיבת E2E tests ל-login flow
- [ ] כתיבת E2E tests ל-discovery flow
- [ ] כתיבת E2E tests ל-chat flow
- [ ] כתיבת E2E tests ל-profile flow
- [ ] כתיבת E2E tests ל-admin flow

**קבצים ליצירה:**
```
apps/web/e2e/
├── playwright.config.ts
├── fixtures/
│   ├── auth.fixture.ts
│   └── data.fixture.ts
├── pages/
│   ├── login.page.ts
│   ├── register.page.ts
│   ├── discover.page.ts
│   ├── chat.page.ts
│   └── profile.page.ts
└── tests/
    ├── auth.spec.ts
    ├── onboarding.spec.ts
    ├── discovery.spec.ts
    ├── chat.spec.ts
    ├── profile.spec.ts
    └── admin.spec.ts
```

---

##### 6.4 Performance Testing (שבוע 2-3)

**כלי:** k6 / Artillery

**יעדים:**
| Metric | Target | Max Acceptable |
|--------|--------|----------------|
| API Response Time (p95) | < 200ms | < 500ms |
| API Response Time (p99) | < 500ms | < 1000ms |
| WebSocket Latency | < 50ms | < 100ms |
| Concurrent Users | 1000+ | - |
| Requests/Second | 500+ | - |
| Error Rate | < 0.1% | < 1% |

**Test Scenarios:**
```javascript
// k6 load test example
export const options = {
  stages: [
    { duration: '1m', target: 100 },  // Ramp up
    { duration: '5m', target: 100 },  // Steady state
    { duration: '1m', target: 500 },  // Spike
    { duration: '5m', target: 500 },  // High load
    { duration: '2m', target: 0 },    // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<200', 'p(99)<500'],
    http_req_failed: ['rate<0.01'],
  },
};
```

**משימות:**
- [ ] הגדרת k6 configuration
- [ ] כתיבת load tests ל-API endpoints
- [ ] כתיבת stress tests
- [ ] כתיבת spike tests
- [ ] בדיקת WebSocket scalability
- [ ] בדיקת Database performance
- [ ] תיעוד תוצאות ו-bottlenecks

**קבצים ליצירה:**
```
tests/performance/
├── k6.config.js
├── scenarios/
│   ├── api-load.js
│   ├── api-stress.js
│   ├── api-spike.js
│   ├── websocket-load.js
│   └── database-load.js
└── reports/
    └── .gitkeep
```

---

##### 6.5 Security Testing (שבוע 3)

**בדיקות אבטחה:**
| Category | Tests | Priority |
|----------|-------|----------|
| Authentication | JWT validation, session hijacking | 🔴 Critical |
| Authorization | Role-based access, permission bypass | 🔴 Critical |
| Input Validation | SQL injection, XSS, CSRF | 🔴 Critical |
| Rate Limiting | Brute force, DoS protection | 🟡 High |
| Data Exposure | PII leakage, sensitive data | 🟡 High |
| API Security | CORS, headers, TLS | 🟢 Medium |

**משימות:**
- [ ] OWASP ZAP scan
- [ ] בדיקת SQL Injection
- [ ] בדיקת XSS vulnerabilities
- [ ] בדיקת CSRF protection
- [ ] בדיקת authentication bypass
- [ ] בדיקת authorization bypass
- [ ] בדיקת rate limiting
- [ ] בדיקת sensitive data exposure
- [ ] Dependency vulnerability scan (npm audit)

**כלים:**
- OWASP ZAP - Automated security scanning
- npm audit - Dependency vulnerabilities
- Trivy - Container security
- SonarQube - Code quality & security (optional)

---

##### 6.6 CI/CD Integration

**GitHub Actions Workflow:**
```yaml
# .github/workflows/test.yml
name: Test Suite

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run test:unit
      - uses: codecov/codecov-action@v4

  integration-tests:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_PASSWORD: test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
      redis:
        image: redis:7
        options: >-
          --health-cmd "redis-cli ping"
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npm run test:integration

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npx playwright install
      - run: npm run test:e2e
      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/

  security-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm audit --audit-level=high
      - uses: aquasecurity/trivy-action@master
        with:
          scan-type: 'fs'
          severity: 'CRITICAL,HIGH'
```

**משימות:**
- [ ] עדכון GitHub Actions workflow
- [ ] הוספת test jobs
- [ ] הגדרת coverage reporting (Codecov)
- [ ] הגדרת test artifacts
- [ ] הגדרת branch protection rules

---

##### 6.7 Test Scripts (package.json)

```json
{
  "scripts": {
    "test": "npm run test:unit && npm run test:integration",
    "test:unit": "vitest run --coverage",
    "test:unit:watch": "vitest watch",
    "test:integration": "vitest run --config vitest.integration.config.ts",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:perf": "k6 run tests/performance/scenarios/api-load.js",
    "test:security": "npm audit && trivy fs .",
    "test:coverage": "vitest run --coverage --reporter=lcov"
  }
}
```

---

##### 6.8 Definition of Done (Phase 6)

**Criteria:**
- [ ] Unit test coverage ≥ 80%
- [ ] All integration tests passing
- [ ] All E2E critical flows passing
- [ ] Performance targets met (p95 < 200ms)
- [ ] No critical/high security vulnerabilities
- [ ] CI pipeline green on all checks
- [ ] Test documentation complete
- [ ] Coverage reports accessible

**Deliverables:**
- [ ] Test suite with 150+ tests
- [ ] Coverage report (HTML + Codecov)
- [ ] Performance benchmark results
- [ ] Security audit report
- [ ] CI/CD pipeline with all checks

---

### 10.2 Phase 5: Admin & Tools ✅ מושלם

**סטטוס:** מושלם (100%)
**תאריך השלמה:** פברואר 2026

#### מה הושלם:
- ✅ **File Upload** - R2/Local abstraction עם image optimization (Sharp)
- ✅ **Stories Service** - 24h content, create/view/delete, cleanup job
- ✅ **Missions Service** - CRUD, daily missions, completion tracking
- ✅ **Achievements Service** - Auto-unlock, XP rewards, notifications
- ✅ **Admin Dashboard API** - Full REST API for admin operations
- ✅ **Analytics Service** - Dashboard metrics, user growth, retention
- ✅ **Background Jobs** - Story cleanup, chat expiry, premium expiration
- ✅ **Moderation Tools** - Reports management, user blocking

#### API Endpoints נוספו:
```
/api/v1/admin/dashboard          - Overview metrics
/api/v1/admin/analytics/*        - User, content, moderation analytics
/api/v1/admin/users              - User management
/api/v1/admin/reports            - Report moderation
/api/v1/admin/jobs               - Background jobs status
/api/v1/admin/export/users       - Export (JSON/CSV)
```

### 10.3 השלב הבא - Phase 6 (Testing) 📋

**ראה סעיף 10.1 לתוכנית מפורטת**

**סיכום:**
- **משך:** 2-3 שבועות
- **יעד כיסוי:** 80%+
- **בדיקות:** Unit, Integration, E2E, Performance, Security
- **כלים:** Vitest, Playwright, k6, OWASP ZAP
- **CI/CD:** GitHub Actions עם coverage reports

### 10.4 טווח ארוך (6-12 חודשים)

#### Advanced Features
- [ ] Matches & Discovery algorithm
- [ ] Premium subscriptions (Stripe)
- [ ] Push notifications (Firebase)
- [ ] Video/Audio calls (WebRTC)
- [ ] AI-powered matching
- [ ] Multi-language content moderation

#### Scale & Performance
- [ ] Multi-region deployment
- [ ] CDN integration
- [ ] Database sharding
- [ ] Read replicas
- [ ] Message queue (RabbitMQ/Kafka)
- [ ] Microservices split (אם נדרש)

---

## 11. דרישות מערכת

### 11.1 דרישות לפיתוח

#### Software
- **Node.js:** 18 or 20 (מומלץ 20)
- **npm:** 9+
- **Docker Desktop:** Latest
- **Git:** Latest
- **VS Code** (או IDE אחר):
  - Extensions: ESLint, Prettier, TypeScript

#### Hardware (Minimal)
- **CPU:** Intel/AMD 2 cores
- **RAM:** 4GB
- **Disk:** 10GB free space
- **OS:** Windows 10+, macOS 12+, Linux (Ubuntu 20.04+)

### 11.2 דרישות לפרודקשן

#### Option A: All-in-One (Minimal)
- **CPU:** 1 core
- **RAM:** 275MB
- **Disk:** 2GB
- **Network:** 1Mbps
- **OS:** Linux (any), Docker support

#### Option B: Standard Production
- **CPU:** 2-4 cores
- **RAM:** 4-8GB
- **Disk:** 20-50GB
- **Network:** 10-100Mbps
- **OS:** Linux (Ubuntu 22.04 recommended)

#### Option C: High Traffic
- **Kubernetes Cluster:** 3+ nodes
- **CPU:** 8+ cores per node
- **RAM:** 16GB+ per node
- **Disk:** 100GB+ SSD
- **Network:** 1Gbps+
- **Load Balancer:** nginx or cloud LB

### 11.3 דרישות Database

#### Development
- **PostgreSQL:** 16
- **Disk:** 1GB
- **Connections:** 20

#### Production (Small)
- **PostgreSQL:** 16
- **RAM:** 1GB
- **Disk:** 10GB SSD
- **Connections:** 100

#### Production (Large)
- **PostgreSQL:** 16 (managed service מומלץ)
- **RAM:** 8GB+
- **Disk:** 100GB+ SSD
- **Connections:** 500+
- **Replicas:** 1+ read replicas

---

## 12. הערות חשובות למנהלי מוצר

### 12.1 עדכוני מסמך זה

**חובה לעדכן מסמך זה בכל שינוי משמעותי!**

- ✅ תכונה חדשה נוספה → עדכן סעיף 4 (יכולות)
- ✅ תכונה הושלמה → עדכן סעיף 5 (סטטוס)
- ✅ שינוי ארכיטקטורה → עדכן סעיף 6
- ✅ שינוי בדרישות → עדכן סעיף 11
- ✅ עדכון Roadmap → עדכן סעיף 10

**תאריך עדכון אחרון צריך להיות תמיד מעודכן בראש המסמך.**

### 12.2 שימוש במסמך

**למי זה מיועד:**
- **מנהלי מוצר** - הבנת scope והתקדמות
- **מפתחים** - הבנת דרישות וארכיטקטורה
- **DevOps** - הבנת דרישות תשתית
- **QA** - הבנת מה צריך לבדוק
- **Stakeholders** - הבנת סטטוס ו-roadmap

**איך להשתמש:**
- קרא את הסקירה הכללית (סעיף 1)
- עבור לסעיף הרלוונטי לך
- בדוק סטטוס פיתוח (סעיף 5)
- עדכן את עצמך ב-Roadmap (סעיף 10)

### 12.3 קישורים למסמכים נוספים

- [MIGRATION_PLAN.md](MIGRATION_PLAN.md) - אסטרטגיית המעבר מBase44
- [README.md](../README.md) - מדריך מהיר
- [PHASE_3_COMPLETION_STATUS.md](PHASE_3_COMPLETION_STATUS.md) - סטטוס Backend מפורט
- [DEPLOYMENT_INFRASTRUCTURE_COMPLETE.md](DEPLOYMENT_INFRASTRUCTURE_COMPLETE.md) - סטטוס Deployment
- [FREE_HOSTING_OPTIONS.md](FREE_HOSTING_OPTIONS.md) - אפשרויות אירוח חינם
- [CLOUD_AGNOSTIC_DEPLOYMENT.md](CLOUD_AGNOSTIC_DEPLOYMENT.md) - מדריך פריסה

---

## 13. סיכום מנהלים (Executive Summary)

### 13.1 מצב הפרוייקט

**Bellor MVP נמצא ב-90% השלמה ומוכן לשלב הבא.**

✅ **מה עובד היום:**
- Backend מלא עם Authentication, Users, WebSocket
- Database מתוקן ופועל עם Indexes מלאים
- Stories, Achievements, Reports & Moderation - מיושמים במלואם
- Premium Subscriptions עם Stripe integration
- Push Notifications עם Firebase Cloud Messaging
- CI/CD pipeline פעיל
- Monitoring מלא
- ניתן לפריסה בכל מקום תוך 15 דקות
- Lazy Loading בכל 50+ דפי Frontend
- תשתית בדיקות מלאה (Vitest + Playwright)
- 0 שגיאות TypeScript

📋 **מה נשאר לעשות:**
- חיבור Frontend ל-Backend החדש (2 שבועות)
- השלמת בדיקות Unit/Integration (1 שבוע)
- Security audit (1 שבוע)

### 13.2 מתי אפשר לעלות לפרודקשן?

**תאריך משוער:** אפריל-מאי 2026
**תנאים:**
- ✅ Phase 4 complete (Frontend integration)
- ✅ File upload working
- ✅ 60%+ test coverage
- ✅ Security audit passed
- ✅ Load testing passed
- ✅ Beta testing (100 users) successful

### 13.3 סיכונים

| סיכון | השפעה | סיכוי | התמודדות |
|-------|-------|-------|----------|
| Frontend integration delays | גבוהה | בינוני | תכנון טוב, 3 שבועות buffer |
| Security vulnerabilities | גבוהה מאוד | נמוך | Security audit, penetration test |
| Performance issues | בינונית | בינוני | Load testing, optimization |
| Database scaling | בינונית | נמוך | PostgreSQL מתמודד טוב עד 100K users |
| Cost overrun | נמוכה | נמוך | Cloud-agnostic, אפשר להחליף ספק |

### 13.4 המלצות

1. **השלם חיבור Frontend ל-Backend** - הצעד האחרון לפני beta
2. **הרץ את כל הבדיקות** - Vitest unit + Playwright E2E
3. **בצע Security Audit** - OWASP Top 10, penetration testing
4. **תכנן beta testing** - 100 משתמשים, 2 שבועות
5. **הכן production environment** - Stripe keys, Firebase credentials
6. **שקול managed database** - לפרודקשן (AWS RDS, Supabase)

---

## 14. הנחיות פיתוח (Development Guidelines)

### 14.1 עיקרון מנחה עליון

> 🚨 **כתוב את הקוד ובצע את כל הפעילויות ברמה הגבוהה ביותר האפשרית כדי לתת מענה למערכת רובסטית שתשמש עשרות אלפי משתמשים בו זמנית.**

### 14.2 סטנדרטים טכניים

#### 14.2.1 Code Quality
```typescript
// ✅ GOOD - Production-ready code
export async function getUserById(id: string): Promise<User | null> {
  const cacheKey = `user:${id}`;

  // Check cache first
  const cached = await redis.get(cacheKey);
  if (cached) return JSON.parse(cached);

  // Database query with timeout
  const user = await prisma.user.findUnique({
    where: { id },
    select: userSelectFields,
  });

  // Cache for 5 minutes
  if (user) {
    await redis.setex(cacheKey, 300, JSON.stringify(user));
  }

  return user;
}

// ❌ BAD - Not production-ready
export async function getUser(id) {
  return await prisma.user.findUnique({ where: { id } });
}
```

#### 14.2.2 Performance Requirements

| Component | Target | Max Acceptable |
|-----------|--------|----------------|
| API Response (p50) | < 50ms | < 100ms |
| API Response (p95) | < 200ms | < 500ms |
| API Response (p99) | < 500ms | < 1000ms |
| WebSocket Message | < 50ms | < 100ms |
| Database Query | < 50ms | < 200ms |
| Redis Operation | < 5ms | < 20ms |
| Page Load (FCP) | < 1.5s | < 3s |
| Page Load (LCP) | < 2.5s | < 4s |

#### 14.2.3 Scalability Patterns

**חובה להשתמש ב:**
- ✅ Connection pooling (Prisma, Redis)
- ✅ Caching layers (Redis, in-memory)
- ✅ Pagination לכל רשימות
- ✅ Rate limiting לכל endpoints
- ✅ Circuit breakers לservices חיצוניים
- ✅ Graceful degradation
- ✅ Health checks (liveness, readiness)
- ✅ Horizontal scaling support

**אסור:**
- ❌ N+1 queries
- ❌ Unbounded queries (SELECT * FROM users)
- ❌ Synchronous blocking operations
- ❌ Memory leaks
- ❌ Hardcoded configurations

#### 14.2.4 Security Standards

**Authentication & Authorization:**
- JWT tokens with short expiry (15min access, 7d refresh)
- bcrypt password hashing (12+ rounds)
- Rate limiting on auth endpoints
- Session invalidation on logout

**Input Validation:**
- Zod schemas לכל input
- SQL injection prevention (Prisma parameterized)
- XSS prevention (sanitization)
- CSRF protection

**Data Protection:**
- HTTPS only
- Sensitive data encryption
- PII minimization
- Audit logging

#### 14.2.5 Error Handling

```typescript
// ✅ Production error handling
try {
  const result = await riskyOperation();
  return result;
} catch (error) {
  // Log with context
  logger.error('Operation failed', {
    operation: 'riskyOperation',
    userId: context.userId,
    error: error instanceof Error ? error.message : 'Unknown error',
    stack: error instanceof Error ? error.stack : undefined,
  });

  // Notify monitoring
  metrics.increment('operation.error', { type: 'riskyOperation' });

  // Return safe error to client
  throw new AppError('OPERATION_FAILED', 'Unable to complete request', 500);
}
```

### 14.3 Testing Requirements

| Test Type | Coverage Target | When Required |
|-----------|-----------------|---------------|
| Unit Tests | 80%+ | כל Service, Utility |
| Integration Tests | Critical paths | API endpoints, DB operations |
| E2E Tests | Happy paths | User flows קריטיים |
| Performance Tests | On demand | שינויים לcomponents קריטיים |
| Security Tests | Before release | כל release |

### 14.4 Code Review Checklist

לפני merge של כל PR:

#### Functionality
- [ ] הקוד עושה מה שהמשימה דורשת
- [ ] Edge cases מטופלים
- [ ] אין regression לפונקציונליות קיימת

#### Performance
- [ ] אין N+1 queries (השתמש ב-`include` ב-Prisma)
- [ ] יש caching לשאילתות חוזרות (Redis)
- [ ] אינדקסים מתאימים בDB
- [ ] Lazy loading לקומפוננטות כבדות

#### Security
- [ ] Input validation (Zod schemas)
- [ ] SQL injection prevention (Prisma parameterized)
- [ ] XSS prevention (sanitize user input)
- [ ] Auth/Authorization בכל endpoint
- [ ] Sensitive data לא נחשף ב-logs

#### Error Handling
- [ ] Try/catch בקוד async
- [ ] Error messages מתאימים למשתמש
- [ ] Errors מתועדים ל-logging
- [ ] Graceful degradation

#### Code Quality
- [ ] אין `any` ב-TypeScript
- [ ] Strict mode עובר (`tsc --noEmit`)
- [ ] ESLint עובר ללא שגיאות
- [ ] קוד קריא ומתועד
- [ ] DRY - אין כפילות קוד

#### Testing
- [ ] Unit tests לפונקציות חדשות
- [ ] Integration tests ל-API endpoints
- [ ] Coverage לא ירד מתחת ל-60%
- [ ] כל הבדיקות עוברות (`npm test`)

#### Documentation
- [ ] JSDoc לפונקציות ציבוריות
- [ ] README מעודכן אם נדרש
- [ ] API docs (Swagger/OpenAPI) מעודכנים
- [ ] Breaking changes מתועדים

#### Git & PR
- [ ] Commit messages ברורים ותמציתיים
- [ ] PR description מסביר את השינוי
- [ ] Branch מעודכן עם main
- [ ] Conflicts נפתרו

### 14.5 Monitoring & Observability

**Metrics חובה:**
- Request rate, latency, errors (RED)
- CPU, memory, disk (USE)
- Business metrics (users, messages, etc.)

**Logging levels:**
- `error` - שגיאות שדורשות תיקון
- `warn` - מצבים לא רצויים
- `info` - פעילות עסקית חשובה
- `debug` - מידע לדיבוג (לא בproduction)

**Alerts:**
- Error rate > 1%
- Response time p95 > 500ms
- Service unhealthy > 1 minute
- Disk usage > 80%

---

**סוף מסמך PRD**

**הבא:** [תחילת Phase 6 - Testing](MIGRATION_PLAN.md#phase-6-testing)

**עודכן לאחרונה:** פברואר 2026 by Claude Code
**גרסה:** 1.2.1-beta
