# Integration Checklist - After Parallel Agents Complete

**Purpose:** Ensure all agent work is properly integrated
**Status:** Pending agent completion

---

## Pre-Integration Checks

### Agent 1: Authentication Service
- [ ] Files created successfully
  - [ ] `src/utils/jwt.util.ts`
  - [ ] `src/services/auth.service.ts`
  - [ ] `src/middleware/auth.middleware.ts`
  - [ ] `src/routes/v1/auth.routes.ts`
- [ ] No syntax errors
- [ ] All dependencies imported correctly
- [ ] Environment variables used properly

### Agent 2: User Management API
- [ ] Files created successfully
  - [ ] `src/services/users.service.ts`
  - [ ] `src/controllers/users.controller.ts`
  - [ ] `src/middleware/validation.middleware.ts`
  - [ ] `src/routes/v1/users.routes.ts`
- [ ] Uses auth middleware from Agent 1
- [ ] No syntax errors
- [ ] Validation schemas complete

### Agent 3: WebSocket & Real-time
- [ ] Files created successfully
  - [ ] `src/websocket/index.ts`
  - [ ] `src/websocket/handlers/presence.handler.ts`
  - [ ] `src/websocket/handlers/chat.handler.ts`
  - [ ] `src/websocket/middleware/auth.middleware.ts`
- [ ] Uses JWT from Agent 1
- [ ] No syntax errors
- [ ] Socket.io configured correctly

---

## Integration Steps

### Step 1: Route Registration
Update `apps/api/src/routes/v1/index.ts`:

```typescript
import { FastifyInstance } from 'fastify';

export default async function v1Routes(app: FastifyInstance) {
  // Auth routes (Agent 1)
  await app.register(import('./auth.routes.js'), { prefix: '/auth' });

  // User routes (Agent 2)
  await app.register(import('./users.routes.js'), { prefix: '/users' });

  // Health check
  app.get('/health', async () => ({
    status: 'ok',
    version: '1.0.0'
  }));
}
```

### Step 2: Main App Integration
Update `apps/api/src/app.ts`:

```typescript
// Import routes
await app.register(import('./routes/v1/index.js'), { prefix: '/api/v1' });

// Import and setup WebSocket (Agent 3)
import { setupWebSocket } from './websocket/index.js';
const io = setupWebSocket(app.server);

// Export for use in other modules
export { app, prisma, redis, io };
```

### Step 3: TypeScript Compilation
```bash
cd apps/api
npm run build
```

### Step 4: Fix Any TypeScript Errors
- Check for missing types
- Check for missing imports
- Check for circular dependencies

---

## Testing Plan

### Unit Tests (Per Agent)

**Agent 1 - Auth:**
```bash
# Test JWT generation
# Test password hashing
# Test login logic
# Test token refresh
```

**Agent 2 - Users:**
```bash
# Test user CRUD
# Test pagination
# Test filtering
# Test language update
```

**Agent 3 - WebSocket:**
```bash
# Test connection
# Test authentication
# Test message sending
# Test presence tracking
```

### Integration Tests

**Auth → Users:**
```bash
# Register user
# Login with credentials
# Access protected user endpoints with token
# Update user profile
```

**Auth → WebSocket:**
```bash
# Connect with valid JWT
# Verify connection rejected with invalid JWT
# Send messages as authenticated user
```

**Full Flow:**
```bash
1. Register new user
2. Login and get token
3. Connect to WebSocket
4. Update user language
5. Send chat message
6. Verify message received
```

---

## Manual Testing Steps

### 1. Start Services
```bash
# Terminal 1: Start Docker
docker compose up -d

# Terminal 2: Start API
cd apps/api
npm run dev
```

### 2. Test Authentication
```bash
# Register
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@bellor.app",
    "password": "Test123!",
    "firstName": "Test",
    "lastName": "User"
  }'

# Login
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@bellor.app",
    "password": "Test123!"
  }'
```

### 3. Test User Management
```bash
# Get current user (use token from login)
curl http://localhost:3000/api/v1/auth/me \
  -H "Authorization: Bearer {token}"

# List users
curl http://localhost:3000/api/v1/users \
  -H "Authorization: Bearer {token}"

# Update language
curl -X PATCH http://localhost:3000/api/v1/users/{userId}/language \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"language": "HEBREW"}'
```

### 4. Test WebSocket
Open browser console on `http://localhost:5173`:
```javascript
const socket = io('http://localhost:3000', {
  auth: { token: 'YOUR_ACCESS_TOKEN' }
});

socket.on('connect', () => {
  console.log('Connected!');
});

socket.on('user:online', (data) => {
  console.log('User online:', data);
});
```

---

## Success Criteria

- [ ] All files compile without errors
- [ ] All routes registered correctly
- [ ] Authentication works end-to-end
- [ ] User CRUD operations work
- [ ] WebSocket connections establish
- [ ] Messages send/receive in real-time
- [ ] No console errors
- [ ] All demo users can login
- [ ] Language switching works
- [ ] Presence tracking works

---

## Rollback Plan

If integration fails:

1. Check individual agent outputs for errors
2. Fix syntax/import errors one agent at a time
3. Test each agent's code independently
4. Use git to revert if needed: `git checkout -- apps/api/src/`

---

**Next Steps After Integration:**
1. Update documentation
2. Add more comprehensive tests
3. Deploy to staging environment
4. Begin Phase 4 (Frontend integration)

---

**Status:** ⏳ Waiting for agents to complete
