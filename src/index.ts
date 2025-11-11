// Server functions
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
} from './server';

// Adapters
export { MongoDBAdapter } from './adapters';
export type { MongoDBAdapterConfig } from './adapters';

// Types
export type {
  Permission,
  Role,
  RoleDocument,
  UserDocument,
  RBACAdapter,
  RBACConfig,
} from './types';
