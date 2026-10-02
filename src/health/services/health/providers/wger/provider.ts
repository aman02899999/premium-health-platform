import { BaseHealthProvider } from "../base";
import { SearchParams, PaginatedResult, DataProvenance, Exercise, ProviderStatus, ProviderCapability } from "../../types";
import { TTL } from "../../cache";

/** One entry of wger's /exerciseinfo/ (names and descriptions live in `translations`). */
type WgerInfo = {
  id: number;
  category?: { id: number; name: string };
  muscles?: { id: number; name: string; name_en?: string }[];
  muscles_secondary?: { id: number; name: string; name_en?: string }[];
  equipment?: { id: number; name: string }[];
  images?: { image: string; is_main?: boolean }[];
  translations?: { name: string; description?: string; language: number }[];
};

const ENGLISH = 2;
const CATALOGUE_TTL_MS = 24 * 60 * 60 * 1000;

/**
 * wger's search filters are no longer honoured by its API (every filter returns the full
 * list) and /exercise/ no longer carries names. So we load the whole catalogue once
 * (~900 exercises), keep it for a day, and search English names locally.
 */
export function rankExercises<T extends { name: string }>(items: T[], query: string): T[] {
  const q = query.trim().toLowerCase();
  if (!q) return items;
  const words = q.split(/\s+/);
  const score = (n: string) => {
    const name = n.toLowerCase();
    if (name === q) return 0;
    if (name.startsWith(q)) return 1;
    if (new RegExp(`\\b${q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`).test(name)) return 2;
    if (name.includes(q)) return 3;
    if (words.every((w) => name.includes(w))) return 4;
    return 99;
  };
  return items
    .map((it) => ({ it, s: score(it.name) }))
    .filter((x) => x.s < 99)
    .sort((a, b) => a.s - b.s || a.it.name.length - b.it.name.length)
    .map((x) => x.it);
}

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
    timeoutMs: 12000,
  };

  private catalogue: { at: number; items: (Exercise & { provenance: DataProvenance })[] } | null = null;

  private async loadCatalogue() {
    if (this.catalogue && Date.now() - this.catalogue.at < CATALOGUE_TTL_MS) return this.catalogue.items;
    const json = (await this.fetchJson(`${this.config.baseUrl}/exerciseinfo/?limit=1000`)) as { results?: WgerInfo[] } | null;
    const items = (json?.results ?? []).map((ex) => this.normalize(ex)).filter((x): x is Exercise & { provenance: DataProvenance } => x !== null);
    if (items.length) this.catalogue = { at: Date.now(), items };
    return items;
  }

  async search(params: SearchParams): Promise<PaginatedResult<Exercise>> {
    const limit = params.limit ?? 20;
    const offset = params.offset ?? 0;
    const all = await this.loadCatalogue();
    const matches = rankExercises(all, params.query);
    return {
      data: matches.slice(offset, offset + limit),
      total: matches.length,
      limit,
      offset,
      hasMore: offset + limit < matches.length,
      source: this.displayName,
      live: all.length > 0,
      cached: false,
      fetchedAt: new Date().toISOString(),
    };
  }

  async getById(id: string) {
    const json = (await this.fetchJson(`${this.config.baseUrl}/exerciseinfo/${encodeURIComponent(id)}/`)) as WgerInfo | null;
    return json ? this.normalize(json) : null;
  }

  private normalize(ex: WgerInfo): (Exercise & { provenance: DataProvenance }) | null {
    const en = ex.translations?.find((t) => t.language === ENGLISH && t.name?.trim());
    if (!en) return null;
    const muscle = (m: { name: string; name_en?: string }) => m.name_en || m.name;
    return {
      id: String(ex.id),
      name: en.name.trim(),
      description: en.description?.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().slice(0, 1000),
      category: ex.category?.name ?? "Unknown",
      muscles: (ex.muscles ?? []).map(muscle),
      secondaryMuscles: (ex.muscles_secondary ?? []).map(muscle),
      equipment: (ex.equipment ?? []).map((e) => e.name),
      images: [...(ex.images ?? [])].sort((a, b) => Number(!!b.is_main) - Number(!!a.is_main)).map((i) => i.image),
      provenance: {
        source: this.displayName,
        source_id: String(ex.id),
        source_url: `https://wger.de/en/exercise/${ex.id}`,
        license: "CC-BY-SA 4.0 (exercise data)",
        attribution: "wger.de",
        retrieved_at: new Date().toISOString(),
        reliability_level: "medium",
      },
    };
  }
}

export const wgerProvider = new WgerProvider();
