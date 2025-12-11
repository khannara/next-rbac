# @khannara/next-rbac

> Enterprise-ready Role-Based Access Control (RBAC) for Next.js 13+ App Router with TypeScript support

[![npm version](https://badge.fury.io/js/%40khannara%2Fnext-rbac.svg)](https://www.npmjs.com/package/@khannara/next-rbac)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Build Status](https://dev.azure.com/phay/next-rbac/_apis/build/status/next-rbac-ci?branchName=main)](https://dev.azure.com/phay/next-rbac/_build/latest?definitionId=3&branchName=main)
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=khannara_next-rbac&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=khannara_next-rbac)
[![Coverage](https://sonarcloud.io/api/project_badges/measure?project=khannara_next-rbac&metric=coverage)](https://sonarcloud.io/summary/new_code?id=khannara_next-rbac)

Production-ready RBAC system extracted from a live Next.js application serving **1000+ users**.

## ✨ Features

- ✅ **Next.js 13+ App Router** - Built for Server Components and Server Actions
- ✅ **TypeScript First** - Full type safety with module augmentation for autocomplete
- ✅ **Database Agnostic** - Prisma (10+ databases), MongoDB, or bring your own
- ✅ **Hierarchical Roles** - Role inheritance with circular detection
- ✅ **Middleware Support** - Protect routes at the edge with Next.js middleware
- ✅ **Server & Client** - Permission checks on both sides
- ✅ **React Components** - `<PermissionGate>`, `<RoleGate>` for declarative access control
- ✅ **Production Tested** - Battle-tested in production with 1000+ active users
- ✅ **Zero Dependencies** - Only peer dependencies (Next.js, React)
- ✅ **Full Test Coverage** - 120+ tests, 94%+ coverage

## 📦 Installation

```bash
npm install @khannara/next-rbac
```

**Peer Dependencies:**
- `next` >= 13.0.0
- `react` >= 18.0.0

**Optional:**
- `mongodb` >= 6.0.0 (if using MongoDB adapter)
- `@prisma/client` >= 6.0.0 (if using Prisma adapter)

## 🚀 Quick Start

### 1. Choose Your Database Adapter

<details>
<summary><b>Prisma (PostgreSQL, MySQL, SQLite, SQL Server, MongoDB, etc.)</b></summary>

```typescript
// lib/rbac.ts
import { PrismaClient } from '@prisma/client';
import { PrismaAdapter } from '@khannara/next-rbac/adapters';

const prisma = new PrismaClient();

export function getRBACAdapter() {
  return new PrismaAdapter({
    prisma,
    roleModel: 'role',      // Your Prisma model name
    userModel: 'user',
    enabled: true,          // Enable caching
    ttl: 300,              // Cache for 5 minutes
  });
}
```

**Required Prisma Schema:**

```prisma
model Role {
  id          String   @id @default(auto()) @map("_id") @db.ObjectId
  name        String   @unique
  permissions String[]
  inherits    String?  // Optional: parent role for inheritance
  deleted_at  DateTime?
  created_at  DateTime  @default(now())
  updated_at  DateTime  @updatedAt
}

model User {
  id    String @id @default(auto()) @map("_id") @db.ObjectId
  email String @unique
  role  String
}
```

</details>

<details>
<summary><b>MongoDB (Direct Connection)</b></summary>

```typescript
// lib/rbac.ts
import { MongoDBAdapter } from '@khannara/next-rbac/adapters';
import clientPromise from '@/lib/mongodb';

export async function getRBACAdapter() {
  const client = await clientPromise;
  const db = client.db('myapp');

  return new MongoDBAdapter({
    db,
    rolesCollection: 'roles',
    usersCollection: 'users',
  });
}
```

</details>

<details>
<summary><b>In-Memory (Testing/Demos)</b></summary>

```typescript
// lib/rbac.test.ts
import { InMemoryAdapter } from '@khannara/next-rbac/adapters';

export function getRBACAdapter() {
  return new InMemoryAdapter({
    roles: [
      {
        name: 'admin',
        permissions: ['users.create', 'users.read', 'users.update', 'users.delete'],
      },
      {
        name: 'user',
        permissions: ['users.read'],
      },
    ],
    users: [
      { id: '1', role: 'admin' },
      { id: '2', role: 'user' },
    ],
  });
}
```

</details>

### 2. Define Your Permissions & Roles (TypeScript)

Create type-safe permissions with full autocomplete:

```typescript
// types/rbac.d.ts
import '@khannara/next-rbac';

declare module '@khannara/next-rbac' {
  export interface RBACTypes {
    Permission:
      // Dashboard
      | 'dashboard.view'
      // Users
      | 'users.create'
      | 'users.read'
      | 'users.update'
      | 'users.delete'
      // Products
      | 'products.create'
      | 'products.read'
      | 'products.update'
      | 'products.delete'
      // Settings
      | 'settings.read'
      | 'settings.update';

    Role: 'super-admin' | 'admin' | 'manager' | 'user';
  }
}
```

**You now get full autocomplete throughout your app!**

### 3. Server-Side Permission Checks

#### API Routes

```typescript
// app/api/users/route.ts
import { requirePermission } from '@khannara/next-rbac/server';
import { getRBACAdapter } from '@/lib/rbac';
import { auth } from '@/auth';

export async function POST(request: Request) {
  const session = await auth();
  const adapter = getRBACAdapter();

  // Throws if user lacks permission
  await requirePermission(adapter, session.user.id, 'users.create');

  // User has permission, proceed...
  return Response.json({ success: true });
}
```

#### Server Actions

```typescript
// app/actions/users.ts
'use server';

import { hasPermission } from '@khannara/next-rbac/server';
import { getRBACAdapter } from '@/lib/rbac';
import { auth } from '@/auth';

export async function deleteUser(userId: string) {
  const session = await auth();
  const adapter = getRBACAdapter();

  if (!await hasPermission(adapter, session.user.id, 'users.delete')) {
    throw new Error('Insufficient permissions');
  }

  // Delete user...
}
```

### 4. Middleware Protection

Protect entire route groups with Next.js middleware:

```typescript
// middleware.ts
import { createRBACMiddleware } from '@khannara/next-rbac/server';
import { getRBACAdapter } from './lib/rbac';
import { getSession } from './lib/auth';

const rbacMiddleware = createRBACMiddleware({
  adapter: getRBACAdapter(),
  getUserId: async (req) => {
    const session = await getSession(req);
    return session?.user?.id || null;
  },
  unauthorizedUrl: '/login',
  forbiddenUrl: '/forbidden',
});

export async function middleware(req: NextRequest) {
  return rbacMiddleware(req, {
    '/admin': { roles: ['admin', 'super-admin'] },
    '/api/users': { permissions: ['users.create', 'users.update', 'users.delete'] },
    '/settings': { anyPermissions: ['settings.update', 'admin.access'] },
    '/dashboard': {
      custom: async (req, userId, adapter) => {
        // Custom logic
        return true;
      },
    },
  });
}

export const config = {
  matcher: ['/admin/:path*', '/api/:path*', '/settings/:path*', '/dashboard/:path*'],
};
```

### 5. Client-Side Permission Gates

```tsx
// app/users/page.tsx
import { PermissionGate } from '@khannara/next-rbac/react';
import { getRolePermissions } from '@khannara/next-rbac/server';
import { getRBACAdapter } from '@/lib/rbac';
import { auth } from '@/auth';

export default async function UsersPage() {
  const session = await auth();
  const adapter = getRBACAdapter();
  const userRole = await adapter.getUserRole(session.user.id);
  const permissions = await getRolePermissions(adapter, userRole);

  return (
    <div>
      <h1>Users</h1>

      <PermissionGate permission="users.create" userPermissions={permissions}>
        <button>Create User</button>
      </PermissionGate>

      <PermissionGate
        permissions={['users.update', 'users.delete']}
        userPermissions={permissions}
        requireAll
        fallback={<p>You need both update and delete permissions</p>}
      >
        <button>Manage Users</button>
      </PermissionGate>
    </div>
  );
}
```

## 🏗️ Hierarchical Roles

Define role inheritance for easier permission management:

```javascript
// Database roles collection
{
  name: 'user',
  permissions: ['users.read', 'profile.update']
}

{
  name: 'manager',
  permissions: ['users.update', 'reports.read'],
  inherits: 'user'  // Inherits all 'user' permissions
}

{
  name: 'admin',
  permissions: ['users.delete', 'settings.update'],
  inherits: 'manager'  // Inherits 'manager' + 'user' permissions
}

{
  name: 'super-admin',
  permissions: ['system.admin'],
  inherits: 'admin'  // Inherits entire chain
}
```

Use inheritance utilities:

```typescript
import {
  resolveRolePermissions,
  inheritsFrom,
  getRoleHierarchy,
} from '@khannara/next-rbac/server';

// Get all permissions (including inherited)
const permissions = await resolveRolePermissions(adapter, 'admin');
// Returns: ['users.read', 'profile.update', 'users.update', 'reports.read', 'users.delete', 'settings.update']

// Check if role inherits from another
const isDescendant = await inheritsFrom(adapter, 'admin', 'user');
// Returns: true

// Get complete hierarchy
const hierarchy = await getRoleHierarchy(adapter, 'admin');
// Returns: ['admin', 'manager', 'user']
```

## 📚 API Reference

### Server Functions

#### Permission Checking

- **`hasPermission(adapter, userId, permission)`** - Check single permission
- **`hasAnyPermission(adapter, userId, permissions)`** - Check if user has ANY of the permissions
- **`hasAllPermissions(adapter, userId, permissions)`** - Check if user has ALL permissions
- **`requirePermission(adapter, userId, permission)`** - Throw if missing permission
- **`requireAllPermissions(adapter, userId, permissions)`** - Throw if missing any permission

#### Role Checking

- **`hasRole(adapter, userId, role)`** - Check user's role
- **`hasAnyRole(adapter, userId, roles)`** - Check if user has any of the roles
- **`requireRole(adapter, userId, role)`** - Throw if wrong role

#### Role Utilities

- **`getRolePermissions(adapter, roleName)`** - Get direct permissions for a role
- **`resolveRolePermissions(adapter, roleName)`** - Get all permissions (including inherited)
- **`inheritsFrom(adapter, roleName, parentRole)`** - Check if role inherits from parent
- **`getRoleHierarchy(adapter, roleName)`** - Get full role hierarchy

#### Middleware

- **`createRBACMiddleware(config)`** - Full-featured route protection
- **`createRoleMiddleware(config)`** - Simple role-based protection
- **`createPermissionMiddleware(config)`** - Simple permission-based protection

### React Components

#### `<PermissionGate>`

```tsx
<PermissionGate
  permission="users.create"       // Single permission
  permissions={['a', 'b']}        // Multiple permissions
  requireAll={false}               // Require all vs any (default: false)
  userPermissions={permissions}    // User's permissions
  fallback={<AccessDenied />}     // Optional fallback
>
  <ProtectedContent />
</PermissionGate>
```

#### `<RoleGate>`

```tsx
<RoleGate
  role="admin"                    // Single role
  roles={['admin', 'manager']}    // Multiple roles
  userRole={session.user.role}    // User's role
  fallback={<AccessDenied />}     // Optional fallback
>
  <AdminPanel />
</RoleGate>
```

## 🗄️ Database Examples

### PostgreSQL with Prisma

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Role {
  id          String   @id @default(uuid())
  name        String   @unique
  permissions String[]
  inherits    String?
  created_at  DateTime @default(now())
  updated_at  DateTime @updatedAt
}

model User {
  id    String @id @default(uuid())
  email String @unique
  role  String
}
```

### MySQL with Prisma

```prisma
datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}

model Role {
  id          Int      @id @default(autoincrement())
  name        String   @unique
  permissions Json     // Store as JSON in MySQL
  inherits    String?
  created_at  DateTime @default(now())
  updated_at  DateTime @updatedAt
}
```

### MongoDB (Direct)

```javascript
// roles collection
{
  _id: ObjectId,
  name: "admin",
  permissions: ["users.create", "users.delete"],
  inherits: "manager",  // Optional
  created_at: ISODate,
  updated_at: ISODate,
  deleted_at: null
}

// users collection
{
  _id: ObjectId,
  email: "admin@example.com",
  role: "admin"
}
```

## 🔧 Custom Adapters

Create your own adapter for any database:

```typescript
import { RBACAdapter, Role, Permission, RoleDocument } from '@khannara/next-rbac';

export class CustomAdapter implements RBACAdapter {
  async findRole(roleName: Role): Promise<RoleDocument | null> {
    // Your implementation
  }

  async getUserRole(userId: string): Promise<Role | null> {
    // Your implementation
  }

  async getRolePermissions(roleName: Role): Promise<Permission[]> {
    // Your implementation
  }
}
```

## 🎯 Use Cases

- **Multi-tenant SaaS** - Different permissions per tenant
- **Admin Dashboards** - Granular admin access control
- **B2B Applications** - Role-based organization access
- **Content Management** - Editor, Reviewer, Publisher roles
- **E-commerce** - Customer, Manager, Admin permissions

## 🧪 Testing

We provide an `InMemoryAdapter` for easy testing:

```typescript
import { InMemoryAdapter } from '@khannara/next-rbac/adapters';

describe('User Management', () => {
  it('should allow admin to create users', async () => {
    const adapter = new InMemoryAdapter({
      roles: [
        { name: 'admin', permissions: ['users.create'] },
        { name: 'user', permissions: ['users.read'] },
      ],
      users: [
        { id: 'admin1', role: 'admin' },
      ],
    });

    const canCreate = await hasPermission(adapter, 'admin1', 'users.create');
    expect(canCreate).toBe(true);
  });
});
```

## 🤝 Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for details.

## 📝 License

MIT © [Khannara Phay](https://github.com/khannara)

## 📞 Support

- 📦 [npm package](https://www.npmjs.com/package/@khannara/next-rbac)
- 📖 [GitHub repository](https://github.com/khannara/next-rbac)
- 🐛 [Report issues](https://github.com/khannara/next-rbac/issues)

---

**Production Ready** - Extracted from a live Next.js application serving **1000+ active users**
