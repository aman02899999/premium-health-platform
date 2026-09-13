import { HealthProvider, ProviderStatus, ProviderCapability, SearchParams, PaginatedResult, ProviderHealth, DataProvenance } from "../types";
import { cachedFetch, TTL } from "../cache";

export abstract class BaseHealthProvider<T, D = unknown> implements HealthProvider<T, D> {
  abstract name: string;
  abstract displayName: string;
  abstract status: ProviderStatus;
  abstract capabilities: ProviderCapability;
  abstract config: HealthProvider["config"];

  abstract search(params: SearchParams): Promise<PaginatedResult<T>>;
  abstract getById(id: string): Promise<(T & { provenance: DataProvenance }) | null>;
  getDetails?(id: string): Promise<D | null>;

  async healthCheck(): Promise<ProviderHealth> {
    const start = Date.now();
    try {
      // Simple search to check health
      await this.search({ query: "test", limit: 1 });
      return {
        provider: this.name,
        status: this.status,
        enabled: this.config.enabled,
        lastCheck: new Date().toISOString(),
        lastSuccess: new Date().toISOString(),
        responseTimeMs: Date.now() - start,
        message: "OK",
      };
    } catch (e) {
      return {
        provider: this.name,
        status: this.status,
        enabled: this.config.enabled,
        lastCheck: new Date().toISOString(),
        lastError: e instanceof Error ? e.message : String(e),
        responseTimeMs: Date.now() - start,
        message: "Failed",
      };
    }
  }

  getCapabilities(): ProviderCapability {
    return this.capabilities;
  }

  protected async fetchJson(url: string, timeoutMs = 7000): Promise<unknown | null> {
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), timeoutMs);
      const res = await fetch(url, {
        signal: ctrl.signal,
        headers: { "User-Agent": "BharatHealthGuide/1.0 HealthDataLayer" },
      });
      clearTimeout(t);
      if (!res.ok) return null;
      return (await res.json()) as unknown;
    } catch {
      return null;
    }
  }

  protected async cachedSearch<T>(key: string, ttl: number, loader: () => Promise<PaginatedResult<T>>): Promise<PaginatedResult<T>> {
    const result = await cachedFetch(key, ttl, loader, { allowStale: true });
    return {
      ...result.data,
      cached: result.cached,
      // Never upgrade a degraded payload to "live".
      //
      // cachedFetch only knows whether the loader threw, but every provider here
      // swallows upstream failures inside fetchJson() and returns an empty result
      // with `live: false`. Trusting the wrapper's flag alone therefore published
      // `live: true` for responses that never reached the upstream — across all
      // providers. The provider's own assessment wins when it reports "not live";
      // otherwise the cache layer's flag is used (so a cache hit still reports
      // live: false, cached: true).
      live: result.data.live === false ? false : result.live,
    };
  }

  protected provenance(sourceId: string, extra?: Partial<DataProvenance>): DataProvenance {
    return {
      source: this.displayName,
      source_id: sourceId,
      source_url: `${this.config.baseUrl}`,
      license: "See provider docs",
      retrieved_at: new Date().toISOString(),
      reliability_level: "medium",
      ...extra,
    };
  }
}
