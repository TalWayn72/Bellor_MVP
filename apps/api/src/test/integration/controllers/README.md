# Controller Integration Tests

Comprehensive integration tests for the 10 most critical API controllers.

## Test Coverage Summary

| Controller | Tests | Focus Areas |
|------------|-------|-------------|
| **auth.controller** | 30 | Registration, login, logout, password management, JWT validation |
| **chat.controller** | 29 | Chat CRUD, messaging, read receipts, access control |
| **upload.controller** | 30 | File uploads (images, audio, video), security validation |
| **responses.controller** | 25 | Mission responses, CRUD operations, filtering |
| **stories.controller** | 24 | 24-hour ephemeral content, feed, views |
| **reports.controller** | 23 | Content reporting, moderation, admin operations |
| **device-tokens.controller** | 23 | Push notification registration, broadcast, cleanup |
| **users.controller** | 22 | User CRUD, search, profile updates, authorization |
| **users-data.controller** | 18 | GDPR compliance, data export, statistics |
| **subscriptions-admin.controller** | 16 | Subscription plans, Stripe webhooks |

**Total: 240 integration tests**

## Test Patterns Used

All tests follow consistent patterns from `security.integration.test.ts`:

- ✅ **Authentication checks** - Verify endpoints require proper JWT tokens
- ✅ **Authorization enforcement** - Test ownership and admin-only operations
- ✅ **Input validation** - Zod schema validation for all request payloads
- ✅ **Error handling** - Test 400, 401, 403, 404, 500 responses
- ✅ **Security** - XSS prevention, SQL injection protection
- ✅ **Mock usage** - Proper mocking of Prisma, Redis, Storage services

## Running Tests

```bash
# Run all controller integration tests
npm run test -- src/test/integration/controllers/

# Run specific controller tests
npm run test -- src/test/integration/controllers/users.controller.integration.test.ts

# Run with coverage
npm run test:coverage -- src/test/integration/controllers/
```

## Test Structure

Each test file includes:

1. **Setup/Teardown** - `buildTestApp()`, `beforeAll`, `afterAll`, `beforeEach`
2. **Test Groups** - Organized by HTTP method and endpoint
3. **Happy Path** - Successful operations with valid data
4. **Error Cases** - Invalid inputs, unauthorized access, missing resources
5. **Security Tests** - Authorization, XSS, SQL injection, input validation

## Example Test

```typescript
describe('GET /api/v1/users/:id - Get User By ID', () => {
  it('should get user by id successfully', async () => {
    const mockUser = createMockUser();
    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser);

    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/users/test-user-id',
      headers: { authorization: authHeader() },
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.payload);
    expect(body.success).toBe(true);
    expect(body.data).toBeDefined();
  });

  it('should return 404 for non-existent user', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/users/non-existent-id',
      headers: { authorization: authHeader() },
    });

    expect(response.statusCode).toBe(404);
  });

  it('should require authentication', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/users/test-user-id',
    });

    expect(response.statusCode).toBe(401);
  });
});
```

## Key Features Tested

### Authentication & Authorization
- JWT token validation (valid, expired, malformed)
- Bearer token format enforcement
- User ownership verification
- Admin-only endpoint protection

### Input Validation
- Zod schema validation
- Required field enforcement
- Enum validation
- Length/format constraints
- XSS prevention

### CRUD Operations
- Create with validation
- Read by ID and list with pagination
- Update with authorization
- Delete with ownership checks

### Error Handling
- 400 Bad Request - Invalid input
- 401 Unauthorized - Missing/invalid token
- 403 Forbidden - Insufficient permissions
- 404 Not Found - Resource doesn't exist
- 500 Internal Server Error - Unexpected failures

### Security
- SQL injection prevention (Prisma ORM)
- XSS sanitization
- File upload validation (magic bytes, size limits)
- Sensitive data exposure prevention (no password hashes)
- Rate limiting enforcement

## Mock Configuration

Tests use mocks from `../../setup.ts`:
- `prisma.*` - All database operations
- `redis.*` - Cache operations
- `storageService.*` - File uploads
- `sendEmail()` - Email notifications

Helper functions:
- `buildTestApp()` - Creates Fastify instance with routes
- `authHeader(userId?)` - Generates valid JWT Bearer token
- `createMockUser()` - Creates mock user data
- `createMockChat()`, `createMockMessage()`, etc.

## Current Test Results

```
Test Files  10 total (240 tests)
Tests      204 passed | 36 failed (85% pass rate)
Duration   ~11s
```

Most failures are due to mock configuration nuances and will be addressed in subsequent iterations.

## Next Steps

1. Fix remaining test failures (mock configurations)
2. Add edge case coverage
3. Add contract tests for request/response schemas
4. Add mutation testing for test quality validation
5. Integrate with CI/CD pipeline

## Related Documentation

- `../security.integration.test.ts` - Security-focused integration tests
- `../../setup.ts` - Test configuration and mocks
- `../../build-test-app.ts` - Fastify test app builder
- `../../../controllers/` - Controller implementations
- `../../../../docs/PRD.md` - Section 10: Testing Strategy
