# Permissions & RBAC Guide

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Request Lifecycle](#request-lifecycle)
4. [Permission String Format](#permission-string-format)
5. [All Built-in Permissions](#all-built-in-permissions)
6. [Decorators](#decorators)
7. [Adding Permissions to a New Module](#adding-permissions-to-a-new-module)
8. [Role Management](#role-management)
9. [Admin Wildcard](#admin-wildcard)
10. [Public Routes](#public-routes)

---

## Overview

This project uses **Role-Based Access Control (RBAC)**:

- Every **user** belongs to a **role**
- Every **role** holds an array of **permission strings** (stored in the DB)
- On login, those permission strings are embedded in the **JWT payload**
- On each request, `AuthGuard` reads the JWT and checks the required permissions declared on the route handler

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Request                                                    │
│                                                             │
│  PermissionValMiddleware          (runs on every route)     │
│    └─ attaches PermissionVal to req.permissionsVal          │
│    └─ stores request in AsyncLocalStorage                   │
│                                                             │
│  AuthGuard                        (global, APP_GUARD)       │
│    └─ @Public() → skip all checks                           │
│    └─ verify JWT → attach req.user = { sub, permissions }   │
│    └─ read @Permissions(...) metadata from route handler    │
│    └─ user has '*' → admin, allow all                       │
│    └─ user has all required permissions → allow             │
│    └─ otherwise → 403 ForbiddenException                    │
│                                                             │
│  Route Handler                                              │
└─────────────────────────────────────────────────────────────┘
```

### Key files

| File | Role |
|------|------|
| `src/common/guard/auth.guard.ts` | Global guard — JWT verification + permission check |
| `src/common/decorators/permission.decorator.ts` | `@Permissions()` decorator |
| `src/common/decorators/public.decorator.ts` | `@Public()` decorator |
| `src/common/middlewares/permission-val.middleware.ts` | Attaches `PermissionVal` object to every request |
| `src/common/models/permission-val.model.ts` | `PermissionVal` class (holds token + permissions) |
| `src/modules/permissions/permissions.service.ts` | In-memory registry of all permission strings |
| `src/modules/permissions/permissions.controller.ts` | `GET /permissions` — lists all registered permissions |

---

## Request Lifecycle

```
HTTP Request
    │
    ▼
PermissionValMiddleware
    • Creates PermissionVal({ accessToken: req.headers.authorization })
    • Attaches to req.permissionsVal
    • Stores { ctxId, request } in AsyncLocalStorage (appStorage)
    │
    ▼
AuthGuard.canActivate()
    • If @Public() on handler or controller → return true immediately
    • Extract Bearer token from Authorization header
    • jwtService.verifyAsync(token) → payload
    • req.user = { sub, username, permissions }
    • req.permissionsVal.permissions = payload.permissions
    • Read @Permissions(...) metadata via Reflector
    • If no @Permissions() → authenticated user is always allowed
    • If user.permissions includes '*' → admin, skip check
    • Otherwise verify user has ALL required permissions
    │
    ▼
Route Handler
    • req.user available via @CurrentUser()
```

---

## Permission String Format

```
<resource>:<action>
```

Examples: `user:read`, `role:create`, `audit-log:read`, `dashboard:read`

Wildcard for admins: `*` — bypasses all permission checks.

---

## All Built-in Permissions

### User module (`user.permissions.ts`)

| Constant | String | Description |
|----------|--------|-------------|
| `UserPermissions.PERMISSIONS.USER_CREATE` | `user:create` | Create user |
| `UserPermissions.PERMISSIONS.USER_READ` | `user:read` | Read user |
| `UserPermissions.PERMISSIONS.USER_UPDATE` | `user:update` | Update user |
| `UserPermissions.PERMISSIONS.USER_DELETE` | `user:delete` | Delete user |

### Role module (`role.permissions.ts`)

| Constant | String | Description |
|----------|--------|-------------|
| `RolePermissions.PERMISSIONS.ROLE_CREATE` | `role:create` | Create role |
| `RolePermissions.PERMISSIONS.ROLE_READ` | `role:read` | Read role |
| `RolePermissions.PERMISSIONS.ROLE_UPDATE` | `role:update` | Update role |
| `RolePermissions.PERMISSIONS.ROLE_DELETE` | `role:delete` | Delete role |

### Audit Log module (`audit-log.permissions.ts`)

| Constant | String | Description |
|----------|--------|-------------|
| `AuditLogPermissions.PERMISSIONS.AUDIT_LOG_READ` | `audit-log:read` | Read audit log |

### Dashboard module (`dashboard.permissions.ts`)

| Constant | String | Description |
|----------|--------|-------------|
| `DashboardPermissions.PERMISSIONS.DASHBOARD_READ` | `dashboard:read` | Read dashboard |

---

## Decorators

### `@Permissions(...permissions)`

Declares which permission strings a user must possess to access the route. The user must have **all** listed permissions.

```typescript
import { Permissions } from 'src/common/decorators';
import { UserPermissions } from './permissions/user.permissions';

@Permissions(UserPermissions.PERMISSIONS.USER_READ)
@Get()
findAll() { ... }

// Require multiple permissions at once
@Permissions('user:read', 'role:read')
@Get('combined')
getCombined() { ... }
```

Can also be placed on the controller class to protect all routes within it:

```typescript
@Permissions('dashboard:read')
@Controller('dashboard')
export class DashboardController { ... }
```

### `@Public()`

Marks a route (or entire controller) as publicly accessible — skips JWT verification and permission checks entirely.

```typescript
import { Public } from 'src/common/decorators';

@Public()
@Post('login')
login(@Body() dto: LoginDto) { ... }
```

### `@CurrentUser()`

Injects the authenticated user object from `req.user` into the route handler.

```typescript
import { CurrentUser } from 'src/common/decorators';

@Get('me')
getProfile(@CurrentUser() user: { sub: number; username: string; permissions: string[] }) {
  return user;
}
```

---

## Adding Permissions to a New Module

Follow these 4 steps whenever you create a new module that needs access control.

### Step 1 — Create the permissions class

```typescript
// src/modules/product/permissions/product.permissions.ts
import { PermissionOptions } from 'src/modules/permissions/dto/permission.dto';

export class ProductPermissions {
  public static readonly PERMISSIONS = {
    PRODUCT_CREATE: 'product:create',
    PRODUCT_READ:   'product:read',
    PRODUCT_UPDATE: 'product:update',
    PRODUCT_DELETE: 'product:delete',
  };

  public static getPermissionsOptions(): PermissionOptions {
    return {
      [ProductPermissions.PERMISSIONS.PRODUCT_CREATE]: 'Create product',
      [ProductPermissions.PERMISSIONS.PRODUCT_READ]:   'Read product',
      [ProductPermissions.PERMISSIONS.PRODUCT_UPDATE]: 'Update product',
      [ProductPermissions.PERMISSIONS.PRODUCT_DELETE]: 'Delete product',
    };
  }
}
```

### Step 2 — Register permissions in the module constructor

```typescript
// src/modules/product/product.module.ts
import { Module } from '@nestjs/common';
import { PermissionsModule } from '../permissions/permissions.module';
import { PermissionsService } from '../permissions/permissions.service';
import { ProductPermissions } from './permissions/product.permissions';

@Module({
  imports: [SharedModule, PermissionsModule],
  controllers: [ProductController],
  providers: [ProductService],
})
export class ProductModule {
  constructor(private readonly permissionsService: PermissionsService) {
    this.permissionsService.setPermissions(
      ProductPermissions.getPermissionsOptions(),
    );
  }
}
```

> **Why the constructor?** `PermissionsService` is a singleton that accumulates permissions from all modules at startup. Each module self-registers its own permissions when it is instantiated.

### Step 3 — Use `@Permissions()` on controller routes

```typescript
// src/modules/product/product.controller.ts
import { Permissions } from 'src/common/decorators';
import { ProductPermissions } from './permissions/product.permissions';

@Controller('product')
export class ProductController {
  @Permissions(ProductPermissions.PERMISSIONS.PRODUCT_CREATE)
  @Post()
  create(@Body() dto: CreateProductDto) { ... }

  @Permissions(ProductPermissions.PERMISSIONS.PRODUCT_READ)
  @Get()
  findAll() { ... }

  @Permissions(ProductPermissions.PERMISSIONS.PRODUCT_UPDATE)
  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateProductDto) { ... }

  @Permissions(ProductPermissions.PERMISSIONS.PRODUCT_DELETE)
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) { ... }
}
```

### Step 4 — Assign permissions to roles via the API

```bash
# Create a role with the new permissions
POST /v1/roles
{
  "name": "product-manager",
  "permissions": ["product:create", "product:read", "product:update"]
}

# Update an existing role to add permissions
PATCH /v1/roles/:id
{
  "permissions": ["product:read"]
}
```

---

## Role Management

Roles are stored in the database with a `permissions` JSON array column.

### Create a role

```bash
POST /v1/roles
Authorization: Bearer <token>

{
  "name": "admin",
  "description": "Full access",
  "permissions": ["*"]
}
```

### Create a role with specific permissions

```bash
POST /v1/roles
Authorization: Bearer <token>

{
  "name": "viewer",
  "permissions": ["user:read", "role:read", "audit-log:read", "dashboard:read"]
}
```

### View all available permissions

```bash
GET /v1/permissions
Authorization: Bearer <token>
```

Response:
```json
{
  "success": true,
  "data": {
    "user:create": "Create user",
    "user:read": "Read user",
    "user:update": "Update user",
    "user:delete": "Delete user",
    "role:create": "Create role",
    "role:read": "Read role",
    "role:update": "Update role",
    "role:delete": "Delete role",
    "audit-log:read": "Read audit log",
    "dashboard:read": "Read dashboard"
  }
}
```

---

## Admin Wildcard

A role with `permissions: ["*"]` grants unrestricted access to all routes. `AuthGuard` checks this first:

```typescript
// auth.guard.ts
const isAdmin = userPermissions.includes('*');
if (!isAdmin) {
  const hasAll = requiredPermissions.every((p) => userPermissions.includes(p));
  if (!hasAll) throw new ForbiddenException();
}
```

To create a superadmin:

```bash
POST /v1/roles
{ "name": "superadmin", "permissions": ["*"] }
```

---

## Public Routes

Routes decorated with `@Public()` skip all authentication and authorization. Currently public:

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/v1/auth/login` | Login, get JWT |
| `POST` | `/v1/auth/register` | Register new user |

Any other route without `@Public()` requires a valid JWT, and if marked with `@Permissions()`, requires the user to hold all listed permissions.
