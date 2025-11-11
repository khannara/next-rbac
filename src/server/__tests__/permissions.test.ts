import {
  getRolePermissions,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  hasRole,
  hasAnyRole,
  requirePermission,
  requireRole,
  requireAnyPermission,
  requireAllPermissions,
} from '../permissions';
import type { RBACAdapter } from '../../types';

describe('Server Permission Functions', () => {
  // Mock adapter
  const mockAdapter: RBACAdapter = {
    getUserRole: jest.fn(),
    getRolePermissions: jest.fn(),
    findRole: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getRolePermissions', () => {
    it('should return permissions for a role', async () => {
      const permissions = ['users.create', 'users.read'];
      (mockAdapter.getRolePermissions as jest.Mock).mockResolvedValue(permissions);

      const result = await getRolePermissions('admin', mockAdapter);

      expect(result).toEqual(permissions);
      expect(mockAdapter.getRolePermissions).toHaveBeenCalledWith('admin');
    });
  });

  describe('hasPermission', () => {
    it('should return true if user has permission', async () => {
      (mockAdapter.getUserRole as jest.Mock).mockResolvedValue('admin');
      (mockAdapter.getRolePermissions as jest.Mock).mockResolvedValue(['users.create', 'users.read']);

      const result = await hasPermission('user123', 'users.create', mockAdapter);

      expect(result).toBe(true);
    });

    it('should return false if user lacks permission', async () => {
      (mockAdapter.getUserRole as jest.Mock).mockResolvedValue('user');
      (mockAdapter.getRolePermissions as jest.Mock).mockResolvedValue(['users.read']);

      const result = await hasPermission('user123', 'users.delete', mockAdapter);

      expect(result).toBe(false);
    });

    it('should return false if user has no role', async () => {
      (mockAdapter.getUserRole as jest.Mock).mockResolvedValue(null);

      const result = await hasPermission('user123', 'users.create', mockAdapter);

      expect(result).toBe(false);
    });
  });

  describe('hasAnyPermission', () => {
    it('should return true if user has at least one permission', async () => {
      (mockAdapter.getUserRole as jest.Mock).mockResolvedValue('manager');
      (mockAdapter.getRolePermissions as jest.Mock).mockResolvedValue(['users.read', 'users.update']);

      const result = await hasAnyPermission(
        'user123',
        ['users.delete', 'users.update'],
        mockAdapter
      );

      expect(result).toBe(true);
    });

    it('should return false if user has none of the permissions', async () => {
      (mockAdapter.getUserRole as jest.Mock).mockResolvedValue('user');
      (mockAdapter.getRolePermissions as jest.Mock).mockResolvedValue(['users.read']);

      const result = await hasAnyPermission(
        'user123',
        ['users.delete', 'users.update'],
        mockAdapter
      );

      expect(result).toBe(false);
    });

    it('should return false if user has no role', async () => {
      (mockAdapter.getUserRole as jest.Mock).mockResolvedValue(null);

      const result = await hasAnyPermission(
        'user123',
        ['users.create'],
        mockAdapter
      );

      expect(result).toBe(false);
    });
  });

  describe('hasAllPermissions', () => {
    it('should return true if user has all permissions', async () => {
      (mockAdapter.getUserRole as jest.Mock).mockResolvedValue('admin');
      (mockAdapter.getRolePermissions as jest.Mock).mockResolvedValue(['users.create', 'users.read', 'users.update', 'users.delete']);

      const result = await hasAllPermissions(
        'user123',
        ['users.read', 'users.update'],
        mockAdapter
      );

      expect(result).toBe(true);
    });

    it('should return false if user lacks any permission', async () => {
      (mockAdapter.getUserRole as jest.Mock).mockResolvedValue('manager');
      (mockAdapter.getRolePermissions as jest.Mock).mockResolvedValue(['users.read', 'users.update']);

      const result = await hasAllPermissions(
        'user123',
        ['users.read', 'users.delete'],
        mockAdapter
      );

      expect(result).toBe(false);
    });

    it('should return false if user has no role', async () => {
      (mockAdapter.getUserRole as jest.Mock).mockResolvedValue(null);

      const result = await hasAllPermissions(
        'user123',
        ['users.create'],
        mockAdapter
      );

      expect(result).toBe(false);
    });
  });

  describe('hasRole', () => {
    it('should return true if user has the role', async () => {
      (mockAdapter.getUserRole as jest.Mock).mockResolvedValue('admin');

      const result = await hasRole('user123', 'admin', mockAdapter);

      expect(result).toBe(true);
    });

    it('should return false if user has different role', async () => {
      (mockAdapter.getUserRole as jest.Mock).mockResolvedValue('user');

      const result = await hasRole('user123', 'admin', mockAdapter);

      expect(result).toBe(false);
    });

    it('should return false if user has no role', async () => {
      (mockAdapter.getUserRole as jest.Mock).mockResolvedValue(null);

      const result = await hasRole('user123', 'admin', mockAdapter);

      expect(result).toBe(false);
    });
  });

  describe('hasAnyRole', () => {
    it('should return true if user has one of the roles', async () => {
      (mockAdapter.getUserRole as jest.Mock).mockResolvedValue('manager');

      const result = await hasAnyRole('user123', ['admin', 'manager'], mockAdapter);

      expect(result).toBe(true);
    });

    it('should return false if user has none of the roles', async () => {
      (mockAdapter.getUserRole as jest.Mock).mockResolvedValue('user');

      const result = await hasAnyRole('user123', ['admin', 'manager'], mockAdapter);

      expect(result).toBe(false);
    });

    it('should return false if user has no role', async () => {
      (mockAdapter.getUserRole as jest.Mock).mockResolvedValue(null);

      const result = await hasAnyRole('user123', ['admin'], mockAdapter);

      expect(result).toBe(false);
    });
  });

  describe('requirePermission', () => {
    it('should not throw if user has permission', async () => {
      (mockAdapter.getUserRole as jest.Mock).mockResolvedValue('admin');
      (mockAdapter.getRolePermissions as jest.Mock).mockResolvedValue(['users.create']);

      await expect(
        requirePermission('user123', 'users.create', mockAdapter)
      ).resolves.not.toThrow();
    });

    it('should throw if user lacks permission', async () => {
      (mockAdapter.getUserRole as jest.Mock).mockResolvedValue('user');
      (mockAdapter.getRolePermissions as jest.Mock).mockResolvedValue(['users.read']);

      await expect(
        requirePermission('user123', 'users.delete', mockAdapter)
      ).rejects.toThrow('Permission denied: users.delete');
    });
  });

  describe('requireRole', () => {
    it('should not throw if user has role', async () => {
      (mockAdapter.getUserRole as jest.Mock).mockResolvedValue('admin');

      await expect(
        requireRole('user123', 'admin', mockAdapter)
      ).resolves.not.toThrow();
    });

    it('should throw if user lacks role', async () => {
      (mockAdapter.getUserRole as jest.Mock).mockResolvedValue('user');

      await expect(
        requireRole('user123', 'admin', mockAdapter)
      ).rejects.toThrow('Role required: admin');
    });
  });

  describe('requireAnyPermission', () => {
    it('should not throw if user has at least one permission', async () => {
      (mockAdapter.getUserRole as jest.Mock).mockResolvedValue('manager');
      (mockAdapter.getRolePermissions as jest.Mock).mockResolvedValue(['users.update']);

      await expect(
        requireAnyPermission('user123', ['users.create', 'users.update'], mockAdapter)
      ).resolves.not.toThrow();
    });

    it('should throw if user lacks all permissions', async () => {
      (mockAdapter.getUserRole as jest.Mock).mockResolvedValue('user');
      (mockAdapter.getRolePermissions as jest.Mock).mockResolvedValue(['users.read']);

      await expect(
        requireAnyPermission('user123', ['users.create', 'users.delete'], mockAdapter)
      ).rejects.toThrow('Permission denied: requires one of users.create, users.delete');
    });
  });

  describe('requireAllPermissions', () => {
    it('should not throw if user has all permissions', async () => {
      (mockAdapter.getUserRole as jest.Mock).mockResolvedValue('admin');
      (mockAdapter.getRolePermissions as jest.Mock).mockResolvedValue(['users.create', 'users.read', 'users.update']);

      await expect(
        requireAllPermissions('user123', ['users.create', 'users.read'], mockAdapter)
      ).resolves.not.toThrow();
    });

    it('should throw if user lacks any permission', async () => {
      (mockAdapter.getUserRole as jest.Mock).mockResolvedValue('manager');
      (mockAdapter.getRolePermissions as jest.Mock).mockResolvedValue(['users.read', 'users.update']);

      await expect(
        requireAllPermissions('user123', ['users.read', 'users.delete'], mockAdapter)
      ).rejects.toThrow('Permission denied: requires all of users.read, users.delete');
    });
  });
});
