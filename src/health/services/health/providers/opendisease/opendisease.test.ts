import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { openDiseaseProvider } from "./provider";
import { cacheClear } from "../../cache";

const INDIA = {
  updated: 1_760_000_000_000,
  country: "India",
  countryInfo: { iso2: "IN", iso3: "IND", lat: 20, long: 77, flag: "https://disease.sh/assets/img/flags/in.png" },
  cases: 45_000_000,
  todayCases: 1_200,
  deaths: 533_000,
  todayDeaths: 12,
  recovered: 44_400_000,
  active: 67_000,
  critical: 698,
  tests: 930_000_000,
  population: 1_400_000_000,
  casesPerOneMillion: 32_000,
  deathsPerOneMillion: 380,
  continent: "Asia",
};

beforeEach(() => cacheClear());
afterEach(() => vi.unstubAllGlobals());

describe("opendisease provider", () => {
  it("has correct metadata and needs no key", () => {
    expect(openDiseaseProvider.name).toBe("opendisease");
    expect(openDiseaseProvider.config.requiresKey).toBe(false);
    expect(openDiseaseProvider.config.baseUrl).toContain("disease.sh");
  });

  it("normalises a country reading and separates the upstream timestamp", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify(INDIA), { status: 200 })));

    const result = await openDiseaseProvider.search({ query: "india", limit: 1 });

    expect(result.live).toBe(true);
    expect(result.data).toHaveLength(1);

    const stat = result.data[0];
    expect(stat.location).toBe("India");
    expect(stat.id).toBe("ind");
    expect(stat.isoCode).toBe("IN");
    expect(stat.cases).toBe(45_000_000);
    expect(stat.deaths).toBe(533_000);
    expect(stat.casesPerMillion).toBe(32_000);
    // As-of date comes from upstream, never from the request clock.
    expect(stat.sourceUpdatedAt).toBe(new Date(1_760_000_000_000).toISOString());
    expect(stat.provenance.last_updated).toBe(stat.sourceUpdatedAt);
    expect(stat.provenance.attribution).toContain("Johns Hopkins");
  });

  it("answers worldwide when no country is given", async () => {
    const urls: string[] = [];
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) => {
        urls.push(String(url));
        return new Response(
          JSON.stringify({ ...INDIA, country: "Worldwide", cases: 700_000_000 }),
          { status: 200 }
        );
      })
    );

    const result = await openDiseaseProvider.search({ query: "", limit: 5 });
    expect(urls[0]).toContain("/covid-19/all");
    expect(result.data[0].location).toBe("Worldwide");
  });

  it("handles an array response, as disease.sh returns for loose matches", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(JSON.stringify([INDIA, { ...INDIA, country: "Indonesia", countryInfo: { iso3: "IDN" } }]), { status: 200 }))
    );

    const result = await openDiseaseProvider.search({ query: "in", limit: 5 });
    expect(result.data.map((d) => d.location)).toEqual(["India", "Indonesia"]);
  });

  it("reports an unknown country as an empty, non-live result", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("Not found", { status: 404 })));

    const result = await openDiseaseProvider.search({ query: "atlantis", limit: 1 });
    expect(result.live).toBe(false);
    expect(result.data).toEqual([]);
    expect(result.total).toBe(0);
  });

  it("degrades gracefully when the aggregator is unreachable", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => {
      throw new Error("offline");
    }));
    const result = await openDiseaseProvider.search({ query: "india" });
    expect(result.live).toBe(false);
    expect(result.data).toEqual([]);
  });

  it("getById returns null rather than a fabricated row", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("Not found", { status: 404 })));
    expect(await openDiseaseProvider.getById("narnia")).toBeNull();
  });
});
