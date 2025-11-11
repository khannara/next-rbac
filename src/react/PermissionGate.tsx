import React from 'react';
import type { Permission } from '../types';

interface PermissionGateProps {
  children: React.ReactNode;
  /**
   * Single permission to check
   */
  permission?: Permission;
  /**
   * Multiple permissions to check
   */
  permissions?: Permission[];
  /**
   * User's permissions (pass from session or context)
   */
  userPermissions: Permission[];
  /**
   * If true, user must have ALL permissions. If false, user needs ANY permission.
   * @default false
   */
  requireAll?: boolean;
  /**
   * Fallback content to render if permission check fails
   * @default null
   */
  fallback?: React.ReactNode;
}

/**
 * Component that renders children only if user has required permissions
 *
 * @example
 * ```tsx
 * // Server Component
 * import { PermissionGate } from '@yourusername/next-rbac/react';
 * import { auth } from '@/auth';
 * import { getUserPermissions } from '@/lib/rbac';
 *
 * export default async function Page() {
 *   const session = await auth();
 *   const permissions = await getUserPermissions(session.user.id);
 *
 *   return (
 *     <PermissionGate
 *       permission="users.create"
 *       userPermissions={permissions}
 *     >
 *       <button>Create User</button>
 *     </PermissionGate>
 *   );
 * }
 * ```
 *
 * @example
 * ```tsx
 * // Client Component with Context
 * 'use client';
 * import { PermissionGate } from '@yourusername/next-rbac/react';
 * import { usePermissions } from './hooks';
 *
 * export function MyComponent() {
 *   const { permissions } = usePermissions();
 *
 *   return (
 *     <PermissionGate
 *       permissions={['users.update', 'users.delete']}
 *       userPermissions={permissions}
 *       requireAll
 *     >
 *       <button>Edit & Delete</button>
 *     </PermissionGate>
 *   );
 * }
 * ```
 */
export function PermissionGate({
  children,
  permission,
  permissions,
  userPermissions,
  requireAll = false,
  fallback = null,
}: PermissionGateProps) {
  // Check single permission
  if (permission && !userPermissions.includes(permission)) {
    return <>{fallback}</>;
  }

  // Check multiple permissions
  if (permissions) {
    const hasPermission = requireAll
      ? permissions.every(p => userPermissions.includes(p))
      : permissions.some(p => userPermissions.includes(p));

    if (!hasPermission) {
      return <>{fallback}</>;
    }
  }

  return <>{children}</>;
}
