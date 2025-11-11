# @khannara/next-rbac

> Role-Based Access Control (RBAC) for Next.js 13+ App Router with TypeScript support

[![npm version](https://badge.fury.io/js/%40khannara%2Fnext-rbac.svg)](https://www.npmjs.com/package/@khannara/next-rbac)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Features

✅ **Next.js 13+ App Router** - Built for Server Components and Server Actions
✅ **TypeScript First** - Full type safety with generics
✅ **Database Agnostic** - MongoDB adapter included, bring your own database
✅ **Server & Client** - Permission checks on both sides
✅ **React Components** - `<PermissionGate>`, `<RoleGate>` for declarative access control
✅ **Production Tested** - Extracted from production app with 1000+ users
✅ **Zero Dependencies** - Only peer dependencies (Next.js, React)

## Installation

```bash
npm install @khannara/next-rbac
```

**Peer Dependencies:**
- `next` >= 13.0.0
- `react` >= 18.0.0
- `mongodb` >= 6.0.0 (optional, only if using MongoDB adapter)

## Quick Start

### 1. Setup Database Adapter

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

### 2. Server-Side Permission Check (API Route)

```typescript
// app/api/users/route.ts
import { requirePermission } from '@khannara/next-rbac';
import { getRBACAdapter } from '@/lib/rbac';
import { auth } from '@/auth';

export async function POST(request: Request) {
  const session = await auth();
  const adapter = await getRBACAdapter();

  // Throw if user lacks permission
  await requirePermission(session.user.id, 'users.create', adapter);

  // User has permission, proceed...
  return Response.json({ success: true });
}
```

### 3. Client-Side Permission Gate (React)

```tsx
// app/users/page.tsx
import { PermissionGate } from '@khannara/next-rbac/react';
import { getRolePermissions } from '@khannara/next-rbac';
import { getRBACAdapter } from '@/lib/rbac';
import { auth } from '@/auth';

export default async function UsersPage() {
  const session = await auth();
  const adapter = await getRBACAdapter();
  const permissions = await getRolePermissions(session.user.role, adapter);

  return (
    <div>
      <h1>Users</h1>

      <PermissionGate
        permission="users.create"
        userPermissions={permissions}
      >
        <button>Create User</button>
      </PermissionGate>
    </div>
  );
}
```

## API Reference

### Server Functions

#### `hasPermission(userId, permission, adapter)`

Check if a user has a specific permission.

```typescript
import { hasPermission } from '@khannara/next-rbac';

const canDelete = await hasPermission(userId, 'users.delete', adapter);
```

#### `requirePermission(userId, permission, adapter)`

Require permission or throw error.

```typescript
await requirePermission(userId, 'users.create', adapter);
// Throws if user lacks permission
```

#### `hasAnyPermission(userId, permissions, adapter)`

Check if user has at least one permission.

```typescript
const canManage = await hasAnyPermission(userId, ['users.create', 'users.update'], adapter);
```

#### `hasAllPermissions(userId, permissions, adapter)`

Check if user has all permissions.

```typescript
const canFullyManage = await hasAllPermissions(userId, ['users.create', 'users.delete'], adapter);
```

#### `hasRole(userId, role, adapter)`

Check user's role.

```typescript
const isAdmin = await hasRole(userId, 'admin', adapter);
```

### React Components

#### `<PermissionGate>`

```tsx
import { PermissionGate } from '@khannara/next-rbac/react';

<PermissionGate
  permission="users.create"
  userPermissions={permissions}
  fallback={<p>Access denied</p>}
>
  <CreateButton />
</PermissionGate>
```

**Props:**
- `permission?: string` - Single permission
- `permissions?: string[]` - Multiple permissions
- `userPermissions: string[]` - User's permissions
- `requireAll?: boolean` - Require all permissions (default: false)
- `fallback?: ReactNode` - Fallback content

#### `<RoleGate>`

```tsx
import { RoleGate } from '@khannara/next-rbac/react';

<RoleGate role="admin" userRole={session.user.role}>
  <AdminPanel />
</RoleGate>
```

## Database Schema

### `users` collection

```javascript
{
  _id: ObjectId,
  role: "admin" | "manager" | "user"
}
```

### `roles` collection

```javascript
{
  _id: ObjectId,
  name: "admin",
  permissions: ["users.create", "users.delete", ...],
  deleted_at: null
}
```

## Custom Adapters

```typescript
import { RBACAdapter } from '@khannara/next-rbac';

class PostgreSQLAdapter implements RBACAdapter {
  async findRole(roleName: string) { /* ... */ }
  async getUserRole(userId: string) { /* ... */ }
  async getRolePermissions(roleName: string) { /* ... */ }
}
```

## TypeScript Support

```typescript
type Permission = 'users.create' | 'users.delete';
type Role = 'admin' | 'user';

await requirePermission<Permission>(userId, 'users.delete', adapter);
```

## Why next-rbac?

**Problem**: Next.js has no built-in RBAC. Auth libraries handle authentication, not authorization.

**Solution**: Production-ready RBAC for Next.js 13+ App Router.

## License

MIT © [Khanna Phay](https://github.com/khannara)

## Author

Built by [Khanna Phay](https://github.com/khannara)

**Need help?** Open an issue on [GitHub](https://github.com/khannara/next-rbac/issues)

---

**Production Ready** - Extracted from a production Next.js app serving 1000+ users