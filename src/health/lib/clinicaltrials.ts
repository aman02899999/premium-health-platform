/**
 * ClinicalTrials.gov API v2 — free, keyless, server-side
 * Docs: https://clinicaltrials.gov/data-api/api
 * Endpoint: https://clinicaltrials.gov/api/v2/studies?query.term=diabetes&pageSize=5
 * Graceful fallback live:false
 */

export type ClinicalTrial = {
  nctId: string;
  title: string;
  status: string;
  phase: string[];
  conditions: string[];
  locations: string[];
  url: string;
  startDate?: string;
  completionDate?: string;
};

export type TrialsResponse = {
  live: boolean;
  query: string;
  count: number;
  trials: ClinicalTrial[];
  fetchedAt: string;
};

async function fetchJson(url: string, timeoutMs = 8000): Promise<unknown | null> {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), timeoutMs);
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: { "User-Agent": "BharatHealthGuide/1.0 (clinicaltrials-live)" },
    });
    clearTimeout(t);
    if (!res.ok) return null;
    return (await res.json()) as unknown;
  } catch {
    return null;
  }
}

type CtGovResponse = {
  totalCount?: number;
  studies?: {
    protocolSection?: {
      identificationModule?: {
        nctId?: string;
        briefTitle?: string;
        officialTitle?: string;
      };
      statusModule?: {
        overallStatus?: string;
        phase?: string[];
        startDateStruct?: { date?: string };
        primaryCompletionDateStruct?: { date?: string };
      };
      conditionsModule?: {
        conditions?: string[];
      };
      contactsLocationsModule?: {
        locations?: { country?: string; city?: string; state?: string }[];
      };
    };
  }[];
};

const cache = new Map<string, { at: number; data: TrialsResponse }>();

export async function searchClinicalTrials(query: string, pageSize = 5): Promise<TrialsResponse> {
  const q = query.trim().slice(0, 120);
  const key = `trials-${q.toLowerCase()}-${pageSize}`;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < 6 * 60 * 60 * 1000) return hit.data;

  const now = new Date().toISOString();

  if (!q) {
    return { live: false, query: q, count: 0, trials: [], fetchedAt: now };
  }

  // Build query: term + optional India filter via AREA filter? For simplicity we search term and include all, but show locations
  // Using query.term which searches across fields
  const url = `https://clinicaltrials.gov/api/v2/studies?query.term=${encodeURIComponent(q)}&pageSize=${pageSize}&sort=LastUpdatePostDate`;

  const json = (await fetchJson(url)) as CtGovResponse | null;

  if (!json) {
    const res: TrialsResponse = { live: false, query: q, count: 0, trials: [], fetchedAt: now };
    cache.set(key, { at: Date.now(), data: res });
    return res;
  }

  const studies = json.studies ?? [];
  const trials: ClinicalTrial[] = studies.map((s) => {
    const idMod = s.protocolSection?.identificationModule;
    const statusMod = s.protocolSection?.statusModule;
    const condMod = s.protocolSection?.conditionsModule;
    const locMod = s.protocolSection?.contactsLocationsModule;

    const nctId = idMod?.nctId ?? "Unknown";
    const title = idMod?.briefTitle ?? idMod?.officialTitle ?? `Clinical trial ${nctId}`;
    const status = statusMod?.overallStatus ?? "Unknown";
    const phase = statusMod?.phase ?? [];
    const conditions = condMod?.conditions ?? [];
    const locationsRaw = locMod?.locations ?? [];
    const locations = locationsRaw
      .map((l) => [l.city, l.state, l.country].filter(Boolean).join(", "))
      .filter(Boolean)
      .slice(0, 3);

    return {
      nctId,
      title: title.replace(/\s+/g, " ").trim().slice(0, 220),
      status,
      phase,
      conditions: conditions.slice(0, 4),
      locations: locations.length ? locations : ["Global"],
      url: `https://clinicaltrials.gov/study/${nctId}`,
      startDate: statusMod?.startDateStruct?.date,
      completionDate: statusMod?.primaryCompletionDateStruct?.date,
    };
  });

  const out: TrialsResponse = {
    live: true,
    query: q,
    count: json.totalCount ?? trials.length,
    trials,
    fetchedAt: now,
  };
  cache.set(key, { at: Date.now(), data: out });
  return out;
}

export function buildTrialsQuery(diseaseName: string): string {
  return diseaseName.replace(/-/g, " ");
}
