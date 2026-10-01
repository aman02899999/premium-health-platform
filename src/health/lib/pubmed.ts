/**
 * PubMed live research via NCBI E-utilities (free, keyless, server-side).
 * - esearch for PMIDs, then esummary for details
 * - Cached 6h, graceful live:false fallback
 */

type ESearchResult = {
  esearchresult?: {
    idlist?: string[];
    count?: string;
  };
};

type ESummaryDoc = {
  uid: string;
  title?: string;
  authors?: { name?: string }[];
  source?: string; // journal
  pubdate?: string;
  sortpubdate?: string;
  volume?: string;
  issue?: string;
  pages?: string;
  doi?: string;
  elocationid?: string;
};

type ESummaryResult = {
  result?: {
    uids?: string[];
    [id: string]: ESummaryDoc | string[] | unknown;
  };
};

export type PubMedArticle = {
  pmid: string;
  title: string;
  authors: string[];
  journal: string;
  pubDate: string;
  url: string;
};

export type PubMedResponse = {
  live: boolean;
  query: string;
  count: number;
  articles: PubMedArticle[];
  fetchedAt: string;
};

async function fetchJson(url: string, timeoutMs = 8000): Promise<unknown | null> {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), timeoutMs);
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: { "User-Agent": "BharatHealthGuide/1.0 (pubmed-live)" },
    });
    clearTimeout(t);
    if (!res.ok) return null;
    return (await res.json()) as unknown;
  } catch {
    return null;
  }
}

const cache = new Map<string, { at: number; data: PubMedResponse }>();
function getCache(key: string, ttlMs: number): PubMedResponse | null {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < ttlMs) return hit.data;
  return null;
}
function setCache(key: string, data: PubMedResponse) {
  cache.set(key, { at: Date.now(), data });
}

function sanitizeTitle(t: string): string {
  return t.replace(/\s+/g, " ").trim().replace(/\.$/, "");
}

export async function searchPubMed(query: string, retmax = 5): Promise<PubMedResponse> {
  const q = query.trim().slice(0, 120);
  if (!q) {
    return { live: false, query, count: 0, articles: [], fetchedAt: new Date().toISOString() };
  }
  const key = `pubmed-${q.toLowerCase()}-${retmax}`;
  const cached = getCache(key, 6 * 60 * 60 * 1000);
  if (cached) return cached;

  const now = new Date().toISOString();

  // Build a focused PubMed query: disease + India filter optional, but we keep generic to maximize hits
  // Example: "type 2 diabetes treatment" -> search term
  const term = `${q} AND (humans[MeSH Terms])`;
  const searchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=${encodeURIComponent(term)}&retmode=json&retmax=${retmax}&sort=date`;

  const searchJson = (await fetchJson(searchUrl)) as ESearchResult | null;
  const idList = searchJson?.esearchresult?.idlist ?? [];

  if (!searchJson || idList.length === 0) {
    // If no results with humans filter, retry without filter
    if (searchJson && idList.length === 0) {
      const fallbackUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=${encodeURIComponent(q)}&retmode=json&retmax=${retmax}&sort=date`;
      const fallback = (await fetchJson(fallbackUrl)) as ESearchResult | null;
      const ids2 = fallback?.esearchresult?.idlist ?? [];
      if (!fallback || ids2.length === 0) {
        const res: PubMedResponse = { live: true, query: q, count: 0, articles: [], fetchedAt: now };
        setCache(key, res);
        return res;
      }
      // proceed with fallback ids
      const summaryUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&id=${ids2.join(",")}&retmode=json`;
      const summaryJson = (await fetchJson(summaryUrl, 9000)) as ESummaryResult | null;
      const articles = parseSummary(summaryJson, ids2);
      const result: PubMedResponse = {
        live: summaryJson != null,
        query: q,
        count: Number(searchJson?.esearchresult?.count ?? ids2.length),
        articles,
        fetchedAt: now,
      };
      setCache(key, result);
      return result;
    }
    const res: PubMedResponse = { live: false, query: q, count: 0, articles: [], fetchedAt: now };
    setCache(key, res);
    return res;
  }

  const summaryUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&id=${idList.join(",")}&retmode=json`;
  const summaryJson = (await fetchJson(summaryUrl, 9000)) as ESummaryResult | null;

  if (!summaryJson?.result) {
    const res: PubMedResponse = { live: false, query: q, count: idList.length, articles: [], fetchedAt: now };
    setCache(key, res);
    return res;
  }

  const articles = parseSummary(summaryJson, idList);

  const out: PubMedResponse = {
    live: true,
    query: q,
    count: Number(searchJson.esearchresult?.count ?? idList.length),
    articles,
    fetchedAt: now,
  };
  setCache(key, out);
  return out;
}

function parseSummary(json: ESummaryResult | null, ids: string[]): PubMedArticle[] {
  if (!json?.result) return [];
  const result = json.result;
  const uids = (result.uids as string[]) ?? ids;
  const articles: PubMedArticle[] = [];

  for (const id of uids) {
    const doc = result[id] as ESummaryDoc | undefined;
    if (!doc || typeof doc === "string") continue;
    const title = doc.title ? sanitizeTitle(doc.title) : `PubMed ${id}`;
    const authors = (doc.authors ?? []).map((a) => a.name ?? "").filter(Boolean).slice(0, 5);
    const journal = doc.source ?? "PubMed";
    const pubDate = doc.pubdate ?? doc.sortpubdate?.slice(0, 10) ?? "";
    articles.push({
      pmid: id,
      title,
      authors,
      journal,
      pubDate,
      url: `https://pubmed.ncbi.nlm.nih.gov/${id}/`,
    });
  }
  return articles;
}

// For disease pages: build a query from slug/name
export function buildPubMedQuery(diseaseName: string, extra?: string): string {
  const base = diseaseName.replace(/-/g, " ");
  // Add India context for relevance, but not too restrictive
  return extra ? `${base} ${extra}` : `${base}`;
}
