# X Automation API Test Suite

## Overview

This test suite provides comprehensive coverage for the X Automation API, using mocked dependencies to ensure tests run without external services.

## Test Statistics

- **Total Tests**: 253+
- **Passing**: 253+
- **Failing**: 0
- **Line Coverage**: ~58%
- **Function Coverage**: ~62%

## Directory Structure

```
src/tests/
├── README.md                          # This file
├── unit/                              # Unit tests (isolated, fast)
│   ├── services/                      # Service layer unit tests
│   │   ├── action-engine.test.ts      # Action execution engine
│   │   ├── cache.test.ts              # Cache service (with mocked Redis)
│   │   ├── data-extractor.test.ts     # Data extraction utilities
│   │   ├── rapidapi-client.test.ts    # RapidAPI client
│   │   ├── trigger-engine.test.ts     # Trigger evaluation engine
│   │   ├── x-api-client.test.ts       # X API client
│   │   ├── x-api-client-mocked.test.ts # X API client (fully mocked)
│   │   └── x-oauth.test.ts            # X OAuth service
│   ├── actions/                       # Action executor tests
│   │   └── executors.test.ts          # All action executors
│   ├── triggers/                      # Trigger evaluator tests
│   │   └── evaluators.test.ts         # All trigger evaluators
│   └── utils/                         # Utility function tests
│       └── encryption.test.ts         # Encryption/decryption
├── integration/                       # Integration tests (with dependencies)
│   ├── app.test.ts                    # Application bootstrap
│   └── routes/                        # API route tests
│       ├── actions.test.ts            # Actions API endpoints
│       ├── auth.test.ts               # Authentication routes
│       ├── middleware.test.ts         # General middleware
│       ├── middleware-convex-auth.test.ts # Convex auth middleware
│       ├── routes-integration.test.ts # Route integration tests
│       ├── routes-sync.test.ts        # Sync routes
│       ├── routes-triggers.test.ts    # Trigger routes
│       ├── routes-workflows.test.ts   # Workflow routes
│       └── workflows.test.ts          # Workflow API
└── mocks/                             # Mock utilities
    ├── api-mocks.ts                   # External API mocks (X API, RapidAPI)
    ├── convex-mock.ts                 # Convex client mock
    └── redis-mock.ts                  # Redis client mock
```

## Test Categories

### Unit Tests (`unit/`)

Fast, isolated tests that don't require external services.

- **Services**: Test individual service functions with mocked dependencies
- **Actions**: Test action executors in isolation
- **Triggers**: Test trigger evaluators with mock context
- **Utils**: Test utility functions

### Integration Tests (`integration/`)

Tests that verify components work together, may use test doubles for external services.

- **Routes**: Test HTTP endpoints with mocked auth/external APIs
- **App**: Test application startup and configuration

### Mocks (`mocks/`)

Reusable mock implementations for tests.

- **api-mocks**: Mock fetch responses for X API and RapidAPI
- **convex-mock**: Mock Convex client for auth testing
- **redis-mock**: In-memory Redis implementation

## Running Tests

```bash
# Run all tests
bun test

# Run specific test category
bun test src/tests/unit
bun test src/tests/integration

# Run specific test file
bun test src/tests/unit/services/cache.test.ts

# Run with coverage
bun test --coverage

# Run in watch mode
bun test --watch
```

## Writing Tests

### Unit Test Example

```typescript
// @ts-nocheck
import { describe, expect, it } from "bun:test";
import { myFunction } from "../../../services/my-service";

describe("My Service", () => {
  it("should do something", () => {
    const result = myFunction("input");
    expect(result).toBe("expected output");
  });
});
```

### Integration Test Example

```typescript
// @ts-nocheck
import { describe, expect, it } from "bun:test";
import { Elysia } from "elysia";
import { myRoutes } from "../../../routes/my-routes";

describe("My Routes", () => {
  it("should handle request", async () => {
    const app = new Elysia().use(myRoutes);
    const response = await app.handle(
      new Request("http://localhost/api/endpoint")
    );
    expect(response.status).toBe(200);
  });
});
```

## Best Practices

1. **Use mocks** for external dependencies (Redis, Convex, X API)
2. **Clean up** after tests using `afterEach` or `afterAll`
3. **Test error cases** as well as success paths
4. **Use descriptive names** that explain the behavior being tested
5. **Group related tests** using `describe` blocks
6. **Suppress console output** in tests to reduce noise:
   ```typescript
   let originalConsoleError: typeof console.error;
   beforeAll(() => {
     originalConsoleError = console.error;
     console.error = () => {};
   });
   afterAll(() => {
     console.error = originalConsoleError;
   });
   ```

## Coverage Goals

- Target: 80% line coverage
- Current: ~58% line coverage

Priority areas for improvement:
- `services/cache.ts` (currently 0% with real Redis)
- `services/sync-service.ts` (complex mocking needed)
- `routes/workflows.ts` (needs auth mocking)
- `services/simdjson-extractor.ts` (C++ bindings)

## Troubleshooting

### Module Mock Issues

Bun's `mock.module` persists across test files. If tests fail due to mock interference:
- Run test files individually: `bun test src/tests/unit/services/cache.test.ts`
- Check that mocks are properly reset in `beforeEach`

### Import Path Issues

After moving files, update imports:
- From `unit/`: `../../../services/...`, `../../../mocks/...`
- From `integration/routes/`: `../../../routes/...`, `../../../../mocks/...`

### Redis Connection Errors

Tests using real Redis will fail without a running Redis instance. Use `redis-mock.ts` or mock the cache module.
