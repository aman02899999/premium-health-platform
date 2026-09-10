import { BaseHealthProvider } from "../base";
import { SearchParams, PaginatedResult, MedicalArticle, ProviderStatus, ProviderCapability, DataProvenance } from "../../types";
import { TTL } from "../../cache";

export class PubMedProvider extends BaseHealthProvider<MedicalArticle> {
  name = "pubmed";
  displayName = "PubMed / NCBI";
  status: ProviderStatus = "AVAILABLE";
  capabilities: ProviderCapability = { search: true, getById: true, getDetails: true, healthCheck: true };
  config = {
    enabled: process.env.ENABLE_PUBMED !== "false",
    baseUrl: process.env.PUBMED_API_URL || "https://eutils.ncbi.nlm.nih.gov/entrez/eutils",
    requiresKey: false,
    ttlMs: TTL.pubmed,
    timeoutMs: 8000,
  };

  async search(params: SearchParams): Promise<PaginatedResult<MedicalArticle>> {
    const key = `pubmed-provider-${params.query.toLowerCase()}-${params.limit ?? 5}`;
    return this.cachedSearch(key, this.config.ttlMs, async () => {
      const limit = params.limit ?? 5;
      const term = `${params.query} AND humans[MeSH Terms]`;
      const searchUrl = `${this.config.baseUrl}/esearch.fcgi?db=pubmed&term=${encodeURIComponent(term)}&retmode=json&retmax=${limit}&sort=date`;
      const searchJson = (await this.fetchJson(searchUrl)) as { esearchresult?: { idlist?: string[]; count?: string } } | null;
      const ids = searchJson?.esearchresult?.idlist ?? [];
      if (ids.length === 0) {
        // fallback without MeSH filter
        const fallbackUrl = `${this.config.baseUrl}/esearch.fcgi?db=pubmed&term=${encodeURIComponent(params.query)}&retmode=json&retmax=${limit}&sort=date`;
        const fb = (await this.fetchJson(fallbackUrl)) as { esearchresult?: { idlist?: string[]; count?: string } } | null;
        const fbIds = fb?.esearchresult?.idlist ?? [];
        if (fbIds.length === 0) {
          return {
            data: [],
            total: 0,
            limit,
            offset: 0,
            hasMore: false,
            source: this.displayName,
            live: true,
            cached: false,
            fetchedAt: new Date().toISOString(),
          };
        }
        const articles = await this.fetchSummary(fbIds);
        return {
          data: articles,
          total: Number(fb?.esearchresult?.count ?? fbIds.length),
          limit,
          offset: 0,
          hasMore: false,
          source: this.displayName,
          live: true,
          cached: false,
          fetchedAt: new Date().toISOString(),
        };
      }
      const articles = await this.fetchSummary(ids);
      return {
        data: articles,
        total: Number(searchJson?.esearchresult?.count ?? ids.length),
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
    const articles = await this.fetchSummary([id]);
    return articles[0] ?? null;
  }

  private async fetchSummary(ids: string[]): Promise<(MedicalArticle & { provenance: DataProvenance })[]> {
    if (ids.length === 0) return [];
    const url = `${this.config.baseUrl}/esummary.fcgi?db=pubmed&id=${ids.join(",")}&retmode=json`;
    const json = (await this.fetchJson(url)) as { result?: { uids?: string[]; [k: string]: unknown } } | null;
    if (!json?.result?.uids) return [];
    const uids = json.result.uids as string[];
    const articles: (MedicalArticle & { provenance: DataProvenance })[] = [];
    for (const uid of uids) {
      const doc = json.result[uid] as { title?: string; authors?: { name: string }[]; source?: string; pubdate?: string; elocationid?: string } | undefined;
      if (!doc) continue;
      articles.push({
        id: uid,
        title: doc.title?.replace(/\s+/g, " ").trim() ?? `PubMed ${uid}`,
        authors: doc.authors?.map((a) => a.name).slice(0, 5),
        journal: doc.source,
        pubDate: doc.pubdate,
        url: `https://pubmed.ncbi.nlm.nih.gov/${uid}/`,
        doi: doc.elocationid?.includes("doi") ? doc.elocationid : undefined,
        provenance: {
          source: this.displayName,
          source_id: uid,
          source_url: `https://pubmed.ncbi.nlm.nih.gov/${uid}/`,
          license: "Public Domain / Varies by article",
          attribution: "NCBI PubMed",
          retrieved_at: new Date().toISOString(),
          reliability_level: "high",
        },
      });
    }
    return articles;
  }
}

export const pubMedProvider = new PubMedProvider();
