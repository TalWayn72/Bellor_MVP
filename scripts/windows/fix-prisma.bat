@echo off
echo ========================================
echo Bellor - Fix Prisma DLL Lock
echo ========================================
echo.

echo [1/4] Killing all Node.js processes...
taskkill /F /IM node.exe >nul 2>&1
if %errorlevel%==0 (
    echo ✓ Node processes killed
) else (
    echo ! No Node processes found or already closed
)
echo.

echo [2/4] Waiting 3 seconds for processes to fully close...
timeout /t 3 /nobreak >nul
echo.

echo [3/4] Generating Prisma Client...
call npx prisma generate --schema=apps/api/prisma/schema.prisma
if %errorlevel% neq 0 (
    echo ✗ ERROR: Failed to generate Prisma client
    echo Please close VSCode and try again
    pause
    exit /b 1
)
echo ✓ Prisma client generated successfully
echo.

echo [4/4] Creating database migration...
call npx prisma migrate dev --name add_feedback_model --schema=apps/api/prisma/schema.prisma
if %errorlevel% neq 0 (
    echo ✗ ERROR: Migration failed
    pause
    exit /b 1
)
echo ✓ Migration completed successfully
echo.

echo ========================================
echo ✓ ALL DONE!
echo ========================================
echo.
echo Next steps:
echo 1. Run: npm run docker:up
echo 2. Run: npm run dev:api
echo 3. Run: npm run dev
echo.
pause
