import { BaseHealthProvider } from "../base";
import {
  SearchParams,
  PaginatedResult,
  OutbreakStat,
  ProviderStatus,
  ProviderCapability,
  DataProvenance,
} from "../../types";
import { TTL } from "../../cache";

/**
 * Open Disease (disease.sh) — country and global case counts for
 * COVID-19 and other tracked outbreaks, aggregated from Johns Hopkins CSSE,
 * WHO and national health ministries.
 *
 * Source: https://disease.sh/docs (no key required)
 * Licence: the aggregator is open source (MIT); the underlying case data is
 * published by Johns Hopkins CSSE / WHO and attributed as such.
 */

type DiseaseShCountry = {
  updated?: number;
  country?: string;
  countryInfo?: { iso2?: string; iso3?: string; lat?: number; long?: number; flag?: string };
  cases?: number;
  todayCases?: number;
  deaths?: number;
  todayDeaths?: number;
  recovered?: number;
  active?: number;
  critical?: number;
  tests?: number;
  population?: number;
  casesPerOneMillion?: number;
  deathsPerOneMillion?: number;
  oneCasePerPeople?: number;
  continent?: string;
};

export class OpenDiseaseProvider extends BaseHealthProvider<OutbreakStat> {
  name = "opendisease";
  displayName = "Open Disease (disease.sh)";
  status: ProviderStatus = "AVAILABLE";
  capabilities: ProviderCapability = { search: true, getById: true, getDetails: false, healthCheck: true };
  config = {
    enabled: process.env.ENABLE_OPEN_DISEASE !== "false",
    baseUrl: process.env.OPEN_DISEASE_API_URL || "https://disease.sh/v3",
    requiresKey: false,
    // Case data moves daily; an hour keeps the API responsive without serving stale totals.
    ttlMs: TTL.pulse,
    timeoutMs: 8000,
  };

  async search(params: SearchParams): Promise<PaginatedResult<OutbreakStat>> {
    const country = (params.query || params.filters?.country || "").trim();
    const limit = Math.min(Math.max(params.limit ?? 10, 1), 25);
    const key = `opendisease-${country.toLowerCase() || "all"}`;

    return this.cachedSearch(key, this.config.ttlMs, async () => {
      if (!country) {
        const global = (await this.fetchJson(`${this.config.baseUrl}/covid-19/all`)) as DiseaseShCountry | null;
        const data = global ? [this.normalize({ ...global, country: "Worldwide" })] : [];
        return this.result(data, data.length, limit, Boolean(global));
      }

      // A name may be given as "india", "IN" or "United States"; the upstream
      // accepts any of these and answers with either an object or an array.
      const json = (await this.fetchJson(
        `${this.config.baseUrl}/covid-19/countries/${encodeURIComponent(country)}?strict=true`
      )) as DiseaseShCountry | DiseaseShCountry[] | null;

      // strict=true returns 404-style emptiness for unknown names, so a miss is
      // reported as an empty, non-live result rather than an error.
      const rows = Array.isArray(json) ? json : json ? [json] : [];
      const data = rows.map((r) => this.normalize(r)).filter((d) => d.location.length > 0);
      return this.result(data, data.length, limit, rows.length > 0);
    });
  }

  async getById(id: string): Promise<(OutbreakStat & { provenance: DataProvenance }) | null> {
    const result = await this.search({ query: id, limit: 1 });
    return result.data[0] ?? null;
  }

  private result(
    data: (OutbreakStat & { provenance: DataProvenance })[],
    total: number,
    limit: number,
    live: boolean
  ): PaginatedResult<OutbreakStat> {
    return {
      data,
      total,
      limit,
      offset: 0,
      hasMore: total > data.length,
      source: this.displayName,
      live,
      cached: false,
      fetchedAt: new Date().toISOString(),
    };
  }

  private normalize(row: DiseaseShCountry): OutbreakStat & { provenance: DataProvenance } {
    const location = row.country ?? "Unknown";
    const updated = typeof row.updated === "number" ? new Date(row.updated).toISOString() : undefined;

    return {
      id: (row.countryInfo?.iso3 ?? location).toLowerCase(),
      location,
      isoCode: row.countryInfo?.iso2 ?? undefined,
      cases: row.cases,
      casesToday: row.todayCases,
      deaths: row.deaths,
      deathsToday: row.todayDeaths,
      recovered: row.recovered,
      active: row.active,
      critical: row.critical,
      tests: row.tests,
      population: row.population,
      casesPerMillion: row.casesPerOneMillion,
      sourceUpdatedAt: updated,
      provenance: {
        source: this.displayName,
        source_id: row.countryInfo?.iso3 ?? location,
        source_url: "https://disease.sh",
        license: "Aggregator MIT — data: Johns Hopkins CSSE / WHO",
        attribution: "disease.sh, Johns Hopkins CSSE, WHO",
        retrieved_at: new Date().toISOString(),
        last_updated: updated,
        reliability_level: "medium",
      },
    };
  }
}

export const openDiseaseProvider = new OpenDiseaseProvider();
