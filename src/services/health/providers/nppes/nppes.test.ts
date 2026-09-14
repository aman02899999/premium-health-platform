import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { nppesProvider } from "./provider";
import { cacheClear } from "../../cache";

/** Two real shapes from the NPI Registry: an individual and an organisation. */
const FIXTURE = {
  result_count: 2,
  results: [
    {
      number: "1234567893",
      enumeration_type: "NPI-1",
      basic: {
        first_name: "ASHA",
        last_name: "SHARMA",
        credential: "MD",
        status: "A",
        sole_proprietor: "NO",
      },
      addresses: [
        { address_purpose: "MAILING", city: "ALBANY", state: "NY", postal_code: "122070000", country_code: "US" },
        {
          address_purpose: "LOCATION",
          address_1: "100 MEDICAL CENTER DR",
          city: "ALBANY",
          state: "NY",
          postal_code: "122083412",
          country_code: "US",
          telephone_number: "518-555-0100",
        },
      ],
      taxonomies: [
        { code: "207R00000X", desc: "Internal Medicine", primary: true, state: "NY", license: "123456" },
        { code: "207RC0000X", desc: "Cardiovascular Disease", primary: false },
      ],
    },
    {
      number: "9876543210",
      enumeration_type: "NPI-2",
      basic: { organization_name: "ALBANY MEDICAL GROUP", status: "A" },
      addresses: [{ address_purpose: "LOCATION", city: "ALBANY", state: "NY", postal_code: "12208", country_code: "US" }],
      taxonomies: [{ code: "193200000X", desc: "Multi-Specialty Group", primary: true }],
    },
    // No NPI — must be dropped rather than emitted with an empty id.
    { basic: { last_name: "GHOST" } },
  ],
};

beforeEach(() => cacheClear());
afterEach(() => vi.unstubAllGlobals());

describe("nppes provider", () => {
  it("has correct metadata and needs no key", () => {
    expect(nppesProvider.name).toBe("nppes");
    expect(nppesProvider.config.requiresKey).toBe(false);
    expect(nppesProvider.config.baseUrl).toContain("npiregistry.cms.hhs.gov");
  });

  it("normalises an individual and an organisation", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify(FIXTURE), { status: 200 })));

    const result = await nppesProvider.search({ query: "sharma", limit: 10 });

    expect(result.live).toBe(true);
    expect(result.total).toBe(2);
    expect(result.data).toHaveLength(2);

    const [person, org] = result.data;
    expect(person.name).toBe("ASHA SHARMA");
    expect(person.kind).toBe("individual");
    expect(person.credential).toBe("MD");
    expect(person.speciality).toBe("Internal Medicine");
    // The practice address wins over the mailing address.
    expect(person.city).toBe("ALBANY");
    expect(person.postalCode).toBe("12208");
    expect(person.phone).toBe("518-555-0100");
    expect(person.status).toBe("A");
    expect(person.provenance.license).toContain("Public domain");

    expect(org.name).toBe("ALBANY MEDICAL GROUP");
    expect(org.kind).toBe("organisation");
  });

  it("never invents 'accepting new patients' — the registry does not publish it", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify(FIXTURE), { status: 200 })));
    const result = await nppesProvider.search({ query: "sharma" });
    expect(result.data.every((p) => p.acceptingNewPatients === undefined)).toBe(true);
  });

  it("caps the page at 25 and passes the state filter upstream", async () => {
    const urls: string[] = [];
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) => {
        urls.push(String(url));
        return new Response(JSON.stringify(FIXTURE), { status: 200 });
      })
    );

    const result = await nppesProvider.search({ query: "sharma", limit: 500, filters: { state: "ny" } });
    expect(result.limit).toBe(25);
    expect(urls[0]).toContain("limit=25");
    expect(urls[0]).toContain("state=NY");
  });

  it("short-circuits an unfiltered query instead of fetching an arbitrary page", async () => {
    const spy = vi.fn(async () => new Response(JSON.stringify(FIXTURE), { status: 200 }));
    vi.stubGlobal("fetch", spy);

    const result = await nppesProvider.search({ query: "", limit: 5 });
    expect(result.data).toEqual([]);
    expect(result.live).toBe(false);
    expect(spy).not.toHaveBeenCalled();
  });

  it("degrades gracefully when the registry is unreachable", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => {
      throw new Error("offline");
    }));
    const result = await nppesProvider.search({ query: "sharma", limit: 5 });
    expect(result.live).toBe(false);
    expect(result.data).toEqual([]);
  });

  it("resolves getById only for a 10-digit NPI", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify(FIXTURE), { status: 200 })));
    const found = await nppesProvider.getById("1234567893");
    expect(found?.name).toBe("ASHA SHARMA");

    // A malformed identifier must not reach the registry at all.
    const spy = vi.fn(async () => new Response(JSON.stringify(FIXTURE), { status: 200 }));
    vi.stubGlobal("fetch", spy);
    expect(await nppesProvider.getById("abc")).toBeNull();
    expect(spy).not.toHaveBeenCalled();
  });
});
