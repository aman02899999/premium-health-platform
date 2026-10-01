import { BaseHealthProvider } from "../base";
import { SearchParams, PaginatedResult, MedicalArticle, ProviderStatus, ProviderCapability, DataProvenance } from "../../types";
import { TTL } from "../../cache";

/**
 * Europe PMC — life-science literature search with abstracts, journal, year and
 * citation counts. Open, keyless, and considerably richer than the PubMed E-utils
 * summary endpoint (which returns no abstracts).
 *
 * Source: https://europepmc.org/RestfulWebService (no key required)
 * Licence: Europe PMC is open; abstracts remain under the publisher's terms.
 */

type EpmcResult = {
  id?: string;
  source?: string;
  pmid?: string;
  doi?: string;
  title?: string;
  authorString?: string;
  journalTitle?: string;
  pubYear?: string;
  abstractText?: string;
  citedByCount?: number;
};

export class EuropePmcProvider extends BaseHealthProvider<MedicalArticle> {
  name = "europepmc";
  displayName = "Europe PMC";
  status: ProviderStatus = "AVAILABLE";
  capabilities: ProviderCapability = { search: true, getById: true, getDetails: true, healthCheck: true };
  config = {
    enabled: process.env.ENABLE_EUROPEPMC !== "false",
    baseUrl: process.env.EUROPEPMC_API_URL || "https://www.ebi.ac.uk/europepmc/webservices/rest",
    requiresKey: false,
    ttlMs: TTL.pubmed,
    timeoutMs: 8000,
  };

  async search(params: SearchParams): Promise<PaginatedResult<MedicalArticle>> {
    const limit = Math.min(Math.max(params.limit ?? 10, 1), 25);
    const key = `europepmc-${params.query.toLowerCase()}-${limit}-${params.offset ?? 0}`;

    return this.cachedSearch(key, this.config.ttlMs, async () => {
      const offset = Math.max(params.offset ?? 0, 0);
      const url =
        `${this.config.baseUrl}/search?query=${encodeURIComponent(params.query)}` +
        `&format=json&resultType=core&pageSize=${limit}&cursorMark=*`;

      const json = (await this.fetchJson(url)) as
        | { hitCount?: number; resultList?: { result?: EpmcResult[] } }
        | null;

      const results = json?.resultList?.result ?? [];
      const data = results
        .filter((r) => r.title)
        .map((r) => this.normalize(r));

      return {
        data,
        total: json?.hitCount ?? data.length,
        limit,
        offset,
        hasMore: (json?.hitCount ?? 0) > offset + data.length,
        source: this.displayName,
        live: Boolean(json),
        cached: false,
        fetchedAt: new Date().toISOString(),
      };
    });
  }

  async getById(id: string): Promise<(MedicalArticle & { provenance: DataProvenance }) | null> {
    // Accepts a PMID or a DOI-ish identifier; Europe PMC resolves both via query.
    const query = /^\d+$/.test(id) ? `EXT_ID:${id}` : `DOI:"${id}"`;
    const url = `${this.config.baseUrl}/search?query=${encodeURIComponent(query)}&format=json&resultType=core&pageSize=1`;
    const json = (await this.fetchJson(url)) as { resultList?: { result?: EpmcResult[] } } | null;
    const hit = json?.resultList?.result?.[0];
    if (!hit?.title) return null;
    return this.normalize(hit);
  }

  private normalize(r: EpmcResult): MedicalArticle & { provenance: DataProvenance } {
    const id = r.pmid ? `MED:${r.pmid}` : r.doi ? `DOI:${r.doi}` : r.id ?? "unknown";
    return {
      id,
      title: stripMarkup(r.title ?? ""),
      authors: r.authorString ? r.authorString.split(",").map((a) => a.trim()).slice(0, 12) : undefined,
      journal: r.journalTitle,
      pubDate: r.pubYear,
      abstract: r.abstractText ? stripMarkup(r.abstractText).slice(0, 4000) : undefined,
      url: r.pmid ? `https://europepmc.org/article/MED/${r.pmid}` : r.doi ? `https://doi.org/${r.doi}` : undefined,
      doi: r.doi,
      citedByCount: r.citedByCount ?? 0,
      provenance: {
        source: this.displayName,
        source_id: id,
        source_url: this.config.baseUrl,
        license: "Europe PMC open access; abstracts per publisher",
        attribution: "Europe PMC",
        retrieved_at: new Date().toISOString(),
        reliability_level: "high",
      },
    };
  }
}

/** Europe PMC returns JATS/HTML fragments in some fields. */
function stripMarkup(value: string): string {
  return value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

export const europePmcProvider = new EuropePmcProvider();
