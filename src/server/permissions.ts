import type { RBACAdapter, Permission, Role } from '../types';

/**
 * Get all permissions for a role
 *
 * @param role - The role name
 * @param adapter - RBAC adapter instance
 * @returns Array of permissions
 *
 * @example
 * ```typescript
 * const permissions = await getRolePermissions('admin', adapter);
 * console.log(permissions); // ['users.create', 'users.delete', ...]
 * ```
 */
export async function getRolePermissions(
  role: Role,
  adapter: RBACAdapter
): Promise<Permission[]> {
  return adapter.getRolePermissions(role);
}

/**
 * Check if a user has a specific permission
 *
 * @param userId - User ID
 * @param permission - Permission to check
 * @param adapter - RBAC adapter instance
 * @returns Boolean indicating if user has permission
 *
 * @example
 * ```typescript
 * const canDelete = await hasPermission(userId, 'users.delete', adapter);
 * if (canDelete) {
 *   // User can delete
 * }
 * ```
 */
export async function hasPermission(
  userId: string,
  permission: Permission,
  adapter: RBACAdapter
): Promise<boolean> {
  const role = await adapter.getUserRole(userId);

  if (!role) {
    return false;
  }

  const permissions = await getRolePermissions(role, adapter);
  return permissions.includes(permission);
}

/**
 * Check if a user has any of the specified permissions
 *
 * @param userId - User ID
 * @param permissions - Array of permissions to check
 * @param adapter - RBAC adapter instance
 * @returns Boolean indicating if user has at least one permission
 *
 * @example
 * ```typescript
 * const canManageUsers = await hasAnyPermission(
 *   userId,
 *   ['users.create', 'users.update', 'users.delete'],
 *   adapter
 * );
 * ```
 */
export async function hasAnyPermission(
  userId: string,
  permissions: Permission[],
  adapter: RBACAdapter
): Promise<boolean> {
  const role = await adapter.getUserRole(userId);

  if (!role) {
    return false;
  }

  const userPermissions = await getRolePermissions(role, adapter);
  return permissions.some(p => userPermissions.includes(p));
}

/**
 * Check if a user has all of the specified permissions
 *
 * @param userId - User ID
 * @param permissions - Array of permissions to check
 * @param adapter - RBAC adapter instance
 * @returns Boolean indicating if user has all permissions
 *
 * @example
 * ```typescript
 * const canFullyManageUsers = await hasAllPermissions(
 *   userId,
 *   ['users.create', 'users.update', 'users.delete'],
 *   adapter
 * );
 * ```
 */
export async function hasAllPermissions(
  userId: string,
  permissions: Permission[],
  adapter: RBACAdapter
): Promise<boolean> {
  const role = await adapter.getUserRole(userId);

  if (!role) {
    return false;
  }

  const userPermissions = await getRolePermissions(role, adapter);
  return permissions.every(p => userPermissions.includes(p));
}

/**
 * Check if a user has a specific role
 *
 * @param userId - User ID
 * @param role - Role to check
 * @param adapter - RBAC adapter instance
 * @returns Boolean indicating if user has role
 *
 * @example
 * ```typescript
 * const isAdmin = await hasRole(userId, 'admin', adapter);
 * if (isAdmin) {
 *   // User is admin
 * }
 * ```
 */
export async function hasRole(
  userId: string,
  role: Role,
  adapter: RBACAdapter
): Promise<boolean> {
  const userRole = await adapter.getUserRole(userId);
  return userRole === role;
}

/**
 * Check if a user has any of the specified roles
 *
 * @param userId - User ID
 * @param roles - Array of roles to check
 * @param adapter - RBAC adapter instance
 * @returns Boolean indicating if user has at least one role
 *
 * @example
 * ```typescript
 * const canManage = await hasAnyRole(userId, ['admin', 'manager'], adapter);
 * ```
 */
export async function hasAnyRole(
  userId: string,
  roles: Role[],
  adapter: RBACAdapter
): Promise<boolean> {
  const userRole = await adapter.getUserRole(userId);
  return userRole ? roles.includes(userRole) : false;
}

/**
 * Require a specific permission or throw an error
 *
 * @param userId - User ID
 * @param permission - Permission to require
 * @param adapter - RBAC adapter instance
 * @throws Error if user lacks permission
 *
 * @example
 * ```typescript
 * // In API route
 * export async function POST(request: Request) {
 *   const session = await auth();
 *   await requirePermission(session.user.id, 'users.create', adapter);
 *
 *   // User has permission, proceed...
 * }
 * ```
 */
export async function requirePermission(
  userId: string,
  permission: Permission,
  adapter: RBACAdapter
): Promise<void> {
  const hasPerms = await hasPermission(userId, permission, adapter);

  if (!hasPerms) {
    throw new Error(`Permission denied: ${permission}`);
  }
}

/**
 * Require a specific role or throw an error
 *
 * @param userId - User ID
 * @param role - Role to require
 * @param adapter - RBAC adapter instance
 * @throws Error if user lacks role
 *
 * @example
 * ```typescript
 * export async function POST(request: Request) {
 *   const session = await auth();
 *   await requireRole(session.user.id, 'admin', adapter);
 *
 *   // User is admin, proceed...
 * }
 * ```
 */
export async function requireRole(
  userId: string,
  role: Role,
  adapter: RBACAdapter
): Promise<void> {
  const hasRoleCheck = await hasRole(userId, role, adapter);

  if (!hasRoleCheck) {
    throw new Error(`Role required: ${role}`);
  }
}

/**
 * Require any of the specified permissions or throw an error
 *
 * @param userId - User ID
 * @param permissions - Array of permissions (user needs at least one)
 * @param adapter - RBAC adapter instance
 * @throws Error if user lacks all permissions
 */
export async function requireAnyPermission(
  userId: string,
  permissions: Permission[],
  adapter: RBACAdapter
): Promise<void> {
  const hasPerms = await hasAnyPermission(userId, permissions, adapter);

  if (!hasPerms) {
    throw new Error(`Permission denied: requires one of ${permissions.join(', ')}`);
  }
}

/**
 * Require all of the specified permissions or throw an error
 *
 * @param userId - User ID
 * @param permissions - Array of permissions (user needs all)
 * @param adapter - RBAC adapter instance
 * @throws Error if user lacks any permission
 */
export async function requireAllPermissions(
  userId: string,
  permissions: Permission[],
  adapter: RBACAdapter
): Promise<void> {
  const hasPerms = await hasAllPermissions(userId, permissions, adapter);

  if (!hasPerms) {
    throw new Error(`Permission denied: requires all of ${permissions.join(', ')}`);
  }
}
