// Most disease pages are built only from the shared genericDetail() template in
// src/health/data/diseases-detail.ts: the same text with the disease name swapped in
// (Phase 7 inventory, docs/phase7/2026-10-25). Search engines and AdSense treat pages like
// that as scaled low-value content, so they stay noindex and out of the sitemap. Visitors and
// internal links still reach them. Add a slug here only after its page has been rewritten to
// the post standard, with sources and its own text.
export const INDEXED_DISEASES: ReadonlySet<string> = new Set(["type-2-diabetes", "hypothyroidism", "arthritis"]);

export const diseaseIndexable = (slug: string) => INDEXED_DISEASES.has(slug);
