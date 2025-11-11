import { NextRequest } from 'next/server';
import {
  createRBACMiddleware,
  createRoleMiddleware,
  createPermissionMiddleware,
} from '../middleware';
import type { RBACAdapter } from '../../types';

// Mock NextRequest and NextResponse
jest.mock('next/server', () => ({
  NextRequest: jest.fn(),
  NextResponse: {
    next: jest.fn(() => ({ type: 'next' })),
    redirect: jest.fn((url: URL) => ({ type: 'redirect', url: url.toString() })),
  },
}));

describe('RBAC Middleware', () => {
  let mockAdapter: RBACAdapter;
  let mockGetUserId: jest.Mock;
  let mockRequest: Partial<NextRequest>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockAdapter = {
      getUserRole: jest.fn(),
      getRolePermissions: jest.fn(),
      findRole: jest.fn(),
    };

    mockGetUserId = jest.fn();

    mockRequest = {
      nextUrl: {
        pathname: '/admin',
      } as any,
      url: 'https://example.com/admin',
    };
  });

  describe('createRBACMiddleware', () => {
    it('should allow public routes', async () => {
      const middleware = createRBACMiddleware({
        adapter: mockAdapter,
        getUserId: mockGetUserId,
        isPublicRoute: (pathname) => pathname === '/public',
      });

      mockRequest.nextUrl!.pathname = '/public';

      const response = await middleware(
        mockRequest as NextRequest,
        {
          '/admin': { roles: ['admin'] },
        }
      );

      expect(response).toEqual({ type: 'next' });
      expect(mockGetUserId).not.toHaveBeenCalled();
    });

    it('should redirect unauthenticated users', async () => {
      const middleware = createRBACMiddleware({
        adapter: mockAdapter,
        getUserId: mockGetUserId,
      });

      mockGetUserId.mockResolvedValue(null);

      const response = await middleware(
        mockRequest as NextRequest,
        {
          '/admin': { roles: ['admin'] },
        }
      );

      expect(response).toEqual({
        type: 'redirect',
        url: 'https://example.com/login',
      });
    });

    it('should redirect users without role', async () => {
      const middleware = createRBACMiddleware({
        adapter: mockAdapter,
        getUserId: mockGetUserId,
      });

      mockGetUserId.mockResolvedValue('user123');
      (mockAdapter.getUserRole as jest.Mock).mockResolvedValue(null);

      const response = await middleware(
        mockRequest as NextRequest,
        {
          '/admin': { roles: ['admin'] },
        }
      );

      expect(response).toEqual({
        type: 'redirect',
        url: 'https://example.com/forbidden',
      });
    });

    it('should allow users with correct role', async () => {
      const middleware = createRBACMiddleware({
        adapter: mockAdapter,
        getUserId: mockGetUserId,
      });

      mockGetUserId.mockResolvedValue('user123');
      (mockAdapter.getUserRole as jest.Mock).mockResolvedValue('admin');

      const response = await middleware(
        mockRequest as NextRequest,
        {
          '/admin': { roles: ['admin'] },
        }
      );

      expect(response).toEqual({ type: 'next' });
    });

    it('should block users without required role', async () => {
      const middleware = createRBACMiddleware({
        adapter: mockAdapter,
        getUserId: mockGetUserId,
      });

      mockGetUserId.mockResolvedValue('user123');
      (mockAdapter.getUserRole as jest.Mock).mockResolvedValue('user');

      const response = await middleware(
        mockRequest as NextRequest,
        {
          '/admin': { roles: ['admin'] },
        }
      );

      expect(response).toEqual({
        type: 'redirect',
        url: 'https://example.com/forbidden',
      });
    });

    it('should check all required permissions', async () => {
      const middleware = createRBACMiddleware({
        adapter: mockAdapter,
        getUserId: mockGetUserId,
      });

      mockGetUserId.mockResolvedValue('user123');
      (mockAdapter.getUserRole as jest.Mock).mockResolvedValue('admin');
      (mockAdapter.getRolePermissions as jest.Mock).mockResolvedValue([
        'users.read',
        'users.update',
      ]);

      mockRequest.nextUrl!.pathname = '/api/users';

      const response = await middleware(
        mockRequest as NextRequest,
        {
          '/api/users': { permissions: ['users.read', 'users.update'] },
        }
      );

      expect(response).toEqual({ type: 'next' });
    });

    it('should block users missing required permissions', async () => {
      const middleware = createRBACMiddleware({
        adapter: mockAdapter,
        getUserId: mockGetUserId,
      });

      mockGetUserId.mockResolvedValue('user123');
      (mockAdapter.getUserRole as jest.Mock).mockResolvedValue('user');
      (mockAdapter.getRolePermissions as jest.Mock).mockResolvedValue(['users.read']);

      mockRequest.nextUrl!.pathname = '/api/users';

      const response = await middleware(
        mockRequest as NextRequest,
        {
          '/api/users': { permissions: ['users.read', 'users.delete'] },
        }
      );

      expect(response).toEqual({
        type: 'redirect',
        url: 'https://example.com/forbidden',
      });
    });

    it('should check any required permissions', async () => {
      const middleware = createRBACMiddleware({
        adapter: mockAdapter,
        getUserId: mockGetUserId,
      });

      mockGetUserId.mockResolvedValue('user123');
      (mockAdapter.getUserRole as jest.Mock).mockResolvedValue('user');
      (mockAdapter.getRolePermissions as jest.Mock).mockResolvedValue(['users.read']);

      mockRequest.nextUrl!.pathname = '/settings';

      const response = await middleware(
        mockRequest as NextRequest,
        {
          '/settings': {
            anyPermissions: ['settings.update', 'users.read', 'admin.access'],
          },
        }
      );

      expect(response).toEqual({ type: 'next' });
    });

    it('should block users without any of the required permissions', async () => {
      const middleware = createRBACMiddleware({
        adapter: mockAdapter,
        getUserId: mockGetUserId,
      });

      mockGetUserId.mockResolvedValue('user123');
      (mockAdapter.getUserRole as jest.Mock).mockResolvedValue('user');
      (mockAdapter.getRolePermissions as jest.Mock).mockResolvedValue(['users.read']);

      mockRequest.nextUrl!.pathname = '/settings';

      const response = await middleware(
        mockRequest as NextRequest,
        {
          '/settings': { anyPermissions: ['settings.update', 'admin.access'] },
        }
      );

      expect(response).toEqual({
        type: 'redirect',
        url: 'https://example.com/forbidden',
      });
    });

    it('should support custom check function', async () => {
      const middleware = createRBACMiddleware({
        adapter: mockAdapter,
        getUserId: mockGetUserId,
      });

      mockGetUserId.mockResolvedValue('user123');
      (mockAdapter.getUserRole as jest.Mock).mockResolvedValue('user');

      const customCheck = jest.fn().mockResolvedValue(true);

      const response = await middleware(
        mockRequest as NextRequest,
        {
          '/admin': { custom: customCheck },
        }
      );

      expect(customCheck).toHaveBeenCalledWith(
        mockRequest,
        'user123',
        mockAdapter
      );
      expect(response).toEqual({ type: 'next' });
    });

    it('should block when custom check returns false', async () => {
      const middleware = createRBACMiddleware({
        adapter: mockAdapter,
        getUserId: mockGetUserId,
      });

      mockGetUserId.mockResolvedValue('user123');
      (mockAdapter.getUserRole as jest.Mock).mockResolvedValue('user');

      const customCheck = jest.fn().mockResolvedValue(false);

      const response = await middleware(
        mockRequest as NextRequest,
        {
          '/admin': { custom: customCheck },
        }
      );

      expect(response).toEqual({
        type: 'redirect',
        url: 'https://example.com/forbidden',
      });
    });

    it('should match most specific route first', async () => {
      const middleware = createRBACMiddleware({
        adapter: mockAdapter,
        getUserId: mockGetUserId,
      });

      mockGetUserId.mockResolvedValue('user123');
      (mockAdapter.getUserRole as jest.Mock).mockResolvedValue('admin');

      mockRequest.nextUrl!.pathname = '/admin/users';

      const response = await middleware(
        mockRequest as NextRequest,
        {
          '/admin': { roles: ['admin'] },
          '/admin/users': { roles: ['super-admin'] },
        }
      );

      expect(response).toEqual({
        type: 'redirect',
        url: 'https://example.com/forbidden',
      });
    });

    it('should use custom URLs for redirects', async () => {
      const middleware = createRBACMiddleware({
        adapter: mockAdapter,
        getUserId: mockGetUserId,
        unauthorizedUrl: '/signin',
        forbiddenUrl: '/access-denied',
      });

      mockGetUserId.mockResolvedValue(null);

      const response = await middleware(
        mockRequest as NextRequest,
        {
          '/admin': { roles: ['admin'] },
        }
      );

      expect(response).toEqual({
        type: 'redirect',
        url: 'https://example.com/signin',
      });
    });
  });

  describe('createRoleMiddleware', () => {
    it('should allow users with allowed role', async () => {
      const middleware = createRoleMiddleware({
        adapter: mockAdapter,
        getUserId: mockGetUserId,
        allowedRoles: ['admin', 'manager'],
      });

      mockGetUserId.mockResolvedValue('user123');
      (mockAdapter.getUserRole as jest.Mock).mockResolvedValue('admin');

      const response = await middleware(mockRequest as NextRequest);

      expect(response).toEqual({ type: 'next' });
    });

    it('should block users without allowed role', async () => {
      const middleware = createRoleMiddleware({
        adapter: mockAdapter,
        getUserId: mockGetUserId,
        allowedRoles: ['admin', 'manager'],
      });

      mockGetUserId.mockResolvedValue('user123');
      (mockAdapter.getUserRole as jest.Mock).mockResolvedValue('user');

      const response = await middleware(mockRequest as NextRequest);

      expect(response).toEqual({
        type: 'redirect',
        url: 'https://example.com/forbidden',
      });
    });
  });

  describe('createPermissionMiddleware', () => {
    it('should allow users with required permissions', async () => {
      const middleware = createPermissionMiddleware({
        adapter: mockAdapter,
        getUserId: mockGetUserId,
        requiredPermissions: ['users.read', 'users.update'],
      });

      mockGetUserId.mockResolvedValue('user123');
      (mockAdapter.getUserRole as jest.Mock).mockResolvedValue('admin');
      (mockAdapter.getRolePermissions as jest.Mock).mockResolvedValue([
        'users.read',
        'users.update',
        'users.delete',
      ]);

      const response = await middleware(mockRequest as NextRequest);

      expect(response).toEqual({ type: 'next' });
    });

    it('should block users without required permissions', async () => {
      const middleware = createPermissionMiddleware({
        adapter: mockAdapter,
        getUserId: mockGetUserId,
        requiredPermissions: ['users.read', 'users.delete'],
      });

      mockGetUserId.mockResolvedValue('user123');
      (mockAdapter.getUserRole as jest.Mock).mockResolvedValue('user');
      (mockAdapter.getRolePermissions as jest.Mock).mockResolvedValue(['users.read']);

      const response = await middleware(mockRequest as NextRequest);

      expect(response).toEqual({
        type: 'redirect',
        url: 'https://example.com/forbidden',
      });
    });
  });
});
