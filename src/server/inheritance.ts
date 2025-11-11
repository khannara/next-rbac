import type { RBACAdapter, Role, Permission } from '../types';

/**
 * Options for resolving role inheritance
 */
export interface InheritanceOptions {
  /**
   * Maximum depth to traverse role hierarchy (prevents infinite loops)
   * @default 10
   */
  maxDepth?: number;
}

/**
 * Resolves all permissions for a role including inherited permissions
 *
 * @param adapter - RBAC adapter instance
 * @param roleName - Name of the role
 * @param options - Inheritance options
 * @returns Array of all permissions (deduplicated)
 *
 * @example
 * ```typescript
 * // Role hierarchy:
 * // super-admin (no permissions, inherits from admin)
 * // admin (users.delete, inherits from manager)
 * // manager (users.update, inherits from user)
 * // user (users.read)
 *
 * const permissions = await resolveRolePermissions(adapter, 'super-admin');
 * // Returns: ['users.read', 'users.update', 'users.delete']
 * ```
 */
export async function resolveRolePermissions(
  adapter: RBACAdapter,
  roleName: Role,
  options: InheritanceOptions = {}
): Promise<Permission[]> {
  const { maxDepth = 10 } = options;
  const visited = new Set<string>();
  const allPermissions = new Set<Permission>();

  async function traverse(currentRole: Role, depth: number): Promise<void> {
    // Prevent infinite loops
    if (depth > maxDepth) {
      throw new Error(
        `Role inheritance depth exceeded ${maxDepth} for role: ${currentRole}`
      );
    }

    // Prevent circular inheritance
    if (visited.has(currentRole)) {
      throw new Error(`Circular role inheritance detected: ${currentRole}`);
    }

    visited.add(currentRole);

    // Get role document
    const role = await adapter.findRole(currentRole);
    if (!role) {
      return;
    }

    // Add this role's permissions
    role.permissions.forEach((perm) => allPermissions.add(perm));

    // Recursively get parent permissions
    if (role.inherits) {
      await traverse(role.inherits, depth + 1);
    }
  }

  await traverse(roleName, 0);

  return Array.from(allPermissions);
}

/**
 * Checks if a role inherits from another role (directly or indirectly)
 *
 * @param adapter - RBAC adapter instance
 * @param roleName - Name of the role to check
 * @param parentRole - Name of the potential parent role
 * @param options - Inheritance options
 * @returns True if roleName inherits from parentRole
 *
 * @example
 * ```typescript
 * // super-admin → admin → manager → user
 * await inheritsFrom(adapter, 'super-admin', 'user'); // true
 * await inheritsFrom(adapter, 'super-admin', 'admin'); // true
 * await inheritsFrom(adapter, 'admin', 'super-admin'); // false
 * ```
 */
export async function inheritsFrom(
  adapter: RBACAdapter,
  roleName: Role,
  parentRole: Role,
  options: InheritanceOptions = {}
): Promise<boolean> {
  const { maxDepth = 10 } = options;
  const visited = new Set<string>();

  async function traverse(currentRole: Role, depth: number): Promise<boolean> {
    if (depth > maxDepth) {
      return false;
    }

    if (visited.has(currentRole)) {
      return false;
    }

    visited.add(currentRole);

    const role = await adapter.findRole(currentRole);
    if (!role) {
      return false;
    }

    if (role.inherits === parentRole) {
      return true;
    }

    if (role.inherits) {
      return traverse(role.inherits, depth + 1);
    }

    return false;
  }

  return traverse(roleName, 0);
}

/**
 * Gets the complete role hierarchy for a role
 *
 * @param adapter - RBAC adapter instance
 * @param roleName - Name of the role
 * @param options - Inheritance options
 * @returns Array of role names from current to root (e.g., ['super-admin', 'admin', 'manager', 'user'])
 *
 * @example
 * ```typescript
 * const hierarchy = await getRoleHierarchy(adapter, 'super-admin');
 * // Returns: ['super-admin', 'admin', 'manager', 'user']
 * ```
 */
export async function getRoleHierarchy(
  adapter: RBACAdapter,
  roleName: Role,
  options: InheritanceOptions = {}
): Promise<Role[]> {
  const { maxDepth = 10 } = options;
  const hierarchy: Role[] = [];
  const visited = new Set<string>();

  async function traverse(currentRole: Role, depth: number): Promise<void> {
    if (depth > maxDepth) {
      throw new Error(
        `Role inheritance depth exceeded ${maxDepth} for role: ${currentRole}`
      );
    }

    if (visited.has(currentRole)) {
      throw new Error(`Circular role inheritance detected: ${currentRole}`);
    }

    visited.add(currentRole);
    hierarchy.push(currentRole);

    const role = await adapter.findRole(currentRole);
    if (role?.inherits) {
      await traverse(role.inherits, depth + 1);
    }
  }

  await traverse(roleName, 0);

  return hierarchy;
}
