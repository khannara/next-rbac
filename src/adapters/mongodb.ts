import type { Db, Collection } from 'mongodb';
import type { RBACAdapter, RoleDocument, UserDocument, Role, Permission } from '../types';

/**
 * MongoDB adapter configuration
 */
export interface MongoDBAdapterConfig {
  db: Db;
  rolesCollection?: string;
  usersCollection?: string;
}

/**
 * MongoDB adapter for RBAC
 *
 * @example
 * ```typescript
 * import { MongoClient } from 'mongodb';
 * import { MongoDBAdapter } from '@yourusername/next-rbac/adapters';
 *
 * const client = new MongoClient(process.env.MONGODB_URI);
 * await client.connect();
 * const db = client.db('myapp');
 *
 * const adapter = new MongoDBAdapter({ db });
 * ```
 */
export class MongoDBAdapter implements RBACAdapter {
  private db: Db;
  private rolesCollectionName: string;
  private usersCollectionName: string;

  constructor(config: MongoDBAdapterConfig) {
    this.db = config.db;
    this.rolesCollectionName = config.rolesCollection || 'roles';
    this.usersCollectionName = config.usersCollection || 'users';
  }

  private get rolesCollection(): Collection<RoleDocument> {
    return this.db.collection<RoleDocument>(this.rolesCollectionName);
  }

  private get usersCollection(): Collection<UserDocument> {
    return this.db.collection<UserDocument>(this.usersCollectionName);
  }

  async findRole(roleName: Role): Promise<RoleDocument | null> {
    return this.rolesCollection.findOne({
      name: roleName,
      $or: [
        { deleted_at: null },
        { deleted_at: { $exists: false } }
      ]
    });
  }

  async getUserRole(userId: string): Promise<Role | null> {
    // Try to find by ObjectId first, then by string
    let user;

    try {
      const { ObjectId } = await import('mongodb');
      user = await this.usersCollection.findOne({ _id: new ObjectId(userId) } as any);
    } catch {
      // If ObjectId import fails or invalid ObjectId, try string
      user = await this.usersCollection.findOne({ _id: userId } as any);
    }

    return user?.role || null;
  }

  async getRolePermissions(roleName: Role): Promise<Permission[]> {
    const role = await this.findRole(roleName);

    if (!role) {
      return [];
    }

    // Get direct permissions
    const permissions = new Set<Permission>(role.permissions || []);

    // Recursively get inherited permissions
    if (role.inherits) {
      const inheritedPermissions = await this.getRolePermissions(role.inherits as Role);
      inheritedPermissions.forEach(p => permissions.add(p));
    }

    return Array.from(permissions);
  }
}
