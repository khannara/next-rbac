import { PrismaAdapter } from '../prisma';

describe('PrismaAdapter', () => {
  let mockPrisma: any;
  let adapter: PrismaAdapter;

  beforeEach(() => {
    // Mock Prisma client
    mockPrisma = {
      role: {
        findUnique: jest.fn(),
      },
      user: {
        findUnique: jest.fn(),
      },
    };

    adapter = new PrismaAdapter({
      prisma: mockPrisma,
    });
  });

  describe('constructor', () => {
    it('should throw error if prisma client is not provided', () => {
      expect(() => new PrismaAdapter({} as any)).toThrow(
        'PrismaAdapter requires a Prisma client instance'
      );
    });

    it('should use default model names', () => {
      expect(() =>
        new PrismaAdapter({
          prisma: mockPrisma,
        })
      ).not.toThrow();
    });

    it('should accept custom model names', () => {
      expect(() =>
        new PrismaAdapter({
          prisma: mockPrisma,
          roleModel: 'Role',
          userModel: 'User',
        })
      ).not.toThrow();
    });
  });

  describe('findRole', () => {
    it('should find an existing role', async () => {
      const mockRole = {
        id: '1',
        name: 'admin',
        permissions: ['users.create', 'users.read'],
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: null,
      };

      mockPrisma.role.findUnique.mockResolvedValue(mockRole);

      const role = await adapter.findRole('admin');

      expect(mockPrisma.role.findUnique).toHaveBeenCalledWith({
        where: {
          name: 'admin',
          deleted_at: null,
        },
      });

      expect(role).toEqual({
        _id: '1',
        name: 'admin',
        permissions: ['users.create', 'users.read'],
        created_at: mockRole.created_at,
        updated_at: mockRole.updated_at,
        deleted_at: null,
      });
    });

    it('should return null for non-existent role', async () => {
      mockPrisma.role.findUnique.mockResolvedValue(null);

      const role = await adapter.findRole('nonexistent');

      expect(role).toBeNull();
    });

    it('should fallback if deleted_at field does not exist', async () => {
      const mockRole = {
        id: '1',
        name: 'admin',
        permissions: ['users.read'],
        created_at: new Date(),
        updated_at: new Date(),
      };

      // First call throws (no deleted_at field), second call succeeds
      mockPrisma.role.findUnique
        .mockRejectedValueOnce(new Error('Unknown field deleted_at'))
        .mockResolvedValueOnce(mockRole);

      const role = await adapter.findRole('admin');

      expect(mockPrisma.role.findUnique).toHaveBeenCalledTimes(2);
      expect(role?.name).toBe('admin');
      expect(role?.deleted_at).toBeNull();
    });

    it('should use caching', async () => {
      const adapterWithCache = new PrismaAdapter({
        prisma: mockPrisma,
        enabled: true,
        ttl: 60,
      });

      const mockRole = {
        id: '1',
        name: 'admin',
        permissions: ['users.read'],
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: null,
      };

      mockPrisma.role.findUnique.mockResolvedValue(mockRole);

      // First call - should hit database
      await adapterWithCache.findRole('admin');
      expect(mockPrisma.role.findUnique).toHaveBeenCalledTimes(1);

      // Second call - should use cache
      await adapterWithCache.findRole('admin');
      expect(mockPrisma.role.findUnique).toHaveBeenCalledTimes(1);
    });
  });

  describe('getUserRole', () => {
    it('should get role for existing user', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: '1',
        role: 'admin',
      });

      const role = await adapter.getUserRole('1');

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: '1' },
        select: {
          role: true,
        },
      });

      expect(role).toBe('admin');
    });

    it('should return null for non-existent user', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const role = await adapter.getUserRole('999');

      expect(role).toBeNull();
    });

    it('should use caching', async () => {
      const adapterWithCache = new PrismaAdapter({
        prisma: mockPrisma,
        enabled: true,
        ttl: 60,
      });

      mockPrisma.user.findUnique.mockResolvedValue({
        id: '1',
        role: 'admin',
      });

      // First call
      await adapterWithCache.getUserRole('1');
      expect(mockPrisma.user.findUnique).toHaveBeenCalledTimes(1);

      // Second call - should use cache
      await adapterWithCache.getUserRole('1');
      expect(mockPrisma.user.findUnique).toHaveBeenCalledTimes(1);
    });
  });

  describe('getRolePermissions', () => {
    it('should get permissions for a role', async () => {
      mockPrisma.role.findUnique.mockResolvedValue({
        id: '1',
        name: 'admin',
        permissions: ['users.create', 'users.read'],
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: null,
      });

      const permissions = await adapter.getRolePermissions('admin');

      expect(permissions).toEqual(['users.create', 'users.read']);
    });

    it('should return empty array for non-existent role', async () => {
      mockPrisma.role.findUnique.mockResolvedValue(null);

      const permissions = await adapter.getRolePermissions('nonexistent');

      expect(permissions).toEqual([]);
    });
  });

  describe('custom field names', () => {
    it('should work with custom field names', async () => {
      const customAdapter = new PrismaAdapter({
        prisma: mockPrisma,
        roleModel: 'Role',
        userModel: 'User',
        roleNameField: 'roleName',
        rolePermissionsField: 'perms',
        userRoleField: 'userRole',
        deletedAtField: 'deletedAt',
      });

      mockPrisma.Role = {
        findUnique: jest.fn().mockResolvedValue({
          id: '1',
          roleName: 'admin',
          perms: ['all'],
          created_at: new Date(),
          updated_at: new Date(),
          deletedAt: null,
        }),
      };

      mockPrisma.User = {
        findUnique: jest.fn().mockResolvedValue({
          id: '1',
          userRole: 'admin',
        }),
      };

      const role = await customAdapter.findRole('admin');
      const userRole = await customAdapter.getUserRole('1');

      expect(mockPrisma.Role.findUnique).toHaveBeenCalledWith({
        where: {
          roleName: 'admin',
          deletedAt: null,
        },
      });

      expect(mockPrisma.User.findUnique).toHaveBeenCalledWith({
        where: { id: '1' },
        select: {
          userRole: true,
        },
      });

      expect(role?.name).toBe('admin');
      expect(userRole).toBe('admin');
    });
  });

  describe('clearCache', () => {
    it('should clear specific cache key', async () => {
      const adapterWithCache = new PrismaAdapter({
        prisma: mockPrisma,
        enabled: true,
        ttl: 60,
      });

      mockPrisma.role.findUnique.mockResolvedValue({
        id: '1',
        name: 'admin',
        permissions: ['users.read'],
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: null,
      });

      // Cache the role
      await adapterWithCache.findRole('admin');
      expect(mockPrisma.role.findUnique).toHaveBeenCalledTimes(1);

      // Clear specific cache key
      adapterWithCache.clearCache('role:admin');

      // Should hit database again
      await adapterWithCache.findRole('admin');
      expect(mockPrisma.role.findUnique).toHaveBeenCalledTimes(2);
    });

    it('should clear all cache', async () => {
      const adapterWithCache = new PrismaAdapter({
        prisma: mockPrisma,
        enabled: true,
        ttl: 60,
      });

      mockPrisma.role.findUnique.mockResolvedValue({
        id: '1',
        name: 'admin',
        permissions: ['users.read'],
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: null,
      });

      mockPrisma.user.findUnique.mockResolvedValue({
        id: '1',
        role: 'admin',
      });

      // Cache both
      await adapterWithCache.findRole('admin');
      await adapterWithCache.getUserRole('1');

      // Clear all cache
      adapterWithCache.clearCache();

      // Both should hit database again
      await adapterWithCache.findRole('admin');
      await adapterWithCache.getUserRole('1');

      expect(mockPrisma.role.findUnique).toHaveBeenCalledTimes(2);
      expect(mockPrisma.user.findUnique).toHaveBeenCalledTimes(2);
    });
  });
});
