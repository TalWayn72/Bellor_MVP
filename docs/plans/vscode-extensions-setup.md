# תוכנית: התקנת VS Code Extensions והוספת חוק הרשאה

## משימה
1. התקנת תוספי VS Code מומלצים לפרויקט Bellor MVP
2. הוספת חוק כללי ל-Claude שמתיר התקנת extensions

---

## שלב 1: התקנת Extensions (עדיפות גבוהה)

```bash
code --install-extension vitest.explorer
code --install-extension ms-playwright.playwright
code --install-extension redhat.vscode-yaml
code --install-extension ms-azuretools.vscode-docker
code --install-extension 42Crunch.vscode-openapi
```

## שלב 2: התקנת Extensions (עדיפות בינונית)

```bash
code --install-extension usernamehw.errorlens
code --install-extension dsznajder.es7-react-js-snippets
code --install-extension cweijan.vscode-postgresql-client2
code --install-extension wix.vscode-import-cost
```

## שלב 3: הוספת חוק הרשאה ל-CLAUDE.md

הוספה לקובץ: `C:\Users\talwa\.claude\projects\Bellor_MVP\CLAUDE.md`

בסעיף **Permissions**, להוסיף:
```
- VS Code extensions installation - PERMITTED
```

---

## קבצים לעריכה
- `C:\Users\talwa\.claude\projects\Bellor_MVP\CLAUDE.md` - הוספת חוק הרשאה

## אימות
- הרצת `code --list-extensions` לוודא שהתוספים הותקנו
- בדיקה שהחוק נוסף ל-CLAUDE.md
