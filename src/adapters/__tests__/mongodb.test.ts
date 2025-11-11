import { MongoDBAdapter } from '../mongodb';
import type { Db, Collection } from 'mongodb';

describe('MongoDBAdapter', () => {
  let mockDb: Partial<Db>;
  let mockRolesCollection: Partial<Collection>;
  let mockUsersCollection: Partial<Collection>;
  let adapter: MongoDBAdapter;

  beforeEach(() => {
    // Mock collections
    mockRolesCollection = {
      findOne: jest.fn(),
    };

    mockUsersCollection = {
      findOne: jest.fn(),
    };

    // Mock database
    mockDb = {
      collection: jest.fn((name: string) => {
        if (name === 'roles') return mockRolesCollection as Collection;
        if (name === 'users') return mockUsersCollection as Collection;
        throw new Error(`Unknown collection: ${name}`);
      }),
    };

    adapter = new MongoDBAdapter({
      db: mockDb as Db,
    });
  });

  describe('constructor', () => {
    it('should use default collection names', () => {
      expect(() =>
        new MongoDBAdapter({
          db: mockDb as Db,
        })
      ).not.toThrow();
    });

    it('should accept custom collection names', () => {
      const customAdapter = new MongoDBAdapter({
        db: mockDb as Db,
        rolesCollection: 'custom_roles',
        usersCollection: 'custom_users',
      });

      expect(customAdapter).toBeDefined();
    });
  });

  describe('findRole', () => {
    it('should find an existing role', async () => {
      const mockRole = {
        _id: '1',
        name: 'admin',
        permissions: ['users.create', 'users.read'],
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: null,
      };

      (mockRolesCollection.findOne as jest.Mock).mockResolvedValue(mockRole);

      const role = await adapter.findRole('admin');

      expect(mockRolesCollection.findOne).toHaveBeenCalledWith({
        name: 'admin',
        $or: [{ deleted_at: null }, { deleted_at: { $exists: false } }],
      });

      expect(role).toEqual(mockRole);
    });

    it('should return null for non-existent role', async () => {
      (mockRolesCollection.findOne as jest.Mock).mockResolvedValue(null);

      const role = await adapter.findRole('nonexistent');

      expect(role).toBeNull();
    });

    it('should filter out soft-deleted roles', async () => {
      (mockRolesCollection.findOne as jest.Mock).mockResolvedValue(null);

      await adapter.findRole('deleted-role');

      expect(mockRolesCollection.findOne).toHaveBeenCalledWith({
        name: 'deleted-role',
        $or: [{ deleted_at: null }, { deleted_at: { $exists: false } }],
      });
    });
  });

  describe('getUserRole', () => {
    it('should get role for existing user with ObjectId', async () => {
      const mockUser = {
        _id: '507f1f77bcf86cd799439011',
        email: 'admin@example.com',
        role: 'admin',
      };

      (mockUsersCollection.findOne as jest.Mock).mockResolvedValue(mockUser);

      const role = await adapter.getUserRole('507f1f77bcf86cd799439011');

      expect(role).toBe('admin');
    });

    it('should get role for existing user with string ID', async () => {
      const mockUser = {
        _id: 'user123',
        email: 'user@example.com',
        role: 'user',
      };

      (mockUsersCollection.findOne as jest.Mock).mockResolvedValue(mockUser);

      const role = await adapter.getUserRole('user123');

      expect(role).toBe('user');
      expect(mockUsersCollection.findOne).toHaveBeenCalled();
    });

    it('should return null for non-existent user', async () => {
      (mockUsersCollection.findOne as jest.Mock).mockResolvedValue(null);

      const role = await adapter.getUserRole('999');

      expect(role).toBeNull();
    });

    it('should handle user without role field', async () => {
      const mockUser = {
        _id: '1',
        email: 'nRole@example.com',
      };

      (mockUsersCollection.findOne as jest.Mock).mockResolvedValue(mockUser);

      const role = await adapter.getUserRole('1');

      expect(role).toBeNull();
    });
  });

  describe('getRolePermissions', () => {
    it('should get permissions for a role', async () => {
      const mockRole = {
        _id: '1',
        name: 'admin',
        permissions: ['users.create', 'users.read', 'users.delete'],
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: null,
      };

      (mockRolesCollection.findOne as jest.Mock).mockResolvedValue(mockRole);

      const permissions = await adapter.getRolePermissions('admin');

      expect(permissions).toEqual(['users.create', 'users.read', 'users.delete']);
    });

    it('should return empty array for non-existent role', async () => {
      (mockRolesCollection.findOne as jest.Mock).mockResolvedValue(null);

      const permissions = await adapter.getRolePermissions('nonexistent');

      expect(permissions).toEqual([]);
    });

    it('should handle role without permissions field', async () => {
      const mockRole = {
        _id: '1',
        name: 'empty-role',
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: null,
      };

      (mockRolesCollection.findOne as jest.Mock).mockResolvedValue(mockRole);

      const permissions = await adapter.getRolePermissions('empty-role');

      expect(permissions).toEqual([]);
    });
  });

  describe('custom collections', () => {
    it('should work with custom collection names', async () => {
      // Update mock to handle custom names
      (mockDb.collection as jest.Mock) = jest.fn((name: string) => {
        if (name === 'custom_roles') return mockRolesCollection as Collection;
        if (name === 'custom_users') return mockUsersCollection as Collection;
        throw new Error(`Unknown collection: ${name}`);
      });

      const customAdapter = new MongoDBAdapter({
        db: mockDb as Db,
        rolesCollection: 'custom_roles',
        usersCollection: 'custom_users',
      });

      const mockRole = {
        _id: '1',
        name: 'admin',
        permissions: ['all'],
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: null,
      };

      (mockRolesCollection.findOne as jest.Mock).mockResolvedValue(mockRole);

      await customAdapter.findRole('admin');

      expect(mockDb.collection).toHaveBeenCalledWith('custom_roles');
    });
  });

  describe('integration scenarios', () => {
    it('should handle complete user permission lookup', async () => {
      // User has admin role
      const mockUser = {
        _id: '1',
        email: 'admin@example.com',
        role: 'admin',
      };

      const mockRole = {
        _id: 'role1',
        name: 'admin',
        permissions: ['users.create', 'users.read', 'users.update', 'users.delete'],
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: null,
      };

      (mockUsersCollection.findOne as jest.Mock).mockResolvedValue(mockUser);
      (mockRolesCollection.findOne as jest.Mock).mockResolvedValue(mockRole);

      // Get user's role
      const userRole = await adapter.getUserRole('1');
      expect(userRole).toBe('admin');

      // Get role's permissions
      const permissions = await adapter.getRolePermissions('admin');
      expect(permissions).toEqual([
        'users.create',
        'users.read',
        'users.update',
        'users.delete',
      ]);
    });

    it('should handle user with non-existent role', async () => {
      const mockUser = {
        _id: '1',
        email: 'orphan@example.com',
        role: 'deleted-role',
      };

      (mockUsersCollection.findOne as jest.Mock).mockResolvedValue(mockUser);
      (mockRolesCollection.findOne as jest.Mock).mockResolvedValue(null);

      const userRole = await adapter.getUserRole('1');
      expect(userRole).toBe('deleted-role');

      const permissions = await adapter.getRolePermissions('deleted-role');
      expect(permissions).toEqual([]);
    });
  });
});
