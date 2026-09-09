import { BaseHealthProvider } from "../base";
import { SearchParams, PaginatedResult, Food, ProviderStatus, ProviderCapability, DataProvenance } from "../../types";
import { TTL } from "../../cache";

type OFFProduct = {
  code: string;
  product_name: string;
  brands?: string;
  categories?: string;
  nutriments?: Record<string, number>;
  ingredients_text?: string;
  allergens?: string;
  serving_size?: string;
  image_url?: string;
  nutriscore_grade?: string;
  nova_group?: number;
};

export class OpenFoodFactsProvider extends BaseHealthProvider<Food> {
  name = "openfoodfacts";
  displayName = "Open Food Facts";
  status: ProviderStatus = "AVAILABLE";
  capabilities: ProviderCapability = { search: true, getById: true, getDetails: true, barcode: true, healthCheck: true };
  config = {
    enabled: process.env.ENABLE_OPENFOODFACTS !== "false",
    baseUrl: process.env.OPENFOODFACTS_API_URL || "https://world.openfoodfacts.org",
    requiresKey: false,
    ttlMs: TTL.foodSearch,
    timeoutMs: 8000,
  };

  async search(params: SearchParams): Promise<PaginatedResult<Food>> {
    const key = `off-search-${params.query.toLowerCase()}-${params.limit ?? 20}`;
    return this.cachedSearch(key, this.config.ttlMs, async () => {
      const limit = params.limit ?? 20;
      const url = `${this.config.baseUrl}/cgi/search.pl?search_terms=${encodeURIComponent(params.query)}&search_simple=1&action=process&json=1&page_size=${limit}&fields=code,product_name,brands,categories,nutriments,ingredients_text,allergens,serving_size,image_url,nutriscore_grade,nova_group`;
      const json = (await this.fetchJson(url)) as { products: OFFProduct[]; count: number } | null;
      if (!json?.products) {
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
      const data = json.products.filter((p) => p.product_name).map((p) => this.normalize(p));
      return {
        data,
        total: json.count,
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
    // id is barcode
    const url = `${this.config.baseUrl}/api/v0/product/${id}.json?fields=code,product_name,brands,categories,nutriments,ingredients_text,allergens,serving_size,image_url,nutriscore_grade,nova_group`;
    const json = (await this.fetchJson(url)) as { status: number; product: OFFProduct } | null;
    if (!json || json.status !== 1 || !json.product) return null;
    return this.normalize(json.product) as Food & { provenance: DataProvenance };
  }

  async getByBarcode(barcode: string) {
    return this.getById(barcode);
  }

  private normalize(p: OFFProduct): Food & { provenance: DataProvenance } {
    const n = p.nutriments ?? {};
    return {
      id: p.code,
      name: p.product_name,
      brand: p.brands,
      barcode: p.code,
      category: p.categories?.split(",")[0]?.trim(),
      nutrients: {
        calories: n["energy-kcal_100g"],
        protein: n.proteins_100g,
        carbs: n.carbohydrates_100g,
        fat: n.fat_100g,
        fiber: n.fiber_100g,
        sugar: n.sugars_100g,
        sodium: n.sodium_100g,
        saturatedFat: n["saturated-fat_100g"],
      },
      ingredients: p.ingredients_text?.split(",").map((s) => s.trim()).slice(0, 20),
      allergens: p.allergens?.split(",").map((s) => s.trim()),
      servingSize: p.serving_size,
      image: p.image_url,
      nutriScore: p.nutriscore_grade?.toUpperCase(),
      novaGroup: p.nova_group,
      provenance: {
        source: this.displayName,
        source_id: p.code,
        source_url: `${this.config.baseUrl}/product/${p.code}`,
        license: "ODbL + DBCL",
        attribution: "Open Food Facts contributors",
        retrieved_at: new Date().toISOString(),
        reliability_level: "medium",
      },
    };
  }
}

export const openFoodFactsProvider = new OpenFoodFactsProvider();
