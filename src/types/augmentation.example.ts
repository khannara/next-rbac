/**
 * Example of how to augment the RBAC types with your own permission and role types
 *
 * To use this in your project:
 * 1. Create a file: `types/rbac.d.ts` in your project
 * 2. Copy the content below
 * 3. Customize the Permission and Role types with your specific values
 * 4. TypeScript will now autocomplete your permissions and roles throughout your app
 *
 * @example
 * ```typescript
 * // types/rbac.d.ts
 * import '@khannara/next-rbac';
 *
 * declare module '@khannara/next-rbac' {
 *   export interface RBACTypes {
 *     Permission:
 *       // Dashboard
 *       | 'dashboard.view'
 *       // Users
 *       | 'users.create'
 *       | 'users.read'
 *       | 'users.update'
 *       | 'users.delete'
 *       // Products
 *       | 'products.create'
 *       | 'products.read'
 *       | 'products.update'
 *       | 'products.delete'
 *       // Settings
 *       | 'settings.read'
 *       | 'settings.update';
 *
 *     Role:
 *       | 'super-admin'
 *       | 'admin'
 *       | 'manager'
 *       | 'user'
 *       | 'guest';
 *   }
 * }
 * ```
 *
 * After adding this file, you'll get full autocomplete:
 *
 * ```typescript
 * import { hasPermission } from '@khannara/next-rbac/server';
 *
 * // TypeScript will autocomplete these!
 * await hasPermission(adapter, userId, 'users.create'); // ✓
 * await hasPermission(adapter, userId, 'invalid.perm'); // ✗ Type error
 *
 * await hasRole(adapter, userId, 'admin'); // ✓
 * await hasRole(adapter, userId, 'invalid-role'); // ✗ Type error
 * ```
 */

// This file is just an example and is not compiled into the package.
// Users should create their own version in their project.

import '@khannara/next-rbac';

declare module '@khannara/next-rbac' {
  export interface RBACTypes {
    /**
     * Define your application's permissions here
     */
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

    /**
     * Define your application's roles here
     */
    Role: 'super-admin' | 'admin' | 'manager' | 'user' | 'guest';
  }
}
