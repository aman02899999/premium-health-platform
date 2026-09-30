import { BaseHealthProvider } from "../base";
import { SearchParams, PaginatedResult, Food, ProviderStatus, ProviderCapability, DataProvenance } from "../../types";
import { TTL } from "../../cache";

type USDAFood = {
  fdcId: number;
  description: string;
  brandOwner?: string;
  ingredients?: string;
  foodNutrients?: { nutrientName: string; value: number; unitName: string }[];
};

export class USDAProvider extends BaseHealthProvider<Food> {
  name = "usda";
  displayName = "USDA FoodData Central";
  status: ProviderStatus = "REQUIRES_API_KEY";
  capabilities: ProviderCapability = { search: true, getById: true, getDetails: true, healthCheck: true };
  config = {
    enabled: process.env.ENABLE_USDA === "true",
    baseUrl: process.env.USDA_API_URL || "https://api.nal.usda.gov/fdc/v1",
    requiresKey: true,
    keyEnvVar: "USDA_API_KEY",
    ttlMs: TTL.foodSearch,
    timeoutMs: 8000,
  };

  private getKey(): string | null {
    return process.env.USDA_API_KEY || null;
  }

  async search(params: SearchParams): Promise<PaginatedResult<Food>> {
    const key = this.getKey();
    if (!key || !this.config.enabled) {
      return {
        data: [],
        total: 0,
        limit: params.limit ?? 20,
        offset: 0,
        hasMore: false,
        source: this.displayName,
        live: false,
        cached: false,
        fetchedAt: new Date().toISOString(),
      };
    }
    const cacheKey = `usda-search-${params.query.toLowerCase()}-${params.limit ?? 20}`;
    return this.cachedSearch(cacheKey, this.config.ttlMs, async () => {
      const limit = params.limit ?? 20;
      const url = `${this.config.baseUrl}/foods/search?api_key=${key}&query=${encodeURIComponent(params.query)}&pageSize=${limit}`;
      const json = (await this.fetchJson(url)) as { foods: USDAFood[]; totalHits: number } | null;
      if (!json?.foods) {
        return {
          data: [],
          total: 0,
          limit,
          offset: 0,
          hasMore: false,
          source: this.displayName,
          live: false,
          cached: false,
          fetchedAt: new Date().toISOString(),
        };
      }
      const data = json.foods.map((f) => this.normalize(f));
      return {
        data,
        total: json.totalHits,
        limit,
        offset: 0,
        hasMore: false,
        source: this.displayName,
        live: true,
        cached: false,
        fetchedAt: new Date().toISOString(),
      };
    });
  }

  async getById(id: string) {
    const key = this.getKey();
    if (!key || !this.config.enabled) return null;
    const url = `${this.config.baseUrl}/food/${id}?api_key=${key}`;
    const json = (await this.fetchJson(url)) as USDAFood | null;
    if (!json) return null;
    return this.normalize(json) as Food & { provenance: DataProvenance };
  }

  private normalize(f: USDAFood): Food & { provenance: DataProvenance } {
    const nutrients: Record<string, number> = {};
    f.foodNutrients?.forEach((n) => {
      const name = n.nutrientName.toLowerCase();
      if (name.includes("energy") && n.unitName === "KCAL") nutrients.calories = n.value;
      if (name.includes("protein")) nutrients.protein = n.value;
      if (name.includes("carbohydrate")) nutrients.carbs = n.value;
      if (name.includes("total lipid") || name.includes("fat") && !name.includes("saturated")) nutrients.fat = n.value;
      if (name.includes("fiber")) nutrients.fiber = n.value;
      if (name.includes("sugars")) nutrients.sugar = n.value;
      if (name.includes("sodium")) nutrients.sodium = n.value;
    });
    return {
      id: String(f.fdcId),
      name: f.description,
      brand: f.brandOwner,
      nutrients: {
        calories: nutrients.calories,
        protein: nutrients.protein,
        carbs: nutrients.carbs,
        fat: nutrients.fat,
        fiber: nutrients.fiber,
        sugar: nutrients.sugar,
        sodium: nutrients.sodium,
      },
      ingredients: f.ingredients?.split(",").map((s) => s.trim()),
      provenance: {
        source: this.displayName,
        source_id: String(f.fdcId),
        source_url: `https://fdc.nal.usda.gov/food-details/${f.fdcId}/nutrients`,
        license: "Public Domain (US Government)",
        attribution: "USDA",
        retrieved_at: new Date().toISOString(),
        reliability_level: "high",
      },
    };
  }
}

export const usdaProvider = new USDAProvider();
