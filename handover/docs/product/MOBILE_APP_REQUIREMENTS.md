# דרישות אפליקציה מובייל - Bellor MVP

**גרסה:** 1.0.1
**תאריך יצירה:** פברואר 2026
**תאריך עדכון:** 5 פברואר 2026
**סטטוס:** בתהליך (Phase 1-2 הושלמו)
**קשור ל:** [PRD.md](PRD.md) | [GOOGLE_PLAY_DEPLOYMENT.md](GOOGLE_PLAY_DEPLOYMENT.md)

---

## 1. סקירה כללית

### 1.1 מטרה
הפיכת Bellor MVP מ-PWA לאפליקציה native הזמינה ב:
- Google Play Store (Android)
- iOS App Store (בעתיד)

### 1.2 גישה טכנית
**Capacitor** - עטיפת אפליקציית React הקיימת כאפליקציה native.

### 1.3 יתרונות הגישה
- שימור קוד React קיים (100%)
- תמיכה ב-Android + iOS מאותו codebase
- גישה ל-Native APIs (Push, Camera, Storage)
- עבודה גם במצב offline
- חווית משתמש native (אייקון, splash screen)

---

## 2. דרישות פונקציונליות

### 2.1 יכולות קיימות (PWA) - ללא שינוי

| יכולת | סטטוס PWA | הערות |
|-------|-----------|-------|
| התחברות/הרשמה | ✅ | JWT + Google OAuth |
| פרופיל משתמש | ✅ | כולל העלאת תמונות |
| Discovery | ✅ | חיפוש והתאמות |
| צ'אט זמני וקבוע | ✅ | WebSocket real-time |
| מסימות יומיות | ✅ | אתגרים ותגמולים |
| סיפורים (Stories) | ✅ | תוכן 24 שעות |
| הישגים | ✅ | XP ותגים |
| מנויי Premium | ✅ | Stripe integration |
| i18n | ✅ | 5 שפות |

### 2.2 יכולות Native חדשות

| יכולת | עדיפות | תיאור |
|-------|--------|-------|
| Push Notifications (Native) | גבוהה | FCM לאנדרואיד, APNs ל-iOS |
| Deep Links | גבוהה | פתיחת מסכים ספציפיים מקישור |
| App Icon Badge | בינונית | מספר הודעות על האייקון |
| Splash Screen | בינונית | מסך טעינה ממותג |
| Offline Mode | בינונית | גישה לנתונים שמורים |
| Share Target | נמוכה | שיתוף תוכן לאפליקציה |
| Biometric Auth | נמוכה | טביעת אצבע / Face ID |

### 2.3 Push Notifications

**דרישות:**
- [ ] הודעה על הודעת צ'אט חדשה
- [ ] הודעה על התאמה חדשה
- [ ] הודעה על מסימה יומית
- [ ] הודעה על הישג חדש
- [ ] הגדרות התראות למשתמש

**יישום:**
```typescript
// Capacitor Push Notifications
import { PushNotifications } from '@capacitor/push-notifications';

// רישום להתראות
await PushNotifications.requestPermissions();
await PushNotifications.register();

// קבלת token
PushNotifications.addListener('registration', (token) => {
  // שליחת token לשרת
});
```

### 2.4 Deep Links

**תבניות:**
| Pattern | פעולה |
|---------|-------|
| `bellor://chat/{chatId}` | פתיחת צ'אט |
| `bellor://profile/{userId}` | פתיחת פרופיל |
| `bellor://mission/{missionId}` | פתיחת מסימה |
| `bellor://discover` | פתיחת Discovery |

---

## 3. דרישות טכניות

### 3.1 מבנה פרויקט

```
apps/web/
├── src/                      # React code (קיים)
├── public/
│   ├── manifest.json         # PWA manifest
│   └── .well-known/
│       └── assetlinks.json   # Android Deep Links
├── android/                  # Capacitor Android (חדש)
│   ├── app/
│   │   ├── src/main/
│   │   │   ├── AndroidManifest.xml
│   │   │   └── res/
│   │   │       ├── drawable/  # Icons
│   │   │       └── values/    # Colors, strings
│   │   └── build.gradle
│   └── gradle.properties
├── ios/                      # Capacitor iOS (חדש)
│   └── App/
├── capacitor.config.ts       # Capacitor config (חדש)
└── package.json              # עדכון dependencies
```

### 3.2 Dependencies חדשות

```json
{
  "dependencies": {
    "@capacitor/core": "^5.0.0",
    "@capacitor/android": "^5.0.0",
    "@capacitor/ios": "^5.0.0",
    "@capacitor/push-notifications": "^5.0.0",
    "@capacitor/splash-screen": "^5.0.0",
    "@capacitor/app": "^5.0.0",
    "@capacitor/haptics": "^5.0.0",
    "@capacitor/status-bar": "^5.0.0"
  },
  "devDependencies": {
    "@capacitor/cli": "^5.0.0"
  }
}
```

### 3.3 הגדרות אבטחה

| הגדרה | ערך | סיבה |
|-------|-----|------|
| minSdkVersion | 24 (Android 7) | תמיכה ב-95%+ מכשירים |
| targetSdkVersion | 34 (Android 14) | דרישת Google Play |
| iOS Deployment Target | 14.0 | תמיכה ב-95%+ מכשירים |
| Network Security | HTTPS only | אבטחת תקשורת |
| Certificate Pinning | מומלץ | הגנה מפני MITM |

---

## 4. דרישות עיצוב

### 4.1 אייקונים

| סוג | גודל | פורמט | שימוש |
|-----|------|-------|-------|
| App Icon | 1024x1024 | PNG | Store listing |
| Android Adaptive | 432x432 | PNG | אנדרואיד 8+ |
| Android Legacy | 192x192 | PNG | אנדרואיד ישן |
| iOS App Icon | 1024x1024 | PNG (ללא שקיפות) | iOS |
| Notification | 96x96 | PNG (monochrome) | התראות |

### 4.2 Splash Screen

| Platform | גודל | הערות |
|----------|------|-------|
| Android | 1920x1920 | 9-patch או vector |
| iOS | לפי Safe Area | LaunchScreen.storyboard |

**עיצוב:**
- רקע: #EC4899 (Pink - צבע המותג)
- לוגו: לבן, ממורכז
- ללא spinner

### 4.3 Store Assets

**Google Play:**
| Asset | גודל | כמות |
|-------|------|------|
| Feature Graphic | 1024x500 | 1 |
| Phone Screenshots | 1080x1920 | 4-8 |
| Tablet Screenshots | 1920x1200 | 2-4 |
| App Icon | 512x512 | 1 |

**iOS App Store:**
| Asset | גודל | כמות |
|-------|------|------|
| iPhone 6.5" | 1284x2778 | 4-8 |
| iPhone 5.5" | 1242x2208 | 4-8 |
| iPad 12.9" | 2048x2732 | 2-4 |
| App Icon | 1024x1024 | 1 |

---

## 5. דרישות ביצועים

### 5.1 מדדים

| מדד | יעד | הערות |
|-----|-----|-------|
| Cold Start | < 3 שניות | עד תצוגה ראשונה |
| Warm Start | < 1.5 שניות | חזרה מרקע |
| APK/IPA Size | < 50MB | לא כולל resources |
| Memory Usage | < 200MB | בשימוש רגיל |
| Battery Impact | Low | ללא drain מיותר |

### 5.2 אופטימיזציות

- [ ] Lazy loading לרכיבים
- [ ] Image compression
- [ ] Code splitting
- [ ] Tree shaking
- [ ] ProGuard (Android)

---

## 6. דרישות בדיקות

### 6.1 בדיקות יחידה
- כל הבדיקות הקיימות ב-PWA צריכות לעבור

### 6.2 בדיקות E2E על מכשיר
| תרחיש | Android | iOS |
|-------|---------|-----|
| התקנה מחנות | [ ] | [ ] |
| הרשמה | [ ] | [ ] |
| התחברות | [ ] | [ ] |
| Push Notification | [ ] | [ ] |
| Deep Link | [ ] | [ ] |
| צ'אט real-time | [ ] | [ ] |
| העלאת תמונה | [ ] | [ ] |
| רכישת Premium | [ ] | [ ] |

### 6.3 מכשירי בדיקה מומלצים

**Android:**
- Samsung Galaxy S21+ (flagship)
- Google Pixel 6 (stock Android)
- Xiaomi Redmi Note 11 (budget)
- Samsung Galaxy Tab S7 (tablet)

**iOS:**
- iPhone 14 Pro (latest)
- iPhone 12 (common)
- iPhone SE 3 (budget)
- iPad Pro 11" (tablet)

---

## 7. Checklist לפרסום

### 7.1 לפני הגשה

**טכני:**
- [ ] Capacitor מותקן ומוגדר
- [ ] Build עובר ללא שגיאות
- [ ] כל הבדיקות עוברות
- [ ] APK/IPA נבנה בהצלחה
- [ ] Keystore נשמר בבטחה

**עיצוב:**
- [ ] אייקונים בכל הגדלים
- [ ] Splash screen מוכן
- [ ] צילומי מסך לחנות

**משפטי:**
- [ ] Privacy Policy URL פעיל
- [ ] Terms of Service URL פעיל
- [ ] GDPR compliance (אם רלוונטי)

### 7.2 Store Listing

**Google Play:**
- [ ] שם האפליקציה (עד 30 תווים)
- [ ] תיאור קצר (עד 80 תווים)
- [ ] תיאור מלא (עד 4000 תווים)
- [ ] קטגוריה: Social / Dating
- [ ] Content Rating מולא
- [ ] Data Safety מולא

**iOS App Store:**
- [ ] שם האפליקציה
- [ ] Subtitle
- [ ] תיאור
- [ ] Keywords
- [ ] Privacy Nutrition Labels

---

## 8. לוח זמנים

| שלב | Phase | משך |
|-----|-------|-----|
| התקנת Capacitor | 9 | יום 1 |
| הגדרת פרויקטים Native | 9 | יום 2 |
| בניית AAB | 9 | יום 3 |
| Store Assets | 9 | יום 4 |
| בדיקות | 9 | יום 5-6 |
| הגשה לבדיקה | 9 | יום 7 |
| בדיקת Google/Apple | - | 1-7 ימים |

**סה"כ:** כ-2 שבועות

---

## 9. סיכונים ופתרונות

| סיכון | הסתברות | פתרון |
|-------|----------|--------|
| דחייה ע"י Google | בינונית | תיקון לפי הנחיות |
| בעיות ביצועים | נמוכה | אופטימיזציה |
| בעיות Push | בינונית | בדיקה על מכשירים אמיתיים |
| תאימות מכשירים | נמוכה | הגדרת minSdk נכון |

---

**מסמך זה חלק מ-PRD של Bellor MVP.**
