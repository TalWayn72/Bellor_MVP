#!/bin/bash
# ==================================
# Bellor MVP - Dependency Audit Script
# ==================================
# Checks all dependencies for known vulnerabilities
# Usage: bash scripts/dependency-audit.sh

set -e

echo "========================================"
echo "  Bellor Dependency Audit"
echo "  $(date '+%Y-%m-%d %H:%M:%S')"
echo "========================================"

# ─── 1. Root project audit ───────────────────
echo ""
echo "[1/3] Auditing root project dependencies..."
echo "----------------------------------------"
npm audit --production 2>&1 || true

# ─── 2. API project audit ───────────────────
echo ""
echo "[2/3] Auditing API dependencies..."
echo "----------------------------------------"
cd apps/api
npm audit --production 2>&1 || true
cd ../..

# ─── 3. Web project audit ───────────────────
echo ""
echo "[3/3] Auditing Web dependencies..."
echo "----------------------------------------"
cd apps/web
npm audit --production 2>&1 || true
cd ../..

# ─── 4. Check for outdated packages ─────────
echo ""
echo "Checking for outdated packages..."
echo "----------------------------------------"
npm outdated 2>&1 || true

# ─── 5. License check ───────────────────────
echo ""
echo "Checking dependency licenses..."
echo "----------------------------------------"
echo "Note: For production, consider running 'npx license-checker --production --failOn' with restricted license list"

echo ""
echo "========================================"
echo "  Audit Complete"
echo "  Review any vulnerabilities above"
echo "  Run 'npm audit fix' to auto-fix where possible"
echo "========================================"
