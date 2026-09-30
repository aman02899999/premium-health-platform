import { BaseHealthProvider } from "../base";
import { SearchParams, PaginatedResult, HomeopathicRemedy, ProviderStatus, ProviderCapability, DataProvenance } from "../../types";
import { TTL } from "../../cache";

const LOCAL_HOMEOPATHY: Omit<HomeopathicRemedy, "provenance">[] = [
  {
    id: "arnica-montana",
    name: "Arnica montana",
    commonNames: ["Leopard's bane", "Mountain tobacco"],
    scientificName: "Arnica montana",
    materiaMedicaRef: "Boericke, Allen",
    traditionalIndications: ["Traditional homeopathic use for bruises, muscle soreness (traditional claim)"],
    potencyInfo: "Common potencies: 6C, 30C, 200C (traditional)",
  },
  {
    id: "nux-vomica",
    name: "Nux vomica",
    commonNames: ["Poison nut"],
    scientificName: "Strychnos nux-vomica",
    materiaMedicaRef: "Boericke",
    traditionalIndications: ["Traditional homeopathic use for digestive complaints (traditional)"],
    potencyInfo: "6C, 30C (traditional)",
  },
  {
    id: "belladonna",
    name: "Belladonna",
    commonNames: ["Deadly nightshade"],
    scientificName: "Atropa belladonna",
    materiaMedicaRef: "Boericke",
    traditionalIndications: ["Traditional homeopathic use for fever, throbbing headache (traditional)"],
    potencyInfo: "30C, 200C (traditional)",
  },
];

export class HomeopathyProvider extends BaseHealthProvider<HomeopathicRemedy> {
  name = "homeopathy";
  displayName = "Homeopathy (Traditional)";
  status: ProviderStatus = "AVAILABLE";
  capabilities: ProviderCapability = { search: true, getById: true, getDetails: false, healthCheck: true };
  config = {
    enabled: process.env.ENABLE_HOMEOPATHY !== "false",
    baseUrl: process.env.HOMEOPATHY_API_URL || "local-dataset",
    requiresKey: false,
    ttlMs: TTL.herb,
    timeoutMs: 5000,
  };

  async search(params: SearchParams): Promise<PaginatedResult<HomeopathicRemedy>> {
    const q = params.query.toLowerCase();
    const limit = params.limit ?? 20;
    const filtered = LOCAL_HOMEOPATHY.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.commonNames?.some((c) => c.toLowerCase().includes(q)) ||
        r.scientificName?.toLowerCase().includes(q)
    ).slice(0, limit);
    const data = filtered.map((r) => ({
      ...r,
      provenance: {
        source: this.displayName,
        source_id: r.id,
        source_url: "https://www.materiamedica.info + Boericke",
        license: "Traditional homeopathic materia medica (public domain old texts) + CC BY-SA",
        attribution: "Boericke, Allen, public domain homeopathic texts",
        retrieved_at: new Date().toISOString(),
        reliability_level: "traditional" as const,
      },
    }));
    return {
      data: data as (HomeopathicRemedy & { provenance: DataProvenance })[],
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
    const found = LOCAL_HOMEOPATHY.find((r) => r.id === id.toLowerCase() || r.name.toLowerCase() === id.toLowerCase());
    if (!found) return null;
    return {
      ...found,
      provenance: {
        source: this.displayName,
        source_id: found.id,
        source_url: "local-dataset",
        license: "Traditional",
        attribution: "Materia medica",
        retrieved_at: new Date().toISOString(),
        reliability_level: "traditional",
      },
    } as HomeopathicRemedy & { provenance: DataProvenance };
  }
}

export const homeopathyProvider = new HomeopathyProvider();
