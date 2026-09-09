/**
 * World Bank Open Data — free, keyless, server-side
 * India health indicators for /about page
 * API: https://api.worldbank.org/v2/country/IN/indicator/{codes}?format=json&per_page=100
 * No key, cached 24h, graceful live:false
 */

export type WBIndicator = {
  code: string;
  label: string;
  value: number | null;
  year: number | null;
  unit: string;
  source: string;
};

export type WBResponse = {
  live: boolean;
  fetchedAt: string;
  indicators: WBIndicator[];
  source: string;
};

// Mapping of World Bank indicator codes to human labels
export const INDICATORS: { code: string; label: string; unit: string }[] = [
  { code: "SP.DYN.LE00.IN", label: "Life expectancy at birth", unit: "years" },
  { code: "SP.POP.TOTL", label: "Population, total", unit: "people" },
  { code: "SH.DYN.MORT", label: "Under-5 mortality", unit: "per 1,000 live births" },
  { code: "SH.DYN.NMRT", label: "Neonatal mortality", unit: "per 1,000 live births" },
  { code: "SH.STA.MMRT", label: "Maternal mortality ratio", unit: "per 100,000 live births" },
  { code: "SP.DYN.TFRT.IN", label: "Fertility rate", unit: "births per woman" },
  { code: "SH.XPD.CHEX.GD.ZS", label: "Current health expenditure", unit: "% of GDP" },
  { code: "SH.MED.BEDS.ZS", label: "Hospital beds", unit: "per 10,000 people" },
  { code: "SH.MED.PHYS.ZS", label: "Physicians", unit: "per 1,000 people" },
  { code: "SH.STA.STNT.ZS", label: "Child stunting", unit: "% of children under 5" },
];

async function fetchJson(url: string, timeoutMs = 9000): Promise<unknown | null> {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), timeoutMs);
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: { "User-Agent": "BharatHealthGuide/1.0 (worldbank-live)" },
    });
    clearTimeout(t);
    if (!res.ok) return null;
    return (await res.json()) as unknown;
  } catch {
    return null;
  }
}

type WBApiItem = {
  indicator?: { id?: string; value?: string };
  country?: { value?: string };
  countryiso3code?: string;
  date?: string;
  value?: number | null;
  unit?: string;
  obs_status?: string;
  decimal?: number;
};

const cache = new Map<string, { at: number; data: WBResponse }>();

export async function getIndiaHealthIndicators(): Promise<WBResponse> {
  const key = "wb-india-health-v1";
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < 24 * 60 * 60 * 1000) return hit.data;

  const now = new Date().toISOString();
  const codes = INDICATORS.map((i) => i.code).join(";");

  const url = `https://api.worldbank.org/v2/country/IN/indicator/${codes}?format=json&per_page=200&source=2`;

  const json = (await fetchJson(url)) as [unknown, WBApiItem[]] | null;

  if (!json || !Array.isArray(json) || json.length < 2 || !Array.isArray(json[1])) {
    const fallback: WBResponse = {
      live: false,
      fetchedAt: now,
      indicators: INDICATORS.map((i) => ({
        code: i.code,
        label: i.label,
        value: null,
        year: null,
        unit: i.unit,
        source: "World Bank",
      })),
      source: "World Bank Open Data",
    };
    cache.set(key, { at: Date.now(), data: fallback });
    return fallback;
  }

  const items = json[1] as WBApiItem[];

  // Group by indicator code, pick latest non-null value
  const latest = new Map<string, WBApiItem>();
  for (const item of items) {
    const code = item.indicator?.id ?? "";
    if (!code) continue;
    if (item.value == null) continue;
    const existing = latest.get(code);
    if (!existing) {
      latest.set(code, item);
    } else {
      const existingYear = Number(existing.date ?? 0);
      const thisYear = Number(item.date ?? 0);
      if (thisYear > existingYear) latest.set(code, item);
    }
  }

  const indicators: WBIndicator[] = INDICATORS.map((def) => {
    const found = latest.get(def.code);
    return {
      code: def.code,
      label: def.label,
      value: found?.value ?? null,
      year: found?.date ? Number(found.date) : null,
      unit: def.unit,
      source: "World Bank",
    };
  });

  const live = indicators.some((i) => i.value != null);

  const out: WBResponse = {
    live,
    fetchedAt: now,
    indicators,
    source: "World Bank Open Data (CC BY 4.0)",
  };

  cache.set(key, { at: Date.now(), data: out });
  return out;
}

export function formatWBValue(ind: WBIndicator): string {
  if (ind.value == null) return "—";
  const v = ind.value;
  if (ind.code === "SP.POP.TOTL") {
    return `${(v / 1e9).toFixed(2)}B`;
  }
  if (v >= 1000) return v.toLocaleString("en-IN");
  if (v >= 10) return v.toFixed(1);
  if (v >= 1) return v.toFixed(2);
  return v.toFixed(3);
}
