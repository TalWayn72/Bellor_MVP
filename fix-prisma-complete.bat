@echo off
echo ========================================
echo Bellor - Complete Setup Fix
echo ========================================
echo.

REM ============================================
REM Step 1: Kill all Node processes
REM ============================================
echo [1/7] Killing all Node.js processes...
taskkill /F /IM node.exe >nul 2>&1
if %errorlevel%==0 (
    echo ✓ Node processes killed
) else (
    echo ! No Node processes found
)
timeout /t 2 /nobreak >nul
echo.

REM ============================================
REM Step 2: Start Docker containers
REM ============================================
echo [2/7] Starting Docker containers (PostgreSQL + Redis)...
echo This may take 30-60 seconds...
call npm run docker:up
if %errorlevel% neq 0 (
    echo ✗ ERROR: Failed to start Docker
    echo Please make sure Docker Desktop is running
    pause
    exit /b 1
)
echo ✓ Docker containers started
echo.

REM ============================================
REM Step 3: Wait for PostgreSQL to be ready
REM ============================================
echo [3/7] Waiting for PostgreSQL to be ready...
echo Checking connection every 3 seconds...
set /a attempts=0
:check_postgres
set /a attempts+=1
if %attempts% GTR 20 (
    echo ✗ ERROR: PostgreSQL didn't start after 60 seconds
    echo Please check: docker ps
    pause
    exit /b 1
)
timeout /t 3 /nobreak >nul
docker exec bellor_postgres pg_isready -U bellor >nul 2>&1
if %errorlevel% neq 0 (
    echo ... still waiting (attempt %attempts%/20)
    goto check_postgres
)
echo ✓ PostgreSQL is ready
echo.

REM ============================================
REM Step 4: Generate Prisma Client
REM ============================================
echo [4/7] Generating Prisma Client...
call npx prisma generate --schema=apps/api/prisma/schema.prisma
if %errorlevel% neq 0 (
    echo ✗ ERROR: Failed to generate Prisma client
    pause
    exit /b 1
)
echo ✓ Prisma client generated
echo.

REM ============================================
REM Step 5: Run database migration
REM ============================================
echo [5/7] Running database migration (add_feedback_model)...
call npx prisma migrate dev --name add_feedback_model --schema=apps/api/prisma/schema.prisma
if %errorlevel% neq 0 (
    echo ✗ ERROR: Migration failed
    pause
    exit /b 1
)
echo ✓ Migration completed
echo.

REM ============================================
REM Step 6: Verify database has data
REM ============================================
echo [6/7] Checking if database has seed data...
docker exec bellor_postgres psql -U bellor -d bellor -tAc "SELECT COUNT(*) FROM \"User\";" >temp_count.txt 2>nul
set /p user_count=<temp_count.txt
del temp_count.txt >nul 2>&1

if "%user_count%"=="" set user_count=0
if %user_count% EQU 0 (
    echo ! Database is empty. Running seed...
    cd apps\api
    call npx prisma db seed
    cd ..\..
    echo ✓ Seed data added
) else (
    echo ✓ Database has %user_count% users
)
echo.

REM ============================================
REM Step 7: Start API server
REM ============================================
echo [7/7] Starting API server...
echo.
echo ========================================
echo ✓ SETUP COMPLETE!
echo ========================================
echo.
echo API server will start now...
echo Press Ctrl+C to stop the server when needed
echo.
echo After API starts, open a NEW terminal and run:
echo   npm run dev
echo.
echo ========================================
echo.
timeout /t 3 /nobreak >nul

REM Start API server (this will keep running)
call npm run dev:api
