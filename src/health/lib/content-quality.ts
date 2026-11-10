// Most disease pages are built only from the shared genericDetail() template in
// src/health/data/diseases-detail.ts: the same text with the disease name swapped in
// (Phase 7 inventory, docs/phase7/2026-10-25). Search engines and AdSense treat pages like
// that as scaled low-value content, so they stay noindex and out of the sitemap. Visitors and
// internal links still reach them. Add a slug here only after its page has been rewritten to
// the post standard, with sources and its own text.
export const INDEXED_DISEASES: ReadonlySet<string> = new Set([
  "type-2-diabetes",
  "hypothyroidism",
  "arthritis",
  // Full rewrites in src/health/data/diseases-rewrites.ts
  "high-blood-pressure",
  "pcos",
  "fatty-liver",
]);

export const diseaseIndexable = (slug: string) => INDEXED_DISEASES.has(slug);

// Short reference pages (Phase 7 inventory, docs/phase7/2026-10-25): median own words were
// lab tests 88, symptoms 79, nutrition 104, Ayurveda 124; 7 of 12 medicine pages were under 150;
// product pages are short affiliate summaries. They help visitors but read as thin to Google and
// AdSense, so each section stays noindex, out of the sitemap and ad-free until a page is expanded
// with sources and its own text. Add the slug to that section's set once it is.
// Herbs (median 152 own words) and news stay indexed.
export const THIN_SECTIONS = ["symptoms", "lab-tests", "nutrition", "ayurveda", "medicines", "products"] as const;
export type ThinSection = (typeof THIN_SECTIONS)[number];

export const INDEXED_REFERENCE: Record<ThinSection, ReadonlySet<string>> = {
  symptoms: new Set(),
  "lab-tests": new Set(),
  nutrition: new Set(),
  ayurveda: new Set(),
  medicines: new Set(),
  products: new Set(),
};

export const referenceIndexable = (section: ThinSection, slug: string) => INDEXED_REFERENCE[section].has(slug);

/** Robots value for a page in a thin section: noindex unless rewritten; links stay followable. */
export const referenceRobots = (section: ThinSection, slug: string) =>
  referenceIndexable(section, slug) ? {} : { robots: { index: false, follow: true } };

const THIN_PAGE = new RegExp(`^/(?:hi/)?health/(${THIN_SECTIONS.join("|")})/([^/?#]+)/?$`);

/** True for a /health page that is noindex for thin content (template diseases or short reference pages). */
export const isThinContentPath = (path: string) => {
  const d = /^\/(?:hi\/)?health\/diseases\/([^/?#]+)\/?$/.exec(path);
  if (d) return !diseaseIndexable(decodeURIComponent(d[1]));
  const m = THIN_PAGE.exec(path);
  return !!m && !referenceIndexable(m[1] as ThinSection, decodeURIComponent(m[2]));
};
