import { BaseHealthProvider } from "../base";
import { SearchParams, PaginatedResult, DataProvenance, Exercise, ProviderStatus, ProviderCapability } from "../../types";
import { TTL } from "../../cache";

type WgerExercise = {
  id: number;
  name: string;
  description: string;
  category: number;
  muscles: number[];
  muscles_secondary: number[];
  equipment: number[];
  images: { image: string }[];
};

type WgerCategory = { id: number; name: string };
type WgerMuscle = { id: number; name: string; is_front: boolean };
type WgerEquipment = { id: number; name: string };

export class WgerProvider extends BaseHealthProvider<Exercise> {
  name = "wger";
  displayName = "wger Workout Manager";
  status: ProviderStatus = "AVAILABLE";
  capabilities: ProviderCapability = { search: true, getById: true, getDetails: true, healthCheck: true };
  config = {
    enabled: process.env.ENABLE_WGER !== "false",
    baseUrl: process.env.WGER_API_URL || "https://wger.de/api/v2",
    requiresKey: false,
    ttlMs: TTL.exercise,
    timeoutMs: 8000,
  };

  private categories: Map<number, string> = new Map();
  private muscles: Map<number, string> = new Map();
  private equipment: Map<number, string> = new Map();

  private async loadMeta() {
    if (this.categories.size > 0) return;
    const [cats, mus, eq] = await Promise.all([
      this.fetchJson(`${this.config.baseUrl}/exercisecategory/`) as Promise<{ results: WgerCategory[] } | null>,
      this.fetchJson(`${this.config.baseUrl}/muscle/`) as Promise<{ results: WgerMuscle[] } | null>,
      this.fetchJson(`${this.config.baseUrl}/equipment/`) as Promise<{ results: WgerEquipment[] } | null>,
    ]);
    cats?.results?.forEach((c) => this.categories.set(c.id, c.name));
    mus?.results?.forEach((m) => this.muscles.set(m.id, m.name));
    eq?.results?.forEach((e) => this.equipment.set(e.id, e.name));
  }

  async search(params: SearchParams): Promise<PaginatedResult<Exercise>> {
    const key = `wger-search-${params.query.toLowerCase()}-${params.limit ?? 20}-${params.offset ?? 0}`;
    return this.cachedSearch(key, this.config.ttlMs, async () => {
      await this.loadMeta();
      const limit = params.limit ?? 20;
      const offset = params.offset ?? 0;
      const url = `${this.config.baseUrl}/exercise/?language=2&limit=${limit}&offset=${offset}&search=${encodeURIComponent(params.query)}`;
      const json = (await this.fetchJson(url)) as { count: number; results: WgerExercise[] } | null;
      if (!json) {
        return {
          data: [],
          total: 0,
          limit,
          offset,
          hasMore: false,
          source: this.displayName,
          live: false,
          cached: false,
          fetchedAt: new Date().toISOString(),
        };
      }
      const data = json.results.map((ex) => this.normalize(ex));
      return {
        data,
        total: json.count,
        limit,
        offset,
        hasMore: offset + limit < json.count,
        source: this.displayName,
        live: true,
        cached: false,
        fetchedAt: new Date().toISOString(),
      };
    });
  }

  async getById(id: string) {
    await this.loadMeta();
    const url = `${this.config.baseUrl}/exercise/${id}/?language=2`;
    const json = (await this.fetchJson(url)) as WgerExercise | null;
    if (!json) return null;
    return this.normalize(json) as Exercise & { provenance: DataProvenance };
  }

  private normalize(ex: WgerExercise): Exercise & { provenance: DataProvenance } {
    return {
      id: String(ex.id),
      name: ex.name,
      description: ex.description?.replace(/<[^>]*>/g, "").slice(0, 1000),
      category: this.categories.get(ex.category) ?? "Unknown",
      muscles: ex.muscles.map((m) => this.muscles.get(m) ?? String(m)),
      secondaryMuscles: ex.muscles_secondary.map((m) => this.muscles.get(m) ?? String(m)),
      equipment: ex.equipment.map((e) => this.equipment.get(e) ?? String(e)),
      images: ex.images?.map((i) => i.image) ?? [],
      provenance: {
        source: this.displayName,
        source_id: String(ex.id),
        source_url: `https://wger.de/en/exercise/${ex.id}`,
        license: "AGPL-3.0",
        attribution: "wger.de",
        retrieved_at: new Date().toISOString(),
        reliability_level: "medium",
      },
    };
  }
}

export const wgerProvider = new WgerProvider();
