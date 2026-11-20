// Gemini rewrite drafts for the thin, template-built disease pages (Phase 7).
// Plain module (no "server-only"): the GitHub Action script scripts/gemini/disease-drafts.ts uses it.
//
// A draft is never published by this code. It lands in content/drafts/diseases/<slug>.json as
// pending-medical-review. A person checks it, moves it into DISEASE_REWRITES and adds the slug to
// INDEXED_DISEASES; only then does Google see the page.

import type { DiseaseDetail, DiseaseSummary } from "@/health/types";

export type Rewrite = Omit<DiseaseDetail, keyof DiseaseSummary>;

const str = { type: "string" };
const strList = { type: "array", items: str };
const obj = (props: Record<string, unknown>, required = Object.keys(props)) => ({ type: "object", additionalProperties: false, required, properties: props });

/** The fields Gemini writes. updatedAt and imagePrompt are filled in by the script. */
export const REWRITE_SCHEMA = obj({
  definition: str,
  quickFacts: { type: "array", items: obj({ label: str, value: str }) },
  causes: strList,
  types: { type: "array", items: obj({ name: str, desc: str }) },
  diagnosis: strList,
  investigations: { type: "array", items: obj({ test: str, purpose: str, slug: str }, ["test", "purpose"]) },
  modernTreatment: strList,
  ayurvedaView: strList,
  herbsUsed: { type: "array", items: obj({ name: str, slug: str, note: str }) },
  nutrition: strList,
  lifestyle: strList,
  yogaActivity: strList,
  homeopathyNote: strList,
  evidenceNotes: strList,
  shouldNotDo: strList,
  medicationSafety: strList,
  complications: strList,
  emergencySigns: strList,
  whenToSeeDoctor: strList,
  faqs: { type: "array", items: obj({ q: str, a: str }) },
  references: { type: "array", items: obj({ title: str, source: str, year: str, url: str }, ["title", "source", "url"]) },
  relatedDiseases: strList,
  relatedMedicines: strList,
  relatedHerbs: strList,
  relatedLabs: strList,
});

/** Sources Gemini may cite. Anything else is dropped before a person sees the draft. */
export const TRUSTED_SOURCES = [
  "who.int", "icmr.gov.in", "icmr.nic.in", "nin.res.in", "mohfw.gov.in", "fssai.gov.in", "nhm.gov.in", "aiims.edu",
  "ncbi.nlm.nih.gov", "nih.gov", "medlineplus.gov", "cdc.gov", "nhs.uk", "nice.org.uk", "mayoclinic.org",
  "heart.org", "diabetes.org", "hsph.harvard.edu", "health.harvard.edu", "clevelandclinic.org", "cochranelibrary.com",
];

export function trustedUrl(url: string): boolean {
  try {
    const u = new URL(url);
    if (u.protocol !== "https:") return false;
    return TRUSTED_SOURCES.some((d) => u.hostname === d || u.hostname.endsWith(`.${d}`));
  } catch {
    return false;
  }
}

/** Diseases still on the shared template, minus the ones already rewritten or drafted. */
export function pendingSlugs(all: { slug: string; name: string }[], skip: Iterable<string>): { slug: string; name: string }[] {
  const done = new Set(skip);
  return all.filter((d) => !done.has(d.slug));
}

const CLAIM = /\b(cures?|cured|guaranteed?|miracle)\b/i;
// "No good evidence: 'BP cure' powders" is a denial too, so the gap may hold any non-sentence-ending text.
const DENIAL = /(?:\b(?:not|no|never|without|nor)\b|n't)(?:\s+[^\s.!?]+){0,6}?\s+['"‘“]?(?:\w+\s)?(?:cures?|cured|guaranteed?|miracle)\b/gi;
/** A number with a dose unit: medicine, herb or supplement doses are never allowed (house rule). */
/** A sentence that warns against a claim ("beware of tonics promising a guaranteed cure") is fine. */
const WARNING = /\b(?:not|no|never|without|nor|myths?|claims?|claiming|promis\w*|false|fake|so-called|beware|avoid|don't|doesn't|isn't|cannot|can't|scam)\b|n't\b/i;
/** Medicine doses: blocked in every treatment field. Lab units like mg/dL and mmol/L are results, not doses. */
const MED_DOSE = /\b\d+(?:\.\d+)?\s?(?:mg|mcg|µg|ml|iu|units?|tablets?|capsules?|drops)\b(?!\s?\/\s?(?:dl|l)\b)/i;
/** Herb and remedy amounts (grams, spoons) as well: blocked where herbs and remedies are discussed. */
const HERB_DOSE = new RegExp(`${MED_DOSE.source}|\\b\\d+(?:\\.\\d+)?\\s?(?:g|gm|grams?|teaspoons?|tsp|tablespoons?|tbsp)\\b`, "i");
const DOSE_FIELDS: [string, RegExp][] = [["modernTreatment", MED_DOSE], ["medicationSafety", MED_DOSE], ["ayurvedaView", HERB_DOSE], ["homeopathyNote", HERB_DOSE], ["herbsUsed", HERB_DOSE]];
const sentences = (s: string) => s.split(/(?<=[.!?])\s+/);

const words = (s: string) => s.split(/\s+/).filter(Boolean).length;
const texts = (v: unknown): string[] => (typeof v === "string" ? [v] : Array.isArray(v) ? v.flatMap(texts) : v && typeof v === "object" ? Object.values(v).flatMap(texts) : []);

export type DraftCheck = { ok: true; draft: Rewrite; warnings: string[] } | { ok: false; errors: string[] };

/**
 * House rules for a health draft: enough own text, real sources, no cure or guarantee claims,
 * no doses, and the safety sections filled. Slugs that don't exist on the site are dropped.
 */
export function checkDraft(raw: unknown, known: { diseases: Set<string>; herbs: Set<string>; labs: Set<string>; medicines: Set<string> }, updatedAt: string): DraftCheck {
  if (!raw || typeof raw !== "object") return { ok: false, errors: ["not an object"] };
  const d = raw as Record<string, unknown>;
  const errors: string[] = [];
  const warnings: string[] = [];
  const list = (k: string) => (Array.isArray(d[k]) ? (d[k] as unknown[]) : []);

  const own = texts(d).join(" ");
  if (words(own) < 1200) errors.push(`only ${words(own)} words (needs 1,200+)`);
  if (typeof d.definition !== "string" || d.definition.length < 400) errors.push("definition under 400 characters");
  for (const [k, min] of [["causes", 4], ["diagnosis", 3], ["modernTreatment", 3], ["lifestyle", 3], ["emergencySigns", 3], ["whenToSeeDoctor", 3], ["shouldNotDo", 3], ["medicationSafety", 2]] as const)
    if (list(k).length < min) errors.push(`${k} has ${list(k).length} items (needs ${min}+)`);
  const faqs = list("faqs").length;
  if (faqs < 4 || faqs > 8) errors.push(`${faqs} FAQs (needs 4-8)`);

  const claim = texts(d)
    .flatMap(sentences)
    .map((t) => t.replace(DENIAL, "").replace(/\bcure-all\b/gi, ""))
    .find((t) => CLAIM.test(t) && !WARNING.test(t));
  if (claim) errors.push(`cure/guarantee claim: "${claim.match(new RegExp(`.{0,40}${CLAIM.source}.{0,20}`, "i"))?.[0]}"`);
  for (const [k, re] of DOSE_FIELDS) {
    const hit = texts(d[k]).find((t) => re.test(t));
    if (hit) errors.push(`dose in ${k}: "${hit.match(new RegExp(`.{0,30}(?:${re.source}).{0,10}`, "i"))?.[0]}"`);
  }
  for (const f of list("faqs") as { a?: unknown }[]) if (typeof f?.a === "string" && /\b(?:take|dose|dosage)\b/i.test(f.a) && MED_DOSE.test(f.a)) errors.push(`dose in an FAQ answer: "${f.a.slice(0, 60)}"`);

  const refs = (list("references") as { url?: unknown }[]).filter((r) => typeof r?.url === "string" && trustedUrl(r.url));
  const dropped = list("references").length - refs.length;
  if (dropped) warnings.push(`${dropped} reference(s) from untrusted sites dropped`);
  if (refs.length < 3) errors.push(`${refs.length} trusted references (needs 3+)`);

  if (errors.length) return { ok: false, errors };

  const keep = (k: string, set: Set<string>) => (list(k) as unknown[]).filter((s): s is string => typeof s === "string" && set.has(s));
  const herbsUsed = (list("herbsUsed") as Rewrite["herbsUsed"]).filter((h) => known.herbs.has(h.slug));
  const investigations = (list("investigations") as Rewrite["investigations"]).map((i) => (i.slug && !known.labs.has(i.slug) ? { test: i.test, purpose: i.purpose } : i));
  const draft = {
    ...(d as unknown as Rewrite),
    investigations,
    herbsUsed,
    references: refs as Rewrite["references"],
    relatedDiseases: keep("relatedDiseases", known.diseases),
    relatedHerbs: keep("relatedHerbs", known.herbs),
    relatedLabs: keep("relatedLabs", known.labs),
    relatedMedicines: keep("relatedMedicines", known.medicines),
    updatedAt,
    imagePrompt: "",
  };
  return { ok: true, draft, warnings };
}

export const DRAFT_SYSTEM = `You write one disease page for Bharat Health Guide, the health section of an Indian gym website. Readers are ordinary Indian adults.
Write in plain English, short sentences, warm and direct. Use Indian context: Indian foods, Indian guidelines (ICMR, ICMR-NIN, MoHFW) and Indian numbers where they exist.
Rules that never bend:
- Education only. Never say anything cures a disease, never promise or guarantee a result.
- Never give a dose or amount for any medicine, insulin, herb, supplement or homeopathic remedy. Say "as advised by your doctor".
- When you warn about false claims, say "no herb, diet or product can make it go away" rather than repeating words like "cure" or "guaranteed".
- Herbs and Ayurveda can only "support" alongside medical care. Say clearly when evidence is weak.
- Every number or statistic must come from one of the references you list.
- references: 4 to 8 real, existing pages from WHO, ICMR, ICMR-NIN, MoHFW, FSSAI, AIIMS, NIH/NCBI/MedlinePlus, CDC, NHS, NICE, Mayo Clinic, Cleveland Clinic, Harvard, the American Heart or Diabetes Association, or Cochrane. Give exact URLs you are sure exist. Fewer real ones beat more made-up ones.
- emergencySigns and whenToSeeDoctor must be specific and practical.
- Use only slugs from the lists you are given for herbsUsed, investigations, relatedDiseases, relatedHerbs, relatedLabs and relatedMedicines. Leave a slug out rather than invent one.
- Write about 1,500 to 2,500 words in total across all fields.
The example page shows the standard and tone. Do not copy its sentences.`;

export function draftPrompt(d: { slug: string; name: string }, example: Rewrite, slugs: { diseases: string[]; herbs: string[]; labs: string[]; medicines: string[] }): string {
  return [
    `Write the page for: ${d.name} (slug ${d.slug}).`,
    `Allowed herb slugs: ${slugs.herbs.join(", ")}`,
    `Allowed lab test slugs: ${slugs.labs.join(", ")}`,
    `Allowed medicine slugs: ${slugs.medicines.join(", ")}`,
    `Allowed disease slugs: ${slugs.diseases.filter((s) => s !== d.slug).join(", ")}`,
    `Example page (High Blood Pressure), for standard and tone only:\n${JSON.stringify(example)}`,
  ].join("\n\n");
}
