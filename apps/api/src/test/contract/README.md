# Backend Contract Tests

Contract tests verify that the API complies with shared Zod schemas defined in `@bellor/shared/schemas`.
These tests catch API drift between frontend and backend by validating request/response structures.

## Test Files

### Schema Compliance Tests

- **`user-schema-compliance.test.ts`** - User endpoints (GET, PATCH, DELETE, etc.)
- **`auth-schema-compliance.test.ts`** - Authentication endpoints (register, login, refresh)
- **`chat-schema-compliance.test.ts`** - Chat and message endpoints
- **`story-schema-compliance.test.ts`** - Story endpoints
- **`response-schema-compliance.test.ts`** - Response (mission response) endpoints

### Transformation Tests

- **`transformation.test.ts`** - Validates camelCase ↔ snake_case transformations
  - Database to API (snake_case → camelCase)
  - Frontend to API (both snake_case and camelCase accepted)
  - Backward compatibility with legacy frontend fields

## Purpose

1. **Schema Validation**: Ensures API responses match `UserResponseSchema`, `LoginResponseSchema`, etc.
2. **Field Naming**: Validates camelCase consistency in API responses
3. **Enum Validation**: Checks that enum values (Gender, Language, etc.) are correct
4. **Backward Compatibility**: Ensures API accepts both camelCase and snake_case from frontend
5. **Transformation Logic**: Validates field mapping (e.g., `age` → `birthDate`, `looking_for` → `lookingFor`)

## Running Tests

```bash
# Run all contract tests
npm run test:api -- src/test/contract

# Run specific test file
npx vitest run src/test/contract/user-schema-compliance.test.ts

# Watch mode
npx vitest watch src/test/contract
```

## Test Pattern

```typescript
import { UserResponseSchema } from '@bellor/shared/schemas';

it('returns data matching UserResponseSchema', async () => {
  const response = await app.inject({
    method: 'GET',
    url: '/api/v1/users/test-user-id',
    headers: { authorization: authHeader() },
  });

  const body = JSON.parse(response.payload);
  const result = UserResponseSchema.safeParse(body.data);

  expect(result.success).toBe(true);
});
```

## Known Issues

Some tests may fail due to:
- Missing route registrations in test app
- Incomplete mock data
- Authentication logic differences in test environment

These tests serve as documentation of the expected API contract and should be fixed as the API stabilizes.

## Coverage

- ✅ User endpoints (7 endpoints)
- ✅ Auth endpoints (6 endpoints)
- ⚠️ Chat endpoints (5 endpoints) - some routes not found
- ⚠️ Story endpoints (6 endpoints) - some routes not found
- ⚠️ Response endpoints (5 endpoints) - some routes not found
- ✅ Transformation logic (15 scenarios)

Total: **75 test cases** across **8 test files**
