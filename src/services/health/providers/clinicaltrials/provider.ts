import { BaseHealthProvider } from "../base";
import { SearchParams, PaginatedResult, ClinicalTrial, ProviderStatus, ProviderCapability, DataProvenance } from "../../types";
import { TTL } from "../../cache";

export class ClinicalTrialsProvider extends BaseHealthProvider<ClinicalTrial> {
  name = "clinicaltrials";
  displayName = "ClinicalTrials.gov";
  status: ProviderStatus = "AVAILABLE";
  capabilities: ProviderCapability = { search: true, getById: true, getDetails: true, healthCheck: true };
  config = {
    enabled: process.env.ENABLE_CLINICALTRIALS !== "false",
    baseUrl: process.env.CLINICALTRIALS_API_URL || "https://clinicaltrials.gov/api/v2/studies",
    requiresKey: false,
    ttlMs: TTL.trials,
    timeoutMs: 8000,
  };

  async search(params: SearchParams): Promise<PaginatedResult<ClinicalTrial>> {
    const key = `ct-provider-${params.query.toLowerCase()}-${params.limit ?? 5}`;
    return this.cachedSearch(key, this.config.ttlMs, async () => {
      const limit = params.limit ?? 5;
      const url = `${this.config.baseUrl}?query.term=${encodeURIComponent(params.query)}&pageSize=${limit}&sort=LastUpdatePostDate`;
      const json = (await this.fetchJson(url)) as {
        totalCount?: number;
        studies?: {
          protocolSection?: {
            identificationModule?: { nctId?: string; briefTitle?: string };
            statusModule?: { overallStatus?: string; phase?: string[] };
            conditionsModule?: { conditions?: string[] };
            contactsLocationsModule?: { locations?: { country?: string; city?: string }[] };
          };
        }[];
      } | null;
      if (!json?.studies) {
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
      const data = json.studies.map((s) => {
        const idMod = s.protocolSection?.identificationModule;
        const statusMod = s.protocolSection?.statusModule;
        const condMod = s.protocolSection?.conditionsModule;
        const locMod = s.protocolSection?.contactsLocationsModule;
        const nctId = idMod?.nctId ?? "Unknown";
        return {
          id: nctId,
          nctId,
          title: idMod?.briefTitle?.slice(0, 300) ?? `Trial ${nctId}`,
          status: statusMod?.overallStatus ?? "Unknown",
          phase: statusMod?.phase,
          conditions: condMod?.conditions?.slice(0, 5),
          locations: locMod?.locations?.map((l) => [l.city, l.country].filter(Boolean).join(", ")).slice(0, 3),
          url: `https://clinicaltrials.gov/study/${nctId}`,
          provenance: {
            source: this.displayName,
            source_id: nctId,
            source_url: `https://clinicaltrials.gov/study/${nctId}`,
            license: "Public Domain",
            attribution: "ClinicalTrials.gov (NLM)",
            retrieved_at: new Date().toISOString(),
            reliability_level: "high",
          } as DataProvenance,
        } as ClinicalTrial & { provenance: DataProvenance };
      });
      return {
        data,
        total: json.totalCount ?? data.length,
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
    const url = `${this.config.baseUrl}/${id}`;
    const json = (await this.fetchJson(url)) as {
      protocolSection?: {
        identificationModule?: { nctId?: string; briefTitle?: string; officialTitle?: string };
        statusModule?: { overallStatus?: string; phase?: string[] };
        conditionsModule?: { conditions?: string[] };
      };
    } | null;
    if (!json?.protocolSection) return null;
    const idMod = json.protocolSection.identificationModule;
    const nctId = idMod?.nctId ?? id;
    return {
      id: nctId,
      nctId,
      title: idMod?.briefTitle ?? idMod?.officialTitle ?? nctId,
      status: json.protocolSection.statusModule?.overallStatus ?? "Unknown",
      phase: json.protocolSection.statusModule?.phase,
      conditions: json.protocolSection.conditionsModule?.conditions,
      url: `https://clinicaltrials.gov/study/${nctId}`,
      provenance: {
        source: this.displayName,
        source_id: nctId,
        source_url: `https://clinicaltrials.gov/study/${nctId}`,
        license: "Public Domain",
        attribution: "ClinicalTrials.gov",
        retrieved_at: new Date().toISOString(),
        reliability_level: "high",
      },
    } as ClinicalTrial & { provenance: DataProvenance };
  }
}

export const clinicalTrialsProvider = new ClinicalTrialsProvider();
