# Bellor MVP — Security Audit Checklist

**Version:** 1.0.0
**Date:** February 5, 2026

Use this checklist before every release to verify security controls are in place.

---

## 1. Input Validation

- [ ] All text fields sanitize HTML/script tags (server-side)
- [ ] Output encoding applied before rendering user content
- [ ] Whitelist character validation on all text inputs
- [ ] Field length limits enforced (server-side)
- [ ] XSS payloads blocked: `<script>`, `onerror=`, `javascript:`, `onload=`
- [ ] SQL injection payloads blocked: `OR 1=1`, `UNION SELECT`, `'; DROP`
- [ ] NoSQL injection patterns blocked: `$gt`, `$ne`, `$where`
- [ ] Command injection chars blocked: `;`, `|`, `&`, `` ` ``, `$()`
- [ ] Template injection blocked: `{{`, `${`, `<%`
- [ ] Prototype pollution blocked: `__proto__`, `constructor`, `prototype`
- [ ] Base64-encoded scripts in text fields blocked
- [ ] Data URIs in text fields blocked
- [ ] Null bytes and control characters stripped

## 2. File Uploads

- [ ] Magic bytes validation on all file uploads
- [ ] MIME type validated (Content-Type header + actual content)
- [ ] Extension whitelist enforced (no exe, php, svg, etc.)
- [ ] SVG files always rejected
- [ ] EXIF/metadata stripped from images
- [ ] Images re-encoded through sharp (neutralizes hidden payloads)
- [ ] File size limits enforced per type
- [ ] Image resolution limits enforced (max 4096x4096)
- [ ] Random filenames generated (UUID + hash)
- [ ] Path traversal characters stripped (`../`)
- [ ] Double extension attacks blocked (`photo.jpg.php`)
- [ ] Audio files validated (format, duration, size)
- [ ] Upload rate limiting active (max 10/minute per user)
- [ ] Files quarantined until validation passes

## 3. Authentication

- [ ] Passwords hashed with bcrypt (12+ rounds)
- [ ] JWT tokens signed with 32+ character secret
- [ ] Access tokens expire in 15 minutes
- [ ] Refresh tokens stored in Redis with TTL
- [ ] Session invalidation on password change
- [ ] Brute force protection active (lockout after 5 attempts)
- [ ] Failed login attempts logged with IP and user agent
- [ ] Password strength requirements enforced

## 4. HTTP Security Headers

- [ ] Content-Security-Policy set (no `unsafe-eval`)
- [ ] X-Content-Type-Options: nosniff
- [ ] X-Frame-Options: DENY
- [ ] Strict-Transport-Security (HSTS) enabled
- [ ] Referrer-Policy: strict-origin-when-cross-origin
- [ ] Permissions-Policy restricts unnecessary features
- [ ] Cross-Origin-Embedder-Policy set
- [ ] Cross-Origin-Opener-Policy set
- [ ] Cross-Origin-Resource-Policy set
- [ ] Server header removed / hidden

## 5. API Security

- [ ] Global rate limiting active
- [ ] Per-endpoint rate limiting on sensitive routes
- [ ] Request body size limited (1MB default, 15MB uploads)
- [ ] Zod schema validation on all endpoints
- [ ] CORS whitelist configured (no wildcard in production)
- [ ] Request IDs generated for tracing
- [ ] Error messages generic (no stack traces to client)
- [ ] GraphQL complexity limits (if applicable)

## 6. Container Security

- [ ] Multi-stage Docker builds (no dev dependencies in production)
- [ ] Containers run as non-root user
- [ ] Read-only filesystem (except /tmp)
- [ ] `no-new-privileges` flag set
- [ ] All capabilities dropped, only necessary ones added
- [ ] Resource limits set (CPU, memory)
- [ ] Network segmentation in place
- [ ] No SSH access to production containers
- [ ] Docker images scanned for vulnerabilities
- [ ] .dockerignore blocks sensitive files

## 7. Data Protection

- [ ] TLS enforced on all connections
- [ ] No secrets hardcoded in code
- [ ] No secrets in Dockerfiles
- [ ] Environment variables from secure source
- [ ] PII data minimized
- [ ] Account deletion fully implemented
- [ ] Audit logging on sensitive data access

## 8. Monitoring

- [ ] Security events logged (auth failures, blocked inputs, rate limits)
- [ ] Structured logging with IP, user agent, timestamp
- [ ] Alert thresholds configured for suspicious patterns
- [ ] npm audit run regularly
- [ ] Docker image scan in CI/CD pipeline

---

**Reviewer:** _______________
**Date:** _______________
**Pass/Fail:** _______________
