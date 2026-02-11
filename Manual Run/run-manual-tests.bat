@echo off
REM ============================================================================
REM  Bellor - Manual Tests Runner (Full-Stack E2E)
REM ============================================================================
REM
REM  This script replaces manual QA testing by running the full-stack
REM  Playwright E2E test suite against the REAL running backend.
REM
REM  What it tests:
REM    - Auth & Registration (login, logout, session, onboarding)
REM    - Feed & Content (SharedSpace, likes, responses, daily missions)
REM    - Chat & Messaging (chat list, private chat, message history)
REM    - Profile Management (view, edit, upload photo)
REM    - Navigation & History (drawer menu, bottom nav, back/forward)
REM    - Modals & Dialogs (open, close, interact with all modals)
REM    - Settings Pages (theme, notifications, privacy, filters)
REM    - Error States (offline, 500, 404, expired session)
REM    - Edge Cases (XSS, SQL injection, rapid clicks, Hebrew input)
REM
REM  Test files location: apps/web/e2e/full-stack/*.spec.ts
REM  New tests added to that folder are automatically included.
REM
REM  Prerequisites (checked automatically):
REM    1. Docker running (PostgreSQL + Redis)
REM    2. Backend API running on port 3000
REM    3. Frontend dev server running on port 5173
REM
REM  Usage:
REM    "Manual Run\run-manual-tests.bat"              - Run all manual tests
REM    "Manual Run\run-manual-tests.bat" --headed      - Run with visible browser
REM    "Manual Run\run-manual-tests.bat" --debug       - Run in debug mode
REM    "Manual Run\run-manual-tests.bat" --ui          - Run with Playwright UI
REM    "Manual Run\run-manual-tests.bat" --mobile      - Run on mobile viewport
REM
REM ============================================================================

setlocal enabledelayedexpansion

REM --- Colors ---
set "GREEN=[92m"
set "RED=[91m"
set "YELLOW=[93m"
set "CYAN=[96m"
set "RESET=[0m"
set "BOLD=[1m"

echo.
echo %CYAN%============================================================================%RESET%
echo %BOLD%  Bellor - Manual Tests Runner (Full-Stack E2E)%RESET%
echo %CYAN%============================================================================%RESET%
echo.

REM --- Navigate to project root ---
cd /d "%~dp0.."

REM ============================================================================
REM  STEP 1: Check Prerequisites
REM ============================================================================

echo %BOLD%Step 1: Checking prerequisites...%RESET%
echo.

REM --- Check Docker ---
echo   Checking Docker...
docker ps >nul 2>&1
if %errorlevel% neq 0 (
    echo   %RED%X Docker is not running!%RESET%
    echo   %YELLOW%  Fix: Start Docker Desktop, then run: npm run docker:up%RESET%
    goto :prerequisites_failed
)

docker ps --format "{{.Names}}" 2>nul | findstr /i "bellor_postgres" >nul 2>&1
if %errorlevel% neq 0 (
    echo   %YELLOW%! PostgreSQL container not found. Starting Docker services...%RESET%
    npm run docker:up
    timeout /t 5 /nobreak >nul
)

docker ps --format "{{.Names}}" 2>nul | findstr /i "bellor_redis" >nul 2>&1
if %errorlevel% neq 0 (
    echo   %RED%X Redis container not running!%RESET%
    echo   %YELLOW%  Fix: npm run docker:up%RESET%
    goto :prerequisites_failed
)
echo   %GREEN%V Docker services running (PostgreSQL + Redis)%RESET%

REM --- Check Backend API ---
echo   Checking Backend API (port 3000)...
curl -s -o nul -w "%%{http_code}" http://localhost:3000/health 2>nul | findstr "200" >nul 2>&1
if %errorlevel% neq 0 (
    echo   %RED%X Backend API is not running on port 3000!%RESET%
    echo   %YELLOW%  Fix: Open a new terminal and run: npm run dev:api%RESET%
    echo   %YELLOW%  Wait for "Server listening on port 3000" message%RESET%
    goto :prerequisites_failed
)
echo   %GREEN%V Backend API is healthy%RESET%

REM --- Check Frontend ---
echo   Checking Frontend (port 5173)...
curl -s -o nul -w "%%{http_code}" http://localhost:5173 2>nul | findstr "200" >nul 2>&1
if %errorlevel% neq 0 (
    echo   %YELLOW%! Frontend not detected on port 5173%RESET%
    echo   %YELLOW%  Playwright will start it automatically via webServer config%RESET%
)
if %errorlevel% equ 0 (
    echo   %GREEN%V Frontend is running%RESET%
)

echo.
echo %GREEN%  All prerequisites met!%RESET%
echo.

REM ============================================================================
REM  STEP 2: Clear Rate Limits
REM ============================================================================

echo %BOLD%Step 2: Clearing rate limits in Redis...%RESET%
docker exec bellor_redis redis-cli EVAL "local keys = redis.call('keys', 'fastify-rate-limit*') for i=1,#keys do redis.call('del', keys[i]) end return #keys" 0 >nul 2>&1
if %errorlevel% equ 0 (
    echo   %GREEN%V Rate limits cleared%RESET%
) else (
    echo   %YELLOW%! Could not clear rate limits (non-critical)%RESET%
)
echo.

REM ============================================================================
REM  STEP 3: Run Full-Stack E2E Tests
REM ============================================================================

echo %BOLD%Step 3: Running full-stack E2E tests...%RESET%
echo.
echo   Test files: apps/web/e2e/full-stack/*.spec.ts
echo   Auth: Global setup creates authenticated sessions via API
echo   Backend: Real Fastify + PostgreSQL + Redis
echo.

REM --- Determine run mode ---
set "RUN_CMD=test:e2e:fullstack"

if "%~1"=="--headed" (
    set "RUN_CMD=test:e2e:fullstack:headed"
    echo   Mode: %CYAN%HEADED%RESET% (visible browser)
) else if "%~1"=="--debug" (
    set "RUN_CMD=test:e2e:fullstack:debug"
    echo   Mode: %CYAN%DEBUG%RESET% (step-by-step)
) else if "%~1"=="--ui" (
    set "RUN_CMD=test:e2e:fullstack:ui"
    echo   Mode: %CYAN%UI%RESET% (Playwright Test UI)
) else if "%~1"=="--mobile" (
    set "RUN_CMD=test:e2e:fullstack:mobile"
    echo   Mode: %CYAN%MOBILE%RESET% (Pixel 5 viewport)
) else (
    echo   Mode: %CYAN%HEADLESS%RESET% (default)
)

echo.
echo %CYAN%--------------------------------------------------------------------------%RESET%

npm run %RUN_CMD%
set "EXIT_CODE=%errorlevel%"

echo %CYAN%--------------------------------------------------------------------------%RESET%
echo.

REM ============================================================================
REM  STEP 4: Results Summary
REM ============================================================================

if %EXIT_CODE% equ 0 (
    echo %GREEN%============================================================================%RESET%
    echo %GREEN%  ALL MANUAL TESTS PASSED!%RESET%
    echo %GREEN%============================================================================%RESET%
) else (
    echo %RED%============================================================================%RESET%
    echo %RED%  SOME TESTS FAILED (exit code: %EXIT_CODE%)%RESET%
    echo %RED%============================================================================%RESET%
    echo.
    echo   View detailed report:
    echo     cd apps/web ^&^& npx playwright show-report
    echo.
    echo   Re-run failed tests only:
    echo     cd apps/web ^&^& npx playwright test --last-failed
)

echo.
echo   HTML Report: apps\web\playwright-report\index.html
echo   Screenshots: apps\web\test-results\ (on failure)
echo.

exit /b %EXIT_CODE%

:prerequisites_failed
echo.
echo %RED%============================================================================%RESET%
echo %RED%  PREREQUISITES NOT MET - Cannot run tests%RESET%
echo %RED%============================================================================%RESET%
echo.
echo   Required services:
echo     1. Docker: npm run docker:up
echo     2. Backend API: npm run dev:api  (in separate terminal)
echo     3. Frontend: npm run dev         (in separate terminal, or auto-started)
echo.
echo   Quick start:
echo     Terminal 1: npm run docker:up
echo     Terminal 2: npm run dev:api
echo     Terminal 3: npm run dev
echo     Terminal 4: "Manual Run\run-manual-tests.bat"
echo.
exit /b 1
