import { BaseAdapter } from './base';
import type { Role, Permission, RoleDocument } from '../types';

export interface MemoryAdapterConfig {
  /**
   * Initial roles data
   */
  roles?: Array<{
    name: string;
    permissions: string[];
  }>;

  /**
   * Initial users data
   */
  users?: Array<{
    id: string;
    role: string;
  }>;
}

/**
 * In-memory adapter for RBAC
 *
 * Perfect for:
 * - Unit testing
 * - Development/demos
 * - Documentation examples
 * - Prototyping
 *
 * @example
 * ```typescript
 * import { InMemoryAdapter } from '@khannara/next-rbac/adapters';
 *
 * const adapter = new InMemoryAdapter({
 *   roles: [
 *     {
 *       name: 'admin',
 *       permissions: ['users.create', 'users.read', 'users.update', 'users.delete']
 *     },
 *     {
 *       name: 'user',
 *       permissions: ['users.read']
 *     }
 *   ],
 *   users: [
 *     { id: '1', role: 'admin' },
 *     { id: '2', role: 'user' }
 *   ]
 * });
 * ```
 */
export class InMemoryAdapter extends BaseAdapter {
  private roles: Map<string, RoleDocument>;
  private users: Map<string, { id: string; role: string }>;

  constructor(config: MemoryAdapterConfig = {}) {
    super(); // No caching needed for in-memory

    this.roles = new Map();
    this.users = new Map();

    // Initialize roles
    if (config.roles) {
      config.roles.forEach(role => {
        this.roles.set(role.name, {
          _id: role.name,
          name: role.name,
          permissions: role.permissions,
          created_at: new Date(),
          updated_at: new Date(),
          deleted_at: null,
        });
      });
    }

    // Initialize users
    if (config.users) {
      config.users.forEach(user => {
        this.users.set(user.id, user);
      });
    }
  }

  /**
   * Find a role by name
   */
  async findRole(roleName: Role): Promise<RoleDocument | null> {
    return this.roles.get(roleName) || null;
  }

  /**
   * Get user's role
   */
  async getUserRole(userId: string): Promise<Role | null> {
    const user = this.users.get(userId);
    return user ? user.role : null;
  }

  /**
   * Get all permissions for a role
   */
  async getRolePermissions(roleName: Role): Promise<Permission[]> {
    const role = this.roles.get(roleName);
    return role?.permissions || [];
  }

  /**
   * Add or update a role (useful for testing)
   */
  setRole(name: string, permissions: string[]): void {
    this.roles.set(name, {
      _id: name,
      name,
      permissions,
      created_at: new Date(),
      updated_at: new Date(),
      deleted_at: null,
    });
  }

  /**
   * Add or update a user (useful for testing)
   */
  setUser(id: string, role: string): void {
    this.users.set(id, { id, role });
  }

  /**
   * Remove a role (useful for testing)
   */
  deleteRole(name: string): void {
    this.roles.delete(name);
  }

  /**
   * Remove a user (useful for testing)
   */
  deleteUser(id: string): void {
    this.users.delete(id);
  }

  /**
   * Clear all data (useful for test cleanup)
   */
  clear(): void {
    this.roles.clear();
    this.users.clear();
  }
}
