import { BaseHealthProvider } from "../base";
import { SearchParams, PaginatedResult, Drug, ProviderStatus, ProviderCapability, DataProvenance } from "../../types";
import { TTL } from "../../cache";

type FDALabel = {
  openfda?: {
    generic_name?: string[];
    brand_name?: string[];
    substance_name?: string[];
    product_type?: string[];
    route?: string[];
  };
  indications_and_usage?: string[];
  warnings?: string[];
  contraindications?: string[];
  adverse_reactions?: string[];
  dosage_and_administration?: string[];
};

export class OpenFDAProvider extends BaseHealthProvider<Drug> {
  name = "openfda";
  displayName = "openFDA";
  status: ProviderStatus = "AVAILABLE";
  capabilities: ProviderCapability = { search: true, getById: true, getDetails: true, healthCheck: true };
  config = {
    enabled: process.env.ENABLE_OPENFDA !== "false",
    baseUrl: process.env.OPENFDA_API_URL || "https://api.fda.gov/drug/label.json",
    requiresKey: false,
    ttlMs: TTL.drugSearch,
    timeoutMs: 8000,
  };

  async search(params: SearchParams): Promise<PaginatedResult<Drug>> {
    const key = `openfda-search-${params.query.toLowerCase()}-${params.limit ?? 10}`;
    return this.cachedSearch(key, this.config.ttlMs, async () => {
      const limit = params.limit ?? 10;
      const url = `${this.config.baseUrl}?search=openfda.generic_name:\"${encodeURIComponent(params.query)}\"&limit=${limit}`;
      const json = (await this.fetchJson(url)) as { results: FDALabel[]; meta: { results: { total: number } } } | null;
      if (!json?.results) {
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
      const data = json.results.map((r, i) => this.normalize(r, `${params.query}-${i}`));
      return {
        data,
        total: json.meta?.results?.total ?? data.length,
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
    const url = `${this.config.baseUrl}?search=openfda.generic_name:\"${encodeURIComponent(id)}\"&limit=1`;
    const json = (await this.fetchJson(url)) as { results: FDALabel[] } | null;
    if (!json?.results?.[0]) return null;
    return this.normalize(json.results[0], id) as Drug & { provenance: DataProvenance };
  }

  private normalize(label: FDALabel, id: string): Drug & { provenance: DataProvenance } {
    return {
      id,
      genericName: label.openfda?.generic_name?.[0] ?? id,
      brandNames: label.openfda?.brand_name ?? [],
      activeIngredients: label.openfda?.substance_name ?? [],
      drugClass: label.openfda?.product_type?.[0],
      indications: label.indications_and_usage?.map((s) => s.slice(0, 500)),
      contraindications: label.contraindications,
      warnings: label.warnings,
      adverseReactions: label.adverse_reactions,
      dosage: label.dosage_and_administration?.[0]?.slice(0, 1000),
      provenance: {
        source: this.displayName,
        source_id: id,
        source_url: "https://open.fda.gov/apis/drug/label/",
        license: "Public Domain (US FDA)",
        attribution: "U.S. FDA",
        retrieved_at: new Date().toISOString(),
        reliability_level: "high",
      },
    };
  }
}

export const openFDAProvider = new OpenFDAProvider();
