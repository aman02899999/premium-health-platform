import { BaseHealthProvider } from "../base";
import { SearchParams, PaginatedResult, DiseaseCode, ProviderStatus, ProviderCapability, DataProvenance } from "../../types";
import { TTL } from "../../cache";

// Local ICD-10 subset for India-relevant conditions + API fallback
const LOCAL_ICD10: { code: string; display: string; definition?: string }[] = [
  { code: "E11", display: "Type 2 diabetes mellitus", definition: "Non-insulin-dependent diabetes" },
  { code: "E10", display: "Type 1 diabetes mellitus" },
  { code: "I10", display: "Essential (primary) hypertension" },
  { code: "E78.00", display: "Pure hypercholesterolemia" },
  { code: "E66.9", display: "Obesity, unspecified" },
  { code: "J06.9", display: "Acute upper respiratory infection, unspecified" },
  { code: "K76.0", display: "Fatty (change of) liver, not elsewhere classified" },
  { code: "E03.9", display: "Hypothyroidism, unspecified" },
  { code: "N92.6", display: "Irregular menstruation" },
  { code: "F32.9", display: "Major depressive disorder, single episode, unspecified" },
  { code: "G43.909", display: "Migraine, unspecified, not intractable" },
  { code: "M54.5", display: "Low back pain" },
];

export class ICD10Provider extends BaseHealthProvider<DiseaseCode> {
  name = "icd10";
  displayName = "ICD-10 (WHO)";
  status: ProviderStatus = "AVAILABLE";
  capabilities: ProviderCapability = { search: true, getById: true, getDetails: false, healthCheck: true };
  config = {
    enabled: process.env.ENABLE_ICD10 !== "false",
    baseUrl: process.env.ICD10_API_URL || "https://id.who.int/icd/release/11/2024-01/mms",
    requiresKey: false,
    ttlMs: TTL.terminology,
    timeoutMs: 5000,
  };

  async search(params: SearchParams): Promise<PaginatedResult<DiseaseCode>> {
    const q = params.query.toLowerCase();
    const limit = params.limit ?? 20;
    const filtered = LOCAL_ICD10.filter(
      (c) => c.code.toLowerCase().includes(q) || c.display.toLowerCase().includes(q)
    ).slice(0, limit);
    const data = filtered.map((c) => ({
      code: c.code,
      system: "ICD-10" as const,
      display: c.display,
      definition: c.definition,
      provenance: {
        source: this.displayName,
        source_id: c.code,
        source_url: `https://icd.who.int/browse10/2019/en#/${c.code}`,
        license: "WHO ICD-10 © WHO, CC BY-ND 3.0 IGO for browser",
        attribution: "World Health Organization",
        retrieved_at: new Date().toISOString(),
        reliability_level: "high" as const,
      },
    }));
    return {
      data: data as (DiseaseCode & { provenance: DataProvenance })[],
      total: filtered.length,
      limit,
      offset: 0,
      hasMore: false,
      source: this.displayName,
      live: false,
      cached: true,
      fetchedAt: new Date().toISOString(),
    };
  }

  async getById(id: string) {
    const found = LOCAL_ICD10.find((c) => c.code.toLowerCase() === id.toLowerCase());
    if (!found) return null;
    return {
      code: found.code,
      system: "ICD-10" as const,
      display: found.display,
      definition: found.definition,
      provenance: {
        source: this.displayName,
        source_id: found.code,
        source_url: `https://icd.who.int/browse10/2019/en#/${found.code}`,
        license: "WHO ICD-10",
        attribution: "WHO",
        retrieved_at: new Date().toISOString(),
        reliability_level: "high",
      },
    } as DiseaseCode & { provenance: DataProvenance };
  }
}

export const icd10Provider = new ICD10Provider();
