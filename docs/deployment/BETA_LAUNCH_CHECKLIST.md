# Bellor Beta Launch Checklist (Phase 11)

**Created:** February 19, 2026
**Target:** 100 beta users
**Status:** Pre-Beta

---

## Pre-Launch (Before Inviting Users)

### Infrastructure
- [x] PROD server live (prod.bellor.app - Oracle Cloud)
- [x] QA server live (qa.bellor.app - Oracle Cloud)
- [x] SSL certificates (Let's Encrypt)
- [x] PostgreSQL 16 + Redis 7 running
- [x] PM2 process manager with auto-restart
- [ ] Server monitoring alerts (uptime, CPU, memory, disk)
- [ ] Database backup verification (restore test)
- [ ] Rate limiting tuned for 100 concurrent users

### Application
- [x] All PRD Section 4 features implemented (4.1-4.14)
- [x] 2,433 automated tests passing (0 failures)
- [x] Security checklist 79/79 (100%)
- [ ] Load test with 100 simulated users (`npm run load:sustained`)
- [ ] Error tracking service configured (Sentry or similar)
- [ ] Analytics configured (user events, session tracking)

### Content & Data
- [ ] Seed database with realistic demo profiles (10-20)
- [ ] Create initial daily missions for first 2 weeks
- [ ] Prepare welcome message / onboarding email template
- [ ] Privacy Policy and Terms of Service reviewed by legal

### Mobile (if beta includes mobile)
- [ ] Android keystore generated
- [ ] APK/AAB built and tested on 3+ devices
- [ ] Push notifications working end-to-end
- [ ] TestFlight / Google Play Internal Testing track configured

---

## Launch Day

### Invite Process
- [ ] Define invite method (email, link, code)
- [ ] Create landing page or invite flow
- [ ] Send invites to first batch (10-20 users)
- [ ] Monitor server health during first hour

### Monitoring
- [ ] Watch PM2 logs: `pm2 logs bellor-api`
- [ ] Monitor memory: should stay under 800MB RSS
- [ ] Watch for 5xx errors in Nginx access logs
- [ ] Check WebSocket connections count
- [ ] Monitor database connection pool

---

## Post-Launch (First 2 Weeks)

### Daily Checks
- [ ] Review error logs
- [ ] Check user registrations count
- [ ] Monitor response times (target: p95 < 200ms)
- [ ] Check disk space (uploads)

### Weekly Checks
- [ ] User retention (DAU/WAU)
- [ ] Feature usage breakdown
- [ ] Bug reports from users
- [ ] Server resource trends

### Feedback Collection
- [ ] In-app feedback form (already implemented: Feedback page)
- [ ] Direct communication channel (WhatsApp group / Discord)
- [ ] Weekly summary of user feedback

---

## Success Criteria (Phase 11 Complete)

| Metric | Target |
|--------|--------|
| Registered users | 100+ |
| Daily active users | 30+ |
| Avg session duration | > 5 min |
| Server uptime | > 99% |
| Critical bugs | 0 unresolved |
| User satisfaction | > 4/5 average |
| Onboarding completion | > 60% |
