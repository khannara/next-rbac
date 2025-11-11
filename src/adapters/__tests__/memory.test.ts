import { InMemoryAdapter } from '../memory';

describe('InMemoryAdapter', () => {
  let adapter: InMemoryAdapter;

  beforeEach(() => {
    adapter = new InMemoryAdapter({
      roles: [
        {
          name: 'admin',
          permissions: ['users.create', 'users.read', 'users.update', 'users.delete'],
        },
        {
          name: 'user',
          permissions: ['users.read'],
        },
      ],
      users: [
        { id: '1', role: 'admin' },
        { id: '2', role: 'user' },
      ],
    });
  });

  describe('findRole', () => {
    it('should find an existing role', async () => {
      const role = await adapter.findRole('admin');

      expect(role).toBeDefined();
      expect(role?.name).toBe('admin');
      expect(role?.permissions).toEqual([
        'users.create',
        'users.read',
        'users.update',
        'users.delete',
      ]);
    });

    it('should return null for non-existent role', async () => {
      const role = await adapter.findRole('nonexistent');
      expect(role).toBeNull();
    });

    it('should include timestamps and deleted_at', async () => {
      const role = await adapter.findRole('admin');

      expect(role?.created_at).toBeInstanceOf(Date);
      expect(role?.updated_at).toBeInstanceOf(Date);
      expect(role?.deleted_at).toBeNull();
    });
  });

  describe('getUserRole', () => {
    it('should get role for existing user', async () => {
      const role = await adapter.getUserRole('1');
      expect(role).toBe('admin');
    });

    it('should get role for regular user', async () => {
      const role = await adapter.getUserRole('2');
      expect(role).toBe('user');
    });

    it('should return null for non-existent user', async () => {
      const role = await adapter.getUserRole('999');
      expect(role).toBeNull();
    });
  });

  describe('getRolePermissions', () => {
    it('should get permissions for admin role', async () => {
      const permissions = await adapter.getRolePermissions('admin');
      expect(permissions).toEqual([
        'users.create',
        'users.read',
        'users.update',
        'users.delete',
      ]);
    });

    it('should get permissions for user role', async () => {
      const permissions = await adapter.getRolePermissions('user');
      expect(permissions).toEqual(['users.read']);
    });

    it('should return empty array for non-existent role', async () => {
      const permissions = await adapter.getRolePermissions('nonexistent');
      expect(permissions).toEqual([]);
    });
  });

  describe('setRole', () => {
    it('should add a new role', async () => {
      adapter.setRole('manager', ['users.read', 'users.update']);

      const role = await adapter.findRole('manager');
      expect(role?.name).toBe('manager');
      expect(role?.permissions).toEqual(['users.read', 'users.update']);
    });

    it('should update an existing role', async () => {
      adapter.setRole('admin', ['super.admin']);

      const role = await adapter.findRole('admin');
      expect(role?.permissions).toEqual(['super.admin']);
    });
  });

  describe('setUser', () => {
    it('should add a new user', async () => {
      adapter.setUser('3', 'user');

      const role = await adapter.getUserRole('3');
      expect(role).toBe('user');
    });

    it('should update an existing user role', async () => {
      adapter.setUser('2', 'admin');

      const role = await adapter.getUserRole('2');
      expect(role).toBe('admin');
    });
  });

  describe('deleteRole', () => {
    it('should delete an existing role', async () => {
      adapter.deleteRole('user');

      const role = await adapter.findRole('user');
      expect(role).toBeNull();
    });

    it('should not throw when deleting non-existent role', () => {
      expect(() => adapter.deleteRole('nonexistent')).not.toThrow();
    });
  });

  describe('deleteUser', () => {
    it('should delete an existing user', async () => {
      adapter.deleteUser('1');

      const role = await adapter.getUserRole('1');
      expect(role).toBeNull();
    });

    it('should not throw when deleting non-existent user', () => {
      expect(() => adapter.deleteUser('999')).not.toThrow();
    });
  });

  describe('clear', () => {
    it('should clear all roles and users', async () => {
      adapter.clear();

      const adminRole = await adapter.findRole('admin');
      const userRole = await adapter.getUserRole('1');

      expect(adminRole).toBeNull();
      expect(userRole).toBeNull();
    });
  });

  describe('empty initialization', () => {
    it('should work with no initial data', async () => {
      const emptyAdapter = new InMemoryAdapter();

      const role = await emptyAdapter.findRole('admin');
      const userRole = await emptyAdapter.getUserRole('1');

      expect(role).toBeNull();
      expect(userRole).toBeNull();
    });

    it('should allow adding data after initialization', async () => {
      const emptyAdapter = new InMemoryAdapter();

      emptyAdapter.setRole('admin', ['all.permissions']);
      emptyAdapter.setUser('1', 'admin');

      const role = await emptyAdapter.findRole('admin');
      const userRole = await emptyAdapter.getUserRole('1');

      expect(role?.name).toBe('admin');
      expect(userRole).toBe('admin');
    });
  });
});
