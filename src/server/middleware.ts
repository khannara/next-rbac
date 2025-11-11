import { NextRequest, NextResponse } from 'next/server';
import type { RBACAdapter, Permission, Role } from '../types';

/**
 * Configuration for RBAC middleware
 */
export interface RBACMiddlewareConfig {
  /**
   * RBAC adapter instance
   */
  adapter: RBACAdapter;

  /**
   * Function to get user ID from request
   * This should extract the user ID from session/token/cookies
   *
   * @example
   * ```typescript
   * getUserId: async (req) => {
   *   const session = await getSession(req);
   *   return session?.user?.id || null;
   * }
   * ```
   */
  getUserId: (req: NextRequest) => Promise<string | null>;

  /**
   * Optional: URL to redirect to when user is not authenticated
   * @default '/login'
   */
  unauthorizedUrl?: string;

  /**
   * Optional: URL to redirect to when user lacks permission
   * @default '/forbidden'
   */
  forbiddenUrl?: string;

  /**
   * Optional: Function to check if route should be public
   */
  isPublicRoute?: (pathname: string) => boolean;
}

/**
 * Route protection configuration
 */
export interface RouteProtection {
  /**
   * Required permissions (user must have ALL of these)
   */
  permissions?: Permission[];

  /**
   * Required permissions (user must have ANY of these)
   */
  anyPermissions?: Permission[];

  /**
   * Required roles (user must have ANY of these)
   */
  roles?: Role[];

  /**
   * Custom check function
   */
  custom?: (req: NextRequest, userId: string, adapter: RBACAdapter) => Promise<boolean>;
}

/**
 * Creates an RBAC middleware for Next.js
 *
 * @example
 * ```typescript
 * // middleware.ts
 * import { createRBACMiddleware } from '@khannara/next-rbac/server';
 * import { getAdapter } from './lib/rbac';
 * import { getSession } from './lib/auth';
 *
 * const rbacMiddleware = createRBACMiddleware({
 *   adapter: getAdapter(),
 *   getUserId: async (req) => {
 *     const session = await getSession(req);
 *     return session?.user?.id || null;
 *   },
 * });
 *
 * export async function middleware(req: NextRequest) {
 *   return rbacMiddleware(req, {
 *     '/admin': { roles: ['admin'] },
 *     '/api/users': { permissions: ['users.read'] },
 *     '/settings': { anyPermissions: ['settings.update', 'admin.access'] },
 *   });
 * }
 *
 * export const config = {
 *   matcher: ['/admin/:path*', '/api/:path*', '/settings/:path*'],
 * };
 * ```
 */
export function createRBACMiddleware(config: RBACMiddlewareConfig) {
  const {
    adapter,
    getUserId,
    unauthorizedUrl = '/login',
    forbiddenUrl = '/forbidden',
    isPublicRoute,
  } = config;

  return async function middleware(
    req: NextRequest,
    protectedRoutes: Record<string, RouteProtection>
  ): Promise<NextResponse> {
    const { pathname } = req.nextUrl;

    // Check if route is public
    if (isPublicRoute && isPublicRoute(pathname)) {
      return NextResponse.next();
    }

    // Find matching protection rule
    const matchingRoute = Object.keys(protectedRoutes)
      .sort((a, b) => b.length - a.length) // Match most specific route first
      .find((route) => pathname.startsWith(route));

    if (!matchingRoute) {
      return NextResponse.next();
    }

    const protection = protectedRoutes[matchingRoute];

    // Get user ID
    const userId = await getUserId(req);
    if (!userId) {
      return NextResponse.redirect(new URL(unauthorizedUrl, req.url));
    }

    // Get user's role
    const userRole = await adapter.getUserRole(userId);
    if (!userRole) {
      return NextResponse.redirect(new URL(forbiddenUrl, req.url));
    }

    // Check role requirements
    if (protection.roles && protection.roles.length > 0) {
      if (!protection.roles.includes(userRole)) {
        return NextResponse.redirect(new URL(forbiddenUrl, req.url));
      }
    }

    // Get user's permissions
    const userPermissions = await adapter.getRolePermissions(userRole);

    // Check permission requirements (all required)
    if (protection.permissions && protection.permissions.length > 0) {
      const hasAllPermissions = protection.permissions.every((perm) =>
        userPermissions.includes(perm)
      );
      if (!hasAllPermissions) {
        return NextResponse.redirect(new URL(forbiddenUrl, req.url));
      }
    }

    // Check permission requirements (any required)
    if (protection.anyPermissions && protection.anyPermissions.length > 0) {
      const hasAnyPermission = protection.anyPermissions.some((perm) =>
        userPermissions.includes(perm)
      );
      if (!hasAnyPermission) {
        return NextResponse.redirect(new URL(forbiddenUrl, req.url));
      }
    }

    // Custom check
    if (protection.custom) {
      const allowed = await protection.custom(req, userId, adapter);
      if (!allowed) {
        return NextResponse.redirect(new URL(forbiddenUrl, req.url));
      }
    }

    return NextResponse.next();
  };
}

/**
 * Helper to create a simple role-based middleware
 *
 * @example
 * ```typescript
 * export const middleware = createRoleMiddleware({
 *   adapter: getAdapter(),
 *   getUserId: getUserIdFromSession,
 *   allowedRoles: ['admin', 'manager'],
 * });
 * ```
 */
export function createRoleMiddleware(
  config: RBACMiddlewareConfig & { allowedRoles: Role[] }
) {
  const { adapter, getUserId, allowedRoles, unauthorizedUrl, forbiddenUrl } = config;

  return async function middleware(req: NextRequest): Promise<NextResponse> {
    const userId = await getUserId(req);
    if (!userId) {
      return NextResponse.redirect(new URL(unauthorizedUrl || '/login', req.url));
    }

    const userRole = await adapter.getUserRole(userId);
    if (!userRole || !allowedRoles.includes(userRole)) {
      return NextResponse.redirect(new URL(forbiddenUrl || '/forbidden', req.url));
    }

    return NextResponse.next();
  };
}

/**
 * Helper to create a permission-based middleware
 *
 * @example
 * ```typescript
 * export const middleware = createPermissionMiddleware({
 *   adapter: getAdapter(),
 *   getUserId: getUserIdFromSession,
 *   requiredPermissions: ['users.read', 'users.update'],
 * });
 * ```
 */
export function createPermissionMiddleware(
  config: RBACMiddlewareConfig & { requiredPermissions: Permission[] }
) {
  const { adapter, getUserId, requiredPermissions, unauthorizedUrl, forbiddenUrl } =
    config;

  return async function middleware(req: NextRequest): Promise<NextResponse> {
    const userId = await getUserId(req);
    if (!userId) {
      return NextResponse.redirect(new URL(unauthorizedUrl || '/login', req.url));
    }

    const userRole = await adapter.getUserRole(userId);
    if (!userRole) {
      return NextResponse.redirect(new URL(forbiddenUrl || '/forbidden', req.url));
    }

    const userPermissions = await adapter.getRolePermissions(userRole);
    const hasAllPermissions = requiredPermissions.every((perm) =>
      userPermissions.includes(perm)
    );

    if (!hasAllPermissions) {
      return NextResponse.redirect(new URL(forbiddenUrl || '/forbidden', req.url));
    }

    return NextResponse.next();
  };
}
