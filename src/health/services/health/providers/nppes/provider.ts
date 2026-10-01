import { BaseHealthProvider } from "../base";
import {
  SearchParams,
  PaginatedResult,
  HealthcareProvider,
  ProviderStatus,
  ProviderCapability,
  DataProvenance,
} from "../../types";
import { TTL } from "../../cache";

/**
 * NPPES — the CMS National Plan and Provider Enumeration System, exposed as the
 * NPI Registry. Every US healthcare provider and organisation is registered
 * here with its speciality, practice address and registration status.
 *
 * Source: https://npiregistry.cms.hhs.gov/api-page (no key required, version 2.1)
 * Licence: public domain (US federal government work; CMS open data)
 *
 * Caveat worth surfacing to consumers: this is a US registry. It is offered as a
 * worked example of a government provider directory, not as Indian provider data.
 */

type NppesRecord = {
  number?: string;
  enumeration_type?: string;
  basic?: {
    first_name?: string;
    last_name?: string;
    middle_name?: string;
    credential?: string;
    organization_name?: string;
    status?: string;
    sole_proprietor?: string;
    gender?: string;
  };
  addresses?: {
    address_purpose?: string;
    address_1?: string;
    city?: string;
    state?: string;
    postal_code?: string;
    country_code?: string;
    telephone_number?: string;
  }[];
  taxonomies?: {
    code?: string;
    desc?: string;
    primary?: boolean;
    state?: string;
    license?: string;
  }[];
};

export class NppesProvider extends BaseHealthProvider<HealthcareProvider> {
  name = "nppes";
  displayName = "NPPES NPI Registry (CMS)";
  status: ProviderStatus = "AVAILABLE";
  capabilities: ProviderCapability = { search: true, getById: true, getDetails: false, healthCheck: true };
  config = {
    enabled: process.env.ENABLE_NPPES !== "false",
    baseUrl: process.env.NPPES_API_URL || "https://npiregistry.cms.hhs.gov/api",
    requiresKey: false,
    ttlMs: TTL.worldbank,
    timeoutMs: 8000,
  };

  async search(params: SearchParams): Promise<PaginatedResult<HealthcareProvider>> {
    const limit = Math.min(Math.max(params.limit ?? 10, 1), 25);
    const state = (params.filters?.state ?? "").trim().toUpperCase();
    const key = `nppes-${params.query.toLowerCase()}-${state}-${limit}`;

    return this.cachedSearch(key, this.config.ttlMs, async () => {
      // The registry matches on a name fragment; a fully empty query would return
      // an arbitrary page, so it is refused upstream and short-circuited here.
      if (!params.query.trim() && !state) {
        return this.emptyResult(limit, 0);
      }

      const url =
        `${this.config.baseUrl}/?version=2.1` +
        `&limit=${limit}` +
        (state ? `&state=${encodeURIComponent(state)}` : "") +
        (params.query.trim() ? `&last_name=${encodeURIComponent(params.query.trim())}*` : "");

      const json = (await this.fetchJson(url)) as { result_count?: number; results?: NppesRecord[] } | null;
      const results = json?.results ?? [];
      const data = results.map((r) => this.normalize(r)).filter((r): r is HealthcareProvider & { provenance: DataProvenance } => r !== null);

      return {
        data,
        total: json?.result_count ?? data.length,
        limit,
        offset: 0,
        hasMore: (json?.result_count ?? 0) > data.length,
        source: this.displayName,
        live: Boolean(json),
        cached: false,
        fetchedAt: new Date().toISOString(),
      };
    });
  }

  async getById(id: string): Promise<(HealthcareProvider & { provenance: DataProvenance }) | null> {
    const npi = id.replace(/\D/g, "");
    if (npi.length !== 10) return null;

    const json = (await this.fetchJson(`${this.config.baseUrl}/?version=2.1&number=${npi}`)) as {
      results?: NppesRecord[];
    } | null;
    const record = json?.results?.[0];
    return record ? this.normalize(record) : null;
  }

  private normalize(record: NppesRecord): (HealthcareProvider & { provenance: DataProvenance }) | null {
    const npi = record.number;
    if (!npi) return null;

    const basic = record.basic ?? {};
    const isOrganisation = Boolean(basic.organization_name);
    const name = isOrganisation
      ? basic.organization_name!
      : [basic.first_name, basic.middle_name, basic.last_name].filter(Boolean).join(" ").trim();
    if (!name) return null;

    // Prefer the practice-location address over the mailing address.
    const address =
      record.addresses?.find((a) => a.address_purpose === "LOCATION") ?? record.addresses?.[0] ?? undefined;

    const taxonomies = record.taxonomies ?? [];
    const primaryTaxonomy = taxonomies.find((t) => t.primary) ?? taxonomies[0];

    return {
      id: npi,
      name,
      kind: isOrganisation || record.enumeration_type === "NPI-2" ? "organisation" : "individual",
      credential: basic.credential,
      speciality: primaryTaxonomy?.desc ?? undefined,
      city: address?.city,
      state: address?.state,
      postalCode: address?.postal_code ? address.postal_code.slice(0, 5) : undefined,
      country: address?.country_code ?? "US",
      phone: address?.telephone_number,
      status: basic.status,
      // The registry records that a provider's Medicare enrolment is active; it does
      // not publish "accepting new patients", so we never invent it.
      acceptingNewPatients: undefined,
      provenance: {
        source: this.displayName,
        source_id: npi,
        source_url: `https://npiregistry.cms.hhs.gov/provider-view/${npi}`,
        license: "Public domain (US government work)",
        attribution: "Centers for Medicare & Medicaid Services (CMS), NPPES",
        retrieved_at: new Date().toISOString(),
        reliability_level: "high",
      },
    };
  }

  private emptyResult(limit: number, offset: number): PaginatedResult<HealthcareProvider> {
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
}

export const nppesProvider = new NppesProvider();
