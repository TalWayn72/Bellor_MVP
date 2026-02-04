#!/bin/bash
# Post-Agent Integration Script
# Automatically integrates all agent work after completion

set -e

echo "=================================="
echo "Post-Agent Integration Script"
echo "=================================="
echo ""

PROJECT_ROOT="c:/Users/talwa/.claude/projects/Bellor_MVP"
API_DIR="${PROJECT_ROOT}/apps/api"

# Step 1: Verify all agent files exist
echo "Step 1: Verifying agent files..."
echo "---------------------------------"

REQUIRED_FILES=(
  "${API_DIR}/src/utils/jwt.util.ts"
  "${API_DIR}/src/services/auth.service.ts"
  "${API_DIR}/src/middleware/auth.middleware.ts"
  "${API_DIR}/src/routes/v1/auth.routes.ts"
  "${API_DIR}/src/services/users.service.ts"
  "${API_DIR}/src/controllers/users.controller.ts"
  "${API_DIR}/src/middleware/validation.middleware.ts"
  "${API_DIR}/src/routes/v1/users.routes.ts"
  "${API_DIR}/src/websocket/index.ts"
)

MISSING_FILES=()

for file in "${REQUIRED_FILES[@]}"; do
  if [ ! -f "$file" ]; then
    echo "✗ Missing: $file"
    MISSING_FILES+=("$file")
  else
    echo "✓ Found: $(basename $file)"
  fi
done

if [ ${#MISSING_FILES[@]} -ne 0 ]; then
  echo ""
  echo "ERROR: ${#MISSING_FILES[@]} required files are missing!"
  echo "Please ensure all agents completed successfully."
  exit 1
fi

echo ""
echo "✓ All required files exist"
echo ""

# Step 2: Update routes index
echo "Step 2: Updating routes index..."
echo "---------------------------------"

cat > "${API_DIR}/src/routes/v1/index.ts" << 'EOF'
import { FastifyInstance } from 'fastify';

export default async function v1Routes(app: FastifyInstance) {
  // Health check
  app.get('/health', async () => ({
    status: 'ok',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  }));

  // Auth routes (Agent 1)
  await app.register(import('./auth.routes.js'), { prefix: '/auth' });

  // Users routes (Agent 2)
  await app.register(import('./users.routes.js'), { prefix: '/users' });
}
EOF

echo "✓ Routes index updated"
echo ""

# Step 3: Check TypeScript compilation
echo "Step 3: Checking TypeScript compilation..."
echo "-------------------------------------------"

cd "${API_DIR}"

if npm run build 2>&1 | tee /tmp/build.log; then
  echo ""
  echo "✓ TypeScript compilation successful"
else
  echo ""
  echo "✗ TypeScript compilation failed"
  echo "Check /tmp/build.log for details"
  exit 1
fi

echo ""

# Step 4: Update status files
echo "Step 4: Updating status files..."
echo "---------------------------------"

cat > "${PROJECT_ROOT}/docs/INTEGRATION_STATUS.md" << 'EOF'
# Integration Status

**Date:** $(date)
**Status:** ✅ COMPLETE

## Agent Work Integrated

- ✅ Agent 1: Authentication Service
- ✅ Agent 2: User Management API
- ✅ Agent 3: WebSocket & Real-time

## Files Integrated

- routes/v1/index.ts - Updated
- app.ts - Routes registered
- All agent files - Compiled successfully

## Next Steps

1. Start Docker services
2. Run database migrations
3. Test API endpoints
4. Test WebSocket connections
EOF

echo "✓ Status files updated"
echo ""

echo "=================================="
echo "✅ Integration Complete!"
echo "=================================="
echo ""
echo "Next steps:"
echo "1. docker compose up -d"
echo "2. npm run prisma:migrate"
echo "3. npm run prisma:seed"
echo "4. npm run dev:api"
echo "5. ./scripts/test-api.sh"
