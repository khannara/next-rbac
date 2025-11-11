import type { RBACAdapter, Role, Permission } from '../types';

export interface CacheConfig {
  enabled?: boolean;
  ttl?: number; // seconds
}

/**
 * Base adapter with common functionality like caching
 * All adapters should extend this class
 */
export abstract class BaseAdapter implements RBACAdapter {
  protected cache?: Map<string, { data: any; expires: number }>;
  protected cacheConfig: CacheConfig;

  constructor(cacheConfig: CacheConfig = {}) {
    this.cacheConfig = cacheConfig;
    if (cacheConfig.enabled) {
      this.cache = new Map();
    }
  }

  /**
   * Get from cache or fetch and cache
   */
  protected async withCache<T>(
    key: string,
    fetcher: () => Promise<T>
  ): Promise<T> {
    if (!this.cache) {
      return fetcher();
    }

    const cached = this.cache.get(key);
    if (cached && cached.expires > Date.now()) {
      return cached.data as T;
    }

    const data = await fetcher();
    const ttl = this.cacheConfig.ttl || 300; // default 5 minutes
    this.cache.set(key, {
      data,
      expires: Date.now() + ttl * 1000,
    });

    return data;
  }

  /**
   * Clear cache for a specific key or all cache
   */
  public clearCache(key?: string): void {
    if (!this.cache) return;

    if (key) {
      this.cache.delete(key);
    } else {
      this.cache.clear();
    }
  }

  // Abstract methods that each adapter must implement
  abstract findRole(roleName: Role): Promise<any>;
  abstract getUserRole(userId: string): Promise<Role | null>;
  abstract getRolePermissions(roleName: Role): Promise<Permission[]>;
}
