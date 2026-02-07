#!/bin/bash
# ==================================
# Bellor MVP - Security Scan Script
# ==================================
# Runs automated security checks on the codebase
# Usage: bash scripts/security-scan.sh

set -e

echo "========================================"
echo "  Bellor Security Scan"
echo "  $(date '+%Y-%m-%d %H:%M:%S')"
echo "========================================"

ERRORS=0
WARNINGS=0

# ─── 1. npm audit ──────────────────────────────
echo ""
echo "[1/6] Running npm audit..."
echo "----------------------------------------"
if npm audit --production 2>/dev/null; then
  echo "✅ No known vulnerabilities in production dependencies"
else
  echo "⚠️  Vulnerabilities found — review npm audit output"
  WARNINGS=$((WARNINGS + 1))
fi

# ─── 2. Check for hardcoded secrets ───────────
echo ""
echo "[2/6] Checking for hardcoded secrets..."
echo "----------------------------------------"

SECRET_PATTERNS=(
  "password\s*=\s*['\"](?!.*\$\{)"
  "secret\s*=\s*['\"](?!.*\$\{)"
  "api_key\s*=\s*['\"]"
  "-----BEGIN.*PRIVATE KEY-----"
  "AKIA[0-9A-Z]{16}"
)

FOUND_SECRETS=0
for pattern in "${SECRET_PATTERNS[@]}"; do
  if grep -rniE "$pattern" apps/ packages/ --include="*.ts" --include="*.js" --include="*.tsx" --include="*.jsx" \
    --exclude-dir=node_modules --exclude-dir=dist --exclude-dir=coverage \
    --exclude="*.test.*" --exclude="*.spec.*" 2>/dev/null | \
    grep -v "process.env" | grep -v "\.example" | grep -v "placeholder" | head -5; then
    FOUND_SECRETS=1
  fi
done

if [ $FOUND_SECRETS -eq 0 ]; then
  echo "✅ No hardcoded secrets detected"
else
  echo "⚠️  Potential hardcoded secrets found — review above"
  WARNINGS=$((WARNINGS + 1))
fi

# ─── 3. Check .env files not tracked ─────────
echo ""
echo "[3/6] Checking .env files..."
echo "----------------------------------------"
if git ls-files --cached | grep -E "^\.env$|^apps/.*\.env$" | grep -v example 2>/dev/null; then
  echo "❌ .env files tracked in git — remove them!"
  ERRORS=$((ERRORS + 1))
else
  echo "✅ No .env files tracked in git"
fi

# ─── 4. Check for eval() usage ───────────────
echo ""
echo "[4/6] Checking for dangerous function usage..."
echo "----------------------------------------"
DANGEROUS_FOUND=0

if grep -rnE "\beval\s*\(" apps/ packages/ --include="*.ts" --include="*.js" --include="*.tsx" --include="*.jsx" \
  --exclude-dir=node_modules --exclude-dir=dist 2>/dev/null; then
  echo "⚠️  eval() usage found"
  DANGEROUS_FOUND=1
fi

if grep -rnE "innerHTML\s*=" apps/ packages/ --include="*.ts" --include="*.js" --include="*.tsx" --include="*.jsx" \
  --exclude-dir=node_modules --exclude-dir=dist 2>/dev/null; then
  echo "⚠️  innerHTML usage found"
  DANGEROUS_FOUND=1
fi

if grep -rnE "dangerouslySetInnerHTML" apps/ packages/ --include="*.tsx" --include="*.jsx" \
  --exclude-dir=node_modules --exclude-dir=dist 2>/dev/null; then
  echo "⚠️  dangerouslySetInnerHTML usage found"
  DANGEROUS_FOUND=1
fi

if [ $DANGEROUS_FOUND -eq 0 ]; then
  echo "✅ No dangerous function usage detected"
else
  WARNINGS=$((WARNINGS + 1))
fi

# ─── 5. Check Docker security ────────────────
echo ""
echo "[5/6] Checking Docker configuration..."
echo "----------------------------------------"

# Check if Dockerfiles run as non-root
if grep -L "USER " infrastructure/docker/Dockerfile.* 2>/dev/null; then
  echo "⚠️  Some Dockerfiles may run as root"
  WARNINGS=$((WARNINGS + 1))
else
  echo "✅ All Dockerfiles use non-root user"
fi

# Check for no-new-privileges in compose
if grep -q "no-new-privileges" docker-compose.prod.yml 2>/dev/null; then
  echo "✅ Production compose has no-new-privileges"
else
  echo "⚠️  Production compose missing no-new-privileges"
  WARNINGS=$((WARNINGS + 1))
fi

# ─── 6. Check security headers ───────────────
echo ""
echo "[6/6] Checking security headers configuration..."
echo "----------------------------------------"

HEADERS_OK=0
for header in "X-Frame-Options" "X-Content-Type-Options" "Content-Security-Policy" "Referrer-Policy"; do
  if grep -q "$header" infrastructure/docker/nginx-production.conf 2>/dev/null || \
     grep -q "$header" apps/api/src/security/headers.ts 2>/dev/null || \
     grep -q "$header" apps/api/src/config/security.config.ts 2>/dev/null; then
    HEADERS_OK=$((HEADERS_OK + 1))
  else
    echo "⚠️  Missing header: $header"
    WARNINGS=$((WARNINGS + 1))
  fi
done

if [ $HEADERS_OK -eq 4 ]; then
  echo "✅ All critical security headers configured"
fi

# ─── Summary ─────────────────────────────────
echo ""
echo "========================================"
echo "  Scan Complete"
echo "  Errors:   $ERRORS"
echo "  Warnings: $WARNINGS"
echo "========================================"

if [ $ERRORS -gt 0 ]; then
  exit 1
fi

exit 0
