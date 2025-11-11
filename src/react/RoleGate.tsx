import React from 'react';
import type { Role } from '../types';

interface RoleGateProps {
  children: React.ReactNode;
  /**
   * Single role to check
   */
  role?: Role;
  /**
   * Multiple roles to check
   */
  roles?: Role[];
  /**
   * User's role (pass from session or context)
   */
  userRole: Role | null;
  /**
   * Fallback content to render if role check fails
   * @default null
   */
  fallback?: React.ReactNode;
}

/**
 * Component that renders children only if user has required role
 *
 * @example
 * ```tsx
 * // Server Component
 * import { RoleGate } from '@yourusername/next-rbac/react';
 * import { auth } from '@/auth';
 *
 * export default async function Page() {
 *   const session = await auth();
 *
 *   return (
 *     <RoleGate role="admin" userRole={session.user.role}>
 *       <AdminPanel />
 *     </RoleGate>
 *   );
 * }
 * ```
 *
 * @example
 * ```tsx
 * // Client Component
 * 'use client';
 * import { RoleGate } from '@yourusername/next-rbac/react';
 * import { useSession } from 'next-auth/react';
 *
 * export function MyComponent() {
 *   const { data: session } = useSession();
 *
 *   return (
 *     <RoleGate
 *       roles={['admin', 'manager']}
 *       userRole={session?.user?.role}
 *     >
 *       <ManagementPanel />
 *     </RoleGate>
 *   );
 * }
 * ```
 */
export function RoleGate({
  children,
  role,
  roles,
  userRole,
  fallback = null,
}: RoleGateProps) {
  if (!userRole) {
    return <>{fallback}</>;
  }

  // Check single role
  if (role && userRole !== role) {
    return <>{fallback}</>;
  }

  // Check multiple roles
  if (roles && !roles.includes(userRole)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
