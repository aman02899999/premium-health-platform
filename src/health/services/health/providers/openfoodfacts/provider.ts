import { BaseHealthProvider } from "../base";
import { SearchParams, PaginatedResult, Food, ProviderStatus, ProviderCapability, DataProvenance } from "../../types";
import { TTL } from "../../cache";

type OFFProduct = {
  code: string;
  product_name: string;
  /** String from the product API, array from the search service. */
  brands?: string | string[];
  categories?: string;
  categories_tags?: string[];
  allergens_tags?: string[];
  nutrition_grades?: string;
  nutriments?: Record<string, number>;
  ingredients_text?: string;
  allergens?: string;
  serving_size?: string;
  image_url?: string;
  nutriscore_grade?: string;
  nova_group?: number;
};

const r1 = (v: number | undefined, digits = 1) => (typeof v === "number" && Number.isFinite(v) ? Math.round(v * 10 ** digits) / 10 ** digits : undefined);

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
      // Open Food Facts' search service (the old cgi/search.pl now returns an HTML page).
      // Products sold in India first; worldwide if there are none.
      const fields = "code,product_name,brands,categories_tags,nutriments,allergens_tags,serving_size,image_url,nutrition_grades,nova_group";
      const search = async (q: string) =>
        (await this.fetchJson(`https://search.openfoodfacts.org/search?q=${encodeURIComponent(q)}&page_size=${Math.min(limit * 2, 40)}&fields=${fields}`)) as { hits?: OFFProduct[]; count?: number } | null;
      let json = await search(`${params.query} countries_tags:"en:india"`);
      // The India filter can be rejected by the search service (400 when the field name changes),
      // so fall back to a plain search whenever it gives nothing usable, not only when it is empty.
      if (!json?.hits?.length) json = await search(params.query);
      if (!json?.hits) {
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
      // The search service often returns products with no nutrition at all; a card of dashes helps nobody,
      // so list products that have calories first and drop the empty ones when enough real ones exist.
      const named = json.hits.filter((p) => p.product_name);
      const withKcal = named.filter((p) => typeof p.nutriments?.["energy-kcal_100g"] === "number");
      const data = (withKcal.length >= 3 ? withKcal : named).slice(0, limit).map((p) => this.normalize(p));
      return {
        data,
        total: json.count ?? data.length,
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
      // The search service returns tags like "xx:Amul"; strip the language prefix.
      brand: (Array.isArray(p.brands) ? p.brands.join(", ") : p.brands)?.replace(/(^|, )\w\w:/g, "$1"),
      barcode: p.code,
      category: p.categories?.split(",")[0]?.trim() ?? p.categories_tags?.[0]?.replace(/^\w\w:/, "").replace(/-/g, " "),
      // Open Food Facts stores floats like 2.2300000190734863; one decimal is plenty on a label.
      nutrients: {
        calories: r1(n["energy-kcal_100g"], 0),
        protein: r1(n.proteins_100g),
        carbs: r1(n.carbohydrates_100g),
        fat: r1(n.fat_100g),
        fiber: r1(n.fiber_100g),
        sugar: r1(n.sugars_100g),
        sodium: r1(n.sodium_100g, 3),
        saturatedFat: r1(n["saturated-fat_100g"]),
      },
      ingredients: p.ingredients_text?.split(",").map((s) => s.trim()).slice(0, 20),
      allergens: p.allergens ? p.allergens.split(",").map((s) => s.trim()) : p.allergens_tags?.map((t) => t.replace(/^\w\w:/, "")),
      servingSize: p.serving_size,
      image: p.image_url,
      nutriScore: [p.nutriscore_grade, p.nutrition_grades].map((g) => g?.toUpperCase()).find((g) => g && /^[A-E]$/.test(g)),
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
