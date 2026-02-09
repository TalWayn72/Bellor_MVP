# Frontend Contract Tests

Contract tests verify that frontend services correctly parse API responses and validate them against shared Zod schemas from `@bellor/shared/schemas`.

## Test Files

- **`user-api-contract.test.ts`** - User service API contract validation
- **`auth-api-contract.test.ts`** - Auth service API contract validation

## Purpose

1. **Response Parsing**: Ensures services correctly parse API responses
2. **Schema Validation**: Validates responses against shared Zod schemas
3. **Field Naming**: Confirms camelCase usage (no snake_case)
4. **Type Safety**: Catches type mismatches between API and frontend
5. **Error Handling**: Validates error scenarios and edge cases

## Running Tests

```bash
# Run all contract tests
npm run test:web -- src/test/contract

# Run specific test file
npx vitest run src/test/contract/user-api-contract.test.ts

# Watch mode
npx vitest watch src/test/contract
```

## Test Pattern

```typescript
import { UserResponseSchema } from '@bellor/shared/schemas';
import { userService } from '../../api/services/userService';
import { apiClient } from '../../api/client/apiClient';

vi.mock('../../api/client/apiClient');

it('parses response matching UserResponseSchema', async () => {
  vi.mocked(apiClient.get).mockResolvedValue({
    data: { data: mockUserResponse },
  });

  const result = await userService.getUserById('test-user-id');
  const user = result.user;

  const schemaResult = UserResponseSchema.safeParse(user);
  expect(schemaResult.success).toBe(true);
});
```

## Test Categories

### User Service Tests (14 tests)
- ✅ GET user by ID - schema validation
- ✅ Search users - array validation
- ✅ Update profile - request/response validation
- ✅ Field naming consistency (camelCase)
- ✅ Enum validation (Gender, Language)
- ✅ Error handling
- ✅ Date format validation

### Auth Service Tests (19 tests)
- ✅ Register - request/response validation
- ✅ Login - request/response validation
- ✅ Get current user - response validation
- ✅ Refresh token - response validation
- ✅ Logout - cleanup validation
- ✅ Password validation
- ✅ Enum validation
- ✅ Field naming consistency
- ✅ Error handling

## Test Results

**Total: 33 tests passed (33/33)** ✅

All frontend contract tests are passing, confirming that:
- API responses are correctly parsed
- Data matches shared Zod schemas
- Field naming is consistent (camelCase)
- Error handling works as expected

## Benefits

1. **Catches API Changes**: Tests fail when API response structure changes
2. **Prevents Breaking Changes**: Ensures frontend-backend compatibility
3. **Documents API Contract**: Tests serve as living documentation
4. **Type Safety**: Validates runtime data matches TypeScript types
5. **Refactoring Safety**: Changes to services are validated against schemas

## Next Steps

To add contract tests for new services:
1. Create test file: `src/test/contract/[service]-api-contract.test.ts`
2. Mock `apiClient` responses
3. Call service methods
4. Validate responses with Zod schemas
5. Test error scenarios and edge cases
