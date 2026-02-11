@echo off
REM ============================================================================
REM  Bellor - Complete Test Suite Runner
REM ============================================================================
REM
REM  Runs ALL test layers in the project, from fast unit tests to full-stack E2E.
REM  Each layer is independent - if one fails, the next still runs.
REM
REM  Test Layers (in order):
REM  -----------------------------------------------------------------------
REM  Layer 1: Unit Tests (Vitest)
REM    - Backend: apps/api/src/**/*.test.ts
REM    - Frontend: apps/web/src/**/*.test.{ts,tsx}
REM    - Shared: packages/shared/src/**/*.test.ts
REM    - Run with: npm run test
REM
REM  Layer 2: Memory Leak Detection
REM    - Backend: apps/api/src/test/memory-leak-detection.test.ts
REM    - Frontend: apps/web/src/test/memory-leak-detection.test.ts
REM    - AST Scanner: scripts/check-memory-leaks.js
REM    - Run with: npm run test:memory-leak && npm run check:memory-leaks
REM
REM  Layer 3: Mocked E2E Tests (Playwright, no backend needed)
REM    - Location: apps/web/e2e/*.spec.ts (excludes full-stack/)
REM    - Run with: npm run test:e2e
REM
REM  Layer 4: Full-Stack E2E Tests (Playwright, real backend)
REM    - Location: apps/web/e2e/full-stack/*.spec.ts
REM    - Requires: Docker + API + Frontend running
REM    - Run with: npm run test:e2e:fullstack
REM
REM  Adding new tests:
REM    - Unit tests: Create *.test.ts next to source file -> auto-included
REM    - Mocked E2E: Create *.spec.ts in apps/web/e2e/ -> auto-included
REM    - Full-stack E2E: Create *.spec.ts in apps/web/e2e/full-stack/ -> auto-included
REM    - Memory leak: Add patterns to detection test files -> auto-included
REM
REM  Usage:
REM    "Manual Run\run-all-tests.bat"           - Run everything
REM    "Manual Run\run-all-tests.bat" --quick    - Skip full-stack E2E (fast)
REM    "Manual Run\run-all-tests.bat" --e2e-only - Only E2E tests (mocked + full-stack)
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
echo %BOLD%  Bellor - Complete Test Suite Runner%RESET%
echo %CYAN%============================================================================%RESET%
echo.

REM --- Navigate to project root ---
cd /d "%~dp0.."

REM --- Parse arguments ---
set "SKIP_FULLSTACK=0"
set "E2E_ONLY=0"

if "%~1"=="--quick" (
    set "SKIP_FULLSTACK=1"
    echo   Mode: %YELLOW%QUICK%RESET% (skipping full-stack E2E)
    echo.
)
if "%~1"=="--e2e-only" (
    set "E2E_ONLY=1"
    echo   Mode: %YELLOW%E2E ONLY%RESET% (skipping unit tests)
    echo.
)

REM --- Track results ---
set "LAYER1_RESULT=SKIPPED"
set "LAYER2_RESULT=SKIPPED"
set "LAYER3_RESULT=SKIPPED"
set "LAYER4_RESULT=SKIPPED"
set "TOTAL_FAILED=0"

REM ============================================================================
REM  PREREQUISITES CHECK
REM ============================================================================

echo %BOLD%Checking prerequisites...%RESET%
echo.

REM --- Docker (needed for unit tests with DB and for full-stack E2E) ---
echo   Checking Docker...
docker ps >nul 2>&1
if %errorlevel% neq 0 (
    echo   %YELLOW%! Docker is not running%RESET%
    if "%SKIP_FULLSTACK%"=="0" (
        echo   %YELLOW%  Full-stack E2E tests will be skipped%RESET%
        set "SKIP_FULLSTACK=1"
    )
) else (
    docker ps --format "{{.Names}}" 2>nul | findstr /i "bellor_postgres" >nul 2>&1
    if !errorlevel! neq 0 (
        echo   %YELLOW%! PostgreSQL not running. Starting Docker services...%RESET%
        npm run docker:up
        timeout /t 5 /nobreak >nul
    )
    echo   %GREEN%V Docker services available%RESET%
)

REM --- Backend API (for full-stack E2E) ---
if "%SKIP_FULLSTACK%"=="0" (
    echo   Checking Backend API (port 3000)...
    curl -s -o nul -w "%%{http_code}" http://localhost:3000/health 2>nul | findstr "200" >nul 2>&1
    if !errorlevel! neq 0 (
        echo   %YELLOW%! Backend API not running - full-stack E2E will be skipped%RESET%
        echo   %YELLOW%  To include: Open new terminal, run: npm run dev:api%RESET%
        set "SKIP_FULLSTACK=1"
    ) else (
        echo   %GREEN%V Backend API is healthy%RESET%
    )
)

REM --- Frontend (for E2E tests) ---
echo   Checking Frontend (port 5173)...
curl -s -o nul -w "%%{http_code}" http://localhost:5173 2>nul | findstr "200" >nul 2>&1
if %errorlevel% neq 0 (
    echo   %YELLOW%! Frontend not running (Playwright will auto-start it)%RESET%
) else (
    echo   %GREEN%V Frontend is running%RESET%
)

echo.

REM ============================================================================
REM  LAYER 1: Unit & Integration Tests (Vitest)
REM ============================================================================

if "%E2E_ONLY%"=="1" goto :skip_layer1

echo %CYAN%============================================================================%RESET%
echo %BOLD%  Layer 1/4: Unit ^& Integration Tests (Vitest)%RESET%
echo %CYAN%============================================================================%RESET%
echo.
echo   Backend: apps/api/src/**/*.test.ts
echo   Frontend: apps/web/src/**/*.test.{ts,tsx}
echo   Packages: packages/shared/src/**/*.test.ts
echo.

npm run test
if %errorlevel% equ 0 (
    set "LAYER1_RESULT=PASSED"
    echo.
    echo   %GREEN%V Layer 1: Unit tests PASSED%RESET%
) else (
    set "LAYER1_RESULT=FAILED"
    set /a TOTAL_FAILED+=1
    echo.
    echo   %RED%X Layer 1: Unit tests FAILED%RESET%
)
echo.

:skip_layer1

REM ============================================================================
REM  LAYER 2: Memory Leak Detection
REM ============================================================================

if "%E2E_ONLY%"=="1" goto :skip_layer2

echo %CYAN%============================================================================%RESET%
echo %BOLD%  Layer 2/4: Memory Leak Detection%RESET%
echo %CYAN%============================================================================%RESET%
echo.
echo   Runtime tests: apps/api + apps/web memory-leak-detection.test.ts
echo   AST Scanner: scripts/check-memory-leaks.js
echo.

npm run check:memory-leaks
if %errorlevel% equ 0 (
    set "LAYER2_RESULT=PASSED"
    echo.
    echo   %GREEN%V Layer 2: Memory leak scan PASSED%RESET%
) else (
    set "LAYER2_RESULT=FAILED"
    set /a TOTAL_FAILED+=1
    echo.
    echo   %RED%X Layer 2: Memory leak scan FAILED%RESET%
)
echo.

:skip_layer2

REM ============================================================================
REM  LAYER 3: Mocked E2E Tests (Playwright)
REM ============================================================================

echo %CYAN%============================================================================%RESET%
echo %BOLD%  Layer 3/4: Mocked E2E Tests (Playwright)%RESET%
echo %CYAN%============================================================================%RESET%
echo.
echo   Location: apps/web/e2e/*.spec.ts (no backend needed)
echo   Projects: chromium, Mobile Chrome, Mobile Safari
echo.

npm run test:e2e
if %errorlevel% equ 0 (
    set "LAYER3_RESULT=PASSED"
    echo.
    echo   %GREEN%V Layer 3: Mocked E2E tests PASSED%RESET%
) else (
    set "LAYER3_RESULT=FAILED"
    set /a TOTAL_FAILED+=1
    echo.
    echo   %RED%X Layer 3: Mocked E2E tests FAILED%RESET%
)
echo.

REM ============================================================================
REM  LAYER 4: Full-Stack E2E Tests (Playwright + Real Backend)
REM ============================================================================

if "%SKIP_FULLSTACK%"=="1" (
    echo %CYAN%============================================================================%RESET%
    echo %BOLD%  Layer 4/4: Full-Stack E2E Tests - SKIPPED%RESET%
    echo %CYAN%============================================================================%RESET%
    echo.
    echo   %YELLOW%Skipped: Backend services not available or --quick mode%RESET%
    echo   %YELLOW%To run: Ensure Docker + API + Frontend are running%RESET%
    echo.
    goto :summary
)

echo %CYAN%============================================================================%RESET%
echo %BOLD%  Layer 4/4: Full-Stack E2E Tests (Real Backend)%RESET%
echo %CYAN%============================================================================%RESET%
echo.
echo   Location: apps/web/e2e/full-stack/*.spec.ts
echo   Backend: Real Fastify + PostgreSQL + Redis
echo   Auth: Global setup creates sessions via API login
echo.

REM --- Clear rate limits before full-stack tests ---
docker exec bellor_redis redis-cli EVAL "local keys = redis.call('keys', 'fastify-rate-limit*') for i=1,#keys do redis.call('del', keys[i]) end return #keys" 0 >nul 2>&1

npm run test:e2e:fullstack
if %errorlevel% equ 0 (
    set "LAYER4_RESULT=PASSED"
    echo.
    echo   %GREEN%V Layer 4: Full-stack E2E tests PASSED%RESET%
) else (
    set "LAYER4_RESULT=FAILED"
    set /a TOTAL_FAILED+=1
    echo.
    echo   %RED%X Layer 4: Full-stack E2E tests FAILED%RESET%
)
echo.

REM ============================================================================
REM  SUMMARY
REM ============================================================================

:summary

echo.
echo %CYAN%============================================================================%RESET%
echo %BOLD%  TEST RESULTS SUMMARY%RESET%
echo %CYAN%============================================================================%RESET%
echo.

REM --- Layer 1 ---
if "%LAYER1_RESULT%"=="PASSED" (
    echo   %GREEN%V%RESET% Layer 1: Unit ^& Integration Tests      %GREEN%PASSED%RESET%
) else if "%LAYER1_RESULT%"=="FAILED" (
    echo   %RED%X%RESET% Layer 1: Unit ^& Integration Tests      %RED%FAILED%RESET%
) else (
    echo   %YELLOW%-%RESET% Layer 1: Unit ^& Integration Tests      %YELLOW%SKIPPED%RESET%
)

REM --- Layer 2 ---
if "%LAYER2_RESULT%"=="PASSED" (
    echo   %GREEN%V%RESET% Layer 2: Memory Leak Detection         %GREEN%PASSED%RESET%
) else if "%LAYER2_RESULT%"=="FAILED" (
    echo   %RED%X%RESET% Layer 2: Memory Leak Detection         %RED%FAILED%RESET%
) else (
    echo   %YELLOW%-%RESET% Layer 2: Memory Leak Detection         %YELLOW%SKIPPED%RESET%
)

REM --- Layer 3 ---
if "%LAYER3_RESULT%"=="PASSED" (
    echo   %GREEN%V%RESET% Layer 3: Mocked E2E Tests              %GREEN%PASSED%RESET%
) else if "%LAYER3_RESULT%"=="FAILED" (
    echo   %RED%X%RESET% Layer 3: Mocked E2E Tests              %RED%FAILED%RESET%
) else (
    echo   %YELLOW%-%RESET% Layer 3: Mocked E2E Tests              %YELLOW%SKIPPED%RESET%
)

REM --- Layer 4 ---
if "%LAYER4_RESULT%"=="PASSED" (
    echo   %GREEN%V%RESET% Layer 4: Full-Stack E2E Tests          %GREEN%PASSED%RESET%
) else if "%LAYER4_RESULT%"=="FAILED" (
    echo   %RED%X%RESET% Layer 4: Full-Stack E2E Tests          %RED%FAILED%RESET%
) else (
    echo   %YELLOW%-%RESET% Layer 4: Full-Stack E2E Tests          %YELLOW%SKIPPED%RESET%
)

echo.
echo %CYAN%--------------------------------------------------------------------------%RESET%

if %TOTAL_FAILED% equ 0 (
    echo.
    echo   %GREEN%ALL TEST LAYERS PASSED!%RESET%
    echo.
) else (
    echo.
    echo   %RED%%TOTAL_FAILED% layer(s) failed. Review output above for details.%RESET%
    echo.
    echo   Useful commands:
    echo     npm run test                              - Re-run unit tests
    echo     npm run check:memory-leaks -- --verbose   - Detailed memory scan
    echo     cd apps/web ^&^& npx playwright show-report - View E2E HTML report
    echo     cd apps/web ^&^& npx playwright test --last-failed - Re-run failed E2E
    echo.
)

echo   Reports:
echo     Unit tests:     Terminal output above
echo     Memory leaks:   Terminal output above
echo     Mocked E2E:     apps\web\playwright-report\index.html
echo     Full-stack E2E: apps\web\playwright-report\index.html
echo.

if %TOTAL_FAILED% gtr 0 (
    exit /b 1
) else (
    exit /b 0
)
