# Bellor MVP — Security Hardening Plan

**Version:** 1.0.0
**Date:** February 5, 2026
**Status:** Implementation Phase
**Compliance:** OWASP Top 10, OWASP ASVS Level 2, CWE/SANS Top 25, NIST SP 800-53, CIS Docker Benchmark, GDPR

---

## Table of Contents

1. [Overview](#1-overview)
2. [Threat Model](#2-threat-model)
3. [Injection Prevention](#3-injection-prevention)
4. [Media Security](#4-media-security)
5. [Container Hardening](#5-container-hardening)
6. [Application Security](#6-application-security)
7. [Data Protection & Privacy](#7-data-protection--privacy)
8. [Monitoring & Incident Response](#8-monitoring--incident-response)
9. [Implementation Phases](#9-implementation-phases)
10. [File Structure](#10-file-structure)

---

## 1. Overview

### 1.1 Project Context

Bellor is a dating/social application handling **sensitive personal data** including:
- Personal identifiable information (PII): name, email, birth date, gender
- Profile images with potential GPS/EXIF metadata
- Voice recordings
- Private chat messages
- Location preferences
- Behavioral data (likes, matches, interactions)

### 1.2 Security Principles

| Principle | Implementation |
|-----------|---------------|
| **Defense in Depth** | Multiple layers of security at every boundary |
| **Least Privilege** | Minimal permissions for containers, users, processes |
| **Zero Trust** | Never trust client input; validate everything server-side |
| **Fail Secure** | On error, deny access rather than allow |
| **Privacy by Design** | Minimize data collection; encrypt at rest and in transit |

### 1.3 Compliance Standards

| Standard | Scope |
|----------|-------|
| **OWASP Top 10 (2021)** | All 10 categories — especially Injection, Broken Access Control, Security Misconfiguration |
| **OWASP ASVS Level 2** | Application Security Verification Standard for apps handling sensitive PII |
| **CWE/SANS Top 25** | Most dangerous software weaknesses |
| **NIST SP 800-53** | Security controls for containers and infrastructure |
| **CIS Docker Benchmark** | Container hardening |
| **GDPR / Privacy by Design** | Personal data protection — mandatory for dating apps |

---

## 2. Threat Model

### 2.1 Attack Surfaces

| Surface | Risk Level | Vectors |
|---------|-----------|---------|
| Text input fields (bio, chat, search) | **Critical** | XSS, SQL/NoSQL injection, template injection |
| Image uploads | **Critical** | Malicious files, EXIF injection, polyglot attacks |
| Audio uploads | **High** | Malformed files, resource exhaustion |
| Authentication | **Critical** | Brute force, credential stuffing, token theft |
| API endpoints | **High** | Rate abuse, IDOR, privilege escalation |
| WebSocket | **High** | Message injection, connection flooding |
| Container | **Medium** | Privilege escalation, escape attacks |

### 2.2 Attacker Profiles

- **Script kiddie** — automated scanning, known exploits
- **Malicious user** — abusing platform features for harassment/spam
- **Data harvester** — scraping profiles, images, personal data
- **Targeted attacker** — seeking specific user data

---

## 3. Injection Prevention

### 3.1 Text Input Security

Every text field (name, bio, chat messages, hobbies, search) must pass through:

**Server-side (Fastify middleware):**
- Input sanitization — strip HTML/script tags from all input
- Output encoding — HTML entity encoding before storage
- Whitelist validation — only allowed characters (letters, numbers, basic punctuation, emojis)
- Length limits — hard limits per field type
- Rate limiting — per-user, per-endpoint request throttling

**Attack types blocked:**
- **XSS** (Stored, Reflected, DOM-based)
- **SQL Injection** — parameterized queries via Prisma ORM + additional validation
- **NoSQL Injection** — pattern blocking for MongoDB-style operators
- **Command Injection** — block shell metacharacters (`;`, `|`, `&`, `` ` ``, `$()`)
- **Template Injection (SSTI)** — block `{{`, `${`, `<%` patterns
- **Prototype Pollution** — block `__proto__`, `constructor`, `prototype` in JSON

### 3.2 Paste/Clipboard Protection (Client-side)

- Block paste of binary data into text fields
- Detect and block Base64-encoded content in text input
- Block Data URIs (`data:image/...`, `data:application/...`)
- Limit clipboard paste size (max 5,000 characters)
- Block file drag-and-drop onto text fields
- Strip null bytes (`\x00`) and control characters
- Block polyglot payloads

### 3.3 Configuration per Field

| Field | Max Length | Allowed Pattern | Rate Limit |
|-------|-----------|-----------------|------------|
| firstName | 50 | Letters, spaces, hyphens, apostrophes | — |
| lastName | 50 | Letters, spaces, hyphens, apostrophes | — |
| bio | 500 | Text, emojis, basic punctuation | — |
| chatMessage | 2000 | Text, emojis, basic punctuation | 30/min |
| search | 100 | Alphanumeric, spaces | 60/min |
| hobbies | 100 per item | Text, emojis | — |

---

## 4. Media Security

### 4.1 Image Upload Security

| Check | Implementation |
|-------|---------------|
| Magic bytes validation | Verify file header matches claimed type |
| MIME type validation | Check Content-Type + actual content |
| Extension whitelist | Only: jpg, jpeg, png, webp, heic |
| SVG blocked | SVG can contain JavaScript — always reject |
| EXIF stripping | Remove all metadata including GPS via sharp |
| Re-encoding | Decode and re-encode with sharp to neutralize payloads |
| Size limit | Max 10MB per image, max 6 profile images |
| Resolution limit | Max 4096x4096 pixels (prevent decompression bombs) |
| Random filenames | UUID + hash, never use original filename |
| Path traversal prevention | Strip `../` and special characters from paths |

**Blocked attacks:**
- ImageMagick CVEs (ImageTragick)
- Steganography payloads
- EXIF-based code injection
- Polyglot files (image + HTML/JS)
- Decompression bombs
- Double extension attacks (`photo.jpg.php`)

### 4.2 Audio Upload Security

| Check | Implementation |
|-------|---------------|
| Format whitelist | Only: wav, mp3, ogg, m4a, webm (audio only) |
| Magic bytes validation | Verify actual audio content |
| Duration limit | Max 60 seconds |
| Size limit | Max 5MB |
| Metadata stripping | Remove all metadata |
| Video stream rejection | Reject files with video streams when audio-only expected |

### 4.3 Upload Pipeline

```
Client upload → Rate limit check → Auth check → File type validation →
Magic bytes check → Size/dimension check → Virus scan (future) →
Re-encode → EXIF strip → Random filename → Upload to storage →
Return secure URL
```

---

## 5. Container Hardening

### 5.1 Dockerfile Security (CIS Docker Benchmark)

- Multi-stage builds — separate build and runtime stages
- Non-root user — containers never run as root
- Minimal base image — Alpine-based
- No unnecessary tools — remove package managers in production
- Pin image digests — use SHA256 digests, not `latest` tags
- Health checks — all containers have health check endpoints

### 5.2 Docker Compose Production Security

- `no-new-privileges: true` — prevent privilege escalation
- `read_only: true` — read-only filesystem (except `/tmp`)
- `cap_drop: ALL` — drop all Linux capabilities
- `cap_add: [NET_BIND_SERVICE]` — add only what's needed
- Resource limits — CPU, memory, file descriptors
- Network segmentation — internal networks, no direct internet exposure
- Secrets via Docker secrets or environment from files

### 5.3 .dockerignore

Block sensitive files from Docker context:
- `.git/`, `.env`, `node_modules/`, `coverage/`, `*.md`
- Test files, IDE configs, credentials

---

## 6. Application Security

### 6.1 Authentication & Session Management

| Control | Status | Implementation |
|---------|--------|---------------|
| bcrypt password hashing | ✅ Exists | 12 salt rounds |
| JWT with strong signing | ✅ Exists | HS256 with 32+ char secret |
| Token rotation | ✅ Exists | Refresh tokens with 7-day TTL |
| Session invalidation | ✅ Exists | Redis-based, invalidate on password change |
| Brute force protection | **NEW** | Lockout after 5 failed attempts (15 min) |
| Login attempt logging | **NEW** | Log all auth events with IP, user agent |
| Password strength validation | **NEW** | Min 8 chars, uppercase, lowercase, number, special |

### 6.2 HTTP Security Headers

| Header | Value |
|--------|-------|
| Content-Security-Policy | `default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' wss:; font-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'` |
| X-Content-Type-Options | `nosniff` |
| X-Frame-Options | `DENY` |
| X-XSS-Protection | `0` (disabled — CSP supersedes) |
| Strict-Transport-Security | `max-age=31536000; includeSubDomains; preload` |
| Referrer-Policy | `strict-origin-when-cross-origin` |
| Permissions-Policy | `camera=(), microphone=(), geolocation=(), payment=()` |
| Cross-Origin-Embedder-Policy | `require-corp` |
| Cross-Origin-Opener-Policy | `same-origin` |
| Cross-Origin-Resource-Policy | `same-origin` |

### 6.3 API Security

- Rate limiting — global (100/min) + per-endpoint + per-user
- Request size limits — 1MB body default, 15MB for uploads
- Input schema validation — Zod on every endpoint
- CORS — strict whitelist of allowed origins
- Request ID — UUID per request for tracing
- Generic error messages — no internal details exposed to clients
- Request logging — all requests with IP, method, path, status, duration

### 6.4 CSRF Protection

- Double-submit cookie pattern for state-changing requests
- SameSite=Strict cookies
- Origin/Referer header validation

---

## 7. Data Protection & Privacy

### 7.1 GDPR Compliance

| Requirement | Implementation |
|-------------|---------------|
| Data minimization | Collect only necessary PII |
| Encryption at rest | AES-256 for sensitive fields |
| Encryption in transit | TLS 1.2+ enforced |
| Right to deletion | Full account deletion endpoint |
| Audit logging | All access to sensitive data logged |
| Data retention | Auto-delete inactive data per policy |
| Consent management | Explicit consent for data processing |

### 7.2 Key Management

- No hardcoded secrets in code or Dockerfiles
- Environment variables loaded from secure sources
- JWT secrets minimum 32 characters
- Regular key rotation schedule

---

## 8. Monitoring & Incident Response

### 8.1 Security Logging

All security events are logged with structured data:
- Authentication events (login, logout, failed attempts)
- Authorization failures (forbidden access attempts)
- Input validation failures (blocked payloads)
- File upload rejections (invalid files)
- Rate limit triggers
- Suspicious patterns (rapid requests, unusual user agents)

### 8.2 Alerting

- Brute force attempts (>5 failed logins from same IP)
- Mass upload attempts (>10 uploads/minute)
- Repeated blocked payloads from same source
- Unusual traffic patterns

### 8.3 Automated Scanning

- Weekly `npm audit` for dependency vulnerabilities
- Docker image scanning with Trivy before deployment
- Dependency pinning in package-lock.json

---

## 9. Implementation Phases

### Phase 1: Core Security Modules
- `security.config.ts` — central configuration
- `input-sanitizer.ts` — text input sanitization
- `file-validator.ts` — file upload validation
- `headers.ts` — security headers
- `logger.ts` — security event logging

### Phase 2: Media Processing
- `image-processor.ts` — image validation, EXIF stripping, re-encoding
- `audio-processor.ts` — audio validation and processing

### Phase 3: Middleware & Auth
- `security.middleware.ts` — global security middleware
- `upload.middleware.ts` — upload-specific validation
- `auth-hardening.ts` — brute force protection
- `rate-limiter.ts` — per-endpoint rate limiting
- `csrf-protection.ts` — CSRF token management

### Phase 4: Frontend Security
- `paste-guard.ts` — clipboard/paste protection
- `useSecureInput` hook — secure text input handling
- `useSecureUpload` hook — secure file upload handling
- Secure React components (SecureTextInput, SecureTextArea, SecureImageUpload, SecureAudioRecorder)

### Phase 5: Container Hardening
- Hardened Dockerfiles
- Production docker-compose with security controls
- nginx security headers configuration
- `.dockerignore` optimization

### Phase 6: Scripts & CI
- `security-scan.sh` — automated security scanning
- `dependency-audit.sh` — dependency vulnerability checking
- CI/CD pipeline security integration

---

## 10. File Structure

```
Bellor_MVP/
├── docs/
│   ├── SECURITY_PLAN.md              # This document
│   ├── SECURITY_CHECKLIST.md         # Security audit checklist
│   └── INCIDENT_RESPONSE.md         # Incident response procedures
├── apps/
│   ├── api/
│   │   └── src/
│   │       ├── config/
│   │       │   └── security.config.ts    # Central security config
│   │       ├── security/
│   │       │   ├── index.ts              # Barrel exports
│   │       │   ├── input-sanitizer.ts    # Text input sanitization
│   │       │   ├── file-validator.ts     # File upload validation
│   │       │   ├── image-processor.ts    # Image security processing
│   │       │   ├── audio-processor.ts    # Audio security processing
│   │       │   ├── rate-limiter.ts       # Rate limiting configs
│   │       │   ├── headers.ts            # Security headers
│   │       │   ├── logger.ts             # Security event logging
│   │       │   ├── csrf-protection.ts    # CSRF protection
│   │       │   └── auth-hardening.ts     # Auth hardening (brute force)
│   │       └── middleware/
│   │           ├── security.middleware.ts # Global security middleware
│   │           └── upload.middleware.ts   # Upload validation middleware
│   └── web/
│       └── src/
│           ├── security/
│           │   ├── paste-guard.ts        # Paste/clipboard protection
│           │   └── input-sanitizer.ts    # Client-side sanitization
│           ├── hooks/
│           │   ├── useSecureInput.ts     # Secure input hook
│           │   └── useSecureUpload.ts    # Secure upload hook
│           └── components/
│               └── secure/
│                   ├── SecureTextInput.tsx
│                   ├── SecureTextArea.tsx
│                   ├── SecureImageUpload.tsx
│                   └── SecureAudioRecorder.tsx
├── infrastructure/
│   └── docker/
│       ├── Dockerfile.api               # Hardened API Dockerfile
│       ├── Dockerfile.web               # Hardened Web Dockerfile
│       └── nginx-production.conf        # Security headers in nginx
├── scripts/
│   ├── security-scan.sh                 # Security scanning script
│   └── dependency-audit.sh              # Dependency audit script
├── docker-compose.prod.yml              # Production compose with security
└── .dockerignore                        # Optimized ignore rules
```

---

**Document maintained by:** Bellor Security Team
**Last updated:** February 5, 2026
