# Security Policy

## Supported Versions

We release patches for security vulnerabilities for the following versions:

| Version | Supported          |
| ------- | ------------------ |
| 0.x.x   | :white_check_mark: |

## Reporting a Vulnerability

**Please do not report security vulnerabilities through public GitHub issues.**

If you discover a security vulnerability in next-rbac, please report it by emailing:

**khannara.phay@gmail.com**

Include the following information:

- **Type of vulnerability** (e.g., permission bypass, injection, etc.)
- **Full path of source file(s)** related to the vulnerability
- **Location of the affected source code** (tag/branch/commit or direct URL)
- **Step-by-step instructions** to reproduce the issue
- **Proof-of-concept or exploit code** (if possible)
- **Impact of the vulnerability** (what can an attacker do?)

### Response Timeline

- **Within 48 hours**: We will acknowledge receipt of your report
- **Within 7 days**: We will provide a detailed response with next steps
- **Within 30 days**: We aim to release a patch (timeline may vary based on severity)

### Disclosure Policy

- We ask that you give us reasonable time to fix the vulnerability before public disclosure
- We will credit you in the security advisory (unless you prefer to remain anonymous)
- We will notify you when the vulnerability is fixed
- We appreciate coordinated disclosure and will work with you on timing

## Security Best Practices

When using next-rbac in your application:

### 1. Validate User Input

Always validate and sanitize user input before using it in permission checks:

```typescript
// ❌ BAD - Direct user input
const permission = req.body.permission; // User controlled!
await requirePermission(adapter, userId, permission);

// ✅ GOOD - Validated input
const allowedPermissions = ['users.read', 'users.create'];
const permission = req.body.permission;
if (allowedPermissions.includes(permission)) {
  await requirePermission(adapter, userId, permission);
}
```

### 2. Protect Database Credentials

Never expose database credentials in client-side code:

```typescript
// ❌ BAD - Client-side adapter
'use client';
import { MongoDBAdapter } from '@khannara/next-rbac/adapters';

// ✅ GOOD - Server-side only
// lib/rbac.ts (server-side)
import { MongoDBAdapter } from '@khannara/next-rbac/adapters';
import clientPromise from '@/lib/mongodb';

export async function getRBACAdapter() {
  const client = await clientPromise;
  const db = client.db(process.env.DB_NAME);
  return new MongoDBAdapter({ db });
}
```

### 3. Use Middleware for Route Protection

Protect sensitive routes at the edge with middleware:

```typescript
// middleware.ts
import { createRBACMiddleware } from '@khannara/next-rbac/server';

const rbacMiddleware = createRBACMiddleware({
  adapter: getRBACAdapter(),
  getUserId: getUserIdFromSession,
});

export async function middleware(req: NextRequest) {
  return rbacMiddleware(req, {
    '/admin': { roles: ['admin'] },
    '/api/users': { permissions: ['users.manage'] },
  });
}
```

### 4. Implement Role Inheritance Carefully

When using role inheritance, prevent circular dependencies:

```javascript
// ❌ BAD - Circular dependency
{
  name: 'admin',
  inherits: 'manager'
}
{
  name: 'manager',
  inherits: 'admin'  // Circular!
}

// ✅ GOOD - Linear hierarchy
{
  name: 'user',
  permissions: ['read']
}
{
  name: 'manager',
  permissions: ['write'],
  inherits: 'user'
}
{
  name: 'admin',
  permissions: ['delete'],
  inherits: 'manager'
}
```

### 5. Regularly Update Dependencies

Keep next-rbac and its dependencies up to date:

```bash
npm update @khannara/next-rbac
```

### 6. Use Environment-Specific Configurations

Never hardcode sensitive configuration:

```typescript
// ❌ BAD
const adapter = new MongoDBAdapter({
  db: client.db('production-db'),
});

// ✅ GOOD
const adapter = new MongoDBAdapter({
  db: client.db(process.env.DATABASE_NAME),
});
```

### 7. Implement Audit Logging

Log all permission checks for security auditing:

```typescript
import { hasPermission } from '@khannara/next-rbac/server';

async function checkPermission(userId: string, permission: string) {
  const allowed = await hasPermission(adapter, userId, permission);

  // Log the check
  await auditLog({
    userId,
    permission,
    allowed,
    timestamp: new Date(),
    ip: req.ip,
  });

  return allowed;
}
```

## Known Security Considerations

### Permission Bypass via Client-Side Checks

**Risk**: Relying solely on client-side permission gates (`<PermissionGate>`) without server-side validation.

**Mitigation**: Always validate permissions on the server:

```tsx
// Client-side (for UI)
<PermissionGate permission="users.delete" userPermissions={permissions}>
  <DeleteButton />
</PermissionGate>

// Server-side (required!)
export async function DELETE(req: Request) {
  await requirePermission(adapter, userId, 'users.delete');
  // Proceed with deletion
}
```

### SQL Injection via Custom Adapters

**Risk**: Custom adapters that don't properly sanitize input.

**Mitigation**: Use parameterized queries:

```typescript
// ❌ BAD
async findRole(roleName: Role) {
  return db.query(`SELECT * FROM roles WHERE name = '${roleName}'`);
}

// ✅ GOOD
async findRole(roleName: Role) {
  return db.query('SELECT * FROM roles WHERE name = $1', [roleName]);
}
```

### NoSQL Injection via MongoDB

**Risk**: Unsanitized input in MongoDB queries.

**Mitigation**: The built-in MongoDBAdapter uses parameterized queries. If creating a custom adapter, always validate input.

## Security Updates

Security updates will be released as patch versions (e.g., 0.1.1, 0.1.2) and announced via:

- GitHub Security Advisories
- npm package updates
- Release notes

Subscribe to GitHub notifications to stay informed.

## Hall of Fame

We recognize security researchers who responsibly disclose vulnerabilities:

<!-- Security researchers will be listed here -->
- None reported yet - be the first!

Thank you for helping keep next-rbac and our users safe! 🔒
