import { describe, expect, it } from "vitest";
import { DISEASES } from "@/health/data/diseases-index";
import { getDiseaseDetail } from "@/health/data/diseases-detail";
import { DISEASE_REWRITES } from "@/health/data/diseases-rewrites";
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

describe("rewritten disease pages", () => {
  const strings = (v: unknown): string[] =>
    typeof v === "string" ? [v] : Array.isArray(v) ? v.flatMap(strings) : v && typeof v === "object" ? Object.values(v).flatMap(strings) : [];
  const fields = (slug: string) => {
    const d = getDiseaseDetail(slug)!;
    const { references, relatedDiseases, relatedMedicines, relatedHerbs, relatedLabs, imagePrompt, updatedAt, ...text } = d;
    void references; void relatedDiseases; void relatedMedicines; void relatedHerbs; void relatedLabs; void imagePrompt; void updatedAt;
    // Short values (name, age group, labels) are shared summary data, not prose.
    return { d, text: strings(text).filter((s) => s.length >= 40).map((s) => s.replaceAll(d.name, "X")) };
  };
  const template = new Set(fields("migraine").text);

  for (const slug of Object.keys(DISEASE_REWRITES)) {
    it(`${slug} is indexed, cited and uses no template text`, async () => {
      expect(diseaseIndexable(slug)).toBe(true);
      expect((await meta(slug)).robots).toBeUndefined();
      const { d, text } = fields(slug);
      expect(d.references.length).toBeGreaterThanOrEqual(3);
      for (const r of d.references) expect(r.url).toMatch(/^https:\/\//);
      expect(text.filter((s) => template.has(s))).toEqual([]);
      const links = [...d.relatedDiseases.map((s) => DISEASES.some((x) => x.slug === s))];
      expect(links.every(Boolean)).toBe(true);
    });

    it(`${slug} gives no medicine doses`, () => {
      const { text } = fields(slug);
      expect(text.filter((s) => /\b\d+(\.\d+)?\s?(mg|mcg|µg|IU)\b/i.test(s))).toEqual([]);
    });
  }
});
