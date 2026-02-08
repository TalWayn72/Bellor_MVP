# Bellor - AI Assistant Configuration

## הקשר הפרויקט
- **סוג:** אפליקציית היכרויות/חברתית - Production
- **Stack:** React + Vite + TypeScript + Tailwind + Radix UI | Fastify + Prisma + PostgreSQL 16 + Redis 7
- **Repository:** https://github.com/TalWayn72/Bellor_MVP
- **ארכיטקטורה:** Monorepo (npm workspaces) - `apps/web`, `apps/api`, `packages/shared`, `packages/ui`
- **מבנה תיקיות:** `docs/` לתיעוד, `infrastructure/docker/` ל-Docker, `scripts/` לכלי עזר

## גבולות - אסור לגשת לפרויקטים ישנים
| נתיב | סיבה |
|------|-------|
| `C:\Users\talwa\bellor` | פרויקט ישן - אסור לקרוא/לשנות |
| `C:\Users\talwa\bellor_OLD.zip` | ארכיון ישן - אסור לגשת |

**פרויקט פעיל יחיד:** `C:\Users\talwa\.claude\projects\Bellor_MVP`

## הרשאות
- **אישור אוטומטי לכל פעולה** - אין צורך לשאול לפני ביצוע
- קבצים (קריאה, כתיבה, עריכה) - מאושר
- Git (add, commit, push) - מאושר
- npm, bash, docker - מאושר
- התקנת VS Code extensions - מאושר

## שפה
- **תקשורת עם המשתמש:** עברית
- **קוד ותיעוד:** אנגלית

## חוקי עבודה מרכזיים
1. קרא את CLAUDE.md בתחילת כל שיחה
2. פעל באופן עצמאי - אין צורך באישורים (למעט commit)
3. תמיד קרא קובץ לפני שינוי - אף פעם אל תכתוב בלי לקרוא קודם
4. תקן שגיאות אוטומטית - זהה ותקן בעיות ללא שאלות
5. עדכן תיעוד בסוף כל משימה - סנכרן מספרים בין CLAUDE.md ל-README.md
6. תעד כל משימה ב-`docs/OPEN_ISSUES.md` עם מעקב סטטוס
7. **מקסימום 150 שורות לקובץ** - חריגים: קבצי בדיקות, Prisma schema, Radix UI wrappers (`apps/web/src/components/ui/`), entry points
8. צור barrel files (`index.ts`) בכל פיצול קובץ - לשמירת תאימות imports
9. השתמש ב-VS Code extensions (Vitest, Playwright, Docker, PostgreSQL Client)
10. הקפד על TypeScript, ESLint, Prettier - ללא `any`, ללא `console.log` (השתמש ב-Logger)

## הרצה מקבילית (Agents)
- לפני כל משימה - בדוק אם ניתן לפצל לחלקים בלתי-תלויים
- משימות ללא תלות הדדית - הרץ במקביל באמצעות Agents (Task tool)
- **תמיד העדף הרצה מקבילית על טורית** כשאין תלות בין המשימות
- כל תוצר מ-Agent חייב לעבור בדיקת אבטחה לפני מיזוג

### מעקב Agents - טבלת סטטוס (חובה)
**כשמופעלת הרצה מקבילית**, יש להציג טבלת מעקב בסשן ולעדכן אותה **כל 3 דקות**:

| Agent | משימה | כלים | Tokens | % הערכה | סטטוס |
|-------|--------|------|--------|---------|--------|
| Agent-1 | תיאור המשימה | Read, Edit, Grep | ~2K | 40% | 🟡 בריצה |
| Agent-2 | תיאור המשימה | Bash, Read | ~1.5K | 100% | ✅ הושלם |
| Agent-3 | תיאור המשימה | Glob, Read, Edit | ~3K | 70% | 🟡 בריצה |

**סטטוסים:** ⏳ ממתין | 🟡 בריצה | ✅ הושלם | 🔴 נכשל

## שער ביקורת אבטחה
כל קוד חדש חייב לעמוד בבדיקות הבאות **לפני commit:**

| בדיקה | תיאור |
|--------|-------|
| XSS | אין הזרקת HTML/JS ללא sanitization |
| SQL Injection | כל שאילתה דרך Prisma ORM בלבד |
| Command Injection | אין הרצת פקודות מ-input של משתמש |
| Secrets | אין סודות, מפתחות API, או סיסמאות בקוד |
| Input Validation | כל input מסונן ומאומת (client + server) |
| File Upload | בדיקת magic bytes, סינון שמות קבצים |

סרוק מול `docs/SECURITY_CHECKLIST.md` לפני כל commit.

## מחזור חיי שירותים

### התחלת שיחה - הפעלת שירותים (חובה)
| שלב | פקודה | בדיקה |
|------|--------|-------|
| 1. Docker | `npm run docker:up` | `docker ps` - bellor_postgres + bellor_redis |
| 2. Backend API | `npm run dev:api` | `curl http://localhost:3000/health` |
| 3. Frontend (אופציונלי) | `npm run dev` | http://localhost:5173 |

**DB ריק?** הרץ `cd apps/api && npx prisma db seed`

### סיום עבודה - רשימת אימות
1. Docker רץ (PostgreSQL + Redis)
2. Backend API פעיל על פורט 3000
3. Frontend פעיל על פורט 5173
4. הרץ בדיקות: `npm run test`
5. באגים שתוקנו: תועדו ב-OPEN_ISSUES.md + נוצרו בדיקות
6. **סקירת אבטחה סופית** - ודא שהשינויים לא פגעו באבטחה הקיימת (ראה סעיף למטה)
7. תיעוד עודכן (CLAUDE.md, README.md) אם נדרש

### סקירת אבטחה בסיום עבודה (חובה)
**בסיום כל משימה**, לפני commit, יש לבצע סקירת אבטחה מלאה:

| # | בדיקה | פירוט |
|---|--------|-------|
| 1 | **סרוק מול שער הביקורת** | ודא שכל הקוד החדש עומד בכל 6 הבדיקות מ"שער ביקורת אבטחה" |
| 2 | **אימות אבטחה קיימת** | ודא שהשינויים לא הסירו/החלישו מנגנוני אבטחה קיימים (auth, validation, sanitization) |
| 3 | **בדיקת רגרסיה אבטחתית** | חפש imports שנמחקו, middleware שהוסר, validation שדולג |
| 4 | **סריקה מול SECURITY_CHECKLIST** | הרץ בדיקה מול `docs/SECURITY_CHECKLIST.md` לוודא עמידה בתקינה |
| 5 | **תיעוד שינויי אבטחה** | אם השתנה מנגנון אבטחה - תעד ב-OPEN_ISSUES.md |

**כלל ברזל:** שום שינוי לא יעבור commit אם הוא פוגע באבטחה קיימת. יש לתקן לפני commit.

### פתרון בעיות
| בעיה | פתרון |
|------|--------|
| Docker לא רץ | `npm run docker:up` |
| API לא רץ (3000) | `npm run dev:api` |
| Frontend לא רץ (5173) | `npm run dev` |
| DB ריק | `cd apps/api && npx prisma db seed` |

## מדיניות Git
**Repository:** https://github.com/TalWayn72/Bellor_MVP

| מצב | פעולה |
|-----|--------|
| תיקון באג | Commit מיידי |
| פיצ'ר שלם | Commit בסיום |
| Refactoring | Commit אחרי שינוי לוגי שלם |
| סוף יום עבודה | Commit + Push לגיבוי |

**תהליך:** Claude מציע commit --> המשתמש מאשר --> Claude מבצע.
**אסור לעשות commit אוטומטי ללא אישור המשתמש.**

## פרוטוקול תיקון באגים (חובה)

### שלב ראשון: חקירת לוגים
**לפני כל תיקון באג - קרא את הלוגים קודם!**

| # | צעד |
|---|------|
| 1 | **חפש בלוגים** - קרא לוגים רלוונטיים (API, DB, Redis, Frontend console) לאיתור השגיאה |
| 2 | **נתח את הלוג** - זהה stack trace, error codes, timestamps, ו-context של השגיאה |
| 3 | **אם אין לוג לאירוע** - הבן למה אין logging, והוסף logging מתאים כחלק מהתיקון כדי שבעתיד הבאג ייתפס |
| 4 | **שפר logging קיים** - אם הלוג לא מספיק מפורט, הוסף פרטים (user ID, request params, context) |

**כלל ברזל:** לעולם אל תתקן באג בלי לקרוא קודם את הלוגים. אם אין לוגים - זה חלק מהבאג.

### שלב שני: תיעוד ומעקב
לאחר כל תיקון באג, יש לבצע את **כל** הצעדים:

| # | צעד |
|---|------|
| 1 | תעד ב-`docs/OPEN_ISSUES.md` מיד לאחר תיקון |
| 2 | צור בדיקות אוטומטיות (unit / integration) |
| 3 | עדכן סטטוס: 🔴 פתוח --> 🟡 בטיפול --> ✅ תוקן |
| 4 | עדכן טבלת סיכום בראש המסמך |
| 5 | הוסף להיסטוריית תיקונים בסוף המסמך |

### תבנית תיעוד באג:
```markdown
### ISSUE-XXX: תיאור קצר
**סטטוס:** ✅ תוקן | **חומרה:** 🔴 קריטי / 🟡 בינוני / 🟢 נמוך | **תאריך:** DD Month YYYY
**קבצים:** `path/to/file.ts:line`
**בעיה:** מה קרה ולמה
**פתרון:** מה תוקן ואיך
**בדיקות:** `file.test.ts` - תיאור כיסוי
```

## חובת בדיקות
| סוג שינוי | דרישת בדיקות |
|-----------|---------------|
| פיצ'ר חדש | Unit + Integration |
| תיקון באג | בדיקת רגרסיה |
| שינוי API | בדיקות אינטגרציה לכל endpoint |
| שינוי UI | בדיקות קומפוננטות + E2E |
| שינוי Config | בדיקות תקינות הגדרות |

### מיקום קבצי בדיקות
| סוג | מיקום |
|-----|-------|
| Backend Unit | `apps/api/src/services/*.test.ts` |
| Backend Integration | `apps/api/src/test/integration/*.test.ts` |
| Frontend Unit | `apps/web/src/**/*.test.{ts,tsx}` |
| E2E | `apps/web/e2e/*.spec.ts` |

### פקודות בדיקה
| פקודה | תיאור |
|--------|-------|
| `npm run test` | כל הבדיקות |
| `npm run test:api` | Backend בלבד |
| `npm run test:web` | Frontend בלבד |
| `npm run test:e2e` | E2E בלבד |

**אין לבצע merge או deploy ללא בדיקות מלאות.**

## סנכרון תיעוד
| קובץ | מתי לעדכן | מה לסנכרן |
|-------|-----------|-----------|
| `CLAUDE.md` | שינוי בחוקי עבודה | הוראות AI, הרשאות |
| `README.md` | שינוי בסטטוס/מספרים **או הוספת יכולת חדשה** | מספר בדיקות, סטטוס שלבים, Features חדשים בסקשן Features |
| `docs/PRD.md` | **הוספת פיצ'ר/יכולת חדשה** | תיעוד הפיצ'ר, user stories, דרישות טכניות |
| `docs/OPEN_ISSUES.md` | כל משימה/באג | סטטוס, היסטוריה |

**כללי סנכרון:**
- כשמספרים משתנים (בדיקות, באגים, קבצים) - עדכן README + OPEN_ISSUES יחד
- **כשנוספת יכולת/פיצ'ר חדש** - עדכן README (סקשן Features) + PRD (סקשן רלוונטי) + OPEN_ISSUES

## פקודות נפוצות (קיצור)
```bash
npm run dev              # Frontend
npm run dev:api          # Backend
npm run dev:all          # שניהם
npm run docker:up        # PostgreSQL + Redis
npm run prisma:generate  # Generate Prisma client
npm run prisma:migrate   # Run migrations
npm run build            # Build all
npm run lint             # Lint all
```
