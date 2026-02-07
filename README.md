# Bellor MVP

A modern dating and social networking application - **standalone version, completely independent from Base44 platform**.

> **🔴 Before Starting:** Always ensure all services are running!
> ```bash
> npm run docker:up   # Start PostgreSQL + Redis
> npm run dev:all     # Start Backend + Frontend
> ```

## 🎯 Project Status

**Current Phase:** Phase 7 - Deployment ✅ (All Phases Complete)

| Component | Status | Technology |
|-----------|--------|------------|
| Project Structure | ✅ Complete | Monorepo (npm workspaces) |
| Frontend | ✅ Ready | React 18 + Vite + TypeScript |
| Backend API | ✅ Complete | Node.js + Fastify + TypeScript |
| Database Schema | ✅ Complete | PostgreSQL + Prisma |
| Development Environment | ✅ Complete | Docker Compose |
| **Internationalization (i18n)** | ✅ Complete | 5 Languages (EN, HE, ES, DE, FR) |
| **Demo Data** | ✅ Complete | 10 Demo Users + Missions |
| **Authentication** | ✅ Complete | JWT + Google OAuth |
| **User Management** | ✅ Complete | CRUD + Search |
| **Missions API** | ✅ Complete | Daily Challenges CRUD |
| **Responses API** | ✅ Complete | User Responses + Likes |
| **Stories API** | ✅ Complete | 24h Ephemeral Content |
| **Achievements API** | ✅ Complete | Auto-unlock + XP Rewards |
| **Premium Subscriptions** | ✅ Complete | Stripe Integration |
| **Push Notifications** | ✅ Complete | Firebase Cloud Messaging |
| **Real-time (WebSocket)** | ✅ Complete | Socket.io + JWT Auth |
| **File Storage** | ✅ Complete | Local Storage + R2/S3 |
| **Admin Dashboard API** | ✅ Complete | Analytics + Moderation |
| **Background Jobs** | ✅ Complete | Cleanup + Notifications |
| **CI/CD** | ✅ Complete | GitHub Actions + Load Testing |
| **Monitoring** | ✅ Complete | Prometheus + Grafana + Loki |
| **Production Scale** | ✅ Complete | 10K+ Users, nginx LB, HPA |
| **Deployment** | ✅ Complete | Docker + Kubernetes + Universal |
| **Lazy Loading** | ✅ Complete | React.lazy on 50+ pages |
| **Database Indexes** | ✅ Complete | 40+ optimized indexes |
| **Testing Infrastructure** | ✅ Complete | Vitest + Playwright (530 tests) |

### 🚀 Latest Updates (February 2026)

**Phase 6 - Testing Infrastructure COMPLETE:**
- ✅ **Unit Tests** - 306 API service tests (Vitest, 14 test files)
- ✅ **E2E Tests** - 224 Playwright tests (11 test files)
- ✅ **100% Backend Services Coverage** - All 14 services fully tested
- ✅ **Total Coverage** - 530 tests across 25 test files

**Phase 5 COMPLETE:**
- ✅ **Admin Dashboard API** - Full analytics, user management, moderation
- ✅ **Analytics Service** - DAU/MAU, retention, growth metrics
- ✅ **Background Jobs** - Story cleanup, chat expiry, premium expiration
- ✅ **Stories System** - 24h content with auto-cleanup
- ✅ **Achievements System** - Auto-unlock based on activity
- ✅ **Reports & Moderation** - Full workflow with auto-blocking

**Overall Progress:** 100% Complete - See [docs/PRD.md](docs/PRD.md)
**Testing Details:** See [apps/api/vitest.config.ts](apps/api/vitest.config.ts)

---

## ⚡ Quick Start

### Prerequisites
- Node.js 18+
- npm 9+
- Docker Desktop (for PostgreSQL and Redis)

### Installation

```bash
# Clone repository
git clone <repository-url>
cd Bellor_MVP

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Start databases (PostgreSQL + Redis)
docker compose up -d

# Generate Prisma client
npm run prisma:generate

# Run database migrations
npm run prisma:migrate

# Seed demo data (10 users + missions)
npm run prisma:seed

# Start development servers
npm run dev:all
```

The application will be available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:3000
- API Health: http://localhost:3000/health
- Prisma Studio: `npm run prisma:studio` (port 5555)

> **⚠️ IMPORTANT: Backend Must Be Running!**
>
> The Frontend requires the Backend API to be running on port 3000.
> If you see "Network Error" or "ERR_CONNECTION_REFUSED", run:
> ```bash
> npm run dev:api    # Start backend only
> # OR
> npm run dev:all    # Start both frontend and backend
> ```

**📖 For detailed setup instructions, see [QUICK_START.md](QUICK_START.md)**

---

## 🌐 One-Command Production Deployment

Deploy Bellor MVP on any cloud provider or OS with a single command:

### Linux/macOS
```bash
curl -fsSL https://raw.githubusercontent.com/your-org/Bellor_MVP/main/scripts/install-anywhere.sh | bash
```

### Windows (PowerShell as Administrator)
```powershell
irm https://raw.githubusercontent.com/your-org/Bellor_MVP/main/scripts/install-anywhere.ps1 | iex
```

**Features:**
- ✅ Automatic Docker installation
- ✅ Secure secret generation
- ✅ Database migrations
- ✅ Production-ready configuration
- ✅ 15-minute complete setup

See [docs/DEPLOYMENT_INFRASTRUCTURE_COMPLETE.md](docs/DEPLOYMENT_INFRASTRUCTURE_COMPLETE.md) for details.

---

## 📁 Project Structure

```
Bellor_MVP/
├── apps/
│   ├── web/                    # React Frontend Application
│   │   ├── src/
│   │   │   ├── api/            # API client layer ✅
│   │   │   │   ├── client/     # Axios client + token storage ✅
│   │   │   │   ├── services/   # Auth, User, Chat services ✅
│   │   │   │   └── hooks/      # React hooks (useAuth, useUser, useChat) ✅
│   │   │   ├── components/     # React components
│   │   │   │   ├── admin/      # Admin components
│   │   │   │   └── ui/         # Design system (50+ components)
│   │   │   ├── hooks/          # Custom React hooks
│   │   │   ├── pages/          # Page components (50+)
│   │   │   ├── styles/         # Global styles
│   │   │   └── utils/          # Utilities
│   │   └── package.json
│   │
│   └── api/                    # Node.js Backend API ✅
│       ├── src/
│       │   ├── config/         # Configuration
│       │   ├── controllers/    # Route controllers ✅
│       │   ├── middleware/     # Auth & validation ✅
│       │   ├── routes/         # API routes (v1) ✅
│       │   ├── services/       # Business logic ✅
│       │   │   ├── auth.service.ts      ✅ Complete
│       │   │   └── users.service.ts     ✅ Complete
│       │   ├── websocket/      # WebSocket handlers ✅
│       │   │   ├── index.ts             ✅ Server setup
│       │   │   └── handlers/
│       │   │       ├── presence.handler.ts  ✅ Online/offline
│       │   │       └── chat.handler.ts      ✅ Real-time chat
│       │   ├── lib/            # Shared instances ✅
│       │   │   ├── prisma.ts   ✅ Database client
│       │   │   └── redis.ts    ✅ Cache client
│       │   └── utils/          # Utilities ✅
│       │       └── jwt.util.ts  ✅ Token management
│       └── prisma/
│           └── schema.prisma   # Database schema ✅
│
├── infrastructure/
│   ├── docker/                 # Docker configurations ✅
│   │   ├── Dockerfile.api      ✅ Multi-stage build
│   │   └── Dockerfile.web      ✅ nginx production
│   ├── kubernetes/             # K8s manifests ✅
│   │   ├── namespace.yaml      ✅
│   │   ├── api-deployment.yaml ✅ HPA + Health checks
│   │   ├── web-deployment.yaml ✅
│   │   └── ingress.yaml        ✅ SSL + Routing
│   └── monitoring/             # Observability stack ✅
│       ├── prometheus/         ✅ Metrics collection
│       ├── grafana/            ✅ Dashboards
│       ├── loki/               ✅ Log aggregation
│       └── alertmanager/       ✅ Alert routing
│
├── .github/
│   └── workflows/              # CI/CD Pipelines ✅
│       ├── ci.yml              ✅ Lint, test, build
│       ├── cd.yml              ✅ Deploy to production
│       └── docker-build.yml    ✅ Container builds
│
├── scripts/                    # Deployment scripts ✅
│   ├── install-anywhere.sh     ✅ Universal Linux/macOS installer
│   ├── install-anywhere.ps1    ✅ Universal Windows installer
│   └── deploy.sh               ✅ Docker/K8s deployment
│
├── docs/
│   ├── MIGRATION_PLAN.md           # Complete migration strategy
│   ├── PHASE_3_COMPLETION_STATUS.md # Backend status
│   ├── CLOUD_AGNOSTIC_DEPLOYMENT.md # Deployment guide
│   ├── FREE_HOSTING_OPTIONS.md     # Free hosting (Hebrew)
│   ├── QUICK_DEPLOY_GUIDE.md       # Quick start (Hebrew)
│   └── DEPLOYMENT_INFRASTRUCTURE_COMPLETE.md # Full status
│
├── docker-compose.yml              # Development services
├── docker-compose.prod.yml         # Production setup ✅
├── docker-compose.all-in-one.yml   # Self-contained (275MB min) ✅
├── docker-compose.monitoring.yml   # Monitoring stack ✅
└── README.md                       # This file
```

---

## 🛠 Tech Stack

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| React | 18.2 | UI Framework |
| Vite | 6.1 | Build Tool |
| TypeScript | 5.8 | Type Safety |
| Tailwind CSS | 3.4 | Styling |
| Radix UI | Latest | Component Library |
| TanStack Query | 5.84 | Data Fetching |
| React Router | 6.26 | Routing |
| Framer Motion | 11.16 | Animations |

### Backend
| Technology | Version | Purpose |
|------------|---------|---------|
| Node.js | 20+ | Runtime |
| Fastify | 5.2 | Web Framework |
| TypeScript | 5.8 | Type Safety |
| Prisma | 6.19 | ORM |
| PostgreSQL | 16 | Database |
| Redis | 7 | Cache & Sessions |
| Socket.io | 4.8 | Real-time WebSocket |
| JWT | 9.0 | Authentication |
| Bcrypt | 5.1 | Password Hashing |
| Zod | 3.23 | Validation |
| Stripe | 20.3 | Payment Processing |
| Firebase Admin | 13.6 | Push Notifications |
| Vitest | 2.1 | Testing Framework |

### DevOps & Monitoring
| Technology | Version | Purpose |
|------------|---------|---------|
| Docker | 24+ | Containerization |
| Kubernetes | 1.28+ | Orchestration |
| GitHub Actions | Latest | CI/CD |
| Prometheus | Latest | Metrics Collection |
| Grafana | Latest | Dashboards & Visualization |
| Loki | Latest | Log Aggregation |
| Alertmanager | Latest | Alert Management |

---

## 📝 Available Commands

### Root Level
```bash
npm run dev              # Start frontend only
npm run dev:api          # Start backend only
npm run dev:all          # Start both frontend and backend
npm run build            # Build all workspaces
npm run build:api        # Build API only
npm run build:web        # Build Web only
npm run lint             # Lint all workspaces
npm run lint:fix         # Fix linting issues
npm run type-check       # TypeScript compilation check
npm run test             # Run all tests
npm run test:api         # Run API tests
npm run test:web         # Run Web tests
npm run docker:up        # Start Docker services
npm run docker:down      # Stop Docker services
npm run clean            # Clean all node_modules
```

### Database
```bash
npm run prisma:generate        # Generate Prisma client
npm run prisma:migrate         # Run migrations (development)
npm run prisma:migrate:deploy  # Run migrations (production)
npm run prisma:studio          # Open Prisma Studio (port 5555)
npm run prisma:seed            # Seed demo data
```

### Deployment
```bash
# Docker Compose
./scripts/deploy.sh docker prod

# Kubernetes
./scripts/deploy.sh k8s prod

# Monitoring
docker compose -f docker-compose.yml -f docker-compose.monitoring.yml up -d
```

---

## ✨ Features

### Backend API (✅ Complete)
✅ **Authentication**
  - User registration with validation
  - Login with JWT tokens (access + refresh)
  - Token refresh mechanism
  - Password change
  - OAuth ready (Google, Apple)

✅ **User Management**
  - Get user profile
  - Update profile (name, bio, photos)
  - List users with pagination & filters
  - Search users
  - Language preference
  - Soft delete (deactivate/reactivate)
  - User statistics

✅ **Real-time Communication**
  - WebSocket server with JWT auth
  - Online/offline presence tracking
  - Typing indicators
  - Real-time chat messaging
  - Message read receipts
  - Unread message counts
  - User rooms & broadcasts

✅ **Security**
  - bcrypt password hashing (12 rounds)
  - JWT with short-lived access tokens (15min)
  - Refresh tokens with Redis storage (7 days)
  - Input validation with Zod
  - CORS configuration
  - Rate limiting
  - Security headers (helmet)

### User Features (Frontend)
✅ Profile management with multiple photos
✅ Discovery with advanced filtering
✅ Compatibility matching quiz
✅ Temporary and permanent chats
✅ Voice, video, and text responses
✅ Stories (24-hour content)
✅ Achievements system
✅ Premium subscriptions
✅ Referral program

### Admin Features
✅ Dashboard with metrics
✅ User management (block/unblock)
✅ Report handling
✅ Chat monitoring
✅ Activity analytics
✅ System settings

### DevOps Features (✅ Complete)
✅ **CI/CD Pipelines**
  - Automated linting and testing
  - Multi-stage Docker builds
  - Security vulnerability scanning
  - Automated deployment to K8s
  - Release management

✅ **Monitoring & Observability**
  - Prometheus metrics collection
  - Grafana dashboards
  - Loki log aggregation
  - Alertmanager notifications
  - Container metrics (cAdvisor)
  - System metrics (node-exporter)

✅ **Deployment**
  - One-command universal installers
  - Docker Compose for simple deployment
  - Kubernetes manifests for scale
  - Cloud-agnostic architecture
  - Free hosting options (5 providers)
  - Auto-scaling (3-10 pods)
  - Zero-downtime rolling updates
  - Health checks & readiness probes

---

## 🗺 Migration Roadmap

| Phase | Description | Status | Completion |
|-------|-------------|--------|------------|
| **Phase 1** | Foundation - Monorepo, DB, API scaffold | ✅ Complete | 100% |
| **Phase 2** | Core Backend - Auth, Users, Files, Premium, Push | ✅ Complete | 100% |
| **Phase 3** | Real-time - WebSocket, Chat, Presence | ✅ Complete | 100% |
| **Phase 4** | Frontend Migration - API client, Pages | ✅ Complete | 100% |
| **Phase 5** | Admin & Tools - Dashboard, Scripts | ✅ Complete | 100% |
| **Phase 6** | Testing - Unit, Integration, E2E | ✅ Complete | 100% |
| **Phase 7** | Deployment - CI/CD, Production | ✅ Complete | 100% |
| **Phase 8** | Universal Deployment & Free Hosting | ✅ Complete | 100% |

**Overall Progress:** 100% Complete

Full details: [docs/MIGRATION_PLAN.md](docs/MIGRATION_PLAN.md)

---

## 🌍 Environment Variables

See [.env.example](.env.example) for all available environment variables.

### Required Variables
```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/bellor

# Redis
REDIS_URL=redis://localhost:6379

# JWT Secrets (32+ characters)
JWT_SECRET=your-super-secret-jwt-key-min-32-characters
JWT_REFRESH_SECRET=your-super-secret-refresh-key-min-32-characters
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Application
NODE_ENV=development
PORT=3000
HOST=0.0.0.0
FRONTEND_URL=http://localhost:5173

# URLs for Frontend
VITE_API_URL=http://localhost:3000
VITE_WS_URL=ws://localhost:3000
VITE_CDN_URL=http://localhost:3000
```

---

## 📚 Documentation

### Core Documents (Root)
| Document | Description |
|----------|-------------|
| [README.md](README.md) | Project overview and quick start |
| [CLAUDE.md](CLAUDE.md) | Claude AI configuration and guidelines |
| [QUICK_START.md](QUICK_START.md) | Detailed setup instructions |
| [GUIDELINES.md](GUIDELINES.md) | Development guidelines |
| [WORK_INSTRUCTIONS.md](WORK_INSTRUCTIONS.md) | Task tracking |

### Product & Planning (docs/)
| Document | Description |
|----------|-------------|
| [PRD.md](docs/PRD.md) | Product Requirements Document (Hebrew) |
| [MIGRATION_PLAN.md](docs/MIGRATION_PLAN.md) | Base44 to standalone migration strategy |
| [REMAINING_FEATURES_PLAN.md](docs/REMAINING_FEATURES_PLAN.md) | Remaining features roadmap |
| [POST_INTEGRATION_PLAN.md](docs/POST_INTEGRATION_PLAN.md) | Post-integration plan |

### Mobile App (docs/)
| Document | Description |
|----------|-------------|
| [**GOOGLE_PLAY_DEPLOYMENT.md**](docs/GOOGLE_PLAY_DEPLOYMENT.md) | **Google Play & iOS deployment guide (Hebrew)** |
| [**MOBILE_APP_REQUIREMENTS.md**](docs/MOBILE_APP_REQUIREMENTS.md) | **Mobile app requirements (Hebrew)** |

### Deployment & Infrastructure (docs/)
| Document | Description |
|----------|-------------|
| [DEPLOYMENT_INFRASTRUCTURE_COMPLETE.md](docs/DEPLOYMENT_INFRASTRUCTURE_COMPLETE.md) | Universal deployment status |
| [CLOUD_AGNOSTIC_DEPLOYMENT.md](docs/CLOUD_AGNOSTIC_DEPLOYMENT.md) | Multi-cloud deployment strategy |
| [FREE_HOSTING_OPTIONS.md](docs/FREE_HOSTING_OPTIONS.md) | 5 free hosting services (Hebrew) |
| [QUICK_DEPLOY_GUIDE.md](docs/QUICK_DEPLOY_GUIDE.md) | Quick Docker/K8s setup (Hebrew) |
| [ORACLE_CLOUD_QA_DEPLOYMENT.md](docs/ORACLE_CLOUD_QA_DEPLOYMENT.md) | Oracle Cloud QA deployment (Hebrew) |
| [DOCKER_SETUP_WINDOWS.md](docs/DOCKER_SETUP_WINDOWS.md) | Docker setup for Windows |

### Security (docs/)
| Document | Description |
|----------|-------------|
| [SECURITY_PLAN.md](docs/SECURITY_PLAN.md) | Security hardening strategy |
| [SECURITY_CHECKLIST.md](docs/SECURITY_CHECKLIST.md) | Pre-release security audit checklist |
| [INCIDENT_RESPONSE.md](docs/INCIDENT_RESPONSE.md) | Incident response procedures (P1-P4) |

### Development Status (docs/)
| Document | Description |
|----------|-------------|
| [PHASE_1_COMPLETION.md](docs/PHASE_1_COMPLETION.md) | Phase 1 completion report |
| [PHASE_1_FOUNDATION_COMPLETE.md](docs/PHASE_1_FOUNDATION_COMPLETE.md) | Foundation phase details |
| [PHASE_2_COMPLETION.md](docs/PHASE_2_COMPLETION.md) | Phase 2 completion report |
| [PHASE_3_STATUS.md](docs/PHASE_3_STATUS.md) | Phase 3 WebSocket status |
| [PHASE_3_COMPLETION_STATUS.md](docs/PHASE_3_COMPLETION_STATUS.md) | Phase 3 completion details |
| [PHASE_5_COMPLETION_STATUS.md](docs/PHASE_5_COMPLETION_STATUS.md) | Phase 5 Admin & Tools status |
| [OPEN_ISSUES.md](docs/OPEN_ISSUES.md) | Bug tracking and testing status |

### Base44 Migration (docs/)
| Document | Description |
|----------|-------------|
| [BASE44_REMOVAL_CHECKLIST.md](docs/BASE44_REMOVAL_CHECKLIST.md) | Base44 removal checklist |
| [BASE44_REMOVAL_TEST_RESULTS.md](docs/BASE44_REMOVAL_TEST_RESULTS.md) | Base44 removal test results |
| [NEW_API_CLIENT.md](docs/NEW_API_CLIENT.md) | New API client documentation |
| [SCHEMA_FIXES_REMAINING.md](docs/SCHEMA_FIXES_REMAINING.md) | TypeScript fixes completed |

### Session Logs (docs/)
| Document | Description |
|----------|-------------|
| [SESSION_SUMMARY.md](docs/SESSION_SUMMARY.md) | Session summary |
| [CURRENT_SESSION_PROGRESS.md](docs/CURRENT_SESSION_PROGRESS.md) | Current session progress |
| [PARALLEL_EXECUTION_LOG.md](docs/PARALLEL_EXECUTION_LOG.md) | Parallel execution log |

### Design (Root)
| Document | Description |
|----------|-------------|
| [DESIGN_ALIGNMENT_PLAN.md](DESIGN_ALIGNMENT_PLAN.md) | Design alignment plan |
| [FIGMA_IMPLEMENTATION_PLAN.md](FIGMA_IMPLEMENTATION_PLAN.md) | Figma implementation plan |

---

## 📊 Database Schema

The application uses PostgreSQL with Prisma ORM. Main entities:

- **Users** - User profiles, preferences, authentication
- **Chats** - One-on-one conversations (user1/user2)
- **Messages** - Text, voice, video, image messages with read status
- **Responses** - Task responses (audio/video/text)
- **Stories** - 24-hour ephemeral content
- **Missions** - Daily/weekly challenges
- **Achievements** - User accomplishments
- **Reports** - User reports and moderation
- **AppSettings** - System configuration
- **Referrals** - Pre-registration system

Full schema: [apps/api/prisma/schema.prisma](apps/api/prisma/schema.prisma)

---

## 🔧 Development

### Code Style
- Use TypeScript for all new code
- Follow Prettier formatting
- Use ESLint rules
- Component naming: PascalCase
- File naming: kebab-case
- All TypeScript errors must be fixed before commit

### Git Workflow
- Main branch: `main`
- Development branch: `develop`
- Feature branches: `feature/feature-name`
- Bugfix branches: `bugfix/bug-name`

### Commit Messages
```
feat: Add user authentication
fix: Resolve chat message ordering
docs: Update API documentation
style: Format code with Prettier
refactor: Simplify user service
test: Add user controller tests
chore: Update dependencies
```

---

## 🧪 Testing

```bash
# Run all tests
npm run test

# Run with coverage
npm run test:coverage

# Run specific workspace tests
npm run test --workspace=@bellor/api
npm run test --workspace=@bellor/web

# Run TypeScript compilation check
npm run type-check
```

---

## 🚀 Deployment

### Docker Compose (Recommended for Small Scale)
```bash
# Development
docker compose up -d

# Production
docker compose -f docker-compose.prod.yml up -d

# With monitoring
docker compose -f docker-compose.yml -f docker-compose.monitoring.yml up -d

# All-in-one (database included, 275MB minimum)
docker compose -f docker-compose.all-in-one.yml up -d
```

### 🔥 Production High-Scale (10,000+ Concurrent Users)
```bash
# Start with 3 API replicas, PgBouncer connection pooling, and nginx load balancer
docker compose -f docker-compose.production.yml up -d

# Scale to 5 API replicas for higher traffic
docker compose -f docker-compose.production.yml up -d --scale api=5

# Monitor resource usage
docker stats
```

**Production Features:**
- nginx load balancer with sticky sessions for WebSocket
- PgBouncer connection pooling (1000 client connections → 50 DB connections)
- Rate limiting (30 req/s API, 5 req/s auth, 10 req/s uploads)
- Horizontal scaling (3-20 API replicas)
- Health checks and auto-restart
- Resource limits and reservations
- PostgreSQL tuned for high concurrency

### Kubernetes (Recommended for Large Scale)
```bash
# Deploy to cluster
./scripts/deploy.sh k8s prod

# Or manually
kubectl apply -f infrastructure/kubernetes/namespace.yaml
kubectl apply -f infrastructure/kubernetes/

# Apply advanced auto-scaling (HPA, VPA, PDB)
kubectl apply -f infrastructure/kubernetes/hpa-advanced.yaml
```

**Kubernetes Features:**
- Horizontal Pod Autoscaler (3-20 pods based on CPU/Memory)
- Vertical Pod Autoscaler (automatic resource optimization)
- Pod Disruption Budgets (minimum 2 API pods always available)
- Priority Classes (API pods have higher scheduling priority)
- Resource Quotas (namespace-level limits)

### Universal Installer (Any OS)
See [One-Command Production Deployment](#-one-command-production-deployment) above.

### Monitoring
Access dashboards after deployment:
- **Grafana:** http://localhost:3001 (admin/admin)
- **Prometheus:** http://localhost:9090
- **Alertmanager:** http://localhost:9093

---

## 📈 Monitoring & Observability

The project includes a complete monitoring stack:

### Metrics (Prometheus)
- API request rates
- Response times (p50, p95, p99)
- Error rates
- WebSocket connections
- Database query performance
- Redis operations
- System resources (CPU, Memory, Disk)

### Logs (Loki + Promtail)
- Application logs
- Container logs
- System logs
- Structured logging with correlation IDs

### Dashboards (Grafana)
- API Overview
- System Health
- Database Performance
- WebSocket Activity
- Error Tracking

### Alerts (Alertmanager)
- API downtime
- High error rates
- Resource exhaustion
- Slow queries
- SSL certificate expiry

---

## 🆓 Free Hosting Options

Deploy Bellor MVP for free (development/research):

1. **Render.com** - $0/month, 90-day PostgreSQL, 512MB RAM
2. **Railway.app** - $5 credit/month, usage-based
3. **Fly.io** - 3 free VMs (256MB each)
4. **Oracle Cloud** - 24GB RAM free forever (best value!)
5. **Supabase** - Free PostgreSQL (500MB)

See [docs/FREE_HOSTING_OPTIONS.md](docs/FREE_HOSTING_OPTIONS.md) for detailed setup instructions (Hebrew).

---

## 🤝 Support

- **Issues:** GitHub Issues
- **Email:** support@bellor.app
- **Documentation:** [docs/](docs/)

---

## 📄 License

Private - All rights reserved.

---

## 🎉 Credits

Built with modern best practices:
- **Clean Architecture** - Separation of concerns
- **Type Safety** - Full TypeScript coverage
- **Security First** - JWT, bcrypt, input validation
- **Scalable** - Horizontal scaling with K8s
- **Observable** - Complete monitoring stack
- **Portable** - Cloud-agnostic, container-based

---

**Version:** 1.0.0-beta
**Last Updated:** February 2026
**Status:** Phase 7 - All Phases Complete ✅
**TypeScript Errors:** 0 🎯
**Build Status:** [![CI](https://github.com/your-org/Bellor_MVP/workflows/CI/badge.svg)](https://github.com/your-org/Bellor_MVP/actions)

---

**Completed:**
1. ✅ Unit tests (140 tests)
2. ✅ E2E tests with Playwright (224 tests)
3. ✅ Frontend tests (6 tests)
4. ✅ CI/CD Pipeline configured

**Next Steps:**
1. Security audit (OWASP Top 10)
2. Beta testing with 100 users
3. Production deployment

See [docs/MIGRATION_PLAN.md](docs/MIGRATION_PLAN.md) for detailed next steps.
