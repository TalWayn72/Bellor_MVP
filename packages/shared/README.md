# @bellor/shared

Shared TypeScript types and Zod schemas for the Bellor MVP project.

## Purpose

This package defines the API contract between the frontend (`@bellor/web`) and backend (`@bellor/api`). It addresses the root cause of bugs where frontend expects camelCase but backend sends snake_case.

## Structure

```
packages/shared/
├── src/
│   ├── schemas/
│   │   ├── index.ts           # Barrel export for all schemas
│   │   ├── common.schema.ts   # Common/shared schemas (pagination, errors, etc.)
│   │   ├── user.schema.ts     # User-related schemas
│   │   ├── auth.schema.ts     # Authentication schemas
│   │   ├── chat.schema.ts     # Chat and messaging schemas
│   │   ├── story.schema.ts    # Story (ephemeral content) schemas
│   │   └── response.schema.ts # User response (mission response) schemas
│   └── index.ts               # Main entry point
├── package.json
├── tsconfig.json
└── README.md
```

## Schemas Overview

### Common Schemas (`common.schema.ts`)

Shared utilities and types used across all other schemas:

- `PaginationParamsSchema` - Query parameters for pagination
- `PaginationResponseSchema` - Pagination metadata in responses
- `SortParamsSchema` - Sorting parameters
- `ApiErrorSchema` - Standard error format
- `ApiErrorResponseSchema` - Error response wrapper
- `createSuccessResponseSchema<T>()` - Factory for success responses
- `createPaginatedResponseSchema<T>()` - Factory for paginated responses
- `TimestampsSchema` - createdAt/updatedAt fields

### User Schemas (`user.schema.ts`)

User profile and management:

- `UserDbSchema` - Database representation (snake_case)
- `UserResponseSchema` - API response format (camelCase)
- `UpdateProfileSchema` - User profile update request
- `ListUsersQuerySchema` - Query parameters for listing users
- `SearchUsersQuerySchema` - User search parameters
- `GenderEnum`, `LanguageEnum` - Enumeration types
- `LocationSchema` - Location object structure

### Auth Schemas (`auth.schema.ts`)

Authentication and authorization:

- `PasswordSchema` - Password validation rules
- `RegisterRequestSchema` - User registration payload
- `LoginRequestSchema` - Login credentials
- `RefreshTokenRequestSchema` - Token refresh request
- `ChangePasswordRequestSchema` - Password change request
- `ForgotPasswordRequestSchema` - Password reset request
- `ResetPasswordRequestSchema` - Password reset with token
- `RegisterResponseSchema` - Registration response with tokens
- `LoginResponseSchema` - Login response with user and tokens
- `RefreshTokenResponseSchema` - New access token
- `GetMeResponseSchema` - Current user data

### Chat Schemas (`chat.schema.ts`)

Chat and messaging:

- `ChatDbSchema` - Database chat representation
- `ChatResponseSchema` - API chat response
- `MessageDbSchema` - Database message representation
- `MessageResponseSchema` - API message response
- `CreateChatRequestSchema` - Create/get chat request
- `SendMessageRequestSchema` - Send message payload
- `ChatListResponseSchema` - List of chats with pagination
- `MessageListResponseSchema` - List of messages
- `ChatStatusEnum`, `MessageTypeEnum` - Enumeration types

### Story Schemas (`story.schema.ts`)

24-hour ephemeral stories:

- `StoryDbSchema` - Database story representation
- `StoryResponseSchema` - API story response
- `CreateStoryRequestSchema` - Create story request
- `StoryFeedResponseSchema` - Story feed with pagination
- `MyStoriesResponseSchema` - User's own stories
- `StoryStatsResponseSchema` - Story statistics
- `MediaTypeEnum` - Image or video

### Response Schemas (`response.schema.ts`)

User responses to missions (tasks):

- `ResponseDbSchema` - Database response representation
- `ResponseSchema` - API response format
- `CreateResponseRequestSchema` - Create response request
- `ListResponsesQuerySchema` - Query parameters for responses
- `ResponseListResponseSchema` - List of responses with pagination
- `UserResponsesResponseSchema` - User-specific responses
- `ResponseByIdResponseSchema` - Single response details
- `ResponseTypeEnum` - Text, voice, video, or drawing

## Usage

### In Backend (`@bellor/api`)

```typescript
import { UserResponseSchema, LoginRequestSchema } from '@bellor/shared/schemas';
import { z } from 'zod';

// Validate request body
const loginRequest = LoginRequestSchema.parse(request.body);

// Validate response before sending
const userResponse = UserResponseSchema.parse(dbUser);
return reply.send({ success: true, data: userResponse });
```

### In Frontend (`@bellor/web`)

```typescript
import { LoginResponse, UserResponse } from '@bellor/shared/schemas';
import type { LoginRequest } from '@bellor/shared/schemas';

// Use as TypeScript types
const loginData: LoginRequest = {
  email: 'user@example.com',
  password: 'password123',
};

// Validate API response
const response = await apiClient.post('/auth/login', loginData);
const validated = LoginResponseSchema.parse(response.data);
```

## Key Benefits

1. **Single Source of Truth** - All API contracts defined in one place
2. **Type Safety** - Full TypeScript typing for frontend and backend
3. **Runtime Validation** - Zod schemas validate data at runtime
4. **No More snake_case/camelCase Bugs** - Explicit schema definitions prevent case mismatch
5. **Self-Documenting** - Schemas serve as API documentation
6. **Refactoring Safety** - Changes to schemas immediately show in both apps

## Development

### Type Checking

```bash
npm run type-check
```

### Linting

```bash
npm run lint
npm run lint:fix
```

## Design Patterns

### Database vs API Response Schemas

Some entities have both `*DbSchema` and `*ResponseSchema`:

- `*DbSchema` - Matches database structure (may have snake_case, internal fields)
- `*ResponseSchema` - API response format (camelCase, user-facing fields)

This separation allows the backend to transform database records into clean API responses.

### Factory Functions

Use factory functions for generic response wrappers:

```typescript
import { createSuccessResponseSchema } from '@bellor/shared/schemas';

const UserSuccessResponse = createSuccessResponseSchema(UserResponseSchema);
// Results in: { success: true, data: UserResponse }
```

## Migration Strategy

Existing code can gradually adopt these schemas:

1. Start with new endpoints - use schemas from day one
2. Add validation to existing endpoints - wrap with schema parsing
3. Replace inline types - import types from schemas
4. Remove transformation layers - use schema-based transformers

## Contributing

When adding new API endpoints:

1. Define request/response schemas here first
2. Export types for TypeScript
3. Use schemas in controllers for validation
4. Use types in frontend services

## Notes

- All schemas use `.js` extensions in imports (standard for ES modules with TypeScript)
- TypeScript compiler handles this correctly via `moduleResolution: "bundler"`
- Runtime imports will work after compilation or with tsx/ts-node
