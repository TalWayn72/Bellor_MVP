# Bellor MVP - Architecture Diagrams

Comprehensive architecture documentation for the Bellor dating/social application.
All diagrams use [Mermaid](https://mermaid.js.org/) syntax for rendering.

**Last Updated:** February 8, 2026

---

## Table of Contents

1. [System Overview (C4 Level 1)](#1-system-overview)
2. [Backend Architecture](#2-backend-architecture)
3. [Frontend Architecture](#3-frontend-architecture)
4. [Database Schema (ER Diagram)](#4-database-schema)
5. [Deployment Architecture](#5-deployment-architecture)
6. [CI/CD Pipeline](#6-cicd-pipeline)
7. [Real-time Communication Flow](#7-real-time-communication-flow)
8. [Authentication Flow](#8-authentication-flow)

---

## 1. System Overview

High-level view of the Bellor system showing the main components and their interactions.
Users interact with a React SPA, which communicates with the Fastify API over HTTPS and WebSocket.
The API layer manages persistence in PostgreSQL, caching/sessions in Redis, media storage in Cloudflare R2, and push notifications through Firebase Cloud Messaging.

```mermaid
graph TB
    subgraph Users["Users"]
        MobileUser["Mobile User<br/>(iOS / Android / PWA)"]
        WebUser["Web User<br/>(Browser)"]
    end

    subgraph Frontend["Frontend - React SPA"]
        ReactApp["React + Vite + TypeScript<br/>Tailwind CSS + Radix UI<br/>TanStack Query + Socket.io Client"]
    end

    subgraph Backend["Backend - Fastify API"]
        API["Node.js + Fastify<br/>TypeScript + Prisma ORM<br/>Socket.io Server"]
    end

    subgraph DataStores["Data Stores"]
        PG["PostgreSQL 16<br/>Primary Database"]
        Redis["Redis 7<br/>Cache / Sessions / Pub-Sub"]
    end

    subgraph ExternalServices["External Services"]
        R2["Cloudflare R2<br/>Media Storage (S3-compatible)"]
        FCM["Firebase Cloud Messaging<br/>Push Notifications"]
        Stripe["Stripe<br/>Payment Processing"]
        Email["Email Service<br/>Transactional Emails"]
    end

    MobileUser -->|HTTPS / WSS| ReactApp
    WebUser -->|HTTPS / WSS| ReactApp
    ReactApp -->|REST API /api/v1/*| API
    ReactApp -->|WebSocket /socket.io/| API
    API -->|Prisma ORM| PG
    API -->|ioredis| Redis
    API -->|S3 SDK| R2
    API -->|Firebase Admin SDK| FCM
    API -->|Stripe SDK| Stripe
    API -->|SMTP / API| Email

    style Users fill:#e1f5fe,stroke:#01579b
    style Frontend fill:#e8f5e9,stroke:#1b5e20
    style Backend fill:#fff3e0,stroke:#e65100
    style DataStores fill:#f3e5f5,stroke:#4a148c
    style ExternalServices fill:#fce4ec,stroke:#880e4f
```

---

## 2. Backend Architecture

The backend follows a layered architecture: Routes register endpoints, middleware handles cross-cutting concerns (authentication, validation, rate limiting, security), and services contain the business logic.
Services interact with Prisma for database access, Redis for caching, and external APIs for third-party integrations.

```mermaid
graph LR
    subgraph Middleware["Middleware Layer"]
        Auth["Auth Middleware<br/>(JWT Bearer)"]
        BruteForce["Brute Force<br/>Protection"]
        Security["Security Middleware<br/>(Sanitization, Headers)"]
        RateLimit["Rate Limiting<br/>(Redis-backed)"]
        CORS["CORS<br/>(@fastify/cors)"]
        Helmet["Helmet<br/>(HTTP Security Headers)"]
        Logging["Logging Middleware<br/>(Pino)"]
    end

    subgraph Routes["API Routes (/api/v1)"]
        AuthR["/auth<br/>register, login, refresh, logout"]
        UsersR["/users<br/>CRUD, profiles, preferences"]
        ChatsR["/chats<br/>messaging, temporary/permanent"]
        MissionsR["/missions<br/>daily challenges"]
        ResponsesR["/responses<br/>mission responses"]
        StoriesR["/stories<br/>24h ephemeral content"]
        LikesR["/likes<br/>romantic, positive, super"]
        FollowsR["/follows<br/>follow system"]
        NotifR["/notifications<br/>in-app notifications"]
        AchR["/achievements<br/>badges, XP rewards"]
        AdminR["/admin<br/>dashboard, moderation"]
        SubsR["/subscriptions<br/>premium, Stripe"]
        UploadsR["/uploads<br/>file storage"]
        WebhooksR["/webhooks<br/>Stripe callbacks"]
        DevTokensR["/device-tokens<br/>push notification registration"]
        OAuthR["/oauth<br/>Google OAuth"]
    end

    subgraph Services["Service Layer"]
        AuthS["AuthService"]
        UserS["UsersService"]
        ChatS["ChatService"]
        MissionS["MissionsService"]
        ResponseS["ResponsesService"]
        StoryS["StoriesService"]
        LikeS["LikesService"]
        FollowS["FollowsService"]
        NotifS["NotificationsService"]
        AchS["AchievementsService"]
        AnalyticsS["AnalyticsService"]
        SubsS["SubscriptionsService"]
        StorageS["StorageService"]
        PushS["PushNotificationsService"]
        ReportS["ReportsService"]
    end

    subgraph DataAccess["Data Access Layer"]
        Prisma["Prisma ORM<br/>PostgreSQL Client"]
        RedisClient["Redis Client<br/>(ioredis)"]
        S3Client["S3 Client<br/>(Cloudflare R2)"]
        FCMClient["Firebase Admin<br/>(FCM)"]
        StripeClient["Stripe SDK"]
    end

    Middleware --> Routes
    Routes --> Services
    Services --> DataAccess

    style Middleware fill:#fff9c4,stroke:#f57f17
    style Routes fill:#e8f5e9,stroke:#1b5e20
    style Services fill:#e3f2fd,stroke:#0d47a1
    style DataAccess fill:#f3e5f5,stroke:#4a148c
```

---

## 3. Frontend Architecture

The React frontend uses a provider-based architecture with context for auth and socket state,
TanStack Query for server-state management, and React Router for navigation.
Lazy-loaded pages are wrapped in a shared layout with a navigation system.

```mermaid
graph TB
    subgraph Providers["Provider Layer"]
        AuthProvider["AuthProvider<br/>(JWT tokens, user state)"]
        SocketProvider["SocketProvider<br/>(Socket.io connection)"]
        QueryProvider["QueryClientProvider<br/>(TanStack Query)"]
        NavProvider["NavigationProvider<br/>(route context)"]
    end

    subgraph Router["React Router"]
        BrowserRouter["BrowserRouter<br/>(v6)"]
        LayoutWrapper["LayoutWrapper<br/>(shared navigation)"]
    end

    subgraph Pages["Pages (Lazy-loaded)"]
        SharedSpace["SharedSpace<br/>(Feed)"]
        Profile["Profile"]
        Matches["Matches"]
        ChatPage["PrivateChat /<br/>LiveChat"]
        Settings["Settings"]
        Premium["Premium"]
        Admin["Admin Dashboard<br/>(7 sub-pages)"]
        Onboarding["Onboarding<br/>(14 steps)"]
        Tasks["Tasks<br/>(Audio, Video, Story, Quiz)"]
        Notifications["Notifications"]
    end

    subgraph Components["Shared Components"]
        UILib["Radix UI Components<br/>(50+ components)"]
        StateComponents["State Components<br/>(Loading, Empty, Error)"]
        SecureComponents["Secure Components<br/>(SecureTextInput, SecureImageUpload)"]
    end

    subgraph DataLayer["Data Layer"]
        APIClient["API Client<br/>(fetch wrapper, interceptors)"]
        QueryHooks["TanStack Query Hooks<br/>(useQuery, useMutation)"]
        SocketHooks["Socket Hooks<br/>(useChatRoom, usePresence)"]
        SecureHooks["Security Hooks<br/>(useSecureInput, useSecureUpload)"]
    end

    subgraph Backend["Backend API"]
        RestAPI["REST API<br/>https://api.bellor.app/api/v1"]
        WSServer["WebSocket Server<br/>wss://api.bellor.app/socket.io"]
    end

    Providers --> Router
    Router --> LayoutWrapper
    LayoutWrapper --> Pages
    Pages --> Components
    Pages --> DataLayer
    DataLayer --> Backend

    APIClient -->|"HTTP (JWT Bearer)"| RestAPI
    SocketHooks -->|"WebSocket (token auth)"| WSServer

    style Providers fill:#e1f5fe,stroke:#01579b
    style Router fill:#f1f8e9,stroke:#33691e
    style Pages fill:#fff3e0,stroke:#e65100
    style Components fill:#fce4ec,stroke:#880e4f
    style DataLayer fill:#e8eaf6,stroke:#283593
    style Backend fill:#efebe9,stroke:#3e2723
```

---

## 4. Database Schema

Entity-Relationship diagram showing the core database models and their relationships.
The schema is managed by Prisma and runs on PostgreSQL 16.

```mermaid
erDiagram
    User {
        string id PK
        string email UK
        string passwordHash
        string googleId UK
        string firstName
        string lastName
        string nickname
        string bio
        datetime birthDate
        enum gender
        string[] profileImages
        string drawingUrl
        json location
        string[] interests
        enum preferredLanguage
        boolean isVerified
        boolean isBlocked
        boolean isPremium
        boolean isAdmin
        datetime lastActiveAt
        int responseCount
        int chatCount
        datetime createdAt
    }

    Chat {
        string id PK
        string user1Id FK
        string user2Id FK
        enum status
        boolean isTemporary
        boolean isPermanent
        datetime expiresAt
        int messageCount
        datetime lastMessageAt
        datetime createdAt
    }

    Message {
        string id PK
        string chatId FK
        string senderId FK
        enum messageType
        string content
        string textContent
        boolean isRead
        boolean isDeleted
        datetime createdAt
    }

    Mission {
        string id PK
        string title
        string description
        enum missionType
        int difficulty
        int xpReward
        datetime activeFrom
        datetime activeUntil
    }

    Response {
        string id PK
        string userId FK
        string missionId FK
        enum responseType
        string content
        int viewCount
        int likeCount
        boolean isPublic
        datetime createdAt
    }

    Story {
        string id PK
        string userId FK
        enum mediaType
        string mediaUrl
        string caption
        int viewCount
        datetime expiresAt
        datetime createdAt
    }

    Achievement {
        string id PK
        string name
        string description
        json requirement
        int xpReward
    }

    UserAchievement {
        string id PK
        string userId FK
        string achievementId FK
        datetime unlockedAt
    }

    Like {
        string id PK
        string userId FK
        string targetUserId FK
        string targetResponseId FK
        enum likeType
        datetime createdAt
    }

    Follow {
        string id PK
        string followerId FK
        string followingId FK
        datetime createdAt
    }

    Report {
        string id PK
        string reporterId FK
        string reportedUserId FK
        enum reason
        string description
        enum status
        int priority
        datetime createdAt
    }

    Notification {
        string id PK
        string userId FK
        enum type
        string title
        string message
        boolean isRead
        datetime createdAt
    }

    SubscriptionPlan {
        string id PK
        string name
        float price
        string stripePriceId UK
        json features
        boolean isActive
    }

    Subscription {
        string id PK
        string userId FK
        string planId FK
        string stripeSubscriptionId UK
        enum status
        enum billingCycle
        datetime currentPeriodEnd
    }

    Payment {
        string id PK
        string subscriptionId FK
        string userId FK
        float amount
        string stripePaymentIntentId UK
        enum status
    }

    DeviceToken {
        string id PK
        string userId FK
        string token UK
        enum platform
        boolean isActive
    }

    User ||--o{ Chat : "user1 (chatsAsUser1)"
    User ||--o{ Chat : "user2 (chatsAsUser2)"
    User ||--o{ Message : "sends"
    User ||--o{ Response : "creates"
    User ||--o{ Story : "publishes"
    User ||--o{ UserAchievement : "earns"
    User ||--o{ Report : "reports (reporter)"
    User ||--o{ Report : "reported (reportedUser)"
    User ||--o{ Notification : "receives"
    User ||--o{ DeviceToken : "registers"

    Chat ||--o{ Message : "contains"
    Mission ||--o{ Response : "has"
    Achievement ||--o{ UserAchievement : "unlocked by"
    SubscriptionPlan ||--o{ Subscription : "defines"
    Subscription ||--o{ Payment : "billed"
```

---

## 5. Deployment Architecture

Production deployment uses Kubernetes with nginx Ingress for SSL termination and routing.
The API scales via HPA (3-20 pods), with PostgreSQL and Redis as managed or self-hosted data stores.
Monitoring is provided by Prometheus scraping the /metrics endpoint, with Grafana dashboards and Loki for log aggregation.

```mermaid
graph TB
    subgraph Internet["Internet"]
        Client["Users<br/>(Browser / Mobile App)"]
    end

    subgraph K8sCluster["Kubernetes Cluster (bellor namespace)"]
        subgraph Ingress["nginx Ingress Controller"]
            IngressLB["nginx LB<br/>SSL/TLS Termination<br/>Let's Encrypt<br/>Rate Limiting"]
        end

        subgraph FrontendPods["Frontend Pods"]
            Web1["bellor-web Pod 1<br/>(nginx + SPA)"]
            Web2["bellor-web Pod 2<br/>(nginx + SPA)"]
            WebHPA["HPA: 2-10 replicas<br/>CPU target: 70%"]
        end

        subgraph APIPods["API Pods"]
            API1["bellor-api Pod 1<br/>(Node.js + Fastify)"]
            API2["bellor-api Pod 2<br/>(Node.js + Fastify)"]
            API3["bellor-api Pod 3<br/>(Node.js + Fastify)"]
            APIHPA["HPA: 3-20 replicas<br/>CPU: 65% / Mem: 75%<br/>PDB: minAvailable=2"]
        end

        subgraph DataLayer["Data Layer"]
            PG["PostgreSQL 16<br/>bellor-postgres<br/>1G memory limit"]
            Redis["Redis 7<br/>bellor-redis<br/>256M memory limit<br/>AOF persistence"]
        end

        subgraph Monitoring["Monitoring Stack"]
            Prometheus["Prometheus<br/>Scrapes /metrics"]
            Grafana["Grafana<br/>Dashboards"]
            Loki["Loki<br/>Log Aggregation"]
        end
    end

    subgraph External["External Services"]
        R2["Cloudflare R2<br/>CDN + Storage"]
        FCM["Firebase FCM"]
        StripeSvc["Stripe"]
    end

    Client -->|HTTPS :443| IngressLB
    IngressLB -->|"bellor.app"| Web1
    IngressLB -->|"bellor.app"| Web2
    IngressLB -->|"api.bellor.app"| API1
    IngressLB -->|"api.bellor.app"| API2
    IngressLB -->|"api.bellor.app"| API3
    IngressLB -->|"/socket.io/ (sticky)"| API1

    API1 --> PG
    API2 --> PG
    API3 --> PG
    API1 --> Redis
    API2 --> Redis
    API3 --> Redis

    API1 --> R2
    API1 --> FCM
    API1 --> StripeSvc

    Prometheus -->|scrape /metrics| API1
    Prometheus -->|scrape /metrics| API2
    Prometheus -->|scrape /metrics| API3
    Grafana --> Prometheus
    Grafana --> Loki

    WebHPA -.->|autoscale| FrontendPods
    APIHPA -.->|autoscale| APIPods

    style Internet fill:#e1f5fe,stroke:#01579b
    style K8sCluster fill:#f5f5f5,stroke:#616161
    style Ingress fill:#fff9c4,stroke:#f57f17
    style FrontendPods fill:#e8f5e9,stroke:#1b5e20
    style APIPods fill:#fff3e0,stroke:#e65100
    style DataLayer fill:#f3e5f5,stroke:#4a148c
    style Monitoring fill:#e0f2f1,stroke:#004d40
    style External fill:#fce4ec,stroke:#880e4f
```

---

## 6. CI/CD Pipeline

The CI/CD pipeline runs on GitHub Actions with four workflows:
**CI** (lint, test, build, security scan), **Test** (unit, E2E, Playwright),
**Docker Build** (image build, vulnerability scan), and **CD** (deploy to K8s or staging via Docker Compose).

```mermaid
graph LR
    subgraph Trigger["Trigger"]
        Push["git push<br/>(main / develop)"]
        PR["Pull Request"]
        Tag["git tag v*.*.*"]
    end

    subgraph CI["CI Pipeline"]
        Lint["Lint + Type Check<br/>(ESLint, TypeScript)"]
        TestAPI["Test API<br/>(Vitest, 306+ tests)"]
        TestWeb["Test Web<br/>(Vitest)"]
        BuildAPI["Build API<br/>(tsc)"]
        BuildWeb["Build Web<br/>(Vite)"]
        SecurityScan["Security Scan<br/>(npm audit, Trivy)"]
        OWASP["OWASP ZAP<br/>Baseline Scan"]
        LoadTest["Load Test<br/>(k6 smoke test)"]
    end

    subgraph Docker["Docker Pipeline"]
        DockerBuild["Docker Build<br/>(Dockerfile.api + .web)"]
        TrivyScan["Trivy Image Scan<br/>(CRITICAL, HIGH)"]
        PushGHCR["Push to GHCR<br/>ghcr.io/TalWayn72/bellor_mvp"]
    end

    subgraph CD["CD Pipeline"]
        BuildPush["Build + Push<br/>Docker Images"]
        DeployK8s["Deploy to K8s<br/>(kubectl apply)"]
        DeployStaging["Deploy Staging<br/>(docker compose)"]
        Migrate["Run DB Migrations<br/>(prisma migrate deploy)"]
        Verify["Verify Deployment<br/>(rollout status)"]
    end

    Push --> Lint
    PR --> Lint
    Tag --> DockerBuild

    Lint --> TestAPI
    Lint --> TestWeb
    Lint --> SecurityScan
    TestAPI --> BuildAPI
    TestWeb --> BuildWeb
    BuildAPI --> OWASP
    BuildAPI --> LoadTest
    BuildAPI --> DockerBuild

    DockerBuild --> TrivyScan
    TrivyScan --> PushGHCR

    Push -->|main only| BuildPush
    BuildPush --> DeployK8s
    BuildPush --> DeployStaging
    DeployK8s --> Migrate
    Migrate --> Verify

    style Trigger fill:#e1f5fe,stroke:#01579b
    style CI fill:#e8f5e9,stroke:#1b5e20
    style Docker fill:#fff3e0,stroke:#e65100
    style CD fill:#f3e5f5,stroke:#4a148c
```

---

## 7. Real-time Communication Flow

WebSocket communication uses Socket.io with JWT authentication on the handshake.
Redis is used for presence tracking (online/offline) and cross-pod message delivery.
Clients receive real-time events for chat messages, typing indicators, read receipts, and presence updates.

```mermaid
sequenceDiagram
    participant C1 as Client A<br/>(Sender)
    participant SIO as Socket.io Server
    participant Redis as Redis<br/>(Presence Store)
    participant C2 as Client B<br/>(Receiver)
    participant FCM as Firebase FCM<br/>(Push Fallback)

    Note over C1, SIO: Connection & Authentication
    C1->>SIO: connect({ auth: { token: JWT } })
    SIO->>SIO: Verify JWT (verifyAccessToken)
    SIO->>Redis: SETEX socket:{userId} socketId (TTL 1h)
    SIO->>Redis: SETEX online:{userId} timestamp (TTL 1h)
    SIO->>C1: connected
    SIO-->>C2: user:online { userId, timestamp }

    Note over C1, C2: Chat Message Flow
    C1->>SIO: chat:join { chatId }
    SIO->>SIO: socket.join(chat:{chatId})
    SIO->>C1: chat:joined { chatId }

    C1->>SIO: chat:send { chatId, content, type }
    SIO->>SIO: Save message to PostgreSQL
    SIO->>Redis: GET socket:{recipientId}
    alt Recipient is online
        SIO->>C2: chat:message { id, chatId, content, sender, createdAt }
    else Recipient is offline
        SIO->>FCM: Send push notification
        FCM->>C2: Push: New message from User A
    end
    SIO->>C1: chat:sent { messageId, status }

    Note over C1, C2: Typing & Read Receipts
    C1->>SIO: chat:typing { chatId }
    SIO-->>C2: chat:typing { chatId, userId }
    C2->>SIO: chat:read { chatId, messageId }
    SIO-->>C1: chat:read { chatId, messageId, readAt }

    Note over C1, SIO: Disconnection
    C1->>SIO: disconnect
    SIO->>Redis: DEL socket:{userId}
    SIO->>Redis: DEL online:{userId}
    SIO-->>C2: user:offline { userId, timestamp }
```

---

## 8. Authentication Flow

Authentication uses JWT with short-lived access tokens (15 minutes) and long-lived refresh tokens (7 days, stored in Redis).
Brute force protection is applied to the login endpoint.
Password reset uses a one-time cryptographic token stored in Redis with a 1-hour expiry.

```mermaid
sequenceDiagram
    participant Client as Client<br/>(React SPA)
    participant API as Fastify API
    participant PG as PostgreSQL
    participant Redis as Redis

    Note over Client, Redis: Registration Flow
    Client->>API: POST /api/v1/auth/register<br/>{ email, password, firstName, ... }
    API->>API: Validate input + sanitize
    API->>PG: Check user exists (email)
    PG-->>API: null (not found)
    API->>API: bcrypt.hash(password, 12 rounds)
    API->>PG: INSERT User
    PG-->>API: User created
    API->>API: generateAccessToken(userId, email) [15min]
    API->>API: generateRefreshToken(userId) [7d]
    API->>Redis: SETEX refresh_token:{userId} token (7 days)
    API-->>Client: { user, accessToken, refreshToken }

    Note over Client, Redis: Login Flow
    Client->>API: POST /api/v1/auth/login<br/>{ email, password }
    API->>API: Brute force check (rate limit)
    API->>PG: Find user by email
    PG-->>API: User (with passwordHash)
    API->>API: bcrypt.compare(password, hash)
    API->>PG: UPDATE lastActiveAt
    API->>API: generateAccessToken [15min]
    API->>API: generateRefreshToken [7d]
    API->>Redis: SETEX refresh_token:{userId} (7 days)
    API-->>Client: { user, accessToken, refreshToken }

    Note over Client, Redis: Authenticated Request
    Client->>API: GET /api/v1/users/me<br/>Authorization: Bearer {accessToken}
    API->>API: authMiddleware: extract + verify JWT
    API->>PG: Query user data
    API-->>Client: { user profile data }

    Note over Client, Redis: Token Refresh Flow
    Client->>API: POST /api/v1/auth/refresh<br/>{ refreshToken }
    API->>API: verifyRefreshToken(token)
    API->>Redis: GET refresh_token:{userId}
    Redis-->>API: stored token
    API->>API: Compare tokens
    API->>PG: Verify user active + not blocked
    API->>API: generateAccessToken [15min]
    API-->>Client: { accessToken (new) }

    Note over Client, Redis: Logout Flow
    Client->>API: POST /api/v1/auth/logout<br/>Authorization: Bearer {accessToken}
    API->>Redis: DEL refresh_token:{userId}
    API-->>Client: { success: true }

    Note over Client, Redis: Password Reset Flow
    Client->>API: POST /api/v1/auth/forgot-password<br/>{ email }
    API->>PG: Find user by email
    API->>API: crypto.randomBytes(32)
    API->>Redis: SETEX password_reset:{token} userId (1 hour)
    API->>API: Send reset email with token link
    API-->>Client: { success: true } (always, prevents enumeration)

    Client->>API: POST /api/v1/auth/reset-password<br/>{ token, newPassword }
    API->>Redis: GET password_reset:{token}
    Redis-->>API: userId
    API->>API: bcrypt.hash(newPassword, 12)
    API->>PG: UPDATE passwordHash
    API->>Redis: DEL password_reset:{token}
    API->>Redis: DEL refresh_token:{userId}
    API-->>Client: { success: true }
```

---

## Appendix: Technology Stack Summary

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | React 18 + Vite + TypeScript | SPA framework |
| **UI Components** | Radix UI + Tailwind CSS | Design system (50+ components) |
| **State Management** | TanStack Query (React Query) | Server-state caching |
| **Routing** | React Router v6 | Client-side routing |
| **Real-time (Client)** | Socket.io Client | WebSocket communication |
| **Backend** | Node.js + Fastify + TypeScript | API server |
| **ORM** | Prisma | Database access layer |
| **WebSocket (Server)** | Socket.io | Real-time events |
| **Database** | PostgreSQL 16 | Primary data store |
| **Cache/Sessions** | Redis 7 | Caching, tokens, presence |
| **Media Storage** | Cloudflare R2 | S3-compatible object storage |
| **Push Notifications** | Firebase Cloud Messaging | Mobile/web push |
| **Payments** | Stripe | Subscriptions, payments |
| **Auth** | JWT (access 15min + refresh 7d) | Authentication |
| **Container** | Docker (multi-stage builds) | Packaging |
| **Orchestration** | Kubernetes | Production deployment |
| **Ingress** | nginx | SSL termination, load balancing |
| **CI/CD** | GitHub Actions | Automation pipeline |
| **Security Scanning** | Trivy, OWASP ZAP, npm audit | Vulnerability scanning |
| **Load Testing** | k6 | Performance benchmarks |
| **Monitoring** | Prometheus + Grafana + Loki | Metrics, dashboards, logs |
| **Mobile** | Capacitor | iOS + Android wrappers |
