# Testing Guide

## Table of Contents

1. [Overview](#overview)
2. [Running Tests](#running-tests)
3. [Unit Tests — Step by Step](#unit-tests--step-by-step)
4. [E2E Tests — Step by Step](#e2e-tests--step-by-step)
5. [Common Patterns](#common-patterns)
6. [File Locations & Naming](#file-locations--naming)

---

## Overview

This project has two test types:

| Type | Location | Config |
|------|----------|--------|
| Unit tests | `src/**/*.spec.ts` | `package.json` → `jest` |
| E2E tests | `test/*.e2e-spec.ts` | `test/jest-e2e.json` |

---

## Running Tests

```bash
# Run all unit tests
npm test

# Run in watch mode (re-runs on save)
npm run test:watch

# Run with coverage report
npm run test:cov

# Run e2e tests
npm run test:e2e

# Run a single spec file (by name pattern)
npx jest auth.service
npx jest user.service

# Run with verbose output
npx jest --verbose
```

---

## Unit Tests — Step by Step

Unit tests live next to the source file they test (e.g. `auth.service.ts` → `auth.service.spec.ts`).

### Step 1 — Create the spec file

```
src/modules/auth/auth.service.spec.ts
```

### Step 2 — Import the class under test and its dependencies

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UserService } from '../user/user.service';
import { JwtService } from '@nestjs/jwt';
```

### Step 3 — Mock external modules (if needed)

Use `jest.mock()` **before** importing the mocked module. This is required for modules with side-effects like `bcrypt` or utility files.

```typescript
jest.mock('src/common/utils/hash.util', () => ({
  comparePassword: jest.fn(),
  hashPassword: jest.fn(),
}));

import { comparePassword } from 'src/common/utils/hash.util';
```

### Step 4 — Create mock objects for dependencies

Define typed mock objects with `jest.Mock` instead of importing the real classes. This keeps tests fast and isolated.

```typescript
let userService: { findOne: jest.Mock; create: jest.Mock };
let jwtService: { signAsync: jest.Mock };

userService = { findOne: jest.fn(), create: jest.fn() };
jwtService  = { signAsync: jest.fn() };
```

### Step 5 — Bootstrap the NestJS test module

Use `Test.createTestingModule` and `.overrideProvider` (or `useValue`) to inject mocks.

```typescript
beforeEach(async () => {
  const module: TestingModule = await Test.createTestingModule({
    providers: [
      AuthService,
      { provide: UserService, useValue: userService },
      { provide: JwtService,  useValue: jwtService  },
    ],
  }).compile();

  service = module.get<AuthService>(AuthService);
  jest.clearAllMocks(); // reset call counts between tests
});
```

### Step 6 — Write test cases

```typescript
describe('login', () => {
  it('throws UnauthorizedException when user is not found', async () => {
    // Arrange
    userService.findOne.mockResolvedValue(null);

    // Act & Assert
    await expect(
      service.login({ username: 'bob', password: 'pass' }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('returns accessToken on valid credentials', async () => {
    // Arrange
    userService.findOne.mockResolvedValue({ id: 1, username: 'bob', password: 'hashed', roleId: 1 });
    (comparePassword as jest.Mock).mockResolvedValue(true);
    jwtService.signAsync.mockResolvedValue('jwt-token');

    // Act
    const result = await service.login({ username: 'bob', password: 'correct' });

    // Assert
    expect(result.accessToken).toBe('jwt-token');
    expect(jwtService.signAsync).toHaveBeenCalledWith(
      expect.objectContaining({ sub: 1 }),
    );
  });
});
```

### Step 7 — Use typed DTOs instead of `as any`

Always import and cast to the actual DTO class to avoid ESLint errors.

```typescript
import { RegisterDto } from './dto/register.dto';

// ✅ correct
await service.register({ username: 'bob', email: 'b@b.com', password: 'pass', roleId: 1 } as RegisterDto);

// ❌ avoid
await service.register({ username: 'bob' } as any);
```

---

## E2E Tests — Step by Step

E2E tests boot the full NestJS application with mocked infrastructure (Prisma) and send real HTTP requests.

### Step 1 — Create the spec file in `test/`

```
test/auth.e2e-spec.ts
```

### Step 2 — Build a Prisma stub

Replace the real database with an in-memory mock so tests run without a database.

```typescript
const mockPrisma = {
  $connect:    jest.fn().mockResolvedValue(undefined),
  $disconnect: jest.fn().mockResolvedValue(undefined),
  user: {
    findFirst: jest.fn(),
    findMany:  jest.fn().mockResolvedValue([]),
    count:     jest.fn().mockResolvedValue(0),
    create:    jest.fn(),
    update:    jest.fn(),
    delete:    jest.fn(),
  },
  role: {
    findFirst:  jest.fn(),
    findUnique: jest.fn(),
    findMany:   jest.fn().mockResolvedValue([]),
    count:      jest.fn().mockResolvedValue(0),
    create:     jest.fn(),
  },
  auditLog: {
    findMany: jest.fn().mockResolvedValue([]),
    count:    jest.fn().mockResolvedValue(0),
    create:   jest.fn().mockResolvedValue({ id: 1 }),
  },
};
```

### Step 3 — Boot the app with `overrideProvider`

```typescript
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
const request = require('supertest') as typeof import('supertest');
import { AppModule } from 'src/app.module';
import { PrismaService } from 'src/common/prisma';

describe('Auth (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(mockPrisma)
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, stopAtFirstError: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    // Restore defaults that clearAllMocks wiped out
    mockPrisma.auditLog.create.mockResolvedValue({ id: 1 });
  });
});
```

### Step 4 — Write HTTP test cases with supertest

```typescript
it('returns 200 with accessToken on valid credentials', async () => {
  // Arrange — set what the DB would return
  mockPrisma.user.findFirst.mockResolvedValue({
    id: 1, username: 'bob', password: 'hashed', roleId: 1,
  });
  mockPrisma.role.findUnique.mockResolvedValue({
    id: 1, name: 'user', permissions: ['user:read'],
  });
  (bcrypt.compare as jest.Mock).mockResolvedValue(true);

  // Act — send HTTP request
  const response = await request(app.getHttpServer())
    .post('/api/auth/login')
    .send({ username: 'bob', password: 'correct' })
    .expect(200);

  // Assert — check response shape
  expect(response.body.success).toBe(true);
  expect(response.body.data.accessToken).toBeDefined();
});
```

### Step 5 — Testing protected routes

Get a token first, then pass it in the `Authorization` header.

```typescript
it('returns 200 on protected endpoint with valid token', async () => {
  // 1. Login to get token
  const loginRes = await request(app.getHttpServer())
    .post('/api/auth/login')
    .send({ username: 'admin', password: 'pass' });
  const token = loginRes.body.data.accessToken;

  // 2. Call protected endpoint
  await request(app.getHttpServer())
    .get('/api/users')
    .set('Authorization', `Bearer ${token}`)
    .expect(200);
});
```

---

## Common Patterns

### Mock a resolved value
```typescript
userService.findOne.mockResolvedValue({ id: 1, username: 'bob' });
```

### Mock a rejected value (simulate error)
```typescript
userRepository.create.mockRejectedValue(new Error('DB error'));
```

### Mock different values on consecutive calls
```typescript
userService.findOne
  .mockResolvedValueOnce(null)       // 1st call → null
  .mockResolvedValueOnce({ id: 2 }); // 2nd call → user
```

### Assert a function was called with specific args
```typescript
expect(userRepository.create).toHaveBeenCalledWith({
  data: expect.objectContaining({ username: 'bob' }),
});
```

### Assert a function was NOT called
```typescript
expect(hashPassword).not.toHaveBeenCalled();
```

### Assert an async function throws
```typescript
await expect(service.login({ username: 'x', password: 'y' }))
  .rejects.toThrow(UnauthorizedException);
```

---

## File Locations & Naming

```
src/
  modules/
    auth/
      auth.service.ts
      auth.service.spec.ts       ← unit test lives here
    user/
      user.service.ts
      user.service.spec.ts
  common/
    guard/
      auth.guard.spec.ts
    filters/
      all-exceptions.filter.spec.ts

test/
  auth.e2e-spec.ts               ← e2e tests live here
  jest-e2e.json                  ← e2e jest config
```

**Naming convention:** `<filename>.spec.ts` for unit tests, `<name>.e2e-spec.ts` for e2e tests.
