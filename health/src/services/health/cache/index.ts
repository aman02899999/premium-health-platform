/**
 * Centralized caching layer
 * Uses in-memory cache with TTL, supports Redis if configured
 * Prevents repeated external API calls
 */

type CacheEntry<T> = {
  data: T;
  at: number;
  ttl: number;
};

class MemoryCache {
  private store = new Map<string, CacheEntry<unknown>>();
  private hits = 0;
  private misses = 0;

  get<T>(key: string): T | null {
    const entry = this.store.get(key) as CacheEntry<T> | undefined;
    if (!entry) {
      this.misses++;
      return null;
    }
    if (Date.now() - entry.at > entry.ttl) {
      this.store.delete(key);
      this.misses++;
      return null;
    }
    this.hits++;
    return entry.data;
  }

  set<T>(key: string, data: T, ttlMs: number): void {
    this.store.set(key, { data, at: Date.now(), ttl: ttlMs });
  }

  del(key: string): void {
    this.store.delete(key);
  }

  clear(prefix?: string): number {
    if (!prefix) {
      const size = this.store.size;
      this.store.clear();
      return size;
    }
    let count = 0;
    for (const k of this.store.keys()) {
      if (k.startsWith(prefix)) {
        this.store.delete(k);
        count++;
      }
    }
    return count;
  }

  stats() {
    return {
      size: this.store.size,
      hits: this.hits,
      misses: this.misses,
      hitRate: this.hits + this.misses > 0 ? this.hits / (this.hits + this.misses) : 0,
    };
  }

  keys(): string[] {
    return Array.from(this.store.keys());
  }
}

export const memoryCache = new MemoryCache();

export async function cachedFetch<T>(
  key: string,
  ttlMs: number,
  loader: () => Promise<T>,
  options?: { allowStale?: boolean; staleTtlMs?: number }
): Promise<{ data: T; cached: boolean; live: boolean; stale?: boolean }> {
  const hit = memoryCache.get<T>(key);
  if (hit) {
    return { data: hit, cached: true, live: false };
  }

  try {
    const data = await loader();
    memoryCache.set(key, data, ttlMs);
    return { data, cached: false, live: true };
  } catch (e) {
    // stale fallback
    if (options?.allowStale) {
      const staleKey = `${key}:stale`;
      const stale = memoryCache.get<T>(staleKey);
      if (stale) {
        return { data: stale, cached: true, live: false, stale: true };
      }
    }
    throw e;
  }
}

export function cacheSet<T>(key: string, data: T, ttlMs: number) {
  memoryCache.set(key, data, ttlMs);
  // also keep stale copy for fallback
  memoryCache.set(`${key}:stale`, data, ttlMs * 3);
}

export function cacheGet<T>(key: string): T | null {
  return memoryCache.get<T>(key);
}

export function cacheDel(key: string) {
  memoryCache.del(key);
}

export function cacheClear(prefix?: string) {
  return memoryCache.clear(prefix);
}

export function cacheStats() {
  return memoryCache.stats();
}

// TTL presets by provider
export const TTL = {
  foodSearch: 6 * 60 * 60 * 1000, // 6h
  barcode: 24 * 60 * 60 * 1000, // 24h
  drugSearch: 12 * 60 * 60 * 1000,
  drugDetails: 24 * 60 * 60 * 1000,
  exercise: 24 * 60 * 60 * 1000,
  herb: 24 * 60 * 60 * 1000,
  pubmed: 6 * 60 * 60 * 1000,
  trials: 6 * 60 * 60 * 1000,
  terminology: 24 * 60 * 60 * 1000,
  pulse: 10 * 60 * 1000,
  worldbank: 24 * 60 * 60 * 1000,
  default: 60 * 60 * 1000,
};
