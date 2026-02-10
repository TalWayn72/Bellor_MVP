# מדריך פרסום ל-Google Play Store (ו-iOS App Store)

**גרסה:** 1.0.1
**תאריך יצירה:** פברואר 2026
**תאריך עדכון:** 5 פברואר 2026
**סטטוס:** Phase 1-2 הושלמו (Capacitor מותקן)

---

## תוכן עניינים

1. [סקירה כללית](#סקירה-כללית)
2. [גישה טכנית נבחרת](#גישה-טכנית-נבחרת)
3. [דרישות מוקדמות](#דרישות-מוקדמות)
4. [שלבי יישום](#שלבי-יישום)
5. [דרישות Google Play](#דרישות-google-play)
6. [דרישות iOS App Store](#דרישות-ios-app-store)
7. [בדיקות ואימות](#בדיקות-ואימות)
8. [לוח זמנים](#לוח-זמנים)

---

## 1. סקירה כללית

### מצב נוכחי
Bellor MVP הוא **PWA (Progressive Web App)** מבוסס:
- **Frontend:** React 18 + Vite + TypeScript
- **PWA Config:** `manifest.json` מוגדר עם `com.bellor.app`
- **Mobile Ready:** עיצוב רספונסיבי, אייקונים בגדלים שונים

### מה נדרש לפרסום
- [x] התקנת Capacitor לעטיפת האפליקציה ✅ (5 פברואר 2026)
- [x] יצירת פרויקט Android ✅ (5 פברואר 2026)
- [x] יצירת פרויקט iOS ✅ (5 פברואר 2026)
- [ ] Digital Asset Links (`.well-known/assetlinks.json`)
- [ ] חתימה דיגיטלית (Upload Keystore)
- [ ] קובץ AAB (Android App Bundle)
- [ ] חשבון Google Play Developer ($25)
- [ ] מדיניות פרטיות (Privacy Policy URL)
- [ ] Store Listing (תיאור, צילומי מסך)

---

## 2. גישה טכנית נבחרת

### Capacitor ✅ נבחר

**סיבת הבחירה:** נדרשת תמיכה גם ב-Android וגם ב-iOS בעתיד.

| יתרון | חיסרון |
|-------|--------|
| **Android + iOS** מאותו קוד | דורש התאמות קלות בקוד |
| גישה ל-Native APIs | Build נפרד לכל פלטפורמה |
| עובד גם offline | צריך Android Studio / Xcode |
| Push notifications native | - |

### אפשרויות שנשקלו

#### TWA (Trusted Web Activity)
- מהיר יותר ליישום (1-2 ימים)
- **נדחה:** תומך רק באנדרואיד

#### React Native
- ביצועים מקסימליים
- **נדחה:** דורש שכתוב מלא של UI

---

## 3. דרישות מוקדמות

### לבניית Android
| דרישה | גרסה מינימלית |
|-------|---------------|
| Java JDK | 17+ |
| Android Studio | 2023.1+ |
| Android SDK | 33+ (API Level) |
| Gradle | 8.0+ |
| Node.js | 18+ |

### לבניית iOS (בעתיד)
| דרישה | גרסה מינימלית |
|-------|---------------|
| macOS | Ventura 13+ |
| Xcode | 15+ |
| CocoaPods | 1.12+ |
| Node.js | 18+ |

### חשבונות נדרשים
| חשבון | עלות | קישור |
|-------|------|-------|
| Google Play Developer | $25 חד פעמי | [play.google.com/console](https://play.google.com/console) |
| Apple Developer | $99/שנה | [developer.apple.com](https://developer.apple.com) |

---

## 4. שלבי יישום

### שלב 1: התקנת Capacitor

```bash
cd Bellor_MVP/apps/web

# התקנת Capacitor core
npm install @capacitor/core @capacitor/cli

# אתחול Capacitor
npx cap init "Bellor" "com.bellor.app"

# התקנת פלטפורמות
npm install @capacitor/android @capacitor/ios
npx cap add android
npx cap add ios
```

### שלב 2: הגדרת capacitor.config.ts

יצירת קובץ `apps/web/capacitor.config.ts`:

```typescript
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.bellor.app',
  appName: 'Bellor',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert']
    },
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#EC4899',
      showSpinner: false
    }
  }
};

export default config;
```

### שלב 3: בניית האפליקציה

```bash
# בניית הפרונטאנד
npm run build

# סנכרון עם פרויקטי Native
npx cap sync

# פתיחה ב-Android Studio
npx cap open android

# פתיחה ב-Xcode (למק בלבד)
npx cap open ios
```

### שלב 4: יצירת Keystore (Android)

```bash
keytool -genkey -v -keystore bellor-upload.keystore \
  -alias bellor -keyalg RSA -keysize 2048 -validity 10000
```

**חשוב:** לשמור את ה-Keystore ואת הסיסמאות במקום בטוח!

### שלב 5: בניית AAB ב-Android Studio

1. פתיחת Android Studio
2. Build → Generate Signed Bundle / APK
3. בחירת **Android App Bundle**
4. הזנת פרטי Keystore
5. בחירת **release**
6. יפיק: `app-release.aab`

### שלב 6: העלאה ל-Google Play Console

1. כניסה ל-[Google Play Console](https://play.google.com/console)
2. יצירת אפליקציה חדשה
3. העלאת קובץ AAB
4. מילוי Store Listing (ראה סעיף 5)
5. מילוי Data Safety
6. הגשה לבדיקה

---

## 5. דרישות Google Play

### 5.1 Store Listing

| פריט | דרישה | סטטוס |
|------|-------|-------|
| שם האפליקציה | עד 30 תווים | [ ] |
| תיאור קצר | עד 80 תווים | [ ] |
| תיאור מלא | עד 4000 תווים | [ ] |
| צילומי מסך טלפון | 2-8 תמונות (1080x1920) | [ ] |
| צילומי מסך טאבלט | 2-8 תמונות (1920x1200) | [ ] |
| אייקון | 512x512 PNG | [ ] |
| Feature Graphic | 1024x500 PNG | [ ] |
| מדיניות פרטיות | URL פעיל | [ ] |

### 5.2 Content Rating

יש למלא שאלון דירוג תוכן ולציין:
- [ ] אפליקציית דייטינג/היכרויות
- [ ] צ'אט בין משתמשים
- [ ] תוכן שנוצר על ידי משתמשים (UGC)
- [ ] העלאת תמונות

### 5.3 Data Safety

יש לפרט איזה מידע נאסף:

| סוג מידע | נאסף | משותף | סיבה |
|----------|------|-------|------|
| Email | כן | לא | אימות חשבון |
| שם | כן | כן | פרופיל ציבורי |
| תמונות | כן | כן | פרופיל ציבורי |
| מיקום (אופציונלי) | כן | לא | מציאת התאמות |
| הודעות צ'אט | כן | לא | תקשורת |

### 5.4 Target Audience

- גיל יעד: 18+
- קטגוריה: Social / Dating

---

## 6. דרישות iOS App Store (לעתיד)

### 6.1 App Store Listing

| פריט | דרישה |
|------|-------|
| שם האפליקציה | עד 30 תווים |
| Subtitle | עד 30 תווים |
| תיאור | עד 4000 תווים |
| צילומי מסך iPhone | 6.5" ו-5.5" |
| צילומי מסך iPad | 12.9" |
| אייקון | 1024x1024 PNG (ללא שקיפות) |
| מדיניות פרטיות | URL פעיל |

### 6.2 App Privacy

יש למלא את Privacy Nutrition Labels ב-App Store Connect.

---

## 7. בדיקות ואימות

### לאחר התקנת Capacitor
```bash
# וידוא שהפרויקט נבנה בהצלחה
npm run build
npx cap sync

# וידוא שפרויקט Android נוצר
ls apps/web/android/
```

### לאחר בניית AAB
1. [ ] התקנת APK על אמולטור
2. [ ] התקנת APK על מכשיר אמיתי
3. [ ] בדיקת פיצ'רים קריטיים:
   - [ ] התחברות/הרשמה
   - [ ] צ'אט בזמן אמת
   - [ ] Push notifications
   - [ ] העלאת תמונות
   - [ ] ניווט בין מסכים
4. [ ] בדיקת ביצועים על מכשירים שונים

### לאחר העלאה לחנות
1. [ ] בדיקה ב-Internal Testing track
2. [ ] וידוא App Bundle Analyzer תקין
3. [ ] מילוי כל דרישות Data Safety
4. [ ] בדיקה ב-Closed Testing עם משתמשי בטא

---

## 8. לוח זמנים

| שלב | משך זמן משוער |
|-----|---------------|
| התקנת Capacitor והגדרות | יום 1 |
| יצירת Keystore ובניית AAB | יום 2 |
| מילוי Store Listing | יום 3 |
| יצירת Privacy Policy | יום 4 |
| בדיקה פנימית | יום 5 |
| הגשה לבדיקת Google | יום 6 |
| זמן בדיקה של Google | 1-7 ימים |

**סה"כ עד פרסום:** ~2 שבועות

---

## נספחים

### A. מבנה תיקיות לאחר הוספת Capacitor

```
apps/web/
├── src/                    # קוד React קיים
├── public/
│   ├── manifest.json
│   └── .well-known/
│       └── assetlinks.json  # Digital Asset Links
├── dist/                   # Build output
├── android/                # פרויקט Android (נוצר אוטומטית)
│   ├── app/
│   └── gradle/
├── ios/                    # פרויקט iOS (נוצר אוטומטית)
├── capacitor.config.ts     # הגדרות Capacitor
└── package.json
```

### B. Digital Asset Links

יצירת קובץ `apps/web/public/.well-known/assetlinks.json`:

```json
[{
  "relation": ["delegate_permission/common.handle_all_urls"],
  "target": {
    "namespace": "android_app",
    "package_name": "com.bellor.app",
    "sha256_cert_fingerprints": ["SHA256_FINGERPRINT_HERE"]
  }
}]
```

להשגת ה-SHA256 fingerprint:
```bash
keytool -list -v -keystore bellor-upload.keystore -alias bellor
```

---

**מסמך זה חלק מתוכנית הפיתוח של Bellor MVP.**
**ראה גם:** [MOBILE_APP_REQUIREMENTS.md](MOBILE_APP_REQUIREMENTS.md) | [PRD.md](../product/PRD.md)
