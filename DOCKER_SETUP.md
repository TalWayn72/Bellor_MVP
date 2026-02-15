# Docker Setup Instructions

## Prerequisites
- Docker Desktop must be installed and running

## Starting Services

### Option 1: Start All Services (Recommended)
```bash
npm run docker:up
```

This starts:
- **PostgreSQL 16** on port 5432
- **Redis 7** on port 6379

### Option 2: Start Services Individually
```bash
# Start PostgreSQL only
docker-compose up -d bellor_postgres

# Start Redis only
docker-compose up -d bellor_redis
```

## Verifying Services

### Check if services are running
```bash
docker ps
```

You should see:
- `bellor_postgres` - PostgreSQL database
- `bellor_redis` - Redis cache

### Check service logs
```bash
# PostgreSQL logs
docker logs bellor_postgres

# Redis logs
docker logs bellor_redis
```

## Stopping Services

```bash
npm run docker:down
```

## Common Issues

### Issue: Docker Desktop Not Running
**Error:** `unable to get image... open //./pipe/dockerDesktopLinuxEngine: The system cannot find the file specified`

**Solution:**
1. Open Docker Desktop
2. Wait for it to fully start (whale icon should be steady, not animated)
3. Try `npm run docker:up` again

### Issue: Port Already in Use
**Error:** `port 5432 is already allocated` or `port 6379 is already allocated`

**Solution:**
```bash
# Stop existing services
npm run docker:down

# Or find and kill the process using the port
# Windows:
netstat -ano | findstr :5432
taskkill /PID <PID> /F

# Then restart
npm run docker:up
```

### Issue: Database Empty After Start
**Solution:** Run the seed script
```bash
cd apps/api
npx prisma db seed
```

## Testing Requirements

### For Integration Tests
Integration tests require both PostgreSQL and Redis to be running:
```bash
# 1. Start services
npm run docker:up

# 2. Run migrations
cd apps/api
npx prisma migrate dev

# 3. Seed database
npx prisma db seed

# 4. Run tests
cd ../..
npm run test:api
```

### For Unit Tests
Unit tests use mocks and don't require Docker services.

## Development Workflow

### Recommended Setup at Session Start
```bash
# 1. Start Docker services
npm run docker:up

# 2. Start API dev server
npm run dev:api

# 3. Start frontend dev server (in another terminal)
npm run dev
```

### At Session End
```bash
# Stop services to free resources
npm run docker:down
```

## Troubleshooting

### Reset Everything
If you encounter persistent issues:
```bash
# 1. Stop and remove all containers
npm run docker:down

# 2. Remove volumes (WARNING: deletes all data)
docker volume rm bellor_mvp_postgres_data bellor_mvp_redis_data

# 3. Start fresh
npm run docker:up

# 4. Re-run migrations and seed
cd apps/api
npx prisma migrate dev
npx prisma db seed
```

### Check Docker Status
```bash
# Check Docker daemon
docker info

# Check running containers
docker ps -a

# Check volumes
docker volume ls

# Check networks
docker network ls
```

## CI/CD

In CI/CD environments, services are started automatically by the workflow:
- See `.github/workflows/test.yml` for the setup
- PostgreSQL and Redis are started as service containers
- Environment variables are configured automatically

## Additional Resources

- [Docker Desktop Documentation](https://docs.docker.com/desktop/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Prisma Documentation](https://www.prisma.io/docs/)
- [Redis Documentation](https://redis.io/documentation/)
