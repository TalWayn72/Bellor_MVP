# Bellor MVP - Quick Start Guide

**Date:** February 3, 2026
**Status:** Development Ready

---

## 🚀 Quick Start (5 Minutes)

### Prerequisites
- Node.js 18+ installed
- Docker Desktop installed and running
- Git installed

### Step 1: Clone & Install
```bash
# Navigate to project directory
cd Bellor_MVP

# Install all dependencies
npm install
```

### Step 2: Start Database Services
```bash
# Start PostgreSQL and Redis
docker compose up -d

# Verify services are running
docker ps

# You should see:
# - bellor_postgres (port 5432)
# - bellor_redis (port 6379)
```

### Step 3: Setup Database
```bash
# Generate Prisma client
npm run prisma:generate

# Run database migrations
npm run prisma:migrate

# Seed demo data (10 users + missions + achievements)
npm run prisma:seed
```

### Step 4: Start Development Servers
```bash
# Option 1: Start both frontend and backend
npm run dev:all

# Option 2: Start separately
npm run dev      # Frontend only (port 5173)
npm run dev:api  # Backend only (port 3000)
```

### Step 5: Open Application
- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:3000
- **API Health:** http://localhost:3000/health
- **Prisma Studio:** `npm run prisma:studio` (port 5555)

---

## 👤 Demo User Accounts

All demo users have password: **Demo123!**

### English Users
- **demo_sarah@bellor.app** - Sarah Johnson (Female)
- **demo_michael@bellor.app** - Michael Chen (Male)

### Hebrew Users
- **demo_yael@bellor.app** - Yael Cohen (Female)
- **demo_david@bellor.app** - David Levi (Male)

### Spanish Users
- **demo_maria@bellor.app** - Maria Garcia (Female)
- **demo_carlos@bellor.app** - Carlos Rodriguez (Male)

### German Users
- **demo_anna@bellor.app** - Anna Schmidt (Female)
- **demo_thomas@bellor.app** - Thomas Müller (Male)

### French Users
- **demo_sophie@bellor.app** - Sophie Dubois (Female)
- **demo_pierre@bellor.app** - Pierre Martin (Male)

---

## 🌐 Supported Languages

The application supports 5 languages:
- 🇬🇧 **English** (Default)
- 🇮🇱 **Hebrew** (עברית)
- 🇪🇸 **Spanish** (Español)
- 🇩🇪 **German** (Deutsch)
- 🇫🇷 **French** (Français)

Each demo user has a default language preference that matches their profile.

---

## 📂 Project Structure

```
Bellor_MVP/
├── apps/
│   ├── web/              # React Frontend (localhost:5173)
│   └── api/              # Node.js Backend (localhost:3000)
├── packages/
│   ├── shared/
│   │   └── locales/      # Translation files (en, he, es, de, fr)
│   └── ui/               # Design system
├── docs/                 # Documentation
└── infrastructure/
    └── docker/           # Docker configs
```

---

## 🛠️ Common Commands

### Development
```bash
npm run dev              # Start frontend
npm run dev:api          # Start backend
npm run dev:all          # Start both
```

### Database
```bash
npm run prisma:generate  # Generate Prisma client
npm run prisma:migrate   # Run migrations
npm run prisma:seed      # Seed demo data
npm run prisma:studio    # Open Prisma Studio
```

### Docker
```bash
docker compose up -d     # Start services
docker compose down      # Stop services
docker ps               # Check running containers
docker logs bellor_postgres  # View PostgreSQL logs
```

### Build & Test
```bash
npm run build           # Build all packages
npm run lint            # Lint code
npm run test            # Run tests
```

---

## ✅ Service Health Check

**Before starting work, verify all services are running:**

```bash
# Quick verification command
docker ps && curl -s http://localhost:3000/health

# Expected output:
# CONTAINER ID   IMAGE                PORTS                    NAMES
# ...            postgres:16-alpine   0.0.0.0:5432->5432/tcp   bellor_postgres
# ...            redis:7-alpine       0.0.0.0:6379->6379/tcp   bellor_redis
# {"status":"ok","timestamp":"...","uptime":...}
```

**Service Status Checklist:**
| Service | Port | Status Command | Expected |
|---------|------|----------------|----------|
| PostgreSQL | 5432 | `docker ps \| grep postgres` | Container running |
| Redis | 6379 | `docker ps \| grep redis` | Container running |
| Backend API | 3000 | `curl localhost:3000/health` | `{"status":"ok"...}` |
| Frontend | 5173 | Open browser | App loads |

**If API is not running (ERR_CONNECTION_REFUSED on port 3000):**
```bash
npm run dev:api
```

---

## 🔧 Troubleshooting

### Issue: Docker services won't start
```bash
# Check if Docker Desktop is running
docker --version

# Check ports are not in use
netstat -an | grep 5432  # PostgreSQL
netstat -an | grep 6379  # Redis
```

### Issue: Prisma Client errors
```bash
# Regenerate Prisma client
npm run prisma:generate

# Reset database (WARNING: Deletes all data)
cd apps/api
npx prisma migrate reset
```

### Issue: Port 5173 already in use
```bash
# Kill process on port 5173
npx kill-port 5173

# Or use a different port
cd apps/web
VITE_PORT=5174 npm run dev
```

---

## 📖 Documentation

- [README.md](README.md) - Project overview
- [MIGRATION_PLAN.md](docs/MIGRATION_PLAN.md) - Migration strategy
- [PHASE_1_FOUNDATION_COMPLETE.md](docs/PHASE_1_FOUNDATION_COMPLETE.md) - Phase 1 summary
- [CURRENT_SESSION_PROGRESS.md](docs/CURRENT_SESSION_PROGRESS.md) - Latest progress

---

## 🎯 What's Next?

After completing the Quick Start, you can:

1. **Explore Demo Data**
   - Login with any demo user
   - Browse missions and achievements
   - Test multi-language support

2. **Start Development**
   - Implement Authentication API
   - Build User Management endpoints
   - Add WebSocket for real-time chat

3. **Customize**
   - Add your own translations
   - Create custom missions
   - Design new features

---

## 📞 Support

- **Issues:** GitHub Issues
- **Documentation:** [docs/](docs/)
- **API Documentation:** Coming soon

---

**Version:** 1.0.0
**Last Updated:** February 3, 2026
**Status:** ✅ Ready for Development
