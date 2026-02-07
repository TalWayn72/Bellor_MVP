# Bellor MVP - Development Rules & Guidelines

**גרסה:** 1.0.0
**תאריך:** פברואר 2026
**סטטוס:** חובה לכל פיתוח

---

## 🚨 כלל ראשי: כל פיתוח חייב בדיקות מקיפות

> **מעתה, כל פיתוח חדש מחייב יצירת בדיקות מקיפות לפני merge ל-main.**
>
> אין לאשר PR ללא בדיקות מתאימות!

---

## 📋 חובות בדיקה לפי סוג פיתוח

### 1. Service חדש (Backend)

**חובה:**
- [ ] Unit tests עבור כל method ציבורי
- [ ] בדיקות לכל flow חיובי (happy path)
- [ ] בדיקות לכל שגיאה אפשרית (error cases)
- [ ] בדיקות ל-edge cases
- [ ] Integration tests אם יש תלות ב-DB/Redis/External API
- [ ] Coverage מינימום: 80%

**דוגמה לקובץ בדיקות:**
```typescript
// services/myservice.service.test.ts
describe('MyService', () => {
  describe('methodName', () => {
    it('should succeed with valid input', async () => {});
    it('should throw error for invalid input', async () => {});
    it('should handle edge case X', async () => {});
  });
});
```

### 2. API Route חדש

**חובה:**
- [ ] Unit tests ל-service המשויך
- [ ] Integration tests לנתיב ה-API
- [ ] בדיקות authentication (עם/בלי token)
- [ ] בדיקות authorization (הרשאות)
- [ ] בדיקות validation (Zod schema)
- [ ] בדיקות error responses

**דוגמה:**
```typescript
// test/integration/myroute.integration.test.ts
describe('POST /api/v1/myroute', () => {
  it('should return 201 with valid data', async () => {});
  it('should return 401 without auth token', async () => {});
  it('should return 400 with invalid body', async () => {});
  it('should return 403 for unauthorized user', async () => {});
});
```

### 3. WebSocket Event חדש

**חובה:**
- [ ] Integration tests עם socket.io-client
- [ ] בדיקת authentication על connection
- [ ] בדיקת שליחת event
- [ ] בדיקת קבלת event
- [ ] בדיקת error handling
- [ ] בדיקת broadcast לחדרים

**קובץ בדיקות:**
`test/integration/websocket.integration.test.ts`

### 4. UI Component חדש (Frontend)

**חובה:**
- [ ] Unit tests עם Vitest + React Testing Library
- [ ] בדיקות rendering
- [ ] בדיקות user interactions
- [ ] בדיקות accessibility (a11y)
- [ ] E2E tests ב-Playwright אם זה flow קריטי

### 5. Email Template / Service

**חובה:**
- [ ] Unit tests לפונקציות שליחה
- [ ] בדיקת graceful degradation (ללא API key)
- [ ] בדיקת error handling
- [ ] בדיקת תוכן ה-template

### 6. Security Feature

**חובה:**
- [ ] Unit tests מקיפים
- [ ] Integration tests
- [ ] Security-specific tests (injection, XSS, etc.)
- [ ] בדיקות rate limiting (אם רלוונטי)
- [ ] הוספה ל-security.integration.test.ts

---

## 📁 מבנה קבצי בדיקות

```
apps/api/src/
├── services/
│   ├── auth.service.ts
│   └── auth.service.test.ts        # Unit tests
├── lib/
│   ├── email.ts
│   └── email.test.ts               # Unit tests
└── test/
    ├── setup.ts                    # Global test setup
    ├── build-test-app.ts           # Test app builder
    └── integration/
        ├── auth.integration.test.ts
        ├── websocket.integration.test.ts
        └── security.integration.test.ts
```

---

## 🎯 סוגי בדיקות נדרשים

### Unit Tests
- **כלי:** Vitest
- **מיקום:** ליד הקובץ הנבדק (`*.test.ts`)
- **מטרה:** בדיקת פונקציות בודדות בבידוד
- **חובה:** Mock לכל תלות חיצונית

### Integration Tests
- **כלי:** Vitest + Supertest / light-my-request
- **מיקום:** `test/integration/`
- **מטרה:** בדיקת זרימה מקצה לקצה
- **חובה:** שימוש ב-test fixtures

### E2E Tests
- **כלי:** Playwright
- **מיקום:** `apps/web/e2e/`
- **מטרה:** בדיקת flows קריטיים מנקודת מבט המשתמש
- **חובה:** עבור flows קריטיים (auth, payment, etc.)

### Performance Tests
- **כלי:** k6
- **מיקום:** `infrastructure/k6/`
- **מטרה:** בדיקת ביצועים תחת עומס
- **חובה:** עבור שינויים שעלולים להשפיע על ביצועים

---

## ✅ Checklist לפני PR

### בדיקות
- [ ] כל הבדיקות עוברות (`npm run test`)
- [ ] Coverage לא ירד
- [ ] נוספו בדיקות לקוד חדש
- [ ] Integration tests עוברות

### איכות קוד
- [ ] אין שגיאות TypeScript (`npm run typecheck`)
- [ ] אין שגיאות Lint (`npm run lint`)
- [ ] אין warnings חדשים

### תיעוד
- [ ] עודכן PRD אם זה פיצ'ר חדש
- [ ] נוסף JSDoc לפונקציות ציבוריות
- [ ] עודכן CHANGELOG אם נדרש

### אבטחה
- [ ] אין vulnerabilities חדשות (`npm audit`)
- [ ] אין secrets בקוד
- [ ] Input validation מתאים

---

## 🔄 תהליך הוספת פיצ'ר חדש

1. **תכנון**
   - הגדרת requirements
   - עדכון PRD

2. **פיתוח**
   - כתיבת קוד
   - כתיבת בדיקות **במקביל**

3. **בדיקות**
   - הרצת unit tests
   - הרצת integration tests
   - וידוא coverage

4. **Code Review**
   - PR עם תיאור מפורט
   - Reviewer מוודא קיום בדיקות

5. **Merge**
   - רק לאחר אישור reviewer
   - רק אם CI עובר

---

## 📊 יעדי Coverage

| קטגוריה | מינימום | יעד |
|----------|---------|-----|
| **Services** | 80% | 90% |
| **Controllers** | 70% | 80% |
| **Routes** | 70% | 80% |
| **Security** | 90% | 95% |
| **Utilities** | 80% | 90% |
| **Overall** | 75% | 85% |

---

## 🧪 הרצת בדיקות

```bash
# כל הבדיקות
npm run test

# בדיקות עם coverage
npm run test:coverage

# בדיקות ספציפיות
npm run test -- --grep "auth"

# Integration tests בלבד
npm run test -- src/test/integration/

# E2E tests
npm run test:e2e

# k6 load tests
k6 run infrastructure/k6/smoke-test.js
```

---

## 📝 דוגמה לפיצ'ר חדש עם בדיקות

נניח שמוסיפים פיצ'ר "Report User":

### 1. Service + Unit Tests
```typescript
// services/reports.service.ts
export class ReportsService {
  static async reportUser(reporterId: string, reportedId: string, reason: string) {
    // Implementation
  }
}

// services/reports.service.test.ts
describe('ReportsService', () => {
  describe('reportUser', () => {
    it('should create report successfully', async () => {});
    it('should throw if reporting self', async () => {});
    it('should throw if user already reported', async () => {});
  });
});
```

### 2. Route + Integration Tests
```typescript
// routes/v1/reports.routes.ts
// POST /api/v1/reports

// test/integration/reports.integration.test.ts
describe('Reports API', () => {
  describe('POST /api/v1/reports', () => {
    it('should create report - 201', async () => {});
    it('should require auth - 401', async () => {});
    it('should validate body - 400', async () => {});
  });
});
```

### 3. עדכון PRD
```markdown
#### 4.X.X Reports ✅
- ✅ דיווח על משתמש
- ✅ סיבות דיווח מוגדרות מראש
- ✅ מניעת דיווח כפול
```

---

## ⚠️ אזהרות

1. **לא לדלג על בדיקות** - גם אם "זה פשוט"
2. **לא לכתוב בדיקות אחרי ה-merge** - בדיקות הן חלק מהפיתוח
3. **לא לפתח בלי mocks** - בדיקות צריכות להיות מבודדות
4. **לא להתעלם מכישלונות** - כל כישלון בדיקה דורש טיפול

---

## 📚 משאבים

- [Vitest Documentation](https://vitest.dev/)
- [Playwright Documentation](https://playwright.dev/)
- [k6 Documentation](https://k6.io/docs/)
- [Testing Best Practices](https://github.com/goldbergyoni/javascript-testing-best-practices)

---

**זכור: קוד ללא בדיקות הוא קוד שבור!**
