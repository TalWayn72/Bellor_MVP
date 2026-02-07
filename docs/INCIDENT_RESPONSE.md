# Bellor MVP — Incident Response Plan

**Version:** 1.0.0
**Date:** February 5, 2026

---

## 1. Severity Levels

| Level | Description | Response Time | Examples |
|-------|-------------|---------------|----------|
| **P1 — Critical** | Active breach, data exposure | Immediate (< 15 min) | Data leak, account takeover, SQL injection exploit |
| **P2 — High** | Potential breach, active attack | < 1 hour | Brute force attack, suspicious data access patterns |
| **P3 — Medium** | Vulnerability discovered | < 24 hours | New CVE in dependency, misconfiguration found |
| **P4 — Low** | Minor issue, no immediate risk | < 1 week | Non-critical dependency update, informational finding |

---

## 2. Detection

### 2.1 Automated Detection

| Monitor | Alert Condition |
|---------|----------------|
| Failed logins | > 5 failures from same IP in 5 minutes |
| Rate limit triggers | > 100 blocks from same IP in 10 minutes |
| Blocked payloads | > 3 blocked injection attempts from same user |
| Upload rejections | > 10 rejected uploads from same user |
| Error rate spike | > 5% error rate (5xx responses) |
| Unusual traffic | 3x normal request volume |

### 2.2 Manual Detection

- Review security logs daily
- Monitor npm audit reports weekly
- Check Docker image scan results before each deploy
- Review access patterns monthly

---

## 3. Response Procedures

### 3.1 P1 — Critical Incident

1. **Contain** — Immediately block attacking IP/user
2. **Assess** — Determine scope of breach
3. **Preserve evidence** — Save logs, don't modify affected systems
4. **Notify** — Alert all team members
5. **Mitigate** — Apply hotfix or disable affected feature
6. **Investigate** — Root cause analysis
7. **Recover** — Restore from clean backup if needed
8. **Report** — Document timeline and actions taken
9. **GDPR notification** — If personal data exposed, notify within 72 hours

### 3.2 P2 — High Priority

1. **Monitor** — Increase logging on affected area
2. **Block** — Block attacking source if identified
3. **Investigate** — Determine if breach occurred
4. **Patch** — Apply fix within SLA
5. **Review** — Check for similar vulnerabilities
6. **Document** — Record findings and actions

### 3.3 P3/P4 — Medium/Low

1. **Assess** — Evaluate actual risk
2. **Prioritize** — Schedule fix based on risk
3. **Fix** — Apply patch within SLA
4. **Verify** — Confirm fix resolves issue
5. **Document** — Update security documentation

---

## 4. Communication

### 4.1 Internal Communication

- All incidents logged in incident tracking system
- P1/P2 incidents communicated via team chat immediately
- Post-incident review within 48 hours of resolution

### 4.2 External Communication (if required)

- User notification if personal data affected
- Regulatory notification within 72 hours (GDPR)
- Public disclosure only after fix is deployed

---

## 5. Post-Incident

### 5.1 Review Checklist

- [ ] Root cause identified
- [ ] Fix verified and deployed
- [ ] Similar vulnerabilities checked across codebase
- [ ] Security controls updated to prevent recurrence
- [ ] Documentation updated
- [ ] Monitoring/alerts updated
- [ ] Team debriefed

### 5.2 Incident Report Template

```
## Incident Report

**Date:** YYYY-MM-DD
**Severity:** P1/P2/P3/P4
**Status:** Active / Resolved

### Summary
Brief description of the incident.

### Timeline
- HH:MM — Detection
- HH:MM — Response started
- HH:MM — Containment
- HH:MM — Resolution

### Root Cause
What caused the incident.

### Impact
- Users affected: N
- Data exposed: Y/N
- Services affected: list

### Actions Taken
1. Action 1
2. Action 2

### Prevention
Steps to prevent recurrence.

### Lessons Learned
Key takeaways.
```

---

## 6. Contact Information

| Role | Responsibility |
|------|---------------|
| Project Lead | Final decision maker, external communication |
| Backend Developer | API, database, auth investigation |
| Frontend Developer | Client-side security, UI investigation |
| DevOps | Infrastructure, container, network investigation |

---

**Document maintained by:** Bellor Security Team
**Last updated:** February 5, 2026
