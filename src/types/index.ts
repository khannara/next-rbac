/**
 * Module augmentation interface for customizing Permission and Role types
 *
 * Users can augment this interface to get full type safety and autocomplete.
 *
 * @example
 * ```typescript
 * // In your project: types/rbac.d.ts
 * import '@khannara/next-rbac';
 *
 * declare module '@khannara/next-rbac' {
 *   export interface RBACTypes {
 *     Permission: 'users.create' | 'users.read' | 'users.update' | 'users.delete';
 *     Role: 'admin' | 'manager' | 'user';
 *   }
 * }
 * ```
 */
export interface RBACTypes {
  Permission: string;
  Role: string;
}

/**
 * Permission type - defaults to string, can be augmented via RBACTypes
 */
export type Permission = RBACTypes['Permission'];

/**
 * Role type - defaults to string, can be augmented via RBACTypes
 */
export type Role = RBACTypes['Role'];

/**
 * Role document as stored in database
 */
export interface RoleDocument {
  _id?: unknown;
  name: string;
  permissions: Permission[];
  /**
   * Optional: Name of parent role to inherit permissions from
   * @example 'admin' inherits from 'manager', 'manager' inherits from 'user'
   */
  inherits?: string;
  created_at?: Date;
  updated_at?: Date;
  deleted_at?: Date | null;
}

/**
 * User document with role information
 */
export interface UserDocument {
  _id: unknown;
  role: Role;
  [key: string]: unknown;
}

/**
 * RBAC Adapter interface - implement this for your database
 */
export interface RBACAdapter {
  /**
   * Find a role by name
   */
  findRole(roleName: Role): Promise<RoleDocument | null>;

  /**
   * Get a user's role
   */
  getUserRole(userId: string): Promise<Role | null>;

  /**
   * Get all permissions for a role
   */
  getRolePermissions(roleName: Role): Promise<Permission[]>;
}

/**
 * RBAC Configuration options
 */
export interface RBACConfig {
  adapter: RBACAdapter;
  onPermissionDenied?: (userId: string, permission: Permission) => void | Promise<void>;
  onRoleDenied?: (userId: string, role: Role) => void | Promise<void>;
}
