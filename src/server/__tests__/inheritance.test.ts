import {
  resolveRolePermissions,
  inheritsFrom,
  getRoleHierarchy,
} from '../inheritance';
import type { RBACAdapter, RoleDocument } from '../../types';

describe('Role Inheritance', () => {
  let mockAdapter: RBACAdapter;
  const roles: Map<string, RoleDocument> = new Map();

  beforeEach(() => {
    roles.clear();

    // Setup role hierarchy:
    // super-admin (no direct permissions) → admin → manager → user
    roles.set('user', {
      name: 'user',
      permissions: ['users.read', 'profile.read'],
    });

    roles.set('manager', {
      name: 'manager',
      permissions: ['users.update', 'reports.read'],
      inherits: 'user',
    });

    roles.set('admin', {
      name: 'admin',
      permissions: ['users.delete', 'settings.read'],
      inherits: 'manager',
    });

    roles.set('super-admin', {
      name: 'super-admin',
      permissions: ['system.admin'],
      inherits: 'admin',
    });

    mockAdapter = {
      findRole: jest.fn((roleName: string) => {
        return Promise.resolve(roles.get(roleName) || null);
      }),
      getUserRole: jest.fn(),
      getRolePermissions: jest.fn(),
    };
  });

  describe('resolveRolePermissions', () => {
    it('should get permissions for role without inheritance', async () => {
      const permissions = await resolveRolePermissions(mockAdapter, 'user');

      expect(permissions).toEqual(
        expect.arrayContaining(['users.read', 'profile.read'])
      );
      expect(permissions).toHaveLength(2);
    });

    it('should inherit permissions from parent role', async () => {
      const permissions = await resolveRolePermissions(mockAdapter, 'manager');

      expect(permissions).toEqual(
        expect.arrayContaining([
          'users.read',
          'profile.read',
          'users.update',
          'reports.read',
        ])
      );
      expect(permissions).toHaveLength(4);
    });

    it('should inherit permissions from multiple levels', async () => {
      const permissions = await resolveRolePermissions(mockAdapter, 'admin');

      expect(permissions).toEqual(
        expect.arrayContaining([
          'users.read',
          'profile.read',
          'users.update',
          'reports.read',
          'users.delete',
          'settings.read',
        ])
      );
      expect(permissions).toHaveLength(6);
    });

    it('should inherit all permissions down the hierarchy', async () => {
      const permissions = await resolveRolePermissions(mockAdapter, 'super-admin');

      expect(permissions).toEqual(
        expect.arrayContaining([
          'users.read',
          'profile.read',
          'users.update',
          'reports.read',
          'users.delete',
          'settings.read',
          'system.admin',
        ])
      );
      expect(permissions).toHaveLength(7);
    });

    it('should handle non-existent role', async () => {
      const permissions = await resolveRolePermissions(mockAdapter, 'nonexistent');

      expect(permissions).toEqual([]);
    });

    it('should deduplicate permissions', async () => {
      roles.set('duplicate-role', {
        name: 'duplicate-role',
        permissions: ['users.read', 'users.read', 'users.update'],
        inherits: 'user', // user also has 'users.read'
      });

      const permissions = await resolveRolePermissions(
        mockAdapter,
        'duplicate-role'
      );

      // Should have only one 'users.read'
      expect(permissions.filter((p) => p === 'users.read')).toHaveLength(1);
      expect(permissions).toEqual(
        expect.arrayContaining(['users.read', 'profile.read', 'users.update'])
      );
    });

    it('should detect circular inheritance', async () => {
      roles.set('role-a', {
        name: 'role-a',
        permissions: ['perm-a'],
        inherits: 'role-b',
      });

      roles.set('role-b', {
        name: 'role-b',
        permissions: ['perm-b'],
        inherits: 'role-a', // Circular!
      });

      await expect(
        resolveRolePermissions(mockAdapter, 'role-a')
      ).rejects.toThrow('Circular role inheritance detected');
    });

    it('should enforce max depth limit', async () => {
      // Create a deep hierarchy
      for (let i = 0; i < 15; i++) {
        roles.set(`level-${i}`, {
          name: `level-${i}`,
          permissions: [`perm-${i}`],
          inherits: i > 0 ? `level-${i - 1}` : undefined,
        });
      }

      await expect(
        resolveRolePermissions(mockAdapter, 'level-14', { maxDepth: 5 })
      ).rejects.toThrow('Role inheritance depth exceeded');
    });

    it('should respect custom max depth', async () => {
      const permissions = await resolveRolePermissions(mockAdapter, 'super-admin', {
        maxDepth: 20,
      });

      expect(permissions).toHaveLength(7);
    });
  });

  describe('inheritsFrom', () => {
    it('should return true for direct parent', async () => {
      const result = await inheritsFrom(mockAdapter, 'manager', 'user');
      expect(result).toBe(true);
    });

    it('should return true for indirect parent', async () => {
      const result = await inheritsFrom(mockAdapter, 'super-admin', 'user');
      expect(result).toBe(true);
    });

    it('should return false for child role', async () => {
      const result = await inheritsFrom(mockAdapter, 'user', 'manager');
      expect(result).toBe(false);
    });

    it('should return false for same role', async () => {
      const result = await inheritsFrom(mockAdapter, 'admin', 'admin');
      expect(result).toBe(false);
    });

    it('should return false for unrelated roles', async () => {
      roles.set('editor', {
        name: 'editor',
        permissions: ['content.edit'],
      });

      const result = await inheritsFrom(mockAdapter, 'editor', 'admin');
      expect(result).toBe(false);
    });

    it('should return false for non-existent role', async () => {
      const result = await inheritsFrom(mockAdapter, 'nonexistent', 'user');
      expect(result).toBe(false);
    });

    it('should handle multiple levels correctly', async () => {
      const result1 = await inheritsFrom(mockAdapter, 'super-admin', 'admin');
      const result2 = await inheritsFrom(mockAdapter, 'super-admin', 'manager');
      const result3 = await inheritsFrom(mockAdapter, 'super-admin', 'user');

      expect(result1).toBe(true);
      expect(result2).toBe(true);
      expect(result3).toBe(true);
    });
  });

  describe('getRoleHierarchy', () => {
    it('should return single role for role without parents', async () => {
      const hierarchy = await getRoleHierarchy(mockAdapter, 'user');

      expect(hierarchy).toEqual(['user']);
    });

    it('should return correct hierarchy for single level', async () => {
      const hierarchy = await getRoleHierarchy(mockAdapter, 'manager');

      expect(hierarchy).toEqual(['manager', 'user']);
    });

    it('should return complete hierarchy for multiple levels', async () => {
      const hierarchy = await getRoleHierarchy(mockAdapter, 'super-admin');

      expect(hierarchy).toEqual(['super-admin', 'admin', 'manager', 'user']);
    });

    it('should return hierarchy in correct order (child to parent)', async () => {
      const hierarchy = await getRoleHierarchy(mockAdapter, 'admin');

      expect(hierarchy[0]).toBe('admin');
      expect(hierarchy[hierarchy.length - 1]).toBe('user');
    });

    it('should handle non-existent role', async () => {
      const hierarchy = await getRoleHierarchy(mockAdapter, 'nonexistent');

      expect(hierarchy).toEqual(['nonexistent']);
    });

    it('should detect circular inheritance', async () => {
      roles.set('role-x', {
        name: 'role-x',
        permissions: [],
        inherits: 'role-y',
      });

      roles.set('role-y', {
        name: 'role-y',
        permissions: [],
        inherits: 'role-x',
      });

      await expect(getRoleHierarchy(mockAdapter, 'role-x')).rejects.toThrow(
        'Circular role inheritance detected'
      );
    });

    it('should enforce max depth limit', async () => {
      // Create a deep hierarchy
      for (let i = 0; i < 15; i++) {
        roles.set(`deep-${i}`, {
          name: `deep-${i}`,
          permissions: [],
          inherits: i > 0 ? `deep-${i - 1}` : undefined,
        });
      }

      await expect(
        getRoleHierarchy(mockAdapter, 'deep-14', { maxDepth: 5 })
      ).rejects.toThrow('Role inheritance depth exceeded');
    });
  });

  describe('integration scenarios', () => {
    it('should support complex permission resolution', async () => {
      // Add a role with overlapping permissions
      roles.set('power-user', {
        name: 'power-user',
        permissions: ['users.create', 'users.read', 'reports.create'],
        inherits: 'manager',
      });

      const permissions = await resolveRolePermissions(mockAdapter, 'power-user');

      expect(permissions).toEqual(
        expect.arrayContaining([
          'users.read', // From user (deduplicated)
          'profile.read', // From user
          'users.update', // From manager
          'reports.read', // From manager
          'users.create', // From power-user
          'reports.create', // From power-user
        ])
      );

      // Should be deduplicated (only one 'users.read')
      expect(permissions.filter((p) => p === 'users.read')).toHaveLength(1);
    });

    it('should support branching hierarchies', async () => {
      roles.set('content-admin', {
        name: 'content-admin',
        permissions: ['content.delete'],
        inherits: 'manager',
      });

      const contentPerms = await resolveRolePermissions(
        mockAdapter,
        'content-admin'
      );
      const regularAdminPerms = await resolveRolePermissions(mockAdapter, 'admin');

      // Both inherit from manager
      expect(contentPerms).toContain('users.update');
      expect(regularAdminPerms).toContain('users.update');

      // But have different top-level permissions
      expect(contentPerms).toContain('content.delete');
      expect(contentPerms).not.toContain('users.delete');
      expect(regularAdminPerms).not.toContain('content.delete');
      expect(regularAdminPerms).toContain('users.delete');
    });
  });
});
