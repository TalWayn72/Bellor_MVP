# Bellor Testing Conventions

## Test Classification System

### Priority Tiers

| Tier | Name | Description | Run Command |
|------|------|-------------|-------------|
| P0 | Critical | Revenue, safety, legal - must never break | `npm run test:p0` |
| P1 | Core | Primary user experience | `npm run test:p1` |
| P2 | Supporting | Important but not core flow | Full test run |
| P3 | Enhancement | Nice-to-have features | Full test run |

### Domains

| Domain | Scope |
|--------|-------|
| `auth` | Authentication, JWT, OAuth, middleware |
| `chat` | Chat, WebSocket, real-time messaging |
| `content` | Missions, responses, stories, feed |
| `social` | Likes, follows, matches, notifications |
| `profile` | User profiles, settings, preferences |
| `admin` | Admin dashboard, monitoring, management |
| `safety` | Security, sanitization, CSRF, blocking, reports |
| `payments` | Subscriptions, premium features |
| `infra` | Health, cache, logging, config, storage |

### Describe Block Format

Every top-level `describe` block must include tier and domain labels:

```typescript
// Format: [P<tier>][<domain>] <Module> - <feature>
describe('[P0][auth] AuthService - login', () => {
  // tests...
});

describe('[P1][chat] ChatService - sendMessage', () => {
  // tests...
});
```

## File Organization

### Backend Test Files

```
apps/api/src/
├── services/*.test.ts          # Unit tests (co-located)
├── middleware/*.test.ts         # Middleware tests (co-located)
├── security/*.test.ts          # Security tests (co-located)
├── lib/*.test.ts               # Library tests (co-located)
├── config/*.test.ts            # Config tests (co-located)
└── test/
    ├── setup.ts                # Entry point (imports mocks, exports factories)
    ├── mocks/                  # Mock modules (prisma, redis, cache, email)
    ├── factories/              # Test data factories with Builder pattern
    ├── helpers/                # Async helpers and utilities
    ├── tiers/                  # Tier manifest files (p0-p3)
    ├── integration/            # API integration tests
    ├── contract/               # Schema compliance tests
    └── migration/              # DB migration tests
```

### Frontend Test Files

```
apps/web/src/
├── pages/*.test.jsx            # Page component tests (co-located)
├── components/**/*.test.tsx    # Component tests (co-located)
├── hooks/*.test.ts             # Hook tests (co-located)
├── api/**/*.test.ts            # API service tests (co-located)
└── test/
    ├── setup.js                # Global test setup
    ├── tiers/                  # Tier manifest files (p0-p3)
    ├── a11y/                   # Accessibility tests
    └── contract/               # API contract tests
```

### E2E Test Files

```
apps/web/e2e/
├── fixtures.ts                 # Backward compat re-export
├── fixtures/                   # Modular fixtures
│   ├── test-data.ts            # Constants
│   ├── auth.helpers.ts         # Auth setup
│   ├── api-mock.helpers.ts     # API mocking
│   ├── navigation.helpers.ts   # Navigation utils
│   ├── form.helpers.ts         # Form filling
│   ├── ui.helpers.ts           # UI interactions
│   └── factories/              # E2E mock data
├── *.spec.ts                   # E2E test specs
└── visual/                     # Visual regression
```

## Test Structure Template (AAA Pattern)

```typescript
describe('[P1][content] ResponseService - createResponse', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create a text response successfully', async () => {
    // Arrange
    const mockUser = createMockUser({ id: 'user-1' });
    const input = { missionId: 'mission-1', responseType: 'TEXT', textContent: 'Hello' };
    vi.mocked(prisma.response.create).mockResolvedValue(mockResponse);

    // Act
    const result = await ResponseService.createResponse(mockUser.id, input);

    // Assert
    expect(result).toHaveProperty('id');
    expect(prisma.response.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ userId: 'user-1' }) })
    );
  });
});
```

## Mock Strategy

### Unit Tests
- Mock external dependencies (Prisma, Redis, email)
- Use factory functions: `createMockUser()`, `createMockChat()`
- Use Builder for complex scenarios: `UserBuilder.create().admin().verified().build()`

### Integration Tests
- Use `buildTestApp()` for full Fastify instance
- Mock Prisma at the module level
- Use `generateTestToken()` for authenticated requests
- **NEVER use loose assertions** like `expect([200, 401]).toContain(status)`

### E2E Tests
- Use Playwright route mocking via `mockApiResponse()`
- Use `setupAuthenticatedUser()` for auth state
- Use factory functions from `fixtures/factories/`

## Assertion Standards

### Required
- Exact status code assertions: `expect(response.statusCode).toBe(200)`
- Property existence: `expect(body).toHaveProperty('accessToken')`
- Type checking: `expect(typeof result.id).toBe('string')`

### Forbidden
- Loose status assertions: ~~`expect([200, 401, 500]).toContain(statusCode)`~~
- No assertions: every `it()` block must have at least one `expect()`
- Magic numbers without context: use named constants

## Selective Execution

```bash
# By priority tier
npm run test:p0              # Critical tests only
npm run test:p0:api          # Backend P0 only
npm run test:p0:web          # Frontend P0 only
npm run test:p1              # P0 + P1 tests

# By domain
npm run test:domain:auth     # All auth tests
npm run test:domain:chat     # All chat tests
npm run test:domain:safety   # All safety tests

# By type
npm run test:api             # All backend tests
npm run test:web             # All frontend tests
npm run test:e2e             # E2E tests
npm run test:mutation        # Mutation testing
npm run check:memory-leaks   # Memory leak scan
```
