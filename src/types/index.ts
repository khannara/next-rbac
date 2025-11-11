/**
 * Generic permission type - users should extend this with their own permission strings
 */
export type Permission = string;

/**
 * Generic role type - users should extend this with their own role strings
 */
export type Role = string;

/**
 * Role document as stored in database
 */
export interface RoleDocument {
  _id?: unknown;
  name: string;
  permissions: Permission[];
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
