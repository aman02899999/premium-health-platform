import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { europePmcProvider } from "./provider";
import { cacheClear } from "../../cache";

const FIXTURE = {
  hitCount: 128,
  resultList: {
    result: [
      {
        id: "12345678",
        source: "MED",
        pmid: "12345678",
        doi: "10.1000/example.1",
        title: "<h4>Millets and glycemic control</h4> in Indian adults",
        authorString: "Sharma A, Iyer R, Khan S",
        journalTitle: "Indian Journal of Endocrinology",
        pubYear: "2024",
        abstractText: "<p>Replacing white rice with <b>millets</b> improved HbA1c.</p>",
        citedByCount: 42,
      },
      // No title — must be dropped rather than rendered as an empty row.
      { id: "999", source: "MED", pmid: "999" },
    ],
  },
};

function stubFetch(impl: () => Promise<Response>) {
  vi.stubGlobal("fetch", vi.fn(impl));
}

beforeEach(() => {
  cacheClear();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("europepmc provider", () => {
  it("has correct metadata and needs no key", () => {
    expect(europePmcProvider.name).toBe("europepmc");
    expect(europePmcProvider.status).toBe("AVAILABLE");
    expect(europePmcProvider.config.requiresKey).toBe(false);
    expect(europePmcProvider.capabilities.search).toBe(true);
  });

  it("normalises results and strips JATS/HTML markup", async () => {
    stubFetch(async () => new Response(JSON.stringify(FIXTURE), { status: 200 }));

    const result = await europePmcProvider.search({ query: "millet", limit: 5 });

    expect(result.live).toBe(true);
    expect(result.total).toBe(128);
    expect(result.source).toBe("Europe PMC");
    // The untitled record is excluded.
    expect(result.data).toHaveLength(1);

    const article = result.data[0];
    expect(article.title).toBe("Millets and glycemic control in Indian adults");
    expect(article.abstract).toBe("Replacing white rice with millets improved HbA1c.");
    expect(article.id).toBe("MED:12345678");
    expect(article.doi).toBe("10.1000/example.1");
    expect(article.journal).toBe("Indian Journal of Endocrinology");
    expect(article.citedByCount).toBe(42);
    expect(article.authors).toEqual(["Sharma A", "Iyer R", "Khan S"]);
    expect(article.url).toContain("europepmc.org/article/MED/12345678");
    expect(article.provenance.source).toBe("Europe PMC");
    expect(article.provenance.license).toContain("Europe PMC");
  });

  it("caps the page size at 25 regardless of what the caller asks for", async () => {
    const seen: string[] = [];
    stubFetch(async () => {
      seen.push("");
      return new Response(JSON.stringify(FIXTURE), { status: 200 });
    });

    const result = await europePmcProvider.search({ query: "diabetes", limit: 500 });
    expect(result.limit).toBe(25);
    expect(seen).toHaveLength(1);
  });

  it("degrades gracefully when the upstream is unreachable", async () => {
    stubFetch(async () => {
      throw new Error("ENOTFOUND");
    });

    const result = await europePmcProvider.search({ query: "anything-uncached" });
    expect(result.live).toBe(false);
    expect(result.data).toEqual([]);
    expect(result.total).toBe(0);
    expect(result.source).toBe("Europe PMC");
  });

  it("degrades gracefully on a non-200 response", async () => {
    stubFetch(async () => new Response("nope", { status: 503 }));
    const result = await europePmcProvider.search({ query: "another-query" });
    expect(result.live).toBe(false);
    expect(result.data).toEqual([]);
  });

  it("returns null from getById when nothing matches", async () => {
    stubFetch(async () => new Response(JSON.stringify({ resultList: { result: [] } }), { status: 200 }));
    expect(await europePmcProvider.getById("00000000")).toBeNull();
  });

  it("resolves a numeric id as a PMID and a DOI as a DOI query", async () => {
    const urls: string[] = [];
    stubFetch(async (init?: unknown) => {
      void init;
      return new Response(JSON.stringify(FIXTURE), { status: 200 });
    });
    const originalFetch = globalThis.fetch as unknown as (u: string) => Promise<Response>;
    vi.stubGlobal("fetch", vi.fn(async (url: string) => {
      urls.push(String(url));
      return originalFetch(url);
    }));

    await europePmcProvider.getById("12345678");
    expect(urls[0]).toContain("EXT_ID%3A12345678");

    cacheClear();
    await europePmcProvider.getById("10.1000/example.1");
    expect(urls[1]).toContain("DOI");
  });
});
