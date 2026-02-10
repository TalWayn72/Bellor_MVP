אות # Bellor MVP - Base44 Migration Plan

## Executive Summary

This document outlines the complete migration strategy from Base44 platform to a standalone, production-ready architecture for **Bellor** - a dating and social application expected to serve tens of thousands of users.

**Project Name:** Bellor MVP
**Migration Start Date:** February 2026
**Target Architecture:** Cloud-native, scalable microservices

---

## Table of Contents

1. [Current State Analysis](#1-current-state-analysis)
2. [Target Architecture](#2-target-architecture)
3. [Project Structure Reorganization](#3-project-structure-reorganization)
4. [Backend Migration](#4-backend-migration)
5. [Database Design](#5-database-design)
6. [Authentication & Authorization](#6-authentication--authorization)
7. [File Storage & Media](#7-file-storage--media)
8. [Real-time Communication](#8-real-time-communication)
9. [API Layer](#9-api-layer)
10. [Frontend Migration](#10-frontend-migration)
11. [Testing Strategy](#11-testing-strategy)
12. [Deployment & Infrastructure](#12-deployment--infrastructure)
13. [Monitoring & Observability](#13-monitoring--observability)
14. [Security Implementation](#14-security-implementation)
15. [Data Migration](#15-data-migration)
16. [Documentation Requirements](#16-documentation-requirements)
17. [Timeline & Milestones](#17-timeline--milestones)
18. [Risk Assessment](#18-risk-assessment)

---

## 1. Current State Analysis

### 1.1 Base44 Dependencies

| Component | Current Implementation | Files Affected |
|-----------|----------------------|----------------|
| SDK | `@base44/sdk` | All pages using `base44.entities.*` |
| Vite Plugin | `@base44/vite-plugin` | `vite.config.js` |
| Authentication | `base44.auth` | Auth components |
| Data Storage | `base44.entities.*` | 50+ page components |
| File Upload | `base44.storage` | Profile, Stories, Tasks |
| Email | `base44.integrations.Core.SendEmail` | Admin pages |

### 1.2 Entity Mapping (Base44 → Custom)

| Base44 Entity | Purpose | Estimated Records |
|---------------|---------|-------------------|
| `User` | User profiles | 10,000+ |
| `Chat` | Conversations | 50,000+ |
| `Message` | Chat messages | 500,000+ |
| `Response` | Task responses (audio/video/text) | 100,000+ |
| `Report` | User reports | 1,000+ |
| `Mission` | Daily missions | 10,000+ |
| `Story` | User stories | 20,000+ |
| `AppSetting` | System configuration | 50+ |
| `Referral` | Pre-registrations | 5,000+ |
| `Achievement` | User achievements | 50,000+ |

### 1.3 Files Requiring Changes

```
Total files with Base44 imports: ~60 files
- src/api/base44Client.js (main client)
- src/pages/*.jsx (all page components)
- src/hooks/useCurrentUser.js
- src/components/admin/*.jsx
- vite.config.js
```

---

## 2. Target Architecture

### 2.1 Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         CDN (CloudFlare)                         │
│                    Static Assets + Edge Caching                  │
└─────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Load Balancer (nginx/ALB)                    │
│                      SSL Termination + Routing                   │
└─────────────────────────────────────────────────────────────────┘
                    │                           │
                    ▼                           ▼
┌───────────────────────────┐   ┌───────────────────────────────┐
│     Frontend (React)       │   │       API Gateway             │
│     - Vite Build          │   │   - Rate Limiting             │
│     - Static Hosting      │   │   - Request Validation        │
│     - Service Worker      │   │   - API Versioning            │
└───────────────────────────┘   └───────────────────────────────┘
                                              │
                    ┌─────────────────────────┼─────────────────────────┐
                    │                         │                         │
                    ▼                         ▼                         ▼
        ┌───────────────────┐   ┌───────────────────┐   ┌───────────────────┐
        │   Auth Service    │   │    API Service    │   │  WebSocket Server │
        │   - JWT/Sessions  │   │   - REST API      │   │  - Real-time Chat │
        │   - OAuth 2.0     │   │   - GraphQL (opt) │   │  - Notifications  │
        │   - 2FA           │   │   - File Upload   │   │  - Presence       │
        └───────────────────┘   └───────────────────┘   └───────────────────┘
                    │                         │                         │
                    └─────────────────────────┼─────────────────────────┘
                                              │
                    ┌─────────────────────────┼─────────────────────────┐
                    │                         │                         │
                    ▼                         ▼                         ▼
        ┌───────────────────┐   ┌───────────────────┐   ┌───────────────────┐
        │    PostgreSQL     │   │      Redis        │   │   Object Storage  │
        │   - Primary DB    │   │   - Sessions      │   │   - S3/Cloudflare │
        │   - Read Replicas │   │   - Caching       │   │   - Media Files   │
        │   - Backups       │   │   - Pub/Sub       │   │   - Thumbnails    │
        └───────────────────┘   └───────────────────┘   └───────────────────┘
```

### 2.2 Technology Stack

| Layer | Technology | Justification |
|-------|------------|---------------|
| **Frontend** | React 18 + Vite | Already in use, performant |
| **Backend** | Node.js + Express/Fastify | JavaScript ecosystem consistency |
| **Database** | PostgreSQL 16 | Robust, scalable, JSON support |
| **Cache** | Redis 7 | Sessions, caching, pub/sub |
| **File Storage** | Cloudflare R2 / AWS S3 | Cost-effective, CDN integration |
| **WebSocket** | Socket.io / ws | Real-time communication |
| **Search** | PostgreSQL Full-text / Meilisearch | User discovery |
| **Email** | SendGrid / AWS SES | Transactional emails |
| **SMS** | Twilio | Phone verification |
| **Hosting** | AWS / DigitalOcean / Railway | Scalable infrastructure |

---

## 3. Project Structure Reorganization

### 3.1 New Monorepo Structure

```
Bellor_MVP/
├── .github/
│   ├── workflows/
│   │   ├── ci.yml                 # Continuous Integration
│   │   ├── cd-staging.yml         # Deploy to staging
│   │   └── cd-production.yml      # Deploy to production
│   └── PULL_REQUEST_TEMPLATE.md
│
├── apps/
│   ├── web/                       # React Frontend
│   │   ├── public/
│   │   ├── src/
│   │   │   ├── api/               # API client layer
│   │   │   │   ├── client.ts
│   │   │   │   ├── endpoints/
│   │   │   │   │   ├── users.ts
│   │   │   │   │   ├── chats.ts
│   │   │   │   │   ├── messages.ts
│   │   │   │   │   └── ...
│   │   │   │   └── types.ts
│   │   │   ├── components/
│   │   │   │   ├── ui/            # Design system
│   │   │   │   ├── features/      # Feature components
│   │   │   │   └── layouts/       # Layout components
│   │   │   ├── hooks/
│   │   │   ├── pages/
│   │   │   ├── stores/            # State management
│   │   │   ├── styles/
│   │   │   ├── utils/
│   │   │   └── App.tsx
│   │   ├── package.json
│   │   ├── vite.config.ts
│   │   └── tsconfig.json
│   │
│   └── api/                       # Backend API
│       ├── src/
│       │   ├── config/
│       │   │   ├── database.ts
│       │   │   ├── redis.ts
│       │   │   ├── storage.ts
│       │   │   └── env.ts
│       │   ├── controllers/
│       │   │   ├── auth.controller.ts
│       │   │   ├── users.controller.ts
│       │   │   ├── chats.controller.ts
│       │   │   └── ...
│       │   ├── middleware/
│       │   │   ├── auth.middleware.ts
│       │   │   ├── validation.middleware.ts
│       │   │   ├── rateLimit.middleware.ts
│       │   │   └── error.middleware.ts
│       │   ├── models/
│       │   │   ├── User.ts
│       │   │   ├── Chat.ts
│       │   │   ├── Message.ts
│       │   │   └── ...
│       │   ├── routes/
│       │   │   ├── v1/
│       │   │   │   ├── auth.routes.ts
│       │   │   │   ├── users.routes.ts
│       │   │   │   └── ...
│       │   │   └── index.ts
│       │   ├── services/
│       │   │   ├── auth.service.ts
│       │   │   ├── email.service.ts
│       │   │   ├── storage.service.ts
│       │   │   └── ...
│       │   ├── websocket/
│       │   │   ├── handlers/
│       │   │   └── index.ts
│       │   ├── utils/
│       │   └── app.ts
│       ├── prisma/
│       │   ├── schema.prisma
│       │   └── migrations/
│       ├── package.json
│       └── tsconfig.json
│
├── packages/
│   ├── shared/                    # Shared code
│   │   ├── types/
│   │   ├── constants/
│   │   ├── utils/
│   │   └── package.json
│   │
│   └── ui/                        # Design system package
│       ├── components/
│       ├── styles/
│       └── package.json
│
├── infrastructure/
│   ├── docker/
│   │   ├── Dockerfile.web
│   │   ├── Dockerfile.api
│   │   └── docker-compose.yml
│   ├── kubernetes/                # Optional K8s configs
│   │   ├── deployments/
│   │   └── services/
│   └── terraform/                 # Infrastructure as Code
│       ├── main.tf
│       ├── variables.tf
│       └── outputs.tf
│
├── docs/
│   ├── api/
│   │   └── openapi.yaml           # API Documentation
│   ├── architecture/
│   │   ├── ARCHITECTURE.md
│   │   └── diagrams/
│   ├── deployment/
│   │   ├── DEPLOYMENT.md
│   │   └── RUNBOOK.md
│   ├── development/
│   │   ├── SETUP.md
│   │   ├── CONTRIBUTING.md
│   │   └── CODING_STANDARDS.md
│   └── MIGRATION_PLAN.md          # This document
│
├── scripts/
│   ├── setup.sh
│   ├── migrate-data.ts
│   └── seed-data.ts
│
├── .env.example
├── .gitignore
├── package.json                   # Root package.json (workspaces)
├── pnpm-workspace.yaml
├── turbo.json                     # Turborepo config
└── README.md
```

### 3.2 Migration Script: Move Existing Files

```bash
# Script to reorganize files
# Located at: scripts/reorganize-structure.sh

#!/bin/bash

# Create new structure
mkdir -p apps/web/src/{api,components,hooks,pages,stores,styles,utils}
mkdir -p apps/api/src/{config,controllers,middleware,models,routes,services,websocket,utils}
mkdir -p packages/{shared,ui}
mkdir -p infrastructure/{docker,kubernetes,terraform}
mkdir -p docs/{api,architecture,deployment,development}

# Move frontend files
mv src/components apps/web/src/
mv src/pages apps/web/src/
mv src/hooks apps/web/src/
mv src/styles apps/web/src/
mv src/utils apps/web/src/
mv index.html apps/web/
mv vite.config.js apps/web/vite.config.ts
```

---

## 4. Backend Migration

### 4.1 API Service Setup

**Technology:** Node.js + Fastify + TypeScript

```typescript
// apps/api/src/app.ts

import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import { PrismaClient } from '@prisma/client';
import { Redis } from 'ioredis';

const app = Fastify({ logger: true });

// Middleware
await app.register(cors, {
  origin: process.env.FRONTEND_URL,
  credentials: true,
});

await app.register(helmet);

await app.register(rateLimit, {
  max: 100,
  timeWindow: '1 minute',
});

// Database
const prisma = new PrismaClient();
const redis = new Redis(process.env.REDIS_URL);

// Routes
await app.register(import('./routes/v1'), { prefix: '/api/v1' });

// Health check
app.get('/health', async () => ({ status: 'ok' }));

export { app, prisma, redis };
```

### 4.2 Base44 to Custom API Mapping

| Base44 Method | New API Endpoint | HTTP Method |
|---------------|------------------|-------------|
| `User.list()` | `/api/v1/users` | GET |
| `User.get(id)` | `/api/v1/users/:id` | GET |
| `User.create(data)` | `/api/v1/users` | POST |
| `User.update(id, data)` | `/api/v1/users/:id` | PATCH |
| `User.delete(id)` | `/api/v1/users/:id` | DELETE |
| `User.filter(query)` | `/api/v1/users?...` | GET |
| `Chat.list('-created_date')` | `/api/v1/chats?sort=-createdAt` | GET |
| `Message.filter({chat_id})` | `/api/v1/chats/:id/messages` | GET |
| `Response.create(data)` | `/api/v1/responses` | POST |
| `Report.list()` | `/api/v1/admin/reports` | GET |

### 4.3 Sample Controller Implementation

```typescript
// apps/api/src/controllers/users.controller.ts

import { FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../app';
import { z } from 'zod';

const updateUserSchema = z.object({
  first_name: z.string().optional(),
  bio: z.string().max(500).optional(),
  profile_image: z.string().url().optional(),
  // ... other fields
});

export const usersController = {
  async getAll(req: FastifyRequest, reply: FastifyReply) {
    const { page = 1, limit = 20, sort, search } = req.query as any;

    const users = await prisma.user.findMany({
      skip: (page - 1) * limit,
      take: limit,
      orderBy: sort ? { [sort]: 'desc' } : undefined,
      where: search ? {
        OR: [
          { first_name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ],
      } : undefined,
    });

    const total = await prisma.user.count();

    return reply.send({
      data: users,
      meta: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  },

  async getById(req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      include: {
        achievements: true,
        responses: { take: 10, orderBy: { createdAt: 'desc' } },
      },
    });

    if (!user) {
      return reply.status(404).send({ error: 'User not found' });
    }

    return reply.send({ data: user });
  },

  async update(
    req: FastifyRequest<{ Params: { id: string }; Body: z.infer<typeof updateUserSchema> }>,
    reply: FastifyReply
  ) {
    const data = updateUserSchema.parse(req.body);

    const user = await prisma.user.update({
      where: { id: req.params.id },
      data,
    });

    return reply.send({ data: user });
  },
};
```

---

## 5. Database Design

### 5.1 Prisma Schema

```prisma
// apps/api/prisma/schema.prisma

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

// ==================== USERS ====================

model User {
  id                    String    @id @default(cuid())
  email                 String    @unique
  passwordHash          String?
  firstName             String?
  lastName              String?
  bio                   String?
  birthDate             DateTime?
  gender                Gender?
  profileImages         String[]
  location              Json?     // { lat, lng, city, country }

  // Preferences
  lookingFor            Gender[]
  ageRangeMin           Int?      @default(18)
  ageRangeMax           Int?      @default(99)
  maxDistance           Int?      @default(100) // km

  // Status
  isVerified            Boolean   @default(false)
  isBlocked             Boolean   @default(false)
  isPremium             Boolean   @default(false)
  premiumExpiresAt      DateTime?
  lastActiveAt          DateTime?

  // Stats
  responseCount         Int       @default(0)
  chatCount             Int       @default(0)
  missionCompletedCount Int       @default(0)

  // Timestamps
  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt

  // Relations
  chatsAsUser1          Chat[]    @relation("ChatUser1")
  chatsAsUser2          Chat[]    @relation("ChatUser2")
  sentMessages          Message[] @relation("MessageSender")
  responses             Response[]
  stories               Story[]
  achievements          UserAchievement[]
  reportsMade           Report[]  @relation("Reporter")
  reportsReceived       Report[]  @relation("ReportedUser")

  @@index([email])
  @@index([lastActiveAt])
  @@index([location(ops: JsonbPathOps)], type: Gin)
}

enum Gender {
  MALE
  FEMALE
  NON_BINARY
  OTHER
}

// ==================== CHATS ====================

model Chat {
  id                    String    @id @default(cuid())
  user1Id               String
  user2Id               String

  // Status
  status                ChatStatus @default(ACTIVE)
  isTemporary           Boolean    @default(true)
  isPermanent           Boolean    @default(false)
  isConvertedToPermanent Boolean   @default(false)

  // Expiry (for temporary chats)
  expiresAt             DateTime?

  // Stats
  reportedCount         Int        @default(0)
  messageCount          Int        @default(0)

  // Timestamps
  createdAt             DateTime   @default(now())
  updatedAt             DateTime   @updatedAt
  lastMessageAt         DateTime?

  // Relations
  user1                 User       @relation("ChatUser1", fields: [user1Id], references: [id])
  user2                 User       @relation("ChatUser2", fields: [user2Id], references: [id])
  messages              Message[]

  @@unique([user1Id, user2Id])
  @@index([user1Id])
  @@index([user2Id])
  @@index([status])
  @@index([expiresAt])
}

enum ChatStatus {
  ACTIVE
  EXPIRED
  BLOCKED
  DELETED
}

// ==================== MESSAGES ====================

model Message {
  id                    String      @id @default(cuid())
  chatId                String
  senderId              String

  // Content
  messageType           MessageType
  content               String?     // Text content or URL for media
  textContent           String?     // Text version (for voice transcription)

  // Status
  isRead                Boolean     @default(false)
  isDeleted             Boolean     @default(false)

  // Timestamps
  createdAt             DateTime    @default(now())
  readAt                DateTime?

  // Relations
  chat                  Chat        @relation(fields: [chatId], references: [id], onDelete: Cascade)
  sender                User        @relation("MessageSender", fields: [senderId], references: [id])

  @@index([chatId])
  @@index([senderId])
  @@index([createdAt])
}

enum MessageType {
  TEXT
  VOICE
  IMAGE
  VIDEO
  DRAWING
}

// ==================== RESPONSES (Task Responses) ====================

model Response {
  id                    String       @id @default(cuid())
  userId                String
  missionId             String?

  // Content
  responseType          ResponseType
  content               String       // URL or text content
  textContent           String?
  thumbnailUrl          String?
  duration              Int?         // For audio/video in seconds

  // Stats
  viewCount             Int          @default(0)
  likeCount             Int          @default(0)

  // Privacy
  isPublic              Boolean      @default(true)

  // Timestamps
  createdAt             DateTime     @default(now())

  // Relations
  user                  User         @relation(fields: [userId], references: [id])
  mission               Mission?     @relation(fields: [missionId], references: [id])

  @@index([userId])
  @@index([missionId])
  @@index([createdAt])
}

enum ResponseType {
  TEXT
  VOICE
  VIDEO
  DRAWING
}

// ==================== MISSIONS ====================

model Mission {
  id                    String    @id @default(cuid())

  // Content
  title                 String
  description           String
  missionType           MissionType
  difficulty            Int       @default(1) // 1-5

  // Rewards
  xpReward              Int       @default(10)

  // Scheduling
  activeFrom            DateTime?
  activeUntil           DateTime?

  // Timestamps
  createdAt             DateTime  @default(now())

  // Relations
  responses             Response[]

  @@index([activeFrom, activeUntil])
}

enum MissionType {
  DAILY
  WEEKLY
  SPECIAL
  ICE_BREAKER
}

// ==================== STORIES ====================

model Story {
  id                    String    @id @default(cuid())
  userId                String

  // Content
  mediaType             MediaType
  mediaUrl              String
  thumbnailUrl          String?
  caption               String?

  // Stats
  viewCount             Int       @default(0)

  // Timestamps
  createdAt             DateTime  @default(now())
  expiresAt             DateTime  // 24 hours from creation

  // Relations
  user                  User      @relation(fields: [userId], references: [id])

  @@index([userId])
  @@index([expiresAt])
}

enum MediaType {
  IMAGE
  VIDEO
}

// ==================== REPORTS ====================

model Report {
  id                    String       @id @default(cuid())
  reporterId            String
  reportedUserId        String

  // Content reference
  reportedContentType   ContentType?
  reportedContentId     String?

  // Details
  reason                ReportReason
  description           String?
  priority              Int          @default(1) // 1-5

  // Status
  status                ReportStatus @default(PENDING)
  reviewedBy            String?
  reviewNotes           String?

  // Timestamps
  createdAt             DateTime     @default(now())
  reviewedAt            DateTime?

  // Relations
  reporter              User         @relation("Reporter", fields: [reporterId], references: [id])
  reportedUser          User         @relation("ReportedUser", fields: [reportedUserId], references: [id])

  @@index([status])
  @@index([createdAt])
}

enum ContentType {
  MESSAGE
  RESPONSE
  STORY
  PROFILE
}

enum ReportReason {
  SPAM
  HARASSMENT
  INAPPROPRIATE_CONTENT
  FAKE_PROFILE
  UNDERAGE
  OTHER
}

enum ReportStatus {
  PENDING
  REVIEWED
  ACTION_TAKEN
  DISMISSED
}

// ==================== ACHIEVEMENTS ====================

model Achievement {
  id                    String    @id @default(cuid())

  // Content
  name                  String
  description           String
  iconUrl               String?

  // Requirements
  requirement           Json      // { type: 'response_count', value: 10 }
  xpReward              Int       @default(50)

  // Relations
  users                 UserAchievement[]
}

model UserAchievement {
  id                    String    @id @default(cuid())
  userId                String
  achievementId         String
  unlockedAt            DateTime  @default(now())

  user                  User       @relation(fields: [userId], references: [id])
  achievement           Achievement @relation(fields: [achievementId], references: [id])

  @@unique([userId, achievementId])
}

// ==================== APP SETTINGS ====================

model AppSetting {
  id                    String    @id @default(cuid())
  key                   String    @unique
  value                 String
  description           String?
  dataType              String    @default("string") // string, number, boolean, json
  category              String    @default("system")
  updatedAt             DateTime  @updatedAt
}

// ==================== REFERRALS ====================

model Referral {
  id                    String    @id @default(cuid())
  referrerUserId        String?
  referredEmail         String
  phoneNumber           String?

  // Status
  status                ReferralStatus @default(PENDING)
  emailSent             Boolean    @default(false)
  whatsappSent          Boolean    @default(false)

  // Timestamps
  createdAt             DateTime   @default(now())
  signedUpAt            DateTime?
}

enum ReferralStatus {
  PENDING
  SIGNED_UP
  COMPLETED
}
```

### 5.2 Database Migrations Strategy

1. **Initial Migration**: Create all tables with new schema
2. **Data Import**: Script to migrate data from Base44
3. **Index Optimization**: Add indexes based on query patterns
4. **Partitioning**: Consider partitioning for messages table

---

## 6. Authentication & Authorization

### 6.1 Authentication Strategy

| Method | Use Case |
|--------|----------|
| JWT + Refresh Tokens | Primary authentication |
| OAuth 2.0 (Google, Apple) | Social login |
| Magic Links | Email-based passwordless |
| Phone OTP | Phone verification |

### 6.2 JWT Implementation

```typescript
// apps/api/src/services/auth.service.ts

import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { prisma, redis } from '../app';

export const authService = {
  async login(email: string, password: string) {
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || !await bcrypt.compare(password, user.passwordHash)) {
      throw new Error('Invalid credentials');
    }

    if (user.isBlocked) {
      throw new Error('Account is blocked');
    }

    const accessToken = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET!,
      { expiresIn: '15m' }
    );

    const refreshToken = jwt.sign(
      { userId: user.id },
      process.env.JWT_REFRESH_SECRET!,
      { expiresIn: '7d' }
    );

    // Store refresh token in Redis
    await redis.setex(`refresh:${user.id}`, 7 * 24 * 60 * 60, refreshToken);

    return { accessToken, refreshToken, user };
  },

  async refreshToken(token: string) {
    const payload = jwt.verify(token, process.env.JWT_REFRESH_SECRET!) as { userId: string };

    const storedToken = await redis.get(`refresh:${payload.userId}`);
    if (storedToken !== token) {
      throw new Error('Invalid refresh token');
    }

    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user) throw new Error('User not found');

    const accessToken = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET!,
      { expiresIn: '15m' }
    );

    return { accessToken };
  },

  async logout(userId: string) {
    await redis.del(`refresh:${userId}`);
  },
};
```

### 6.3 Authorization Middleware

```typescript
// apps/api/src/middleware/auth.middleware.ts

import { FastifyRequest, FastifyReply } from 'fastify';
import jwt from 'jsonwebtoken';
import { prisma } from '../app';

export async function authMiddleware(req: FastifyRequest, reply: FastifyReply) {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    return reply.status(401).send({ error: 'Missing authorization header' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
    const user = await prisma.user.findUnique({ where: { id: payload.userId } });

    if (!user || user.isBlocked) {
      return reply.status(401).send({ error: 'Unauthorized' });
    }

    req.user = user;
  } catch (error) {
    return reply.status(401).send({ error: 'Invalid token' });
  }
}

export async function adminMiddleware(req: FastifyRequest, reply: FastifyReply) {
  if (!req.user?.isAdmin) {
    return reply.status(403).send({ error: 'Admin access required' });
  }
}
```

---

## 7. File Storage & Media

### 7.1 Storage Provider

**Recommended:** Cloudflare R2 (S3-compatible, no egress fees)

```typescript
// apps/api/src/services/storage.service.ts

import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import sharp from 'sharp';
import { v4 as uuid } from 'uuid';

const s3 = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

const BUCKET = process.env.R2_BUCKET!;

export const storageService = {
  async uploadImage(file: Buffer, mimeType: string, folder: string) {
    const key = `${folder}/${uuid()}.webp`;

    // Optimize image
    const optimized = await sharp(file)
      .webp({ quality: 80 })
      .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
      .toBuffer();

    // Create thumbnail
    const thumbnail = await sharp(file)
      .webp({ quality: 60 })
      .resize(300, 300, { fit: 'cover' })
      .toBuffer();

    const thumbKey = `${folder}/thumbs/${uuid()}.webp`;

    // Upload both
    await Promise.all([
      s3.send(new PutObjectCommand({
        Bucket: BUCKET,
        Key: key,
        Body: optimized,
        ContentType: 'image/webp',
        CacheControl: 'public, max-age=31536000',
      })),
      s3.send(new PutObjectCommand({
        Bucket: BUCKET,
        Key: thumbKey,
        Body: thumbnail,
        ContentType: 'image/webp',
        CacheControl: 'public, max-age=31536000',
      })),
    ]);

    return {
      url: `${process.env.CDN_URL}/${key}`,
      thumbnailUrl: `${process.env.CDN_URL}/${thumbKey}`,
    };
  },

  async uploadAudio(file: Buffer, mimeType: string) {
    const key = `audio/${uuid()}.${mimeType.split('/')[1]}`;

    await s3.send(new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: file,
      ContentType: mimeType,
      CacheControl: 'public, max-age=31536000',
    }));

    return { url: `${process.env.CDN_URL}/${key}` };
  },

  async uploadVideo(file: Buffer, mimeType: string) {
    // For large videos, use multipart upload
    const key = `video/${uuid()}.mp4`;

    await s3.send(new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: file,
      ContentType: 'video/mp4',
      CacheControl: 'public, max-age=31536000',
    }));

    return { url: `${process.env.CDN_URL}/${key}` };
  },

  async getUploadUrl(folder: string, contentType: string) {
    const key = `${folder}/${uuid()}`;

    const command = new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      ContentType: contentType,
    });

    const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 3600 });

    return {
      uploadUrl,
      publicUrl: `${process.env.CDN_URL}/${key}`,
    };
  },

  async delete(url: string) {
    const key = url.replace(`${process.env.CDN_URL}/`, '');

    await s3.send(new DeleteObjectCommand({
      Bucket: BUCKET,
      Key: key,
    }));
  },
};
```

### 7.2 File Upload Endpoint

```typescript
// apps/api/src/routes/v1/uploads.routes.ts

import { FastifyInstance } from 'fastify';
import multipart from '@fastify/multipart';
import { storageService } from '../../services/storage.service';
import { authMiddleware } from '../../middleware/auth.middleware';

export default async function uploadsRoutes(app: FastifyInstance) {
  await app.register(multipart, {
    limits: {
      fileSize: 50 * 1024 * 1024, // 50MB
    },
  });

  app.post('/images', { preHandler: authMiddleware }, async (req, reply) => {
    const data = await req.file();

    if (!data) {
      return reply.status(400).send({ error: 'No file provided' });
    }

    const buffer = await data.toBuffer();
    const result = await storageService.uploadImage(buffer, data.mimetype, 'profiles');

    return reply.send({ data: result });
  });

  // Presigned URL for client-side upload
  app.get('/presigned', { preHandler: authMiddleware }, async (req, reply) => {
    const { folder, contentType } = req.query as any;

    const result = await storageService.getUploadUrl(folder, contentType);

    return reply.send({ data: result });
  });
}
```

---

## 8. Real-time Communication

### 8.1 WebSocket Server

```typescript
// apps/api/src/websocket/index.ts

import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { redis, prisma } from '../app';

export function setupWebSocket(httpServer: HttpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL,
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  // Authentication middleware
  io.use(async (socket, next) => {
    const token = socket.handshake.auth.token;

    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
      const user = await prisma.user.findUnique({ where: { id: payload.userId } });

      if (!user || user.isBlocked) {
        return next(new Error('Unauthorized'));
      }

      socket.data.user = user;
      next();
    } catch (error) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', async (socket: Socket) => {
    const userId = socket.data.user.id;

    // Join user's personal room
    socket.join(`user:${userId}`);

    // Update online status
    await redis.sadd('online_users', userId);
    await prisma.user.update({
      where: { id: userId },
      data: { lastActiveAt: new Date() },
    });

    // Broadcast online status
    socket.broadcast.emit('user:online', { userId });

    // Join chat rooms
    const chats = await prisma.chat.findMany({
      where: {
        OR: [{ user1Id: userId }, { user2Id: userId }],
        status: 'ACTIVE',
      },
    });

    chats.forEach(chat => {
      socket.join(`chat:${chat.id}`);
    });

    // Handle new message
    socket.on('message:send', async (data) => {
      const { chatId, messageType, content, textContent } = data;

      // Validate user is in chat
      const chat = await prisma.chat.findFirst({
        where: {
          id: chatId,
          OR: [{ user1Id: userId }, { user2Id: userId }],
        },
      });

      if (!chat) return;

      // Create message
      const message = await prisma.message.create({
        data: {
          chatId,
          senderId: userId,
          messageType,
          content,
          textContent,
        },
        include: { sender: true },
      });

      // Update chat
      await prisma.chat.update({
        where: { id: chatId },
        data: {
          lastMessageAt: new Date(),
          messageCount: { increment: 1 },
        },
      });

      // Broadcast to chat room
      io.to(`chat:${chatId}`).emit('message:new', message);

      // Send push notification to recipient
      const recipientId = chat.user1Id === userId ? chat.user2Id : chat.user1Id;
      const isOnline = await redis.sismember('online_users', recipientId);

      if (!isOnline) {
        // Queue push notification
        await redis.lpush('push_notifications', JSON.stringify({
          userId: recipientId,
          title: socket.data.user.firstName,
          body: messageType === 'TEXT' ? content : 'Sent you a message',
        }));
      }
    });

    // Handle typing indicator
    socket.on('typing:start', (chatId) => {
      socket.to(`chat:${chatId}`).emit('typing:start', { userId, chatId });
    });

    socket.on('typing:stop', (chatId) => {
      socket.to(`chat:${chatId}`).emit('typing:stop', { userId, chatId });
    });

    // Handle message read
    socket.on('message:read', async ({ chatId, messageId }) => {
      await prisma.message.update({
        where: { id: messageId },
        data: { isRead: true, readAt: new Date() },
      });

      socket.to(`chat:${chatId}`).emit('message:read', { messageId });
    });

    // Handle disconnect
    socket.on('disconnect', async () => {
      await redis.srem('online_users', userId);
      await prisma.user.update({
        where: { id: userId },
        data: { lastActiveAt: new Date() },
      });

      socket.broadcast.emit('user:offline', { userId });
    });
  });

  return io;
}
```

### 8.2 Frontend WebSocket Client

```typescript
// apps/web/src/api/websocket.ts

import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../stores/auth';

let socket: Socket | null = null;

export function connectWebSocket() {
  const token = useAuthStore.getState().accessToken;

  if (!token) return;

  socket = io(import.meta.env.VITE_WS_URL, {
    auth: { token },
    transports: ['websocket'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });

  socket.on('connect', () => {
    console.log('WebSocket connected');
  });

  socket.on('disconnect', () => {
    console.log('WebSocket disconnected');
  });

  socket.on('connect_error', (error) => {
    console.error('WebSocket connection error:', error);
  });

  return socket;
}

export function disconnectWebSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export function getSocket() {
  return socket;
}
```

---

## 9. API Layer

### 9.1 Frontend API Client

```typescript
// apps/web/src/api/client.ts

import axios, { AxiosInstance, AxiosError } from 'axios';
import { useAuthStore } from '../stores/auth';

const API_URL = import.meta.env.VITE_API_URL;

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor - add auth token
    this.client.interceptors.request.use((config) => {
      const token = useAuthStore.getState().accessToken;
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Response interceptor - handle token refresh
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            const newToken = await useAuthStore.getState().refreshToken();
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return this.client(originalRequest);
          } catch (refreshError) {
            useAuthStore.getState().logout();
            window.location.href = '/login';
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      }
    );
  }

  // Generic methods
  async get<T>(url: string, params?: Record<string, any>) {
    const response = await this.client.get<{ data: T }>(url, { params });
    return response.data.data;
  }

  async post<T>(url: string, data?: any) {
    const response = await this.client.post<{ data: T }>(url, data);
    return response.data.data;
  }

  async patch<T>(url: string, data: any) {
    const response = await this.client.patch<{ data: T }>(url, data);
    return response.data.data;
  }

  async delete(url: string) {
    await this.client.delete(url);
  }

  async upload(url: string, file: File, onProgress?: (percent: number) => void) {
    const formData = new FormData();
    formData.append('file', file);

    const response = await this.client.post(url, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percent);
        }
      },
    });

    return response.data.data;
  }
}

export const api = new ApiClient();
```

### 9.2 Entity-Specific API Modules

```typescript
// apps/web/src/api/endpoints/users.ts

import { api } from '../client';
import { User, PaginatedResponse } from '../types';

export const usersApi = {
  list: (params?: { page?: number; limit?: number; search?: string }) =>
    api.get<PaginatedResponse<User>>('/api/v1/users', params),

  get: (id: string) =>
    api.get<User>(`/api/v1/users/${id}`),

  getMe: () =>
    api.get<User>('/api/v1/users/me'),

  update: (id: string, data: Partial<User>) =>
    api.patch<User>(`/api/v1/users/${id}`, data),

  uploadProfileImage: (file: File, onProgress?: (percent: number) => void) =>
    api.upload('/api/v1/uploads/images', file, onProgress),

  block: (id: string) =>
    api.post(`/api/v1/admin/users/${id}/block`),

  unblock: (id: string) =>
    api.post(`/api/v1/admin/users/${id}/unblock`),
};
```

```typescript
// apps/web/src/api/endpoints/chats.ts

import { api } from '../client';
import { Chat, Message, PaginatedResponse } from '../types';

export const chatsApi = {
  list: (params?: { page?: number; status?: string }) =>
    api.get<PaginatedResponse<Chat>>('/api/v1/chats', params),

  get: (id: string) =>
    api.get<Chat>(`/api/v1/chats/${id}`),

  create: (userId: string) =>
    api.post<Chat>('/api/v1/chats', { userId }),

  getMessages: (chatId: string, params?: { before?: string; limit?: number }) =>
    api.get<Message[]>(`/api/v1/chats/${chatId}/messages`, params),

  makePermanent: (id: string) =>
    api.post(`/api/v1/chats/${id}/make-permanent`),

  block: (id: string) =>
    api.post(`/api/v1/chats/${id}/block`),
};
```

### 9.3 React Query Integration

```typescript
// apps/web/src/hooks/useUsers.ts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersApi } from '../api/endpoints/users';

export function useUsers(params?: { page?: number; search?: string }) {
  return useQuery({
    queryKey: ['users', params],
    queryFn: () => usersApi.list(params),
  });
}

export function useUser(id: string) {
  return useQuery({
    queryKey: ['users', id],
    queryFn: () => usersApi.get(id),
    enabled: !!id,
  });
}

export function useCurrentUser() {
  return useQuery({
    queryKey: ['users', 'me'],
    queryFn: () => usersApi.getMe(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<User> }) =>
      usersApi.update(id, data),
    onSuccess: (user) => {
      queryClient.setQueryData(['users', user.id], user);
      queryClient.invalidateQueries({ queryKey: ['users', 'me'] });
    },
  });
}
```

---

## 10. Frontend Migration

### 10.1 Migration Steps for Each Page

Replace Base44 imports and calls with new API:

**Before (Base44):**
```jsx
import { base44 } from '@/api/base44Client';

const { data: users = [] } = useQuery({
  queryKey: ['users'],
  queryFn: () => base44.entities.User.list(),
});
```

**After (Custom API):**
```jsx
import { useUsers } from '@/hooks/useUsers';

const { data, isLoading } = useUsers();
const users = data?.data ?? [];
```

### 10.2 Migration Checklist

- [ ] Remove `@base44/sdk` and `@base44/vite-plugin` from dependencies
- [ ] Update `vite.config.js` to remove Base44 plugin
- [ ] Create new API client
- [ ] Create hooks for each entity
- [ ] Update all page components
- [ ] Update authentication flow
- [ ] Update file upload components
- [ ] Test all CRUD operations

### 10.3 Files to Migrate (by priority)

**High Priority (Core Functionality):**
1. `src/api/base44Client.js` → Replace with new client
2. `src/hooks/useCurrentUser.js` → Update to use new API
3. `src/pages/Login.jsx` → New auth flow
4. `src/pages/Register.jsx` → New auth flow
5. `src/pages/Profile.jsx` → User CRUD
6. `src/pages/PrivateChat.jsx` → Chat + WebSocket
7. `src/pages/Discover.jsx` → User listing + filtering

**Medium Priority:**
8. `src/pages/TemporaryChats.jsx`
9. `src/pages/Notifications.jsx`
10. `src/pages/Stories.jsx`
11. `src/pages/Creation.jsx`
12. `src/pages/Matches.jsx`

**Lower Priority (Admin):**
13. `src/pages/AdminDashboard.jsx`
14. `src/pages/AdminUserManagement.jsx`
15. `src/pages/AdminReportManagement.jsx`
16. All other admin pages

---

## 11. Testing Strategy

### 11.1 Testing Pyramid

```
                    ┌─────────┐
                    │   E2E   │  (10%)
                    │  Tests  │
                    └────┬────┘
                         │
                ┌────────┴────────┐
                │  Integration    │  (30%)
                │     Tests       │
                └────────┬────────┘
                         │
        ┌────────────────┴────────────────┐
        │          Unit Tests              │  (60%)
        └──────────────────────────────────┘
```

### 11.2 Backend Testing

```typescript
// apps/api/src/__tests__/users.test.ts

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { app, prisma } from '../app';
import { createTestUser, getAuthToken } from './helpers';

describe('Users API', () => {
  let token: string;
  let userId: string;

  beforeAll(async () => {
    const user = await createTestUser();
    userId = user.id;
    token = await getAuthToken(user);
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: { contains: 'test' } } });
  });

  describe('GET /api/v1/users/me', () => {
    it('should return current user', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/users/me',
        headers: { Authorization: `Bearer ${token}` },
      });

      expect(response.statusCode).toBe(200);
      expect(response.json().data.id).toBe(userId);
    });

    it('should return 401 without token', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/users/me',
      });

      expect(response.statusCode).toBe(401);
    });
  });

  describe('PATCH /api/v1/users/:id', () => {
    it('should update user profile', async () => {
      const response = await app.inject({
        method: 'PATCH',
        url: `/api/v1/users/${userId}`,
        headers: { Authorization: `Bearer ${token}` },
        payload: { firstName: 'Updated', bio: 'New bio' },
      });

      expect(response.statusCode).toBe(200);
      expect(response.json().data.firstName).toBe('Updated');
    });
  });
});
```

### 11.3 Frontend Testing

```typescript
// apps/web/src/__tests__/Profile.test.tsx

import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import Profile from '../pages/Profile';
import { usersApi } from '../api/endpoints/users';

vi.mock('../api/endpoints/users');

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

const wrapper = ({ children }) => (
  <QueryClientProvider client={queryClient}>
    <MemoryRouter>{children}</MemoryRouter>
  </QueryClientProvider>
);

describe('Profile Page', () => {
  it('renders user profile', async () => {
    vi.mocked(usersApi.getMe).mockResolvedValue({
      id: '1',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
    });

    render(<Profile />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });
  });
});
```

### 11.4 E2E Testing with Playwright

```typescript
// apps/web/e2e/auth.spec.ts

import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('should login successfully', async ({ page }) => {
    await page.goto('/login');

    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL('/');
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/login');

    await page.fill('input[name="email"]', 'wrong@example.com');
    await page.fill('input[name="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');

    await expect(page.locator('[data-testid="error-message"]')).toContainText('Invalid credentials');
  });
});
```

---

## 12. Deployment & Infrastructure

### 12.1 Infrastructure Options

| Option | Pros | Cons | Monthly Cost (Est.) |
|--------|------|------|---------------------|
| **Railway** | Simple, auto-scaling | Limited customization | $50-200 |
| **DigitalOcean App Platform** | Good balance | Limited regions | $100-300 |
| **AWS (ECS/Fargate)** | Full control, scalable | Complex setup | $200-500 |
| **Vercel + Railway** | Best DX for frontend | Split infrastructure | $100-300 |

**Recommended:** Start with Railway/DigitalOcean, migrate to AWS when scaling.

### 12.2 Docker Configuration

```dockerfile
# apps/api/Dockerfile

FROM node:20-alpine AS base
WORKDIR /app

# Install dependencies
FROM base AS deps
COPY package.json pnpm-lock.yaml ./
RUN corepack enable && pnpm install --frozen-lockfile

# Build
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm prisma generate
RUN pnpm build

# Production
FROM base AS runner
ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 api
USER api

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package.json ./

EXPOSE 3000
CMD ["node", "dist/app.js"]
```

```dockerfile
# apps/web/Dockerfile

FROM node:20-alpine AS base
WORKDIR /app

# Install dependencies
FROM base AS deps
COPY package.json pnpm-lock.yaml ./
RUN corepack enable && pnpm install --frozen-lockfile

# Build
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ARG VITE_API_URL
ARG VITE_WS_URL
RUN pnpm build

# Production - nginx
FROM nginx:alpine AS runner
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### 12.3 Docker Compose (Development)

```yaml
# docker-compose.yml

version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: bellor
      POSTGRES_PASSWORD: bellor_dev
      POSTGRES_DB: bellor
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U bellor"]
      interval: 5s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 5s
      retries: 5

  api:
    build:
      context: ./apps/api
      dockerfile: Dockerfile
      target: deps
    command: pnpm dev
    volumes:
      - ./apps/api:/app
      - /app/node_modules
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgresql://bellor:bellor_dev@postgres:5432/bellor
      REDIS_URL: redis://redis:6379
      JWT_SECRET: dev_secret_change_in_production
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy

  web:
    build:
      context: ./apps/web
      dockerfile: Dockerfile
      target: deps
    command: pnpm dev --host
    volumes:
      - ./apps/web:/app
      - /app/node_modules
    ports:
      - "5173:5173"
    environment:
      VITE_API_URL: http://localhost:3000
      VITE_WS_URL: ws://localhost:3000

volumes:
  postgres_data:
  redis_data:
```

### 12.4 CI/CD Pipeline

```yaml
# .github/workflows/ci.yml

name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
        with:
          version: 8
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'
      - run: pnpm install
      - run: pnpm lint

  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
          POSTGRES_DB: test
        ports:
          - 5432:5432
      redis:
        image: redis:7-alpine
        ports:
          - 6379:6379
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
        with:
          version: 8
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'
      - run: pnpm install
      - run: pnpm test
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/test
          REDIS_URL: redis://localhost:6379

  build:
    runs-on: ubuntu-latest
    needs: [lint, test]
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
        with:
          version: 8
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'
      - run: pnpm install
      - run: pnpm build
```

```yaml
# .github/workflows/cd-production.yml

name: Deploy Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Deploy to Railway
        uses: bervProject/railway-deploy@main
        with:
          railway_token: ${{ secrets.RAILWAY_TOKEN }}
          service: api

      - name: Deploy Frontend to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

### 12.5 Cloud-Agnostic Deployment Infrastructure

**Created Files:**
- `infrastructure/docker/Dockerfile.api` - Multi-stage API container (~150MB)
- `infrastructure/docker/Dockerfile.web` - Frontend with nginx (~25MB)
- `docker-compose.prod.yml` - Production orchestration
- `infrastructure/docker/docker-compose.all-in-one.yml` - Self-contained deployment with database (275MB min)
- `infrastructure/kubernetes/*.yaml` - Complete K8s manifests
- `scripts/deploy.sh` - Universal deployment script (Docker/K8s)
- `scripts/install-anywhere.sh` - One-command Bash installer (Linux/macOS)
- `scripts/install-anywhere.ps1` - One-command PowerShell installer (Windows)

**Key Features:**
1. **Platform Independence**: Works on any OS and cloud provider
2. **Automatic Setup**: Single command installs Docker, generates secrets, deploys everything
3. **Security**: Auto-generates JWT secrets, PostgreSQL passwords, Redis passwords
4. **All-in-One Option**: Database included in container for free hosting
5. **Production-Ready**: Health checks, resource limits, rolling updates
6. **SSL Support**: Automatic certificate generation with Let's Encrypt
7. **Zero Configuration**: Pre-configured for immediate deployment

**One-Command Installation:**
```bash
# Linux/macOS
curl -fsSL https://raw.githubusercontent.com/your-org/Bellor_MVP/main/scripts/install-anywhere.sh | bash

# Windows PowerShell (Run as Administrator)
irm https://raw.githubusercontent.com/your-org/Bellor_MVP/main/scripts/install-anywhere.ps1 | iex
```

**Free Hosting Options:**
- Render.com ($0/month, 90-day PostgreSQL)
- Railway.app ($5 credit/month)
- Fly.io (3 free VMs @ 256MB each)
- Oracle Cloud (24GB RAM free forever)
- Supabase (free PostgreSQL)

See [docs/deployment/FREE_HOSTING_OPTIONS.md](../deployment/FREE_HOSTING_OPTIONS.md) for detailed setup guides.

---

## 13. Monitoring & Observability

### 13.1 Logging

```typescript
// apps/api/src/utils/logger.ts

import pino from 'pino';

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: process.env.NODE_ENV === 'development'
    ? { target: 'pino-pretty' }
    : undefined,
  formatters: {
    level: (label) => ({ level: label }),
  },
  base: {
    env: process.env.NODE_ENV,
    service: 'bellor-api',
  },
});
```

### 13.2 Metrics

```typescript
// apps/api/src/middleware/metrics.middleware.ts

import { FastifyInstance } from 'fastify';
import prometheus from 'prom-client';

const httpRequestDuration = new prometheus.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status'],
  buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10],
});

const activeConnections = new prometheus.Gauge({
  name: 'websocket_active_connections',
  help: 'Number of active WebSocket connections',
});

export function setupMetrics(app: FastifyInstance) {
  prometheus.collectDefaultMetrics();

  app.addHook('onRequest', async (req) => {
    req.startTime = Date.now();
  });

  app.addHook('onResponse', async (req, reply) => {
    const duration = (Date.now() - req.startTime) / 1000;
    httpRequestDuration.observe(
      { method: req.method, route: req.routerPath, status: reply.statusCode },
      duration
    );
  });

  app.get('/metrics', async (req, reply) => {
    reply.header('Content-Type', prometheus.register.contentType);
    return prometheus.register.metrics();
  });
}
```

### 13.3 Error Tracking (Sentry)

```typescript
// apps/api/src/utils/sentry.ts

import * as Sentry from '@sentry/node';

export function initSentry() {
  if (process.env.SENTRY_DSN) {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV,
      tracesSampleRate: 0.1,
      integrations: [
        new Sentry.Integrations.Http({ tracing: true }),
        new Sentry.Integrations.Postgres(),
      ],
    });
  }
}
```

### 13.4 Health Checks

```typescript
// apps/api/src/routes/health.routes.ts

import { FastifyInstance } from 'fastify';
import { prisma, redis } from '../app';

export default async function healthRoutes(app: FastifyInstance) {
  app.get('/health', async () => ({ status: 'ok' }));

  app.get('/health/ready', async (req, reply) => {
    try {
      // Check database
      await prisma.$queryRaw`SELECT 1`;

      // Check Redis
      await redis.ping();

      return { status: 'ready', checks: { database: 'ok', redis: 'ok' } };
    } catch (error) {
      return reply.status(503).send({
        status: 'not ready',
        error: error.message,
      });
    }
  });

  app.get('/health/live', async () => ({ status: 'alive' }));
}
```

---

## 14. Security Implementation

### 14.1 Security Checklist

- [ ] **Authentication**
  - [ ] JWT with short expiry (15min)
  - [ ] Refresh token rotation
  - [ ] Password hashing (bcrypt, cost factor 12)
  - [ ] Rate limiting on auth endpoints
  - [ ] Account lockout after failed attempts

- [ ] **Authorization**
  - [ ] Role-based access control (RBAC)
  - [ ] Resource ownership validation
  - [ ] Admin role verification

- [ ] **Data Protection**
  - [ ] HTTPS only
  - [ ] Database encryption at rest
  - [ ] Sensitive data encryption (PII)
  - [ ] Secure session management

- [ ] **Input Validation**
  - [ ] Request body validation (Zod)
  - [ ] SQL injection prevention (Prisma ORM)
  - [ ] XSS prevention (Content-Security-Policy)
  - [ ] File upload validation

- [ ] **Infrastructure**
  - [ ] WAF (Web Application Firewall)
  - [ ] DDoS protection (Cloudflare)
  - [ ] Security headers (Helmet)
  - [ ] CORS configuration

### 14.2 Security Headers

```typescript
// apps/api/src/middleware/security.middleware.ts

import { FastifyInstance } from 'fastify';
import helmet from '@fastify/helmet';

export async function setupSecurity(app: FastifyInstance) {
  await app.register(helmet, {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'", process.env.FRONTEND_URL],
      },
    },
    crossOriginEmbedderPolicy: false,
  });
}
```

### 14.3 Rate Limiting

```typescript
// apps/api/src/middleware/rateLimit.middleware.ts

import rateLimit from '@fastify/rate-limit';
import { redis } from '../app';

export const rateLimitConfig = {
  global: {
    max: 100,
    timeWindow: '1 minute',
  },
  auth: {
    max: 5,
    timeWindow: '1 minute',
  },
  upload: {
    max: 10,
    timeWindow: '1 hour',
  },
};

export async function setupRateLimit(app) {
  await app.register(rateLimit, {
    max: rateLimitConfig.global.max,
    timeWindow: rateLimitConfig.global.timeWindow,
    redis,
    keyGenerator: (req) => req.user?.id || req.ip,
  });
}
```

---

## 15. Data Migration

### 15.1 Migration Script

```typescript
// scripts/migrate-data.ts

import { PrismaClient } from '@prisma/client';
import { base44 } from './base44-export'; // Export from Base44

const prisma = new PrismaClient();

async function migrateUsers() {
  console.log('Migrating users...');

  const base44Users = await base44.entities.User.list();

  for (const user of base44Users) {
    await prisma.user.upsert({
      where: { email: user.email },
      create: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        bio: user.bio,
        birthDate: user.birth_date ? new Date(user.birth_date) : null,
        gender: mapGender(user.gender),
        profileImages: user.profile_images || [],
        isVerified: user.is_verified,
        isBlocked: user.is_blocked,
        isPremium: user.is_premium,
        responseCount: user.response_count || 0,
        chatCount: user.chat_count || 0,
        createdAt: new Date(user.created_date),
      },
      update: {},
    });
  }

  console.log(`Migrated ${base44Users.length} users`);
}

async function migrateChats() {
  console.log('Migrating chats...');

  const base44Chats = await base44.entities.Chat.list();

  for (const chat of base44Chats) {
    await prisma.chat.upsert({
      where: { id: chat.id },
      create: {
        id: chat.id,
        user1Id: chat.user1_id,
        user2Id: chat.user2_id,
        status: mapChatStatus(chat.status),
        isTemporary: chat.is_temporary,
        isPermanent: chat.is_permanent,
        isConvertedToPermanent: chat.is_converted_to_permanent,
        reportedCount: chat.reported_count || 0,
        createdAt: new Date(chat.created_date),
      },
      update: {},
    });
  }

  console.log(`Migrated ${base44Chats.length} chats`);
}

async function migrateMessages() {
  console.log('Migrating messages...');

  const base44Messages = await base44.entities.Message.list();
  let count = 0;

  for (const msg of base44Messages) {
    try {
      await prisma.message.create({
        data: {
          id: msg.id,
          chatId: msg.chat_id,
          senderId: msg.sender_id,
          messageType: mapMessageType(msg.message_type),
          content: msg.content,
          textContent: msg.text_content,
          createdAt: new Date(msg.created_date),
        },
      });
      count++;
    } catch (error) {
      console.error(`Failed to migrate message ${msg.id}:`, error.message);
    }
  }

  console.log(`Migrated ${count} messages`);
}

// Run migration
async function main() {
  try {
    await migrateUsers();
    await migrateChats();
    await migrateMessages();
    // Add more migrations...

    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
```

### 15.2 Media File Migration

```typescript
// scripts/migrate-media.ts

import { S3Client, CopyObjectCommand } from '@aws-sdk/client-s3';
import { prisma } from './prisma';

const s3 = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

async function migrateProfileImages() {
  const users = await prisma.user.findMany({
    where: { profileImages: { isEmpty: false } },
  });

  for (const user of users) {
    const newImages = [];

    for (const oldUrl of user.profileImages) {
      if (oldUrl.includes('base44')) {
        // Download from Base44 and upload to R2
        const response = await fetch(oldUrl);
        const buffer = await response.arrayBuffer();

        const newKey = `profiles/${user.id}/${Date.now()}.webp`;

        await s3.send(new PutObjectCommand({
          Bucket: process.env.R2_BUCKET,
          Key: newKey,
          Body: Buffer.from(buffer),
          ContentType: 'image/webp',
        }));

        newImages.push(`${process.env.CDN_URL}/${newKey}`);
      } else {
        newImages.push(oldUrl);
      }
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { profileImages: newImages },
    });
  }
}
```

---

## 16. Documentation Requirements

### 16.1 Required Documentation

| Document | Location | Purpose |
|----------|----------|---------|
| API Reference | `docs/api/openapi.yaml` | OpenAPI 3.0 spec |
| Architecture Overview | `docs/architecture/ARCHITECTURE.md` | System design |
| Deployment Guide | `docs/deployment/DEPLOYMENT.md` | How to deploy |
| Runbook | `docs/deployment/RUNBOOK.md` | Incident response |
| Development Setup | `docs/development/SETUP.md` | Local development |
| Contributing Guide | `docs/development/CONTRIBUTING.md` | Code standards |
| Database Schema | `docs/architecture/DATABASE.md` | Data model |

### 16.2 OpenAPI Specification

```yaml
# docs/api/openapi.yaml

openapi: 3.0.3
info:
  title: Bellor API
  description: API for Bellor dating application
  version: 1.0.0
  contact:
    email: support@bellor.app

servers:
  - url: https://api.bellor.app/v1
    description: Production
  - url: https://api-staging.bellor.app/v1
    description: Staging
  - url: http://localhost:3000/v1
    description: Development

tags:
  - name: Auth
    description: Authentication endpoints
  - name: Users
    description: User management
  - name: Chats
    description: Chat functionality
  - name: Messages
    description: Message operations

paths:
  /auth/login:
    post:
      tags: [Auth]
      summary: Login with email and password
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                email:
                  type: string
                  format: email
                password:
                  type: string
                  minLength: 8
              required: [email, password]
      responses:
        '200':
          description: Login successful
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/AuthResponse'
        '401':
          $ref: '#/components/responses/Unauthorized'

  /users/me:
    get:
      tags: [Users]
      summary: Get current user profile
      security:
        - bearerAuth: []
      responses:
        '200':
          description: User profile
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/User'

components:
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT

  schemas:
    User:
      type: object
      properties:
        id:
          type: string
        email:
          type: string
        firstName:
          type: string
        lastName:
          type: string
        profileImages:
          type: array
          items:
            type: string
        createdAt:
          type: string
          format: date-time

    AuthResponse:
      type: object
      properties:
        accessToken:
          type: string
        refreshToken:
          type: string
        user:
          $ref: '#/components/schemas/User'

  responses:
    Unauthorized:
      description: Authentication required
      content:
        application/json:
          schema:
            type: object
            properties:
              error:
                type: string
```

---

## 17. Timeline & Milestones

### 17.1 Phase 1: Foundation (Weeks 1-2)
- [ ] Set up monorepo structure
- [ ] Configure TypeScript, ESLint, Prettier
- [ ] Set up PostgreSQL and Redis
- [ ] Create Prisma schema and migrations
- [ ] Basic API scaffolding

### 17.2 Phase 2: Core Backend (Weeks 3-4)
- [ ] Authentication service (JWT, OAuth)
- [ ] User management API
- [ ] File upload service
- [ ] Basic CRUD for all entities

### 17.3 Phase 3: Real-time Features (Weeks 5-6)
- [ ] WebSocket server setup
- [ ] Chat messaging
- [ ] Presence system
- [ ] Push notifications

### 17.4 Phase 4: Frontend Migration (Weeks 7-9)
- [ ] New API client
- [ ] Migrate page by page
- [ ] Update authentication flow
- [ ] Test all features

### 17.5 Phase 5: Admin & Tools (Week 10)
- [ ] Admin dashboard updates
- [ ] Data migration scripts
- [ ] Monitoring setup

### 17.6 Phase 6: Testing & Polish (Weeks 11-12)
- [ ] Unit tests
- [ ] Integration tests
- [ ] E2E tests
- [ ] Performance testing
- [ ] Security audit

### 17.7 Phase 7: Deployment (Week 13)
- [ ] CI/CD pipelines
  - [ ] GitHub Actions workflows
  - [ ] Docker image building and pushing
  - [ ] Automated testing before deployment
- [ ] Container infrastructure
  - [ ] Multi-stage Dockerfiles (`infrastructure/docker/Dockerfile.api`, `Dockerfile.web`)
  - [ ] Production Docker Compose (`docker-compose.prod.yml`)
  - [ ] Kubernetes manifests (`infrastructure/kubernetes/`)
- [ ] Staging deployment
  - [ ] Deploy to staging environment
  - [ ] Run smoke tests
  - [ ] Performance validation
- [ ] Data migration
  - [ ] Backup existing Base44 data
  - [ ] Run Prisma migrations
  - [ ] Seed initial data
  - [ ] Verify data integrity
- [ ] Production deployment
  - [ ] Deploy using universal installer script
  - [ ] SSL certificate configuration
  - [ ] Database migration execution
  - [ ] Health check verification
- [ ] DNS cutover
  - [ ] Update DNS records
  - [ ] Monitor traffic
  - [ ] Rollback plan ready

### 17.8 Phase 8: Universal Deployment & Free Hosting (Week 14)
- [ ] One-command installation scripts (Linux/macOS/Windows)
  - [ ] Bash installer (`install-anywhere.sh`) with auto OS detection
  - [ ] PowerShell installer (`install-anywhere.ps1`) for Windows
  - [ ] Automated Docker installation
  - [ ] Secure secret generation
- [ ] All-in-one Docker deployment
  - [ ] Self-contained compose file with database included
  - [ ] Memory optimization (275MB minimum)
  - [ ] PostgreSQL performance tuning for containers
  - [ ] Redis with memory limits
- [ ] Cloud-agnostic architecture validation
  - [ ] Test deployment on multiple cloud providers
  - [ ] Verify no cloud-specific dependencies
  - [ ] Validate Kubernetes manifests
- [ ] Free hosting deployment guides
  - [ ] Render.com setup (recommended, $0/month)
  - [ ] Railway.app deployment ($5 credit/month)
  - [ ] Fly.io configuration (3 free VMs)
  - [ ] Oracle Cloud free tier (24GB RAM forever)
  - [ ] Supabase integration for PostgreSQL
- [ ] Production deployment automation
  - [ ] Pre-configured environment templates
  - [ ] Automatic SSL certificate generation
  - [ ] Database migration automation
  - [ ] Health check verification
  - [ ] Rollback procedures
- [ ] Monitoring for containerized deployment
  - [ ] Container resource monitoring
  - [ ] Log aggregation setup
  - [ ] Performance metrics collection
  - [ ] Alert configuration

---

## 18. Risk Assessment

### 18.1 Technical Risks

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Data loss during migration | High | Low | Multiple backups, test migrations |
| WebSocket scalability issues | Medium | Medium | Redis pub/sub, horizontal scaling |
| Authentication vulnerabilities | High | Low | Security audit, penetration testing |
| Performance degradation | Medium | Medium | Load testing, caching strategy |

### 18.2 Business Risks

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Extended downtime | High | Low | Blue-green deployment, rollback plan |
| User data privacy issues | High | Low | GDPR compliance, encryption |
| Feature parity gaps | Medium | Medium | Comprehensive testing checklist |

### 18.3 Rollback Plan

1. Keep Base44 environment active during transition
2. Maintain database snapshots before migration
3. Feature flags for gradual rollout
4. DNS-based traffic switching for instant rollback

---

## Appendix A: Environment Variables

```bash
# .env.example

# Application
NODE_ENV=development
PORT=3000
FRONTEND_URL=http://localhost:5173

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/bellor

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your-super-secret-key-min-32-chars
JWT_REFRESH_SECRET=another-super-secret-key-min-32-chars

# Storage (Cloudflare R2)
R2_ENDPOINT=https://xxx.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=xxx
R2_SECRET_ACCESS_KEY=xxx
R2_BUCKET=bellor-media
CDN_URL=https://media.bellor.app

# Email (SendGrid)
SENDGRID_API_KEY=xxx
EMAIL_FROM=noreply@bellor.app

# SMS (Twilio)
TWILIO_ACCOUNT_SID=xxx
TWILIO_AUTH_TOKEN=xxx
TWILIO_PHONE_NUMBER=+1234567890

# OAuth
GOOGLE_CLIENT_ID=xxx
GOOGLE_CLIENT_SECRET=xxx
APPLE_CLIENT_ID=xxx
APPLE_TEAM_ID=xxx
APPLE_KEY_ID=xxx

# Monitoring
SENTRY_DSN=xxx
LOG_LEVEL=info
```

---

## Appendix B: Useful Commands

```bash
# Development
pnpm dev                    # Start all services
pnpm dev --filter api       # Start API only
pnpm dev --filter web       # Start frontend only

# Database
pnpm prisma migrate dev     # Run migrations
pnpm prisma studio          # Open Prisma Studio
pnpm prisma generate        # Generate Prisma client

# Testing
pnpm test                   # Run all tests
pnpm test:unit             # Run unit tests
pnpm test:e2e              # Run E2E tests
pnpm test:coverage         # Generate coverage report

# Build
pnpm build                  # Build all packages
pnpm build --filter api     # Build API only
pnpm build --filter web     # Build frontend only

# Deployment
pnpm docker:build           # Build Docker images
pnpm docker:push            # Push to registry
pnpm deploy:staging         # Deploy to staging
pnpm deploy:production      # Deploy to production
```

---

**Document Version:** 1.0
**Last Updated:** February 2026
**Author:** Bellor Development Team
