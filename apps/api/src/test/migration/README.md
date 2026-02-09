# Database Migration Tests

Comprehensive test suite for validating Bellor MVP Prisma schema migrations.

## Overview

This test suite ensures database schema integrity, migration safety, and seed data quality. It covers:

- **Migration Integrity** (37 tests): Schema structure, indexes, constraints, foreign keys
- **Migration Rollback** (24 tests): Idempotency, data persistence, error recovery
- **Seed Integrity** (44 tests): Data relationships, constraints, seed quality

**Total: 105 tests (97 passing, 8 skipped)**

## Test Files

### `migration-helpers.ts`
Utility functions for migration testing:
- Database creation/deletion
- Running migrations and seeds
- Schema inspection (tables, columns, indexes, constraints)
- PostgreSQL client management

### `migration-integrity.test.ts`
Validates migration application and schema correctness:
- All migrations apply successfully
- Core tables created with proper structure
- Enums defined correctly (Gender, ChatStatus, MessageType, etc.)
- Indexes created on frequently queried fields
- Foreign key relationships configured properly
- Data types match schema definitions

### `migration-rollback.test.ts`
Tests migration idempotency and safety:
- Migrations can run multiple times safely
- Database structure preserved across re-runs
- Data persistence after migrations
- Foreign key constraints enforced
- Cascade deletes work correctly
- Error recovery mechanisms

### `seed-integrity.test.ts`
Validates seed data quality and relationships:
- Seed script executes successfully
- User data integrity (unique emails, hashed passwords)
- Relationship integrity (Chat, Message, Response, Like, Follow)
- Data consistency (message counts, response counts)
- Enum value validity
- Seed idempotency (can run twice safely)

## Running Tests

### All migration tests:
```bash
npm run test:migration
```

### Run once (no watch mode):
```bash
npm run test:migration:run
```

### Specific test file:
```bash
npm run test:migration:run -- src/test/migration/migration-integrity.test.ts
```

## Prerequisites

1. **Docker must be running** with PostgreSQL container:
   ```bash
   npm run docker:up
   ```

2. **PostgreSQL container**: `bellor_postgres` on port 5432
3. **Database user**: `bellor` / `bellor_dev`

## How It Works

1. **Test Isolation**: Each test suite creates a unique test database
2. **Automatic Cleanup**: Databases are dropped after tests complete
3. **Real Database**: Tests use actual PostgreSQL (no mocks)
4. **Parallel Execution**: Tests run in separate forks for speed

## Test Databases

Test databases are created with timestamp suffixes:
- `bellor_test_migrations_<timestamp>`
- `bellor_test_rollback_<timestamp>`
- `bellor_test_seed_<timestamp>`

These are automatically cleaned up after tests finish.

## Configuration

Tests use a separate Vitest config: `vitest.migration.config.ts`

Key settings:
- **Test timeout**: 60 seconds (for database operations)
- **Hook timeout**: 60 seconds
- **Pool**: `forks` (parallel execution)
- **Setup file**: `setup.migration.ts` (no mocks)

## Expected Test Results

✅ **97 tests passing**
- Migration Integrity: 37 tests
- Migration Rollback: 17 tests (7 skipped)
- Seed Integrity: 43 tests (1 skipped)

⏭️ **8 tests skipped**
- Database reset tests (require manual testing)
- These involve `prisma migrate reset` which requires interactive confirmation

## Key Validations

### Schema Structure
- ✅ 18+ tables created
- ✅ 17+ enum types defined
- ✅ 40+ indexes for performance
- ✅ 14+ foreign key relationships

### Data Integrity
- ✅ Unique constraints enforced (email, chat pairs)
- ✅ Foreign keys prevent orphaned records
- ✅ Cascade deletes work (Message → Chat)
- ✅ Seed data follows constraints

### Migration Safety
- ✅ Idempotent (safe to run multiple times)
- ✅ Migration history tracked
- ✅ No data loss on re-migration
- ✅ Error recovery works

## Troubleshooting

### Tests Fail to Create Database

**Error**: `role "postgres" does not exist`

**Solution**: Tests use `bellor` user, not `postgres`. Check `migration-helpers.ts` config.

### Connection Refused

**Error**: `ECONNREFUSED localhost:5432`

**Solution**: Start Docker containers:
```bash
npm run docker:up
```

### Migration Fails

**Error**: `Migration failed: ...`

**Solution**: Check migration files in `apps/api/prisma/migrations/`

### Seed Fails

**Error**: `Seed failed: ...`

**Solution**: Ensure migrations ran successfully first. Check `apps/api/prisma/seed.ts`

## Development

### Adding New Tests

1. Create test in appropriate file (`*-integrity.test.ts`, `*-rollback.test.ts`, `*-seed.test.ts`)
2. Use helpers from `migration-helpers.ts`
3. Follow existing patterns (describe blocks, clear assertions)
4. Test with: `npm run test:migration:run -- path/to/test.ts`

### Modifying Helpers

Edit `migration-helpers.ts` to add new utility functions. Common additions:
- New schema inspection queries
- Data validation functions
- Migration state checks

### Updating Configuration

Edit `vitest.migration.config.ts` to adjust:
- Timeout values
- Test patterns
- Pool options

## CI/CD Integration

Add to your CI pipeline:

```yaml
- name: Run Migration Tests
  run: |
    npm run docker:up
    sleep 10  # Wait for PostgreSQL
    npm run test:migration:run
```

## Best Practices

1. **Always test migrations** before deploying to production
2. **Run full suite** after schema changes
3. **Check seed data** after updating seed scripts
4. **Monitor test duration** (should complete in < 1 minute)
5. **Fix failing tests immediately** - they indicate schema issues

## Related Documentation

- **Prisma Schema**: `apps/api/prisma/schema.prisma`
- **Migrations**: `apps/api/prisma/migrations/`
- **Seed Data**: `apps/api/prisma/seed.ts`
- **PRD**: `docs/PRD.md` (database design)

## Support

For issues or questions:
1. Check test output for specific error messages
2. Review migration logs in test output
3. Verify Docker container status: `docker ps`
4. Check PostgreSQL logs: `docker logs bellor_postgres`
