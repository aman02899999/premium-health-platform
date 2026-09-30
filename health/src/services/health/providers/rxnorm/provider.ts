import { BaseHealthProvider } from "../base";
import { SearchParams, PaginatedResult, Drug, ProviderStatus, ProviderCapability, DataProvenance } from "../../types";
import { TTL } from "../../cache";

export class RxNormProvider extends BaseHealthProvider<Drug> {
  name = "rxnorm";
  displayName = "RxNorm (NLM)";
  status: ProviderStatus = "AVAILABLE";
  capabilities: ProviderCapability = { search: true, getById: true, getDetails: true, healthCheck: true };
  config = {
    enabled: process.env.ENABLE_RXNORM !== "false",
    baseUrl: process.env.RXNORM_API_URL || "https://rxnav.nlm.nih.gov/REST",
    requiresKey: false,
    ttlMs: TTL.drugSearch,
    timeoutMs: 8000,
  };

  async search(params: SearchParams): Promise<PaginatedResult<Drug>> {
    const key = `rxnorm-search-${params.query.toLowerCase()}-${params.limit ?? 10}`;
    return this.cachedSearch(key, this.config.ttlMs, async () => {
      const url = `${this.config.baseUrl}/drugs.json?name=${encodeURIComponent(params.query)}`;
      const json = (await this.fetchJson(url)) as { drugGroup?: { conceptGroup?: { conceptProperties?: { rxcui: string; name: string; synonym: string }[] }[] } } | null;
      const concepts = json?.drugGroup?.conceptGroup?.flatMap((g) => g.conceptProperties ?? []) ?? [];
      const limit = params.limit ?? 10;
      const sliced = concepts.slice(0, limit);
      const data = sliced.map((c) => this.normalize(c.rxcui, c.name, c.synonym));
      return {
        data,
        total: concepts.length,
        limit,
        offset: 0,
        hasMore: concepts.length > limit,
        source: this.displayName,
        live: true,
        cached: false,
        fetchedAt: new Date().toISOString(),
      };
    });
  }

  async getById(id: string) {
    const url = `${this.config.baseUrl}/rxcui/${id}/allrelated.json`;
    const json = (await this.fetchJson(url)) as { allRelatedGroup?: { conceptGroup?: { conceptProperties?: { rxcui: string; name: string }[] }[] } } | null;
    if (!json) return null;
    const concepts = json.allRelatedGroup?.conceptGroup?.flatMap((g) => g.conceptProperties ?? []) ?? [];
    const main = concepts[0];
    if (!main) return null;
    return this.normalize(main.rxcui, main.name) as Drug & { provenance: DataProvenance };
  }

  private normalize(rxcui: string, name: string, synonym?: string): Drug & { provenance: DataProvenance } {
    return {
      id: rxcui,
      genericName: name,
      brandNames: synonym ? [synonym] : [],
      activeIngredients: [name],
      provenance: {
        source: this.displayName,
        source_id: rxcui,
        source_url: `https://mor.nlm.nih.gov/RxNav/search?searchBy=RXCUI&searchTerm=${rxcui}`,
        license: "UMLS Metathesaurus License (RxNorm is free, but UMLS license required for full use)",
        attribution: "U.S. National Library of Medicine",
        retrieved_at: new Date().toISOString(),
        reliability_level: "high",
      },
    };
  }
}

export const rxNormProvider = new RxNormProvider();
