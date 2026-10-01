import { BaseHealthProvider } from "../base";
import { SearchParams, PaginatedResult, Food, ProviderStatus, ProviderCapability, DataProvenance } from "../../types";
import { TTL } from "../../cache";

/**
 * Fruityvice — per-100g nutrition for fruit, including sugar and micronutrients.
 * A useful complement to Open Food Facts, which covers *packaged* products and is
 * thin on fresh produce. Keyless and open.
 *
 * Source: https://www.fruityvice.com (no key required)
 */

type FruityviceFruit = {
  name?: string;
  family?: string;
  genus?: string;
  order?: string;
  nutritions?: {
    calories?: number;
    fat?: number;
    sugar?: number;
    carbohydrates?: number;
    protein?: number;
  };
};

export class FruityviceProvider extends BaseHealthProvider<Food> {
  name = "fruityvice";
  displayName = "Fruityvice";
  status: ProviderStatus = "AVAILABLE";
  capabilities: ProviderCapability = { search: true, getById: true, getDetails: true, healthCheck: true };
  config = {
    enabled: process.env.ENABLE_FRUITYVICE !== "false",
    baseUrl: process.env.FRUITYVICE_API_URL || "https://www.fruityvice.com/api",
    requiresKey: false,
    ttlMs: TTL.foodSearch,
    timeoutMs: 7000,
  };

  async search(params: SearchParams): Promise<PaginatedResult<Food>> {
    const limit = Math.min(Math.max(params.limit ?? 10, 1), 30);
    const query = params.query.toLowerCase().trim();
    const key = `fruityvice-all-${limit}`;

    return this.cachedSearch(key, this.config.ttlMs, async () => {
      const json = (await this.fetchJson(`${this.config.baseUrl}/fruit/all`)) as FruityviceFruit[] | null;
      const all = Array.isArray(json) ? json : [];
      // The API has no search endpoint, so filter the catalogue locally.
      const matched = query
        ? all.filter((f) => f.name?.toLowerCase().includes(query) || f.family?.toLowerCase().includes(query))
        : all;

      const data = matched.filter((f) => f.name).slice(0, limit).map((f) => this.normalize(f));
      return {
        data,
        total: matched.length,
        limit,
        offset: 0,
        hasMore: matched.length > limit,
        source: this.displayName,
        live: all.length > 0,
        cached: false,
        fetchedAt: new Date().toISOString(),
      };
    });
  }

  async getById(id: string) {
    const url = `${this.config.baseUrl}/fruit/${encodeURIComponent(id)}`;
    const json = (await this.fetchJson(url)) as FruityviceFruit | null;
    if (!json?.name) return null;
    return this.normalize(json);
  }

  private normalize(f: FruityviceFruit): Food & { provenance: DataProvenance } {
    const n = f.nutritions ?? {};
    const name = f.name ?? "Unknown";
    return {
      id: name.toLowerCase().replace(/\s+/g, "-"),
      name,
      category: "Fruit",
      nutrients: {
        calories: n.calories,
        protein: n.protein,
        carbs: n.carbohydrates,
        fat: n.fat,
        sugar: n.sugar,
      },
      provenance: {
        source: this.displayName,
        source_id: name,
        source_url: this.config.baseUrl,
        license: "Open data (Fruityvice)",
        attribution: "Fruityvice",
        retrieved_at: new Date().toISOString(),
        reliability_level: "medium",
      },
    };
  }
}

export const fruityviceProvider = new FruityviceProvider();
