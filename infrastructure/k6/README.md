# Bellor Load Testing Suite

Comprehensive k6 performance testing suite for the Bellor API and infrastructure.

## Overview

This suite includes multiple test types targeting different performance characteristics:

| Test Type | Duration | VUs (Peak) | Purpose | When to Run |
|-----------|----------|------------|---------|-------------|
| **Smoke** | ~2 min | 50 | Quick sanity check | Every PR, develop |
| **Sustained Load** | ~32 min | 200 | Stability over time | Main branch only |
| **Stress** | ~8 min | 200 | Find performance limits | Main branch push |
| **Spike** | ~2 min | 500 | Handle traffic bursts | On demand |
| **Memory Leak** | ~32 min | 50 | Detect memory leaks | Weekly/on demand |
| **DB Performance** | ~8 min | 50-100 | Database operations | On demand |
| **WebSocket** | ~6 min | 200 | Real-time features | On demand |

## Test Files

### 1. Smoke Test (`smoke-test.js`)
**Purpose:** Quick validation that API handles basic load without errors.

**Configuration:**
- Duration: ~2 minutes (10s ramp + 30s sustain + 10s spike + 10s ramp-down)
- VUs: 10 → 50
- Endpoints tested: Health, auth, users, missions

**Thresholds:**
- p95 response time: < 500ms
- Error rate: < 10%

**Run:**
```bash
npm run load:smoke
# or
k6 run infrastructure/k6/smoke-test.js
```

**Use case:** Run on every PR and develop branch to catch regressions early.

---

### 2. Sustained Load Test (`sustained-load.js`)
**Purpose:** Test system stability under sustained moderate-to-high load over extended period.

**Configuration:**
- Duration: ~30 minutes
- VUs: Gradual ramp 50 → 100 → 150 → 200, then ramp down
- User patterns: 5 different behavior patterns (social, chat, creator, browser, mixed)

**Thresholds:**
- p95 response time: < 500ms
- p99 response time: < 1000ms
- Error rate: < 5%
- Total requests: > 10,000

**Run:**
```bash
npm run load:sustained
# or
k6 run infrastructure/k6/sustained-load.js
```

**Use case:** Run on main branch to validate production readiness. Detects performance degradation over time.

**User Behavior Patterns:**
1. **Active Social User (20%):** Browsing users, checking notifications, viewing stories
2. **Chat-Focused User (20%):** Messaging, notifications, unread counts
3. **Content Creator (20%):** Missions, stories, achievements
4. **Passive Browser (20%):** Viewing profiles, stories, search
5. **Mixed Activity (20%):** Random mix of all actions (most realistic)

---

### 3. Stress Test (`stress-test.js`)
**Purpose:** Push system beyond normal capacity to find breaking points.

**Configuration:**
- Duration: ~8 minutes
- VUs: 20 → 50 → 100 → 150 → 200 (peak), sustain, then ramp down
- Tests all major endpoints

**Thresholds:**
- p95 response time: < 500ms (relaxed during stress)
- p99 response time: < 1000ms
- Error rate: < 5%

**Run:**
```bash
npm run load:stress
# or
k6 run infrastructure/k6/stress-test.js
```

**Use case:** Find system limits. Run on main branch after major changes.

---

### 4. Spike Test (`spike-test.js`)
**Purpose:** Test system resilience to sudden traffic spikes.

**Configuration:**
- Duration: ~2 minutes
- VUs: 10 → 300 (spike!) → 10 → 500 (bigger spike!)
- Simulates flash crowds, viral content, DDoS

**Thresholds:**
- p95 response time: < 2000ms (relaxed for spike tolerance)
- Error rate: < 15% (some errors acceptable during extreme spikes)

**Run:**
```bash
npm run load:spike
# or
k6 run infrastructure/k6/spike-test.js
```

**Use case:** Validate auto-scaling, rate limiting, circuit breakers. Run before major events.

---

### 5. Memory Leak Detection Test (`memory-leak-test.js`)
**Purpose:** Detect memory leaks, connection pool leaks, resource exhaustion.

**Configuration:**
- Duration: ~32 minutes (sustained constant load)
- VUs: 50 (constant)
- Compares early vs late performance

**Detection Strategy:**
- Tracks response times in early phase (first 5 min) vs late phase (last 5 min)
- Calculates performance degradation percentage
- Monitors connection errors, timeouts

**Thresholds:**
- p95 response time: < 800ms
- Early phase p95: < 600ms
- Late phase p95: < 800ms (max 33% degradation)
- Timeout errors: < 50
- Connection errors: < 20

**Run:**
```bash
npm run load:memory
# or
k6 run infrastructure/k6/memory-leak-test.js
```

**Analysis:**
- **< 15% degradation:** ✅ No memory leak detected
- **15-30% degradation:** ⚠️  Monitor closely
- **> 30% degradation:** 🚨 Memory leak likely

**Use case:** Run weekly or after major changes. Best used alongside server memory monitoring (htop, node --inspect, clinic.js).

**Recommended monitoring during test:**
```bash
# Terminal 1: Run API with memory monitoring
node --inspect apps/api/dist/index.js

# Terminal 2: Monitor memory usage
watch -n 1 'ps aux | grep node'

# Terminal 3: Run k6 test
npm run load:memory
```

---

### 6. Database Performance Test (`db-performance-test.js`)
**Purpose:** Test database-intensive operations under load.

**Configuration:**
- Duration: ~8 minutes
- Multiple scenarios running in parallel:
  - Read-heavy workload (30 VUs)
  - Write-heavy workload (30 VUs)
  - Mixed workload (40 VUs)
  - Complex queries (20-50 VUs)

**Focus Areas:**
- Complex queries with joins
- Write operations (create/update)
- Concurrent read/write scenarios
- Pagination and large result sets
- Text search operations

**Thresholds:**
- DB read p95: < 200ms (PRD target)
- DB write p95: < 300ms
- Complex query p95: < 400ms
- Pagination p95: < 250ms
- Search p95: < 300ms

**Run:**
```bash
npm run load:db
# or
k6 run infrastructure/k6/db-performance-test.js
```

**Use case:** Validate database performance, identify slow queries, test connection pooling.

---

### 7. WebSocket Test (`websocket-test.js`)
**Purpose:** Test Socket.io real-time functionality under load.

**Configuration:**
- Duration: ~6 minutes
- Multiple scenarios:
  - Connection stress (50-200 concurrent connections)
  - Presence updates (30 VUs)
  - Messaging throughput (10-100 messages/sec)

**Focus Areas:**
- WebSocket connection establishment
- Presence (online/offline) events
- Chat messaging throughput
- Typing indicators
- Concurrent connections

**Thresholds:**
- Connection time p95: < 1000ms
- Message latency p95: < 100ms (PRD target: < 50ms)
- Connection errors: < 10%
- Message errors: < 10%

**Run:**
```bash
npm run load:websocket
# or
k6 run infrastructure/k6/websocket-test.js
```

**Note:** k6 has limited native WebSocket/Socket.io support. For comprehensive testing, consider socket.io-client with Artillery or custom Node.js scripts.

**Use case:** Validate real-time features, test WebSocket scaling.

---

## Quick Start

### Prerequisites
```bash
# Install k6 (macOS)
brew install k6

# Install k6 (Ubuntu/Debian)
sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6

# Install k6 (Windows)
choco install k6
```

### Running Tests Locally

1. **Start infrastructure:**
```bash
npm run docker:up
```

2. **Start API:**
```bash
npm run dev:api
```

3. **Run tests:**
```bash
# Quick smoke test
npm run load:smoke

# Sustained load (30 min)
npm run load:sustained

# Stress test
npm run load:stress

# Spike test
npm run load:spike

# Memory leak detection (32 min)
npm run load:memory

# Database performance
npm run load:db

# WebSocket test
npm run load:websocket
```

### Custom Test Configuration

All tests support environment variables:

```bash
# Target different API URL
k6 run --env API_URL=https://staging.bellor.app infrastructure/k6/smoke-test.js

# Override VUs and duration (for quick testing)
k6 run --vus 5 --duration 10s infrastructure/k6/smoke-test.js
```

---

## CI/CD Integration

### GitHub Actions Workflow

The CI pipeline runs different tests based on branch and event:

| Branch/Event | Tests Run |
|--------------|-----------|
| **Pull Request** | Smoke test (quick validation) |
| **Develop branch** | Smoke test |
| **Main branch push** | Smoke + Sustained + Stress |
| **Manual/Weekly** | All tests including Memory Leak |

### Load Test Jobs

1. **`load-test-smoke`**
   - Runs on: PRs, develop
   - Duration: ~5 minutes
   - Purpose: Fast feedback on performance regressions

2. **`load-test-sustained`**
   - Runs on: Main branch only
   - Duration: ~45 minutes (includes setup)
   - Purpose: Production readiness validation

3. **`load-test-stress`**
   - Runs on: Main branch push
   - Duration: ~20 minutes
   - Purpose: Find breaking points before deploy

---

## Interpreting Results

### Key Metrics

1. **http_req_duration**: Total request latency
   - **p95 < 500ms:** ✅ Good
   - **p95 < 1000ms:** ⚠️  Acceptable under stress
   - **p95 > 1000ms:** 🚨 Performance issue

2. **http_req_failed**: Failed request rate
   - **< 1%:** ✅ Excellent
   - **< 5%:** ⚠️  Acceptable under stress
   - **> 10%:** 🚨 Stability issue

3. **errors**: Custom error rate (includes checks)
   - **< 5%:** ✅ Good
   - **> 10%:** 🚨 Issue

### Result Files

Each test produces a JSON result file:
- `smoke-test-results.json`
- `sustained-load-results.json`
- `stress-test-results.json`
- `spike-test-results.json`
- `memory-leak-results.json`
- `db-performance-results.json`
- `websocket-test-results.json`

### Viewing Results

Results are automatically uploaded to GitHub Actions artifacts (retention: 7-30 days).

Local viewing:
```bash
# Pretty-print JSON results
cat sustained-load-results.json | jq '.metrics'

# Extract p95 latency
cat sustained-load-results.json | jq '.metrics.http_req_duration.values."p(95)"'

# Extract error rate
cat sustained-load-results.json | jq '.metrics.http_req_failed.values.rate'
```

---

## Performance Targets (PRD)

| Metric | Target | Test Coverage |
|--------|--------|---------------|
| Response time (p95) | < 200ms | All tests |
| Throughput | 500+ req/s | Sustained, Stress |
| Concurrent users | 1000+ | Sustained |
| Concurrent WebSocket | 10,000+ | WebSocket test |
| WebSocket latency | < 50ms | WebSocket test |
| Database query (p95) | < 200ms | DB Performance |
| Error rate | < 1% | All tests |

---

## Troubleshooting

### Common Issues

**1. Tests failing with connection errors**
- Ensure API is running: `curl http://localhost:3000/health`
- Check Docker services: `docker ps`
- Increase sleep time in test setup

**2. High error rates**
- Check API logs for errors
- Verify database migrations: `npm run prisma:migrate:deploy`
- Check connection pool settings

**3. Slow response times**
- Monitor database query performance
- Check Redis cache hit rate
- Review API logs for slow queries
- Use `clinic.js` for profiling

**4. Memory test shows degradation**
- Run API with `node --inspect` and take heap snapshots
- Use `clinic.js doctor` for memory flame graphs
- Check for event listener leaks
- Review connection pool cleanup

### Debugging

```bash
# Run with verbose output
k6 run --verbose infrastructure/k6/smoke-test.js

# Run with HTTP debug logs
k6 run --http-debug infrastructure/k6/smoke-test.js

# Run with custom log level
k6 run --log-output=stdout --logformat=json infrastructure/k6/smoke-test.js
```

---

## Best Practices

1. **Always run smoke tests before heavier tests**
   - Validates basic functionality first
   - Saves time if there are obvious issues

2. **Monitor server resources during tests**
   - Use `htop`, `docker stats`, or cloud monitoring
   - Watch for CPU, memory, disk I/O bottlenecks

3. **Run memory leak tests overnight or during low traffic**
   - Long duration (32 min)
   - Resource intensive
   - Best with production-like data volume

4. **Use realistic test data**
   - Seed database with realistic user count
   - Include varied content (images, videos, text)
   - Test with production-like cache warmth

5. **Compare results over time**
   - Establish performance baselines
   - Track trends (degradation/improvement)
   - Set up alerts for regressions

6. **Test in production-like environment**
   - Use similar hardware specs
   - Same database instance size
   - Similar network latency

---

## Advanced Usage

### Custom Scenarios

Create custom test scenarios by mixing existing patterns:

```javascript
// custom-test.js
import { activeSocialUser } from './sustained-load.js';

export const options = {
  stages: [
    { duration: '1m', target: 100 },
  ],
};

export default function (data) {
  activeSocialUser(data.baseUrl, headers);
}
```

### Cloud Load Testing

Run tests from multiple regions using k6 Cloud:

```bash
k6 cloud infrastructure/k6/sustained-load.js
```

### Distributed Load Testing

Run distributed tests using k6 operator on Kubernetes:

```bash
kubectl apply -f k6-operator-manifest.yaml
```

---

## Contributing

When adding new tests:

1. Follow existing test structure
2. Use descriptive metric names
3. Set appropriate thresholds
4. Document test purpose and configuration
5. Add test to CI workflow if appropriate
6. Update this README

---

## Resources

- [k6 Documentation](https://k6.io/docs/)
- [k6 Examples](https://github.com/grafana/k6-learn)
- [Performance Testing Best Practices](https://k6.io/docs/testing-guides/test-types/)
- [Bellor PRD Performance Requirements](../../docs/product/PRD.md)

---

## License

Internal use only - Bellor MVP
