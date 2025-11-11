# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- CLI tool for generating RBAC boilerplate (planned)
- Example applications (planned)
- ABAC (Attribute-Based Access Control) support (planned)
- Audit logging utilities (planned)

## [0.2.0] - 2025-01-11

### Added
- **Prisma Adapter** - Support for PostgreSQL, MySQL, SQLite, SQL Server, MongoDB, CockroachDB via Prisma ORM
- **In-Memory Adapter** - Perfect for testing and demos, no database required
- **Middleware Helpers** - `createRBACMiddleware`, `createRoleMiddleware`, `createPermissionMiddleware` for Next.js route protection
- **Hierarchical Roles** - Role inheritance with circular dependency detection
  - `resolveRolePermissions()` - Get all permissions including inherited
  - `inheritsFrom()` - Check if role inherits from another
  - `getRoleHierarchy()` - Get complete role hierarchy
- **TypeScript Module Augmentation** - Full autocomplete for custom permissions and roles
- **Base Adapter Class** - Shared caching functionality for all adapters (TTL-based)
- **Comprehensive Testing** - 116 tests with 96%+ code coverage using Jest and c8
- **CI/CD Pipeline** - GitHub Actions for automated testing, linting, and publishing
- **Community Files** - CONTRIBUTING.md, CODE_OF_CONDUCT.md, SECURITY.md
- **Database Examples** - Prisma schemas for PostgreSQL, MySQL, and MongoDB

### Changed
- **Breaking**: MongoDB adapter now extends BaseAdapter for caching support
- **Improved**: Complete README rewrite with comprehensive examples
- **Enhanced**: TypeScript types now support module augmentation for better DX

### Fixed
- Type safety improvements across all adapters
- Better error messages for circular role inheritance

## [0.1.0] - 2025-01-10

### Added
- Initial release
- MongoDB adapter for RBAC
- Server-side permission checking functions
  - `hasPermission()`, `requirePermission()`
  - `hasAnyPermission()`, `hasAllPermissions()`
  - `hasRole()`, `hasAnyRole()`, `requireRole()`
- React components
  - `<PermissionGate>` - Show/hide content based on permissions
  - `<RoleGate>` - Show/hide content based on roles
- TypeScript support with full type safety
- Next.js 13+ App Router compatibility
- Zero runtime dependencies (only peer deps)
- Production-tested (extracted from app with 1000+ users)

---

## Version History Summary

- **0.2.0** - Multi-database support, middleware, hierarchical roles, testing infrastructure
- **0.1.0** - Initial release with MongoDB adapter and core RBAC functionality

## Upgrade Guides

### Upgrading from 0.1.x to 0.2.x

**Breaking Changes:**

1. **MongoDB Adapter Constructor**: Now accepts optional caching config

```typescript
// Before (0.1.x)
const adapter = new MongoDBAdapter({ db });

// After (0.2.x) - Still works
const adapter = new MongoDBAdapter({ db });

// After (0.2.x) - With caching (optional)
const adapter = new MongoDBAdapter({
  db,
  enabled: true,
  ttl: 300,
});
```

2. **Function Signatures**: No changes to existing functions - fully backward compatible

**New Features:**

1. **Try Prisma Adapter** (optional):

```typescript
import { PrismaAdapter } from '@khannara/next-rbac/adapters';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const adapter = new PrismaAdapter({ prisma });
```

2. **Add Middleware Protection** (optional):

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
  });
}
```

3. **Use Hierarchical Roles** (optional):

Add `inherits` field to your roles:

```javascript
{
  name: 'admin',
  permissions: ['users.delete'],
  inherits: 'manager'  // New field
}
```

Then use inheritance utilities:

```typescript
import { resolveRolePermissions } from '@khannara/next-rbac/server';

const allPermissions = await resolveRolePermissions(adapter, 'admin');
// Includes admin + manager + user permissions
```

## Support

- 📦 [npm package](https://www.npmjs.com/package/@khannara/next-rbac)
- 📖 [GitHub repository](https://github.com/khannara/next-rbac)
- 🐛 [Report issues](https://github.com/khannara/next-rbac/issues)
- 💬 [Discussions](https://github.com/khannara/next-rbac/discussions)
