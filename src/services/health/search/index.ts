/**
 * Unified health search — searches across all enabled providers
 * Returns categorized results for diseases, medicines, herbs, food, exercises, research
 */

import { SearchParams } from "../types";
import { listProviders, enabledProviders } from "../registry";
import { normalizeQuery } from "../normalization";
import { memoryCache } from "../cache";

type CategorizedResults = {
  query: string;
  categories: {
    diseases?: unknown[];
    medicines?: unknown[];
    symptoms?: unknown[];
    food?: unknown[];
    exercises?: unknown[];
    ayurveda?: unknown[];
    homeopathy?: unknown[];
    research?: unknown[];
    trials?: unknown[];
    chemicals?: unknown[];
    terminology?: unknown[];
    indiaIndicators?: unknown[];
  };
  total: number;
  fetchedAt: string;
  sources: string[];
};

export async function unifiedHealthSearch(params: SearchParams): Promise<CategorizedResults> {
  const q = normalizeQuery(params.query);
  if (!q) throw new Error("Query required");

  const cacheKey = `unified-search-${q}-${params.limit ?? 10}`;
  const cached = memoryCache.get<CategorizedResults>(cacheKey);
  if (cached) return cached;

  const providers = enabledProviders();
  const limit = params.limit ?? 5;

  // Run searches in parallel with timeout handling
  const results = await Promise.allSettled(
    providers.map(async (p) => {
      try {
        const res = await p.search({ query: q, limit });
        return { provider: p.name, data: res.data, live: res.live, source: res.source };
      } catch {
        return { provider: p.name, data: [], live: false, source: p.displayName };
      }
    })
  );

  const categories: CategorizedResults["categories"] = {};
  const sources: string[] = [];

  for (const r of results) {
    if (r.status !== "fulfilled") continue;
    const { provider, data, source } = r.value;
    if (data.length === 0) continue;
    sources.push(source);

    switch (provider) {
      case "openfoodfacts":
      case "usda":
        categories.food = [...(categories.food ?? []), ...data].slice(0, limit);
        break;
      case "wger":
        categories.exercises = [...(categories.exercises ?? []), ...data].slice(0, limit);
        break;
      case "openfda":
      case "rxnorm":
        categories.medicines = [...(categories.medicines ?? []), ...data].slice(0, limit);
        break;
      case "pubchem":
        categories.chemicals = [...(categories.chemicals ?? []), ...data].slice(0, limit);
        break;
      case "pubmed":
        categories.research = [...(categories.research ?? []), ...data].slice(0, limit);
        break;
      case "clinicaltrials":
        categories.trials = [...(categories.trials ?? []), ...data].slice(0, limit);
        break;
      case "ayurveda":
        categories.ayurveda = [...(categories.ayurveda ?? []), ...data].slice(0, limit);
        break;
      case "homeopathy":
        categories.homeopathy = [...(categories.homeopathy ?? []), ...data].slice(0, limit);
        break;
      case "icd10":
      case "snomed":
        categories.terminology = [...(categories.terminology ?? []), ...data].slice(0, limit);
        break;
      case "worldbank":
        categories.indiaIndicators = [...(categories.indiaIndicators ?? []), ...data].slice(0, limit);
        break;
      default:
        break;
    }
  }

  // Also include local search from existing search-index (diseases, herbs, etc.)
  try {
    const { searchAll } = await import("@/lib/search-index");
    const local = searchAll(q, limit * 2);
    // local contains diseases, herbs, medicines etc from static data
    const diseaseResults = local.filter((i: { type: string }) => i.type === "disease").slice(0, limit);
    const herbResults = local.filter((i: { type: string }) => i.type === "herb").slice(0, limit);
    const medResults = local.filter((i: { type: string }) => i.type === "medicine").slice(0, limit);
    if (diseaseResults.length) categories.diseases = diseaseResults;
    if (herbResults.length) categories.ayurveda = [...(categories.ayurveda ?? []), ...herbResults].slice(0, limit);
    if (medResults.length) categories.medicines = [...(categories.medicines ?? []), ...medResults].slice(0, limit);
    if (local.length) sources.push("Local static index (BHG)");
  } catch {
    // ignore
  }

  const total = Object.values(categories).reduce((sum, arr) => sum + (Array.isArray(arr) ? arr.length : 0), 0);

  const out: CategorizedResults = {
    query: q,
    categories,
    total,
    fetchedAt: new Date().toISOString(),
    sources: Array.from(new Set(sources)),
  };

  memoryCache.set(cacheKey, out, 10 * 60 * 1000);
  return out;
}
