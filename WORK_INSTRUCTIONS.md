# הנחיות עבודה לשיחות חדשות

---

## 🚀 חובה בתחילת כל שיחה - הפעלת שירותים

**לפני כל פעולה אחרת, יש להפעיל את השירותים הבאים:**

```bash
# 1. נווט לתיקיית הפרויקט
cd C:\Users\talwa\.claude\projects\Bellor_MVP

# 2. הפעל Docker (PostgreSQL + Redis)
npm run docker:up

# 3. הפעל את ה-API (background mode)
npm run dev:api

# 4. בדוק שהכל עובד
curl http://localhost:3000/health
```

**רשימת תיוג לתחילת שיחה:**
- [ ] Docker רץ (bellor_postgres, bellor_redis)
- [ ] API רץ על port 3000
- [ ] Health check עובר

**⚠️ אסור להתחיל לעבוד לפני שכל השירותים פועלים!**

---

## ✅ Polish: State Components (הושלם - 4 פברואר 2026)

```
סטטוס: הושלם ✅
רכיבים שנוצרו:
- LoadingState.jsx - מצבי טעינה (spinner, skeleton, cards, list, profile, chat, feed)
- EmptyState.jsx - מצבים ריקים (messages, matches, feed, notifications, search)
- ErrorState.jsx - הצגת שגיאות (default, network, server, notFound)
- index.js - ייצוא מרוכז

דפים שעודכנו: 40+ דפים
- Core: SharedSpace, Profile, Matches, Notifications, TemporaryChats
- Settings: Settings, FollowingList, BlockedUsers, FilterSettings, ThemeSettings
- Chat: PrivateChat, LiveChat
- Social: Stories, Achievements, Discover
- Tasks: AudioTask, VideoTask, CreateStory, VideoDate, CompatibilityQuiz
- Premium: Premium, ReferralProgram, ProfileBoost, Analytics, DateIdeas, IceBreakers
- Support: SafetyCenter, Feedback, EmailSupport, FAQ, VirtualEvents
- Admin: All 7 admin pages (Dashboard, UserManagement, Reports, Chat, Activity, Settings, PreReg)
- Profile: EditProfile, UserProfile, UserVerification

מיקום: apps/web/src/components/states/
```

---

## 🔴 בדיקת שירותים חובה - לפני סיום כל עבודה

**חובה לוודא שכל השירותים פועלים לפני סיום כל משימה:**

| שירות | פורט | פקודת בדיקה |
|--------|------|-------------|
| Frontend (Vite) | 5173 | `netstat -ano \| findstr ":5173"` |
| Backend (API) | 3000 | `netstat -ano \| findstr ":3000"` |
| PostgreSQL | 5432 | `docker ps \| grep postgres` |
| Redis | 6379 | `docker ps \| grep redis` |

### פקודת בדיקה מהירה
```bash
docker ps && netstat -ano | findstr ":3000 :5173"
```

### אם שירות לא רץ - הפעלה:
```bash
npm run docker:up      # PostgreSQL + Redis
npm run dev:api        # Backend API (port 3000)
npm run dev            # Frontend (port 5173)
```

**⚠️ אין לסיים משימה ללא אישור שכל השירותים פועלים!**

---

## לפני התחלת עבודה - תמיד להעתיק את ההודעה הזו:

---

## ✅ שיחה חדשה - קבוצה 2: פרופיל ומשתמש (הושלם)

```
סטטוס: הושלם ✅
קבצים שעודכנו:
- Profile.jsx - מיושם עם Design System
- UserProfile.jsx - מיושם עם Design System
- EditProfile.jsx - Card components, English labels
- ProfileBoost.jsx - Card components, design tokens
- FollowingList.jsx - Avatar, Card, design tokens
```

---

## ✅ שיחה חדשה - קבוצה 3: פיד וחלל משותף (הושלם)

```
סטטוס: הושלם ✅
קבצים שעודכנו:
- SharedSpace.jsx - מיושם עם Design System
- Stories.jsx - Button, Card, Badge components
- CreateStory.jsx - Button components
- Creation.jsx - Card components, design tokens
```

---

## ✅ שיחה חדשה - קבוצה 4: צ'אט והודעות (הושלם)

```
סטטוס: הושלם ✅
קבצים שעודכנו:
- PrivateChat.jsx - header structure, border styling
- LiveChat.jsx - useCurrentUser hook, Card, Input components
- TemporaryChats.jsx - Avatar, Card, Badge components
- Notifications.jsx - אומת תאימות
```

---

## ✅ שיחה חדשה - קבוצה 5: התאמות וגילוי (הושלם)

```
סטטוס: הושלם ✅
קבצים שעודכנו:
- Matches.jsx - LTR layout, English labels, design tokens
- Discover.jsx - design tokens for colors
- CompatibilityQuiz.jsx - LTR layout, updated buttons
- FilterSettings.jsx - Card components, design tokens
```

---

## ✅ שיחה חדשה - קבוצה 6: הגדרות א' (הושלם)

```
סטטוס: הושלם ✅
קבצים שעודכנו:
- Settings.jsx - Separator import added
- NotificationSettings.jsx - Switch component, Card, LTR
- PrivacySettings.jsx - Switch component, Card, security options
```

---

## ✅ שיחה חדשה - קבוצה 7: הגדרות ב' (הושלם)

```
סטטוס: הושלם ✅
קבצים שעודכנו:
- ThemeSettings.jsx - עודכן
- BlockedUsers.jsx - עודכן
- SafetyCenter.jsx - עודכן
```

---

## ✅ שיחה חדשה - קבוצה 8: משימות (הושלם)

```
סטטוס: הושלם ✅
קבצים שעודכנו:
- AudioTask.jsx - Card, Switch, Label, LTR, English text
- VideoTask.jsx - Card, LTR layout, English text
- WriteTask.jsx - Card, Switch, Label, English text
- IceBreakers.jsx - Card, Button, LTR layout
- DateIdeas.jsx - verified compatibility
```

---

## ✅ שיחה חדשה - קבוצה 9: פרימיום והישגים (הושלם)

```
סטטוס: הושלם ✅
קבצים שעודכנו:
- Premium.jsx - LTR layout
- Achievements.jsx - Button, Card, Badge components, LTR
- Analytics.jsx - LTR layout, header update
- ReferralProgram.jsx - Button, Card, Badge, LTR
```

---

## ✅ שיחה חדשה - קבוצה 11: משפטי ואימות (הושלם)

```
סטטוס: הושלם ✅
קבצים שעודכנו:
- PrivacyPolicy.jsx - Card, Button, LTR, hero section
- TermsOfService.jsx - Card, Button, LTR, hero section
- UserVerification.jsx - Card, LTR, header update
```

---

## ✅ שיחה חדשה - קבוצה 12: אדמין (הושלם)

```
סטטוס: הושלם ✅
קבצים שעודכנו:
- AdminActivityMonitoring.jsx - LTR, English text
- AdminChatMonitoring.jsx - LTR, English text
- AdminDashboard.jsx - LTR, English text
- AdminPreRegistration.jsx - LTR, English text
- AdminReportManagement.jsx - LTR, English text
- AdminSystemSettings.jsx - LTR, English text
- AdminUserManagement.jsx - LTR, English text
```

---

## פקודות Figma API

```bash
# קריאת עיצוב ספציפי
curl -H "X-Figma-Token: YOUR_FIGMA_TOKEN" \
  "https://api.figma.com/v1/files/Xw7AxN31GF7dXOiaXxGbN6/nodes?ids=NODE_ID&depth=3"

# עמודים עיקריים:
# 0-1: Design System
# 0-6017: Main pages
# 4304-33971: UI Design
```

## סטטוס קבוצות

- ✅ קבוצה 1: בית וניווט - הושלם
- ✅ קבוצה 2: פרופיל ומשתמש - הושלם
- ✅ קבוצה 3: פיד וחלל משותף - הושלם (+ RTL fix)
- ✅ קבוצה 4: צ'אט והודעות - הושלם (+ RTL fix)
- ✅ קבוצה 5: התאמות וגילוי - הושלם
- ✅ קבוצה 6: הגדרות א' - הושלם
- ✅ קבוצה 7: הגדרות ב' - הושלם
- ✅ קבוצה 8: משימות - הושלם
- ✅ קבוצה 9: פרימיום והישגים - הושלם
- ✅ קבוצה 10: תמיכה ומידע - הושלם
- ✅ קבוצה 11: משפטי ואימות - הושלם
- ✅ קבוצה 12: אדמין - הושלם (Hebrew translated to English)

---

## 📋 משימות בהמתנה - Deployment & Testing

### 🔜 Phase 9: פריסת סביבת QA ב-Oracle Cloud (מתוכנן)
**עדיפות:** גבוהה
**זמן משוער:** 2 שעות
**עלות:** $0 (חינם לצמיתות)

**שלבים:**
- [ ] רישום ל-Oracle Cloud Free Tier
- [ ] יצירת VCN ו-Security Rules
- [ ] יצירת VM (ARM: 4 CPUs, 24GB RAM)
- [ ] התקנת Docker והגדרת השרת
- [ ] הגדרת SSH Keys ל-GitHub
- [ ] Clone הפרויקט והגדרת Environment
- [ ] Build והפעלה ראשונית
- [ ] הגדרת Auto-Deploy מ-GitHub
- [ ] בדיקות תקינות

**מסמך מפורט:** [docs/ORACLE_CLOUD_QA_DEPLOYMENT.md](docs/ORACLE_CLOUD_QA_DEPLOYMENT.md)

---

### 📋 Phase 6: Testing (מתוכנן)
- [ ] Unit tests ל-Services (50% coverage)
- [ ] Integration tests ל-API endpoints
- [ ] E2E tests קריטיים
- [ ] CI integration
