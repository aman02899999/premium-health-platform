import { describe, expect, it } from "vitest";
import { DISEASE_REWRITES } from "@/health/data/diseases-rewrites";
import { checkDraft, pendingSlugs, trustedUrl } from "./disease-drafts-core";

const known = {
  diseases: new Set(["high-blood-pressure", "stroke", "obesity"]),
  herbs: new Set(["garlic", "arjuna"]),
  labs: new Set(["lipid-profile", "creatinine", "urine-routine", "fasting-glucose"]),
  medicines: new Set(["amlodipine"]),
};

// The hand-written High Blood Pressure page is the standard: it must pass.
const good = () => structuredClone(DISEASE_REWRITES["high-blood-pressure"]) as unknown as Record<string, unknown>;

describe("checkDraft", () => {
  it("passes the hand-written standard page and drops unknown slugs", () => {
    const raw = good();
    raw.relatedDiseases = ["stroke", "made-up-disease"];
    raw.herbsUsed = [{ name: "Garlic", slug: "garlic", note: "May support" }, { name: "Fake", slug: "fake-herb", note: "x" }];
    const r = checkDraft(raw, known, "2026-11-20");
    if (!r.ok) throw new Error(r.errors.join("; "));
    expect(r.draft.relatedDiseases).toEqual(["stroke"]);
    expect(r.draft.herbsUsed.map((h) => h.slug)).toEqual(["garlic"]);
    expect(r.draft.updatedAt).toBe("2026-11-20");
  });

  it("rejects a cure claim but allows a denial", () => {
    const raw = good();
    raw.lifestyle = ["Walking daily cures high blood pressure.", "Sleep well.", "Move more."];
    const r = checkDraft(raw, known, "2026-11-20");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors.join()).toMatch(/cure\/guarantee/);

    const ok = good();
    ok.lifestyle = ["Walking does not cure it, but it helps.", "Sleep well.", "Move more."];
    expect(checkDraft(ok, known, "2026-11-20").ok).toBe(true);
  });

  it("rejects a medicine or herb dose", () => {
    const raw = good();
    raw.modernTreatment = ["Take amlodipine 5 mg once a day.", "b", "c"];
    const r = checkDraft(raw, known, "2026-11-20");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors.join()).toMatch(/dose in modernTreatment/);

    const herb = good();
    herb.herbsUsed = [{ name: "Garlic", slug: "garlic", note: "2 g of garlic powder daily" }];
    expect(checkDraft(herb, known, "2026-11-20").ok).toBe(false);
  });

  it("drops references from untrusted sites and needs 3 trusted ones", () => {
    const raw = good();
    raw.references = [
      { title: "a", source: "WHO", url: "https://www.who.int/news-room/fact-sheets/detail/hypertension" },
      { title: "b", source: "Blog", url: "https://some-blog.example.com/bp" },
    ];
    const r = checkDraft(raw, known, "2026-11-20");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors.join()).toMatch(/1 trusted references/);
  });

  it("rejects thin drafts", () => {
    const r = checkDraft({ definition: "Short.", faqs: [] }, known, "2026-11-20");
    expect(r.ok).toBe(false);
  });
});

describe("trustedUrl", () => {
  it("accepts subdomains of trusted sites over https only", () => {
    expect(trustedUrl("https://pubmed.ncbi.nlm.nih.gov/123/")).toBe(true);
    expect(trustedUrl("https://www.nhs.uk/conditions/stroke/")).toBe(true);
    expect(trustedUrl("http://www.who.int/x")).toBe(false);
    expect(trustedUrl("https://who.int.evil.com/x")).toBe(false);
    expect(trustedUrl("not a url")).toBe(false);
  });
});

describe("pendingSlugs", () => {
  it("skips rewritten and already drafted diseases", () => {
    const all = [{ slug: "a", name: "A" }, { slug: "b", name: "B" }, { slug: "c", name: "C" }];
    expect(pendingSlugs(all, ["b"]).map((d) => d.slug)).toEqual(["a", "c"]);
  });
});

describe("checkDraft: warnings vs claims (from the first real Gemini run)", () => {
  const withLine = (field: string, line: string) => { const raw = good(); raw[field] = [line, "Sleep well.", "Move more.", "Eat simply."]; return checkDraft(raw, known, "2026-11-20"); };

  it("allows a sentence that warns about cure claims", () => {
    expect(withLine("shouldNotDo", "Avoid supplements or commercial tonics promising a 'guaranteed cure' or rapid reversal.").ok).toBe(true);
    expect(withLine("shouldNotDo", "Ignore the myth that type 1 diabetes can be permanently cured by diet.").ok).toBe(true);
  });

  it("allows an FAQ question that asks about a cure", () => {
    const raw = good();
    (raw.faqs as { q: string; a: string }[])[0].q = "Can type 1 diabetes be cured or reversed with a special diet?";
    expect(checkDraft(raw, known, "2026-11-20").ok).toBe(true);
  });

  it("ignores FAQ questions however they end, and allows medical cure rates (second real run)", () => {
    for (const q of ["Can metabolic syndrome be completely cured?\u200b", 'Does lemon water cure insulin resistance?"', "Can heart failure be cured so that my heart returns to normal"]) {
      const raw = good();
      (raw.faqs as { q: string; a: string }[])[0].q = q;
      const r = checkDraft(raw, known, "2026-11-21");
      if (!r.ok) throw new Error(r.errors.join("; "));
    }
    expect(withLine("evidenceNotes", "Most thyroid cancers found in nodules are slow-growing types with very high cure rates when treated.").ok).toBe(true);
    expect(withLine("lifestyle", "Does karela juice cure prediabetes? Not on its own.").ok).toBe(true);
  });

  it("still checks FAQ answers", () => {
    const raw = good();
    (raw.faqs as { q: string; a: string }[])[0].a = "Yes, arjuna bark cures heart failure.";
    expect(checkDraft(raw, known, "2026-11-21").ok).toBe(false);
  });

  it("still blocks a plain claim", () => {
    expect(withLine("lifestyle", "Bitter gourd juice cures diabetes in weeks.").ok).toBe(false);
  });

  it("treats lab targets as results, not doses, but blocks insulin units", () => {
    expect(withLine("modernTreatment", "Doctors usually target a fasting blood sugar of 95 mg/dL or lower.").ok).toBe(true);
    expect(withLine("modernTreatment", "Treat a low with 15 grams of fast-acting carbs, then recheck.").ok).toBe(true);
    expect(withLine("modernTreatment", "Most people start on 10 units of insulin.").ok).toBe(false);
    expect(withLine("ayurvedaView", "Take 3 g of fenugreek powder daily.").ok).toBe(false);
  });
});
