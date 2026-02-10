# תוכנית יישום עיצוב Figma לפרויקט Bellor

## הנחיות עבודה (מתוך CLAUDE.md)
- **תמיד לקרוא את CLAUDE.md בתחילת כל שיחה**
- **עבוד על קבצים בקבוצות קטנות** - לא יותר מ-3-5 קבצים בכל פעם
- **אם יש משימה גדולה, פצל אותה לכמה שיחות** - למנוע "Prompt too long"

---

## מקורות Figma
| מזהה | שם | תוכן |
|------|-----|------|
| `0-1` | ⛩ Minimal Design System | הגדרות עיצוב, צבעים, טיפוגרפיה, רכיבים |
| `0-6017` | ♦️ Main | עיצובי דפים ראשיים |
| `4304-33971` | ❤️❤️ Bellor UI Design | עיצובי UI נוספים |

**Figma File ID:** `Xw7AxN31GF7dXOiaXxGbN6`

---

## סטטוס נוכחי
- ✅ Phase 1: Design tokens, Tailwind config, ThemeProvider
- ✅ Phase 2: Core UI Components
- ✅ Phase 3: Page layouts (כל 12 הקבוצות הושלמו)
- ✅ Phase 4: Advanced components (RTL fixes, Hebrew translation)
- ⏳ Phase 5: Polish and optimization

## עדכון אחרון
- **תאריך:** 2026-02-03
- **קבוצה שהושלמה:** קבוצות 3, 4, 8, 12 - תיקוני RTL ותרגום עברית
- **קבצים עודכנו:**
  - Creation.jsx, Stories.jsx, Notifications.jsx, TemporaryChats.jsx, VirtualEvents.jsx (RTL fix)
  - AudioTask.jsx, VideoTask.jsx, WriteTask.jsx (Group 8)
  - AdminActivityMonitoring.jsx, AdminChatMonitoring.jsx, AdminDashboard.jsx (Group 12)
  - AdminPreRegistration.jsx, AdminReportManagement.jsx, AdminSystemSettings.jsx, AdminUserManagement.jsx (Group 12)
- **שינויים עיקריים:**
  - הסרת dir="rtl" מכל הקבצים
  - תרגום כל הטקסט העברי לאנגלית
  - שינוי text-right ל-text-left בטבלאות
  - עדכון toLocaleDateString מ-he-IL ל-en-US

---

## רשימת כל 52 הדפים לעדכון

### קבוצה 1: דפי בית וניווט (4 דפים)
| # | קובץ | סטטוס | פעולות נדרשות |
|---|------|-------|---------------|
| 1 | `Home.jsx` | ⏳ | עדכון לפי Figma Main |
| 2 | `Splash.jsx` | ⏳ | עדכון אנימציות וצבעים |
| 3 | `Welcome.jsx` | ⏳ | עדכון לפי Figma |
| 4 | `Onboarding.jsx` | ⏳ | עדכון צעדי onboarding |

### קבוצה 2: פרופיל ומשתמש (5 דפים)
| # | קובץ | סטטוס | פעולות נדרשות |
|---|------|-------|---------------|
| 5 | `Profile.jsx` | ✅ | בוצע - מיושם עם Design System |
| 6 | `UserProfile.jsx` | ✅ | בוצע - מיושם עם Design System |
| 7 | `EditProfile.jsx` | ✅ | בוצע - Card components, English labels |
| 8 | `ProfileBoost.jsx` | ✅ | בוצע - Card components, design tokens |
| 9 | `FollowingList.jsx` | ✅ | בוצע - Avatar, Card, design tokens |

### קבוצה 3: פיד וחלל משותף (4 דפים)
| # | קובץ | סטטוס | פעולות נדרשות |
|---|------|-------|---------------|
| 10 | `SharedSpace.jsx` | ✅ | בוצע - מיושם עם Design System |
| 11 | `Stories.jsx` | ✅ | בוצע - Button, Card, Badge components |
| 12 | `CreateStory.jsx` | ✅ | בוצע - Button components |
| 13 | `Creation.jsx` | ✅ | בוצע - Card components, design tokens |

### קבוצה 4: צ'אט והודעות (4 דפים) ✅
| # | קובץ | סטטוס | פעולות נדרשות |
|---|------|-------|---------------|
| 14 | `PrivateChat.jsx` | ✅ | בוצע - header structure, border styling |
| 15 | `LiveChat.jsx` | ✅ | בוצע - useCurrentUser hook, Card, Input components |
| 16 | `TemporaryChats.jsx` | ✅ | בוצע - Avatar, Card, Badge components |
| 17 | `Notifications.jsx` | ✅ | בוצע - אומת תאימות |

### קבוצה 5: התאמות וגילוי (4 דפים)
| # | קובץ | סטטוס | פעולות נדרשות |
|---|------|-------|---------------|
| 18 | `Matches.jsx` | ✅ | בוצע - LTR layout, English labels, design tokens |
| 19 | `Discover.jsx` | ✅ | בוצע - design tokens for colors |
| 20 | `CompatibilityQuiz.jsx` | ✅ | בוצע - LTR layout, updated buttons |
| 21 | `FilterSettings.jsx` | ✅ | בוצע - Card components, design tokens |

### קבוצה 6: הגדרות (6 דפים) ✅
| # | קובץ | סטטוס | פעולות נדרשות |
|---|------|-------|---------------|
| 22 | `Settings.jsx` | ✅ | בוצע - Separator import added |
| 23 | `NotificationSettings.jsx` | ✅ | בוצע - Switch component, Card, LTR |
| 24 | `PrivacySettings.jsx` | ✅ | בוצע - Switch component, Card, security options |
| 25 | `ThemeSettings.jsx` | ✅ | בוצע - עודכן |
| 26 | `BlockedUsers.jsx` | ✅ | בוצע - LTR, English text |
| 27 | `SafetyCenter.jsx` | ✅ | בוצע - LTR, English text |

### קבוצה 7: משימות ופעילויות (5 דפים) ✅
| # | קובץ | סטטוס | פעולות נדרשות |
|---|------|-------|---------------|
| 28 | `AudioTask.jsx` | ✅ | בוצע - Card, Switch, Label, LTR, English |
| 29 | `VideoTask.jsx` | ✅ | בוצע - Card, LTR layout |
| 30 | `WriteTask.jsx` | ✅ | בוצע - Card, Switch, Label, English |
| 31 | `IceBreakers.jsx` | ✅ | בוצע - Card, Button, LTR |
| 32 | `DateIdeas.jsx` | ✅ | בוצע - verified compatibility |

### קבוצה 8: אירועים ווידאו (2 דפים) ✅
| # | קובץ | סטטוס | פעולות נדרשות |
|---|------|-------|---------------|
| 33 | `VirtualEvents.jsx` | ✅ | בוצע - RTL fix, English text |
| 34 | `VideoDate.jsx` | ✅ | בוצע - verified compatibility |

### קבוצה 9: פרימיום והישגים (4 דפים) ✅
| # | קובץ | סטטוס | פעולות נדרשות |
|---|------|-------|---------------|
| 35 | `Premium.jsx` | ✅ | בוצע - LTR layout |
| 36 | `Achievements.jsx` | ✅ | בוצע - Button, Card, Badge components, LTR |
| 37 | `Analytics.jsx` | ✅ | בוצע - LTR layout, header update |
| 38 | `ReferralProgram.jsx` | ✅ | בוצע - Button, Card, Badge, LTR |

### קבוצה 10: תמיכה ומידע (4 דפים) ✅
| # | קובץ | סטטוס | פעולות נדרשות |
|---|------|-------|---------------|
| 39 | `HelpSupport.jsx` | ✅ | בוצע - Button, Card, ChevronRight icons |
| 40 | `FAQ.jsx` | ✅ | בוצע - Card, Input, Button, LTR |
| 41 | `EmailSupport.jsx` | ✅ | בוצע - useCurrentUser, Card, design tokens |
| 42 | `Feedback.jsx` | ✅ | בוצע - LTR layout |

### קבוצה 11: משפטי ואימות (3 דפים) ✅
| # | קובץ | סטטוס | פעולות נדרשות |
|---|------|-------|---------------|
| 43 | `PrivacyPolicy.jsx` | ✅ | בוצע - Card, Button, LTR, hero section |
| 44 | `TermsOfService.jsx` | ✅ | בוצע - Card, Button, LTR, hero section |
| 45 | `UserVerification.jsx` | ✅ | בוצע - Card, LTR, header update |

### קבוצה 12: אדמין (7 דפים) ✅
| # | קובץ | סטטוס | פעולות נדרשות |
|---|------|-------|---------------|
| 46 | `AdminDashboard.jsx` | ✅ | בוצע - LTR, English text |
| 47 | `AdminUserManagement.jsx` | ✅ | בוצע - LTR, English text |
| 48 | `AdminChatMonitoring.jsx` | ✅ | בוצע - LTR, English text |
| 49 | `AdminActivityMonitoring.jsx` | ✅ | בוצע - LTR, English text |
| 50 | `AdminReportManagement.jsx` | ✅ | בוצע - LTR, English text |
| 51 | `AdminPreRegistration.jsx` | ✅ | בוצע - LTR, English text |
| 52 | `AdminSystemSettings.jsx` | ✅ | בוצע - LTR, English text |

---

## תהליך העבודה

### שלב 1: הכנה (בתחילת כל שיחה)
1. קרוא `CLAUDE.md` להנחיות עדכניות
2. קרוא `docs/archive/FIGMA_IMPLEMENTATION_PLAN.md` לסטטוס
3. בחר קבוצה אחת (3-5 דפים) לעבודה

### שלב 2: קריאת עיצוב Figma
```bash
# דוגמה לקריאת עיצוב ספציפי
curl -H "X-Figma-Token: $FIGMA_TOKEN" \
  "https://api.figma.com/v1/files/Xw7AxN31GF7dXOiaXxGbN6/nodes?ids=NODE_ID"
```

### שלב 3: עדכון דפים
1. קרוא הקובץ הנוכחי
2. זהה הבדלים מהעיצוב
3. עדכן סגנונות, רכיבים, ו-layout
4. שמור ובדוק

### שלב 4: אימות
1. הרץ `npm run build` - וודא שאין שגיאות
2. הרץ `npm run dev` - בדוק ויזואלית
3. סמן דפים שהושלמו בתוכנית

### שלב 5: commit
1. `git add` הקבצים שעודכנו
2. `git commit` עם תיאור ברור
3. `git push`

---

## סדר עבודה מומלץ (12 שיחות)

| שיחה | קבוצה | דפים |
|------|-------|------|
| 1 | בית וניווט | Home, Splash, Welcome, Onboarding |
| 2 | פרופיל | Profile, UserProfile, EditProfile, ProfileBoost, FollowingList |
| 3 | פיד | SharedSpace, Stories, CreateStory, Creation |
| 4 | צ'אט | PrivateChat, LiveChat, TemporaryChats, Notifications |
| 5 | התאמות | Matches, Discover, CompatibilityQuiz, FilterSettings |
| 6 | הגדרות א' | Settings, NotificationSettings, PrivacySettings |
| 7 | הגדרות ב' | ThemeSettings, BlockedUsers, SafetyCenter |
| 8 | משימות | AudioTask, VideoTask, WriteTask, IceBreakers, DateIdeas |
| 9 | אירועים + פרימיום | VirtualEvents, VideoDate, Premium, Achievements |
| 10 | פרימיום + תמיכה | Analytics, ReferralProgram, HelpSupport, FAQ |
| 11 | תמיכה + משפטי | EmailSupport, Feedback, PrivacyPolicy, TermsOfService, UserVerification |
| 12 | אדמין | כל 7 דפי האדמין |

---

## אימות סופי

בסיום כל הקבוצות:
1. `npm run build` - וודא build תקין
2. `npm run lint` - וודא אין שגיאות lint
3. בדיקה ויזואלית של כל הדפים
4. עדכן סטטוס ב-`docs/archive/FIGMA_IMPLEMENTATION_PLAN.md`
5. Commit ו-push סופי

---

## הערות חשובות
- **Rate Limit:** ה-Figma API מוגבל. אם יש שגיאת 429, המתן דקה ונסה שוב
- **Token:** `FIGMA_TOKEN` נמצא ב-`.env.local`
- **גיבוי:** תמיד לעשות commit לפני שינויים גדולים
