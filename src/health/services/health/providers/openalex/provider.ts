import { BaseHealthProvider } from "../base";
import { SearchParams, PaginatedResult, MedicalArticle, ProviderStatus, ProviderCapability, DataProvenance } from "../../types";
import { TTL } from "../../cache";

/**
 * OpenAlex — an open catalogue of scholarly works, authors and institutions
 * (the successor to MS Academic Graph). CC0 metadata, keyless, and generous
 * rate limits when a contact email is supplied via the `mailto` parameter.
 *
 * Source: https://docs.openalex.org (no key required)
 * Licence: CC0 1.0 (metadata)
 */

type OpenAlexWork = {
  id?: string;
  doi?: string;
  title?: string;
  display_name?: string;
  publication_year?: number;
  cited_by_count?: number;
  type?: string;
  authorships?: { author?: { display_name?: string } }[];
  primary_location?: { source?: { display_name?: string } | null; landing_page_url?: string | null } | null;
  open_access?: { is_oa?: boolean; oa_url?: string | null };
  abstract_inverted_index?: Record<string, number[]> | null;
};

export class OpenAlexProvider extends BaseHealthProvider<MedicalArticle> {
  name = "openalex";
  displayName = "OpenAlex";
  status: ProviderStatus = "AVAILABLE";
  capabilities: ProviderCapability = { search: true, getById: true, getDetails: true, healthCheck: true };
  config = {
    enabled: process.env.ENABLE_OPENALEX !== "false",
    baseUrl: process.env.OPENALEX_API_URL || "https://api.openalex.org",
    requiresKey: false,
    ttlMs: TTL.pubmed,
    timeoutMs: 8000,
  };

  /** A polite contact address is requested by OpenAlex; never required. */
  private get contactParam(): string {
    const email = process.env.CONTACT_EMAIL || "hello@bharathealthguide.in";
    return `mailto=${encodeURIComponent(email)}`;
  }

  async search(params: SearchParams): Promise<PaginatedResult<MedicalArticle>> {
    const limit = Math.min(Math.max(params.limit ?? 10, 1), 25);
    const key = `openalex-${params.query.toLowerCase()}-${limit}-${params.offset ?? 0}`;

    return this.cachedSearch(key, this.config.ttlMs, async () => {
      const offset = Math.max(params.offset ?? 0, 0);
      const url = `${this.config.baseUrl}/works?search=${encodeURIComponent(params.query)}&per-page=${limit}&page=${Math.floor(offset / limit) + 1}&${this.contactParam}`;

      const json = (await this.fetchJson(url)) as { meta?: { count?: number }; results?: OpenAlexWork[] } | null;
      const results = json?.results ?? [];
      const data = results.filter((w) => w.title || w.display_name).map((w) => this.normalize(w));

      return {
        data,
        total: json?.meta?.count ?? data.length,
        limit,
        offset,
        hasMore: (json?.meta?.count ?? 0) > offset + data.length,
        source: this.displayName,
        live: Boolean(json),
        cached: false,
        fetchedAt: new Date().toISOString(),
      };
    });
  }

  async getById(id: string): Promise<(MedicalArticle & { provenance: DataProvenance }) | null> {
    const clean = id.replace(/^https?:\/\/openalex\.org\//, "");
    const json = (await this.fetchJson(`${this.config.baseUrl}/works/${encodeURIComponent(clean)}?${this.contactParam}`)) as OpenAlexWork | null;
    if (!json || (!json.title && !json.display_name)) return null;
    return this.normalize(json);
  }

  private normalize(w: OpenAlexWork): MedicalArticle & { provenance: DataProvenance } {
    const id = (w.id ?? "").replace("https://openalex.org/", "") || "unknown";
    return {
      id,
      title: w.title ?? w.display_name ?? "",
      authors: w.authorships?.map((a) => a.author?.display_name ?? "").filter(Boolean).slice(0, 12),
      journal: w.primary_location?.source?.display_name ?? undefined,
      pubDate: w.publication_year ? String(w.publication_year) : undefined,
      abstract: w.abstract_inverted_index ? reconstructAbstract(w.abstract_inverted_index).slice(0, 4000) : undefined,
      url: w.open_access?.oa_url ?? w.primary_location?.landing_page_url ?? w.id ?? undefined,
      doi: w.doi?.replace("https://doi.org/", ""),
      citedByCount: w.cited_by_count ?? 0,
      openAccess: Boolean(w.open_access?.is_oa),
      type: w.type,
      provenance: {
        source: this.displayName,
        source_id: id,
        source_url: this.config.baseUrl,
        license: "CC0 1.0 (metadata)",
        attribution: "OpenAlex",
        retrieved_at: new Date().toISOString(),
        reliability_level: "high",
      },
    };
  }
}

/** OpenAlex stores abstracts as an inverted index; rebuild the plain text. */
export function reconstructAbstract(index: Record<string, number[] | undefined>): string {
  const positioned: { word: string; pos: number }[] = [];
  for (const [word, positions] of Object.entries(index)) {
    for (const pos of positions ?? []) positioned.push({ word, pos });
  }
  positioned.sort((a, b) => a.pos - b.pos);
  return positioned.map((p) => p.word).join(" ");
}

export const openAlexProvider = new OpenAlexProvider();
