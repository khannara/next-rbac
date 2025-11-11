// Permission checking functions
export {
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
} from './permissions';

// Middleware helpers
export {
  createRBACMiddleware,
  createRoleMiddleware,
  createPermissionMiddleware,
} from './middleware';

export type {
  RBACMiddlewareConfig,
  RouteProtection,
} from './middleware';

// Role inheritance utilities
export {
  resolveRolePermissions,
  inheritsFrom,
  getRoleHierarchy,
} from './inheritance';

export type {
  InheritanceOptions,
} from './inheritance';
