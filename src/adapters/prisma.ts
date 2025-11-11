import { BaseAdapter, type CacheConfig } from './base';
import type { Role, Permission, RoleDocument } from '../types';

export interface PrismaAdapterConfig extends CacheConfig {
  /**
   * Prisma client instance
   */
  prisma: any;

  /**
   * Name of the roles model in your Prisma schema
   * @default 'role'
   */
  roleModel?: string;

  /**
   * Name of the users model in your Prisma schema
   * @default 'user'
   */
  userModel?: string;

  /**
   * Field name for role name in roles table
   * @default 'name'
   */
  roleNameField?: string;

  /**
   * Field name for permissions array in roles table
   * @default 'permissions'
   */
  rolePermissionsField?: string;

  /**
   * Field name for role in users table
   * @default 'role'
   */
  userRoleField?: string;

  /**
   * Field name for deleted_at (soft delete)
   * @default 'deleted_at'
   */
  deletedAtField?: string;
}

/**
 * Prisma adapter for RBAC
 *
 * Works with any database supported by Prisma:
 * - PostgreSQL
 * - MySQL
 * - SQLite
 * - SQL Server
 * - MongoDB
 * - CockroachDB
 *
 * @example
 * ```typescript
 * import { PrismaClient } from '@prisma/client';
 * import { PrismaAdapter } from '@khannara/next-rbac/adapters';
 *
 * const prisma = new PrismaClient();
 *
 * const adapter = new PrismaAdapter({
 *   prisma,
 *   roleModel: 'role',
 *   userModel: 'user',
 *   enabled: true, // Enable caching
 *   ttl: 300 // Cache for 5 minutes
 * });
 * ```
 *
 * Required Prisma schema:
 * ```prisma
 * model Role {
 *   id          String   @id @default(auto()) @map("_id") @db.ObjectId
 *   name        String   @unique
 *   permissions String[]
 *   deleted_at  DateTime?
 *   created_at  DateTime  @default(now())
 *   updated_at  DateTime  @updatedAt
 * }
 *
 * model User {
 *   id    String @id @default(auto()) @map("_id") @db.ObjectId
 *   email String @unique
 *   role  String
 *   // ... other fields
 * }
 * ```
 */
export class PrismaAdapter extends BaseAdapter {
  private prisma: any;
  private roleModel: string;
  private userModel: string;
  private roleNameField: string;
  private rolePermissionsField: string;
  private userRoleField: string;
  private deletedAtField: string;

  constructor(config: PrismaAdapterConfig) {
    super(config);

    if (!config.prisma) {
      throw new Error('PrismaAdapter requires a Prisma client instance');
    }

    this.prisma = config.prisma;
    this.roleModel = config.roleModel || 'role';
    this.userModel = config.userModel || 'user';
    this.roleNameField = config.roleNameField || 'name';
    this.rolePermissionsField = config.rolePermissionsField || 'permissions';
    this.userRoleField = config.userRoleField || 'role';
    this.deletedAtField = config.deletedAtField || 'deleted_at';
  }

  /**
   * Find a role by name
   */
  async findRole(roleName: Role): Promise<RoleDocument | null> {
    return this.withCache(`role:${roleName}`, async () => {
      try {
        const role = await this.prisma[this.roleModel].findUnique({
          where: {
            [this.roleNameField]: roleName,
            [this.deletedAtField]: null,
          },
        });

        if (!role) return null;

        return {
          _id: role.id,
          name: role[this.roleNameField],
          permissions: role[this.rolePermissionsField] || [],
          created_at: role.created_at,
          updated_at: role.updated_at,
          deleted_at: role[this.deletedAtField],
        };
      } catch (error) {
        // If deleted_at field doesn't exist, try without it
        const role = await this.prisma[this.roleModel].findUnique({
          where: {
            [this.roleNameField]: roleName,
          },
        });

        if (!role) return null;

        return {
          _id: role.id,
          name: role[this.roleNameField],
          permissions: role[this.rolePermissionsField] || [],
          created_at: role.created_at,
          updated_at: role.updated_at,
          deleted_at: null,
        };
      }
    });
  }

  /**
   * Get user's role
   */
  async getUserRole(userId: string): Promise<Role | null> {
    return this.withCache(`user-role:${userId}`, async () => {
      const user = await this.prisma[this.userModel].findUnique({
        where: { id: userId },
        select: {
          [this.userRoleField]: true,
        },
      });

      return user ? user[this.userRoleField] : null;
    });
  }

  /**
   * Get all permissions for a role
   */
  async getRolePermissions(roleName: Role): Promise<Permission[]> {
    const role = await this.findRole(roleName);
    return role?.permissions || [];
  }
}
