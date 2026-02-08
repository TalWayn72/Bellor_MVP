# Bellor Project Configuration

## Project Status
**Migration from Base44:** All phases through Phase 7 Complete ✅
**Current Phase:** Production Ready - Final Polish Complete
**Code Quality:** ~136 `any` types cleaned, ~43 console.log migrated to Logger
**Features Completed:** Push notifications, audio playback, story viewer modal

## ⛔ Old Projects - DO NOT ACCESS
The following are OLD projects that are **no longer active**. Do NOT access, read, or modify any files in them:
- **`C:\Users\talwa\bellor`** - Old Bellor project (Base44-based)
- **`C:\Users\talwa\bellor_OLD.zip`** - Archived old Bellor project

The **only active project** is **Bellor_MVP** at `C:\Users\talwa\.claude\projects\Bellor_MVP`.

## הנחיות עבודה חשובות
- **תמיד לקרוא את ההגדרות לפני עבודה** - לקרוא את CLAUDE.md בתחילת כל שיחה
- **טען את החוקים ל-Context Window** - בכל שיחה חדשה, לטעון את כל חוקי העבודה מקובץ זה
- **קרא חוקים לפני כל פעילות** - לפני ביצוע משימה, לוודא שהחוקים נקראו והובנו
- **עבוד בצורה מסודרת ומקצועית** - אתה מפתח בכיר מאוד
- **עקוב אחר התקינה החדישה** - TypeScript, ESLint, Prettier
- **סדר קבצים בתיקיות הנכונות** - שמור על מבנה נקי
- **עדכן תיעוד בסוף כל פעילות** - README, status docs, CLAUDE.md
- **סנכרן מספרים ב-CLAUDE.md וב-README.md** - כשמשתנה מספר טסטים, באגים, קבצים, סטטוס שלבים וכו' - לעדכן את שני הקבצים יחד כדי לשמור על עקביות
- **מותר לבצע שינויים ללא שאלות** - פעל באופן עצמאי
- **בדוק פונקציונליות בסיום** - ודא שהכל עובד
- **השלם בדיקות אוטומטיות לפני פריסה** - תמיד לוודא שכל הבדיקות עוברות לפני deployment
- **תקן תקלות אוטומטית** - במקרה של כשל, לזהות ולתקן את הבעיה באופן עצמאי
- **השתמש ב-VS Code Extensions** - להשתמש בתוספים המותקנים כדי לייעל את העבודה (Vitest, Playwright, Docker, PostgreSQL Client וכו')
- **ריבוי משימות במקביל** - כשיש מספר משימות שאינן תלויות זו בזו, יש לבצען באמצעות Agents אוטומטיים במקביל (Task tool) כדי לחסוך זמן
- **בדיקת אבטחה לקוד חדש** - כל קוד חדש שנכנס (כולל מ-Agents) חייב לעמוד בתקני האבטחה: ללא XSS, SQL injection, command injection, secrets בקוד, input לא מסונן, או חשיפת מידע רגיש. יש לסרוק קוד חדש מול `docs/SECURITY_CHECKLIST.md` לפני commit

## 📏 Code Quality Rules

### Maximum File Size (150 Lines)
- **150 lines maximum** per source code file
- If a file approaches or exceeds 150 lines, it MUST be split into smaller modules
- Extract sub-components, utility functions, constants, or data into separate files
- Always create barrel files (index.js/ts) when splitting to maintain backward-compatible imports
- **Exceptions:** Test files, Prisma schema, Radix UI wrappers (`apps/web/src/components/ui/`), app entry points

### Activity Tracking
- **Every task/activity MUST be logged in `docs/OPEN_ISSUES.md`** with status tracking
- Update status as work progresses: ⏳ pending -> 🔄 in progress -> ✅ completed
- This applies to: bug fixes, feature additions, refactoring, infrastructure changes
- At the end of each task, verify OPEN_ISSUES.md is up to date

## 🚀 הפעלת שירותים חובה - בתחילת כל שיחה

**⚠️ חובה להפעיל את כל השירותים בתחילת כל שיחת עבודה!**

### סדר הפעלה (חובה):
```bash
# שלב 1: הפעלת Docker (PostgreSQL + Redis)
cd C:\Users\talwa\.claude\projects\Bellor_MVP
npm run docker:up

# שלב 2: הפעלת Backend API (port 3000)
npm run dev:api

# שלב 3 (אופציונלי): הפעלת Frontend (port 5173)
npm run dev
```

### ⚠️ חשוב: אם מסד הנתונים ריק
אם אין משתמשים/נתונים במערכת (למשל אחרי התקנה חדשה), יש להריץ את ה-seed:
```bash
cd apps/api && npx prisma db seed
```
זה יוסיף 20 משתמשי דמו, משימות, תגובות, צ'אטים ועוד.

### בדיקת שירותים פעילים:
```bash
# בדיקה מהירה - האם הכל רץ?
docker ps                           # צריך לראות bellor_postgres + bellor_redis
curl http://localhost:3000/health   # צריך להחזיר {"status":"ok"...}
```

### אם שירות לא רץ:
| בעיה | פתרון |
|------|--------|
| Docker לא רץ | `npm run docker:up` |
| API לא רץ (port 3000) | `npm run dev:api` |
| Frontend לא רץ (port 5173) | `npm run dev` |

**⚠️ אסור להתחיל עבודה לפני שכל השירותים הנדרשים פועלים!**

## 🔴 בדיקת שירותים חובה - לפני סיום כל עבודה

**חובה לוודא שכל השירותים פועלים לפני סיום כל משימה:**

| שירות | פורט | פקודת הפעלה | בדיקה |
|--------|------|-------------|--------|
| Frontend (Vite) | 5173 | `npm run dev` | http://localhost:5173 |
| Backend (API) | 3000 | `npm run dev:api` | http://localhost:3000 |
| PostgreSQL | 5432 | `npm run docker:up` | Docker container |
| Redis | 6379 | `npm run docker:up` | Docker container |

### פקודת בדיקה מהירה
```bash
# בדיקת כל השירותים
docker ps && netstat -ano | findstr ":3000 :5173"
```

### תהליך סיום עבודה
1. ✅ וודא ש-Docker רץ (PostgreSQL + Redis)
2. ✅ וודא ש-Backend API רץ על פורט 3000
3. ✅ וודא ש-Frontend רץ על פורט 5173
4. ✅ בדוק שאין שגיאות ב-Console של הדפדפן
5. ✅ הרץ בדיקות: `npm run test` (אם רלוונטי)
6. ✅ **אם תוקנו באגים:** תעד ב-OPEN_ISSUES.md + צור בדיקות (ראה סעיף "תיעוד באגים")
7. ✅ עדכן תיעוד (CLAUDE.md, README.md) אם נדרש

**⚠️ אין לסיים משימה ללא:**
- אישור שכל השירותים פועלים
- **תיעוד באגים שתוקנו ב-OPEN_ISSUES.md**
- **יצירת בדיקות לכל באג שתוקן**

## 📦 Git Sync - סנכרון קוד

**Repository:** https://github.com/TalWayn72/Bellor_MVP

### מדיניות Commit
| מצב | פעולה |
|-----|--------|
| תיקון באג | Commit מיידי |
| פיצ'ר שלם | Commit בסיום |
| Refactoring | Commit אחרי שינוי לוגי שלם |
| סוף יום עבודה | Commit + Push לגיבוי |

### תהליך עבודה
1. **אני (Claude) מזכיר** - אחרי השלמת משימה משמעותית, אציע לבצע commit
2. **אתה מאשר** - תאשר או תדחה את ה-commit
3. **אני מבצע** - git add, commit, push

### פקודות
```bash
# בדיקת סטטוס
git status

# Commit ו-Push (אחרי אישור)
git add -A && git commit -m "הודעה" && git push
```

**⚠️ אסור לעשות commit אוטומטי ללא אישור המשתמש!**

## 🔴 תיעוד באגים ובדיקות - CRITICAL / MANDATORY

**⚠️ חובה לבצע לאחר כל תיקון באג! אין לסיים משימת תיקון באג ללא ביצוע כל הצעדים!**

### תהליך חובה לאחר תיקון באג:
| # | צעד | תיאור |
|---|-----|-------|
| 1 | ✅ תעד ב-OPEN_ISSUES.md | מיד לאחר זיהוי ותיקון |
| 2 | ✅ צור בדיקות אוטומטיות | unit test / integration test לכל באג |
| 3 | ✅ עדכן סטטוס | 🔴 פתוח → 🟡 בטיפול → ✅ תוקן |
| 4 | ✅ עדכן טבלת סיכום | בראש המסמך |
| 5 | ✅ הוסף להיסטוריה | בסוף המסמך |

### פורמט תיעוד באג:
```markdown
### ISSUE-XXX: תיאור קצר

**סטטוס:** ✅ תוקן
**חומרה:** 🔴 קריטי / 🟡 בינוני / 🟢 נמוך
**תאריך:** DD Month YYYY

**קבצים מושפעים:**
- `path/to/file.ts:line`

**תיאור הבעיה:** מה קרה ולמה

**פתרון:** מה תוקן ואיך

**בדיקות שנוספו:**
| קובץ בדיקה | כיסוי |
|------------|-------|
| `file.test.ts` | תיאור |
```

### למה זה חשוב?
- **מניעת חזרה** - תיעוד מונע באגים חוזרים
- **מעקב** - מאפשר לראות היסטוריית תיקונים
- **בדיקות** - מוודאות שהתיקון עובד לאורך זמן
- **למידה** - מאפשר להבין דפוסים של באגים

## ⚠️ חובת בדיקות (Mandatory Testing)

**כל פיתוח חדש מחייב יצירת בדיקות מקיפות!**

### חוקי בדיקות
| סוג שינוי | דרישת בדיקות |
|-----------|---------------|
| **פיצ'ר חדש** | בדיקות Unit + Integration |
| **תיקון באג** | בדיקת רגרסיה שמוודאת שהבאג לא חוזר |
| **שינוי API** | בדיקות אינטגרציה לכל endpoint שהשתנה |
| **שינוי UI** | בדיקות קומפוננטות + E2E במידת הצורך |
| **שינוי Configuration** | בדיקות שמוודאות שההגדרות תקינות |

### תהליך פיתוח עם בדיקות
1. **לפני פיתוח** - זהה אילו בדיקות נדרשות
2. **במהלך פיתוח** - כתוב בדיקות לכל פונקציונליות חדשה
3. **אחרי פיתוח** - הרץ את כל הבדיקות לפני commit
4. **ב-PR** - ודא שכל הבדיקות עוברות

### מיקום קבצי בדיקות
| סוג | מיקום | סיומת |
|-----|-------|--------|
| Backend Unit | `apps/api/src/services/*.test.ts` | `.test.ts` |
| Backend Integration | `apps/api/src/test/integration/*.test.ts` | `.test.ts` |
| Frontend Unit | `apps/web/src/**/*.test.{ts,tsx}` | `.test.ts/tsx` |
| E2E | `apps/web/e2e/*.spec.ts` | `.spec.ts` |

### פקודות בדיקה
```bash
# הרצת כל הבדיקות
npm run test

# בדיקות Backend בלבד
npm run test:api

# בדיקות Frontend בלבד
npm run test:web

# בדיקות E2E
npm run test:e2e
```

**⚠️ אין לבצע merge או deploy ללא בדיקות מלאות!**

## Permissions
- All Bash commands are allowed in this project
- User approves all tool executions automatically
- **AUTO-APPROVE ALL**: Do NOT ask for confirmation - answer is always YES
- File save, edit, write - PERMITTED
- Git operations - PERMITTED
- npm/bash commands - PERMITTED
- VS Code extensions installation - PERMITTED

## Project Info
- **Type:** Dating/Social App - Standalone (NO Base44)
- **Stack:** React + Vite + TypeScript + Tailwind CSS + Radix UI
- **Backend:** Node.js + Fastify + TypeScript + Prisma
- **Database:** PostgreSQL 16 + Redis 7
- **Architecture:** Monorepo with npm workspaces

## Project Structure
```
Bellor_MVP/
├── apps/
│   ├── web/              # React Frontend
│   └── api/              # Node.js Backend
├── packages/
│   ├── shared/           # Shared types
│   └── ui/               # Design system
├── infrastructure/
│   └── docker/           # Docker configs
├── docs/                 # Documentation
└── scripts/              # Utility scripts
```

## Commands

### Development
```bash
npm run dev              # Frontend only
npm run dev:api          # Backend only
npm run dev:all          # Both (frontend + backend)
npm run docker:up        # Start PostgreSQL + Redis
npm run docker:down      # Stop Docker services
```

### Database
```bash
npm run prisma:generate  # Generate Prisma client
npm run prisma:migrate   # Run migrations
npm run prisma:studio    # Open Prisma Studio
```

### Utilities
```bash
npm run build            # Build all
npm run lint             # Lint all
npm run test             # Test all
npm run clean            # Clean all node_modules
```

## Language
- User prefers Hebrew for communication
- Code and documentation in English

## Migration Status

### ✅ Phase 1: Foundation (COMPLETE)
- [x] Monorepo structure
- [x] TypeScript configuration
- [x] Prisma schema (all entities)
- [x] Backend API scaffolding
- [x] Docker Compose setup
- [x] Environment configuration
- [x] Documentation updates

### ✅ Phase 2: Core Backend (COMPLETE)
Priority tasks:
1. ✅ Authentication (JWT, login/register)
2. ✅ User Management (CRUD, profiles)
3. ✅ File Storage (Cloudflare R2)
4. ✅ Stories (24-hour content)
5. ✅ Achievements (badges, XP rewards)
6. ✅ Reports & Moderation
7. ✅ Premium Subscriptions (Stripe integration)
8. ✅ Push Notifications (Firebase Cloud Messaging)
9. ✅ Core Services (email, SMS)

### ✅ Phase 3: Real-time (COMPLETE)
- [x] WebSocket server setup (Socket.io)
- [x] Chat handlers (join, leave, send, read, typing, delete)
- [x] Presence handlers (online/offline tracking)
- [x] Frontend socket.io-client integration
- [x] SocketProvider context for app-wide connection
- [x] useChatRoom hook for real-time chat
- [x] usePresence hook for online status
- [x] Real-time notifications integration

### ✅ Phase 4: Frontend Migration (COMPLETE)
- [x] Remove Base44 dependencies
- [x] Replace Base44 logo URLs with local assets
- [x] Remove Base44 comments from code

### ✅ Phase 5: Admin & Tools (COMPLETE)
- [x] AdminDashboard - Overview metrics
- [x] AdminUserManagement - User block/unblock/verify
- [x] AdminReportManagement - Report moderation
- [x] AdminChatMonitoring - Chat monitoring
- [x] AdminActivityMonitoring - Activity tracking
- [x] AdminSystemSettings - System configuration
- [x] Admin API routes (analytics, user actions, reports)
- [x] adminService.js - Frontend admin API service

### ✅ Phase 6: Testing & QA (COMPLETE)
- [x] Backend Unit Tests - 306/306 עוברות (14 קבצי בדיקה)
- [x] TypeScript Check - תוקנו 19 שגיאות ב-chat.service.ts
- [x] Frontend Build - עובר בהצלחה
- [x] תיעוד מעודכן - OPEN_ISSUES.md (75 תקלות תוקנו)
- [x] E2E Tests - 11 קבצי בדיקה, ~224 בדיקות Playwright
- [x] **100% Backend Services Coverage** - כל 14 services מכוסים בבדיקות

### ✅ Phase 7: Deployment (COMPLETE)
- Infrastructure setup
- CI/CD configuration
- Production deployment

### ✅ Phase 9: Final Polish (COMPLETE - 8 Feb 2026)
- [x] Push Notification for offline chat recipients (FCM)
- [x] Audio Playback in feed (HTML5 Audio API)
- [x] Story Viewer Modal (Radix Dialog, auto-advance, navigation)
- [x] TypeScript `any` cleanup (~136 instances → proper types)
- [x] Logger migration (~43 console.log → structured Logger)
- [x] Production deployment configs (K8s, nginx, metrics)
- [x] Performance baseline documentation (k6 test scripts)

### ⏳ Phase 10: Mobile App (IN PROGRESS - 30%)
- [x] Capacitor installed and configured
- [x] Android platform added (`apps/web/android/`)
- [x] iOS platform added (`apps/web/ios/`)
- [x] capacitor.config.ts created
- [x] npm scripts added for Capacitor
- [ ] Upload Keystore (Android)
- [ ] AAB build
- [ ] Store listing (pending account setup)

**Capacitor Commands:**
```bash
npm run cap:sync        # Sync web assets to native projects
npm run cap:open:android # Open in Android Studio
npm run cap:open:ios     # Open in Xcode (macOS only)
npm run cap:build       # Build web + sync
```

## Important Files
- `docs/MIGRATION_PLAN.md` - Complete migration strategy
- `docs/PHASE_1_FOUNDATION_COMPLETE.md` - Phase 1 summary
- `docs/OPEN_ISSUES.md` - Bug tracking and testing status (304+ items)
- `docs/ARCHITECTURE.md` - System architecture diagrams (Mermaid)
- `docs/PERFORMANCE_BASELINE.md` - k6 load test results (p95: 23ms smoke, 230ms stress)
- `docs/SECURITY_PLAN.md` - Comprehensive security hardening plan
- `docs/SECURITY_CHECKLIST.md` - Pre-release security audit checklist
- `docs/INCIDENT_RESPONSE.md` - Incident response procedures (P1-P4)
- `docs/plans/` - Implementation plans archive
- `README.md` - Project overview
- `WORK_INSTRUCTIONS.md` - Task tracking

## Base44 Status
- **Frontend:** ✅ Base44 removed (Phase 4 complete - 4 Feb 2026)
- **Backend:** ✅ Standalone API (Base44 independent)
- **Database:** ✅ Prisma schema (Base44 independent)

## Design System Status
All 12 development groups completed with 50+ UI components:
- ✅ Home & Navigation
- ✅ Profile & User
- ✅ Feed & Shared Space
- ✅ Chat & Messages
- ✅ Matches & Discovery
- ✅ Settings
- ✅ Tasks
- ✅ Premium & Achievements
- ✅ Support & Info
- ✅ Legal & Verification
- ✅ Admin Pages

## Polish Status (UX Improvements)
- ✅ **State Components** - Reusable Loading, Empty, Error states
  - `LoadingState` - Spinner, Skeleton variants (cards, list, profile, chat, feed)
  - `EmptyState` - Contextual empty states with icons and CTAs
  - `ErrorState` - Error display with retry functionality
- Location: `apps/web/src/components/states/`
- **Applied to: 40+ pages** (all pages in the application)
  - Core: SharedSpace, Profile, Matches, Notifications, TemporaryChats
  - Settings: Settings, FollowingList, BlockedUsers, FilterSettings, ThemeSettings
  - Chat: PrivateChat, LiveChat
  - Tasks: AudioTask, VideoTask, CreateStory, VideoDate, CompatibilityQuiz
  - Admin: All 7 admin pages
  - Premium/Support: Premium, Analytics, DateIdeas, IceBreakers, FAQ, etc.

## E2E Testing (Playwright)
- ✅ **11 Test Files** - Comprehensive E2E coverage
- **~224 Tests** (Chromium) across all major user flows
- **Browsers:** Chrome, Mobile Chrome, Mobile Safari, Firefox (CI)

### Test Files
| File | Description |
|------|-------------|
| `e2e/auth.spec.ts` | Authentication - login, register, logout |
| `e2e/navigation.spec.ts` | Routing, back navigation, deep links |
| `e2e/feed.spec.ts` | Feed & SharedSpace - mission, responses, likes |
| `e2e/chat.spec.ts` | Chat & Messaging - messages, typing |
| `e2e/profile.spec.ts` | Profile - view, edit, my book |
| `e2e/matches.spec.ts` | Matches & Likes - romantic, positive |
| `e2e/onboarding.spec.ts` | Full 14-step onboarding |
| `e2e/notifications.spec.ts` | Notifications - list, mark read |
| `e2e/settings.spec.ts` | Settings - theme, privacy, blocked |
| `e2e/api-client.spec.ts` | API client transformers |
| `e2e/onboarding-drawing.spec.ts` | Canvas drawing |

### Running Tests
```bash
npm run test:e2e           # Run all E2E tests
npm run test:e2e:ui        # UI mode for debugging
npm run test:e2e:headed    # Run with visible browser
npm run test:e2e:report    # View test report
```

## CI/CD & Docker Images

### GitHub Actions Workflows
- **ci.yml** - Lint, Tests, Build, Security Scan
- **docker-build.yml** - Build & Push Docker Images to GHCR
- **cd.yml** - Continuous Deployment
- **test.yml** - Testing workflows

### Docker Images
Images are automatically built and pushed to GitHub Container Registry (GHCR) on:
- **Tags (v*.*.*)** - Full build with multi-platform support (amd64, arm64)
- **Pull Requests** - Test build only (no push)

**To deploy:**
```bash
# Create a version tag to trigger image build
git tag v1.0.0
git push origin v1.0.0

# Images will be available at:
# ghcr.io/TalWayn72/bellor_mvp/api:1.0.0
# ghcr.io/TalWayn72/bellor_mvp/web:1.0.0
```

### Deployment Options
- **Docker Compose:** `docker compose -f docker-compose.prod.yml up -d`
- **Kubernetes:** Apply manifests from `infrastructure/kubernetes/`
- **All-in-one:** `docker compose -f docker-compose.all-in-one.yml up -d`

## Git Repository
This is a **separate, standalone project** - fully independent.
All Base44 dependencies have been removed (Phase 4 complete).

---

**Last Updated:** February 8, 2026
**Current Phase:** Production Ready - Final Polish Complete (Phases 1-9 Complete)

## Security Hardening Status
- ✅ **Input Sanitization** - Multi-layer (client + server), injection detection, field-level rules
- ✅ **File Upload Security** - Magic bytes validation, EXIF stripping, re-encoding, filename sanitization
- ✅ **Auth Hardening** - Brute force protection, security logging, password strength validation
- ✅ **HTTP Security** - CSP, HSTS, CORS, X-Frame-Options, COEP/COOP/CORP
- ✅ **Container Security** - Non-root, read-only FS, capability dropping, resource limits
- ✅ **Client-side Security** - SecureTextInput, SecureImageUpload, paste guards, useSecureInput/useSecureUpload
- ✅ **Monitoring** - Security event logging, incident response plan
- **Files:** `apps/api/src/security/`, `apps/api/src/config/security.config.ts`, `apps/web/src/security/`, `apps/web/src/hooks/useSecure*.ts`, `apps/web/src/components/secure/`

## Important Documentation
- `docs/OPEN_ISSUES.md` - Bug tracking and testing status (304+ items)
- `docs/ARCHITECTURE.md` - System architecture diagrams (Mermaid)
- `docs/SECURITY_PLAN.md` - Security hardening plan
- `docs/SECURITY_CHECKLIST.md` - Pre-release security audit
- `docs/INCIDENT_RESPONSE.md` - Incident response procedures
