import { describe, expect, it } from "vitest";
import { DISEASES } from "@/health/data/diseases-index";
import { getDiseaseDetail } from "@/health/data/diseases-detail";
import sitemap from "@/app/(health)/health/sitemap";
import { generateMetadata } from "@/app/(health)/health/diseases/[slug]/page";
import { INDEXED_DISEASES, diseaseIndexable } from "./content-quality";

const meta = (slug: string) => generateMetadata({ params: Promise.resolve({ slug }) });

describe("disease pages built from the shared template stay out of search", () => {
  it("only lists slugs that exist", () => {
    const slugs = new Set(DISEASES.map((d) => d.slug));
    for (const s of INDEXED_DISEASES) expect(slugs.has(s)).toBe(true);
  });

  it("indexes the hand-written pages and noindexes the rest, but keeps links followable", async () => {
    expect((await meta("type-2-diabetes")).robots).toBeUndefined();
    expect((await meta("asthma")).robots).toEqual({ index: false, follow: true });
  });

  it("leaves noindexed pages out of the sitemap", () => {
    const urls = sitemap().map((e) => e.url);
    const diseaseUrls = urls.filter((u) => /\/health\/diseases\/[^/]+$/.test(u));
    expect(diseaseUrls.map((u) => u.split("/").pop()).sort()).toEqual([...INDEXED_DISEASES].sort());
  });

  it("keeps every disease page reachable for visitors", () => {
    for (const d of DISEASES) expect(getDiseaseDetail(d.slug)).toBeDefined();
    expect(DISEASES.filter((d) => !diseaseIndexable(d.slug)).length).toBe(DISEASES.length - INDEXED_DISEASES.size);
  });
});
