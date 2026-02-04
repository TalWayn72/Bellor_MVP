# Bellor MVP - Development Guidelines

**Last Updated:** February 2026
**Version:** 1.0.0

---

## 📋 Table of Contents

1. [General Development Principles](#general-development-principles)
2. [Code Standards](#code-standards)
3. [Git Workflow](#git-workflow)
4. [Documentation Requirements](#documentation-requirements)
5. [Testing Guidelines](#testing-guidelines)
6. [Security Guidelines](#security-guidelines)
7. [PR Review Process](#pr-review-process)
8. [Deployment Guidelines](#deployment-guidelines)

---

## 1. General Development Principles

### 1.1 Core Principles

- **Type Safety First** - Always use TypeScript, never use `any` unless absolutely necessary
- **Security First** - Never commit secrets, always validate input, use proper authentication
- **Performance Matters** - Consider performance implications, but don't over-optimize prematurely
- **Clean Code** - Write readable, maintainable code that others can understand
- **Test Your Code** - Write tests for critical functionality
- **Document Your Work** - Update documentation when you make changes

### 1.2 Before You Start

**ALWAYS read these files before starting work:**
1. `README.md` - Project overview and setup
2. `docs/PRD.md` - **Product Requirements Document** (contains full feature specs)
3. `docs/MIGRATION_PLAN.md` - Migration strategy and phases
4. `WORK_INSTRUCTIONS.md` - Current tasks and priorities

### 1.3 Technology Expertise Level

**You are authorized to:**
- ✅ Write TypeScript code (Backend and Frontend)
- ✅ Create/modify API endpoints
- ✅ Write database queries with Prisma
- ✅ Create/modify React components
- ✅ Write tests (unit, integration, E2E)
- ✅ Create/modify Docker configurations
- ✅ Create/modify Kubernetes manifests
- ✅ Create/modify GitHub Actions workflows
- ✅ Create/modify monitoring configurations
- ✅ Update documentation
- ✅ Fix bugs and security issues
- ✅ Optimize performance

**You are NOT authorized to (ask first):**
- ❌ Change database schema structure significantly
- ❌ Change authentication mechanism
- ❌ Expose sensitive data
- ❌ Deploy to production without approval
- ❌ Delete production data
- ❌ Change billing/payment logic

---

## 2. Code Standards

### 2.1 TypeScript

#### General Rules
- **Always use TypeScript** - No plain JavaScript files except config
- **No `any` type** - Use proper types or `unknown` with type guards
- **Explicit return types** - Always declare return types for functions
- **Strict mode** - Follow `tsconfig.json` strict settings
- **No unused variables** - Remove or prefix with `_`

#### Example (Good):
```typescript
export async function getUserById(userId: string): Promise<User | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });
  return user;
}
```

#### Example (Bad):
```typescript
export async function getUserById(userId: any) {  // ❌ uses `any`
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });
  return user;  // ❌ no explicit return type
}
```

### 2.2 Naming Conventions

- **Files:** `kebab-case.ts` (e.g., `auth.service.ts`, `users.controller.ts`)
- **Components:** `PascalCase.tsx` (e.g., `UserProfile.tsx`, `ChatMessage.tsx`)
- **Functions:** `camelCase` (e.g., `getUserById`, `sendMessage`)
- **Classes:** `PascalCase` (e.g., `AuthService`, `UsersController`)
- **Constants:** `UPPER_SNAKE_CASE` (e.g., `MAX_FILE_SIZE`, `JWT_EXPIRES_IN`)
- **Interfaces/Types:** `PascalCase` (e.g., `User`, `AuthResponse`, `JWTPayload`)
- **Enums:** `PascalCase` for name, `UPPER_SNAKE_CASE` for values

### 2.3 Code Organization

#### Backend (apps/api/src/)
```
apps/api/src/
├── config/          # Configuration files
├── controllers/     # Request handlers
├── middleware/      # Express/Fastify middleware
├── routes/          # API route definitions
├── services/        # Business logic
├── lib/             # Shared instances (prisma, redis)
├── utils/           # Utility functions
└── websocket/       # WebSocket handlers
```

#### Frontend (apps/web/src/)
```
apps/web/src/
├── api/             # API client layer
├── components/      # React components
│   ├── ui/          # Reusable UI components
│   └── admin/       # Admin-specific components
├── hooks/           # Custom React hooks
├── pages/           # Page components
├── styles/          # Global styles
└── utils/           # Utility functions
```

### 2.4 Error Handling

#### Backend
```typescript
// ✅ Good - Specific error messages
try {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new Error('User not found');
  }
  return user;
} catch (error) {
  logger.error('Error fetching user:', error);
  throw error;
}

// ❌ Bad - Silent failures
try {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  return user;
} catch (error) {
  return null;  // Swallows the error
}
```

#### Frontend
```typescript
// ✅ Good - User-friendly error messages
const { data, error, isLoading } = useQuery({
  queryKey: ['user', userId],
  queryFn: () => usersApi.getUserById(userId),
  onError: (error) => {
    toast.error('Failed to load user profile. Please try again.');
  },
});

// ❌ Bad - Raw error messages to user
if (error) {
  alert(error.message);  // Technical error message
}
```

---

## 3. Git Workflow

### 3.1 Branch Strategy

- **`main`** - Production-ready code, always stable
- **`develop`** - Development branch, integration happens here
- **`feature/*`** - New features (e.g., `feature/user-authentication`)
- **`bugfix/*`** - Bug fixes (e.g., `bugfix/fix-login-error`)
- **`hotfix/*`** - Urgent production fixes (e.g., `hotfix/security-patch`)

### 3.2 Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

**Format:**
```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `style:` - Code formatting (no functional changes)
- `refactor:` - Code refactoring
- `test:` - Adding/updating tests
- `chore:` - Build process, dependencies, etc.
- `perf:` - Performance improvements
- `ci:` - CI/CD changes

**Examples:**
```
feat(auth): Add JWT refresh token mechanism

- Implement refresh token generation
- Store refresh tokens in Redis with 7-day expiry
- Add /auth/refresh endpoint

Closes #123

---

fix(users): Fix null pointer in getUserById

The function was not checking if user exists before accessing properties.
Added proper null check and error handling.

Fixes #456

---

docs(readme): Update deployment instructions

Added section on universal installers and free hosting options.
```

### 3.3 Before Committing

**Checklist:**
- [ ] Code compiles without errors (`npm run type-check`)
- [ ] No linting errors (`npm run lint`)
- [ ] All tests pass (`npm run test`)
- [ ] No TypeScript errors
- [ ] No sensitive data (passwords, API keys, etc.)
- [ ] Relevant documentation updated
- [ ] Commit message follows conventions

---

## 4. Documentation Requirements

### 4.1 When to Update Documentation

**CRITICAL: Update documentation immediately when you:**
1. Add a new feature → Update `docs/PRD.md`
2. Complete a phase → Update `docs/MIGRATION_PLAN.md`
3. Change API endpoints → Update API documentation
4. Change deployment process → Update deployment docs
5. Fix a major bug → Update `CHANGELOG.md` (if exists)
6. Add/change environment variables → Update `.env.example`

### 4.2 PRD Updates (MANDATORY!)

**ALWAYS update `docs/PRD.md` when:**
- ✅ A feature status changes from "Planned" to "In Progress" to "Complete"
- ✅ A new feature is added to the roadmap
- ✅ Architecture changes
- ✅ Tech stack changes
- ✅ New endpoints are added
- ✅ Security measures change
- ✅ Deployment process changes

**How to update PRD:**
1. Open `docs/PRD.md`
2. Find the relevant section (usually section 4 or 5)
3. Update status: 📋 Planned → ⏳ In Progress → ✅ Complete
4. Update completion percentages
5. Add implementation details
6. Update "Last Updated" date at the top

**Example:**
```markdown
### 4.1 Authentication & Authorization ✅

**סטטוס:** מושלם (100%)  ← Update this

#### 4.1.1 הרשמה (Registration)
- ✅ הזנת email וסיסמה  ← Change from 📋 to ✅
- ✅ Validation מלא (Zod)
...
```

### 4.3 Code Comments

**When to comment:**
- ✅ Complex algorithms
- ✅ Non-obvious business logic
- ✅ Security-critical sections
- ✅ Workarounds for known issues
- ✅ TODOs with explanation

**When NOT to comment:**
- ❌ Obvious code (`// increment counter`)
- ❌ Restating what the code does
- ❌ Outdated comments

**Example:**
```typescript
// ✅ Good - Explains WHY, not WHAT
// Use 12 rounds for bcrypt to balance security and performance
// Based on OWASP recommendations as of 2024
const SALT_ROUNDS = 12;

// ❌ Bad - States the obvious
// This function gets a user by ID
function getUserById(id: string) { }
```

### 4.4 API Documentation

For every new API endpoint, document:
- Method (GET, POST, etc.)
- Path
- Authentication required
- Request body/query parameters
- Response format
- Error codes
- Example request/response

Use JSDoc comments:
```typescript
/**
 * Get user by ID
 *
 * @route GET /api/v1/users/:id
 * @access Private (requires JWT)
 * @param {string} id - User ID
 * @returns {User} User object
 * @throws {404} User not found
 * @throws {401} Unauthorized
 */
export async function getUserById(id: string): Promise<User> {
  // ...
}
```

---

## 5. Testing Guidelines

### 5.1 Test Coverage Goals

| Component | Target Coverage | Current Status |
|-----------|----------------|----------------|
| Services | 80%+ | 📋 Not implemented |
| Controllers | 70%+ | 📋 Not implemented |
| Utilities | 90%+ | 📋 Not implemented |
| Components | 60%+ | 📋 Not implemented |

### 5.2 What to Test

**Priority 1 (Must test):**
- ✅ Authentication logic
- ✅ Authorization checks
- ✅ Data validation
- ✅ Business logic in services
- ✅ API endpoints (critical paths)

**Priority 2 (Should test):**
- ✅ Utility functions
- ✅ React hooks
- ✅ Complex components

**Priority 3 (Nice to have):**
- ✅ Simple presentational components
- ✅ UI interactions

### 5.3 Testing Best Practices

- **Arrange-Act-Assert** pattern
- **One assertion per test** (or closely related assertions)
- **Descriptive test names** - Use "should" format
- **Mock external dependencies** - Don't hit real APIs/DB in unit tests
- **Test edge cases** - Empty inputs, null, undefined, boundary values

**Example:**
```typescript
describe('AuthService', () => {
  describe('register', () => {
    it('should create a new user with hashed password', async () => {
      // Arrange
      const input = {
        email: 'test@example.com',
        password: 'Password123!',
        firstName: 'John',
        lastName: 'Doe',
      };

      // Act
      const result = await AuthService.register(input);

      // Assert
      expect(result.user.email).toBe(input.email);
      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
    });

    it('should throw error for invalid email', async () => {
      // Arrange
      const input = {
        email: 'invalid-email',
        password: 'Password123!',
      };

      // Act & Assert
      await expect(AuthService.register(input)).rejects.toThrow(
        'Invalid email format'
      );
    });
  });
});
```

---

## 6. Security Guidelines

### 6.1 Never Commit Secrets

**NEVER commit:**
- ❌ API keys
- ❌ Database passwords
- ❌ JWT secrets
- ❌ Private keys
- ❌ OAuth client secrets
- ❌ `.env` files with real values

**Always:**
- ✅ Use `.env.example` with placeholder values
- ✅ Store secrets in environment variables
- ✅ Use secret management tools (Kubernetes secrets, AWS Secrets Manager, etc.)
- ✅ Rotate secrets regularly

### 6.2 Input Validation

**ALWAYS validate:**
- ✅ All user input
- ✅ API request bodies
- ✅ Query parameters
- ✅ File uploads

**Use:**
- ✅ Zod for runtime validation
- ✅ TypeScript for compile-time type checking
- ✅ Prisma for SQL injection prevention

**Example:**
```typescript
import { z } from 'zod';

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).regex(/[A-Z]/).regex(/[a-z]/).regex(/[0-9]/),
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
});

// Validate before use
const input = registerSchema.parse(request.body);
```

### 6.3 Authentication & Authorization

**Authentication:**
- ✅ Use JWT with short expiration (15min)
- ✅ Use refresh tokens (7 days)
- ✅ Hash passwords with bcrypt (12 rounds)
- ✅ Validate tokens on every protected request

**Authorization:**
- ✅ Check user permissions before allowing actions
- ✅ Users can only modify their own data (unless admin)
- ✅ Validate resource ownership

**Example:**
```typescript
// ✅ Good - Authorization check
export async function updateUserProfile(userId: string, updates: UpdateUserInput, requestUserId: string) {
  // Check if user is updating their own profile
  if (userId !== requestUserId) {
    throw new Error('Forbidden: Can only update your own profile');
  }

  // Proceed with update
  const user = await prisma.user.update({
    where: { id: userId },
    data: updates,
  });

  return user;
}

// ❌ Bad - No authorization check
export async function updateUserProfile(userId: string, updates: UpdateUserInput) {
  // Anyone can update anyone's profile!
  return prisma.user.update({
    where: { id: userId },
    data: updates,
  });
}
```

### 6.4 Common Vulnerabilities to Avoid

- **SQL Injection** - Use Prisma (parameterized queries)
- **XSS** - Sanitize user input, use React (auto-escapes)
- **CSRF** - Use CORS, validate origin
- **Directory Traversal** - Validate file paths
- **DoS** - Rate limiting, input size limits
- **Sensitive Data Exposure** - Don't log passwords, tokens, etc.

---

## 7. PR Review Process

### 7.1 Before Creating a PR

**Checklist:**
- [ ] Code compiles without errors
- [ ] All tests pass
- [ ] No linting errors
- [ ] Documentation updated (especially `docs/PRD.md`)
- [ ] Commit messages follow conventions
- [ ] No sensitive data
- [ ] Self-review completed

### 7.2 PR Description Template

```markdown
## Description
Brief description of what this PR does.

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Related Issues
Closes #123
Related to #456

## Changes Made
- Added JWT refresh token mechanism
- Updated authentication service
- Added tests for refresh token flow

## Documentation Updated
- [x] README.md
- [x] docs/PRD.md
- [ ] API documentation
- [ ] Other: _________

## Testing
- [x] Unit tests added/updated
- [x] Integration tests added/updated
- [ ] E2E tests added/updated
- [x] Manual testing completed

## Screenshots (if applicable)
[Add screenshots here]

## Checklist
- [x] Code follows style guidelines
- [x] Self-review completed
- [x] Documentation updated
- [x] Tests pass
- [x] No TypeScript errors
- [x] No sensitive data
```

### 7.3 Review Guidelines

**As a reviewer, check:**
- ✅ Code correctness
- ✅ Security implications
- ✅ Performance considerations
- ✅ Test coverage
- ✅ Documentation updates
- ✅ Code style consistency
- ✅ Error handling
- ✅ Edge cases handled

**Feedback should be:**
- Constructive and respectful
- Specific (reference line numbers)
- Actionable
- Categorized (blocking vs. optional)

---

## 8. Deployment Guidelines

### 8.1 Deployment Checklist

**Before deploying to production:**
- [ ] All tests pass in CI/CD
- [ ] Security audit completed
- [ ] Performance testing completed
- [ ] Backup database
- [ ] Prepare rollback plan
- [ ] Monitor resources (CPU, RAM, disk)
- [ ] Check logs for errors
- [ ] Verify health checks pass

### 8.2 Deployment Process

**Development:**
```bash
npm run dev:all
```

**Staging:**
```bash
docker compose -f docker-compose.prod.yml up -d
# Verify everything works
```

**Production (Kubernetes):**
```bash
./scripts/deploy.sh k8s prod
# Monitor deployment
kubectl rollout status deployment/bellor-api -n bellor
```

### 8.3 Rollback Process

**If deployment fails:**
1. Check logs: `kubectl logs -f deployment/bellor-api -n bellor`
2. Check health checks: `curl https://api.bellor.app/health`
3. If critical issue, rollback:
   ```bash
   kubectl rollout undo deployment/bellor-api -n bellor
   ```
4. Investigate issue
5. Fix and redeploy

---

## 9. Monitoring & Alerts

### 9.1 What to Monitor

**Metrics:**
- API response times (p50, p95, p99)
- Error rates (4xx, 5xx)
- WebSocket connections (active)
- Database query times
- Redis operations
- CPU/Memory/Disk usage

**Logs:**
- Application logs
- Error logs
- Security events (failed logins, etc.)
- Performance logs

**Access:**
- **Grafana:** http://localhost:3001 (admin/admin)
- **Prometheus:** http://localhost:9090
- **Loki:** Integrated in Grafana

### 9.2 When to Create Alerts

**Critical (immediate action):**
- API down (> 1min)
- Error rate > 5%
- Database unreachable
- Out of memory
- Disk full

**Warning (check soon):**
- Response time > 1s (p99)
- Memory > 80%
- CPU > 80%
- Disk > 90%

---

## 10. Summary

**Remember:**
1. ✅ **Read this file** before starting work
2. ✅ **Type safety** - Always use TypeScript properly
3. ✅ **Security first** - Validate input, check authorization
4. ✅ **Test your code** - Write tests for critical functionality
5. ✅ **Update `docs/PRD.md`** - MANDATORY for feature changes!
6. ✅ **Commit conventions** - Follow Conventional Commits
7. ✅ **Never commit secrets** - Use environment variables
8. ✅ **Self-review** - Review your own code before PR

**Questions?**
- Check `docs/PRD.md` for product requirements
- Check `README.md` for setup instructions
- Check `docs/MIGRATION_PLAN.md` for migration strategy
- Ask in team chat if unclear

---

**Last Updated:** February 2026
**Version:** 1.0.0

**Contributors:** Bellor Development Team
