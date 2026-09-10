import { BaseHealthProvider } from "../base";
import { SearchParams, PaginatedResult, DiseaseCode, ProviderStatus, ProviderCapability, DataProvenance } from "../../types";
import { TTL } from "../../cache";

export class SnomedProvider extends BaseHealthProvider<DiseaseCode> {
  name = "snomed";
  displayName = "SNOMED CT";
  status: ProviderStatus = "SELF_HOST_REQUIRED";
  capabilities: ProviderCapability = { search: true, getById: true, getDetails: false, healthCheck: true };
  config = {
    enabled: process.env.ENABLE_SNOMED === "true",
    baseUrl: process.env.SNOMED_API_URL || "http://localhost:8080/snowstorm/snomed-ct",
    requiresKey: false,
    ttlMs: TTL.terminology,
    timeoutMs: 5000,
  };

  async search(params: SearchParams): Promise<PaginatedResult<DiseaseCode>> {
    if (!this.config.enabled) {
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
    // If self-hosted Snowstorm is available, query it
    const url = `${this.config.baseUrl}/browser/MAIN/concepts?term=${encodeURIComponent(params.query)}&activeFilter=true&limit=${params.limit ?? 10}`;
    const json = (await this.fetchJson(url)) as { items?: { conceptId: string; fsn: { term: string }; definitionStatus: string }[] } | null;
    const items = json?.items ?? [];
    const data = items.map((i) => ({
      code: i.conceptId,
      system: "SNOMED" as const,
      display: i.fsn.term,
      provenance: {
        source: this.displayName,
        source_id: i.conceptId,
        source_url: `${this.config.baseUrl}`,
        license: "SNOMED CT Affiliates License - requires license",
        attribution: "SNOMED International",
        retrieved_at: new Date().toISOString(),
        reliability_level: "high" as const,
      },
    }));
    return {
      data: data as (DiseaseCode & { provenance: DataProvenance })[],
      total: items.length,
      limit: params.limit ?? 10,
      offset: 0,
      hasMore: false,
      source: this.displayName,
      live: true,
      cached: false,
      fetchedAt: new Date().toISOString(),
    };
  }

  async getById(id: string) {
    if (!this.config.enabled) return null;
    const url = `${this.config.baseUrl}/browser/MAIN/concepts/${id}`;
    const json = (await this.fetchJson(url)) as { conceptId: string; fsn: { term: string } } | null;
    if (!json) return null;
    return {
      code: json.conceptId,
      system: "SNOMED" as const,
      display: json.fsn.term,
      provenance: {
        source: this.displayName,
        source_id: json.conceptId,
        source_url: `${this.config.baseUrl}`,
        license: "SNOMED CT",
        attribution: "SNOMED International",
        retrieved_at: new Date().toISOString(),
        reliability_level: "high",
      },
    } as DiseaseCode & { provenance: DataProvenance };
  }

  async healthCheck() {
    if (!this.config.enabled) {
      return {
        provider: this.name,
        status: this.status,
        enabled: false,
        lastCheck: new Date().toISOString(),
        message: "SNOMED requires self-hosted Snowstorm + license. Set ENABLE_SNOMED=true and SNOMED_API_URL",
      };
    }
    return super.healthCheck();
  }
}

export const snomedProvider = new SnomedProvider();
