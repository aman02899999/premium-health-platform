// Bundles the Gemini disease drafts (branch gemini/disease-drafts, content/drafts/diseases/*.json)
// into one file the site reads: src/health/data/disease-drafts.generated.json.
// Nothing here publishes anything: a bundled draft reaches the public page only after a doctor
// approves it in Admin -> Health page review (table disease_reviews).
//
//   git archive origin/gemini/disease-drafts content/drafts/diseases | tar -x
//   node scripts/gemini/bundle-drafts.mjs [content/drafts/diseases]
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const dir = process.argv[2] ?? "content/drafts/diseases";
const out = path.join("src/health/data/disease-drafts.generated.json");
const files = readdirSync(dir).filter((f) => f.endsWith(".json")).sort();
const bundle = {};
for (const f of files) {
  const d = JSON.parse(readFileSync(path.join(dir, f), "utf8"));
  if (d.reviewStatus !== "pending-medical-review" || !d.draft || d.slug !== f.replace(/\.json$/, "")) throw new Error(`${f}: not a pending draft`);
  bundle[d.slug] = { name: d.name, generatedAt: d.generatedAt, notes: d.notes ?? [], draft: d.draft };
}
writeFileSync(out, `${JSON.stringify(bundle, null, 1)}\n`);
console.log(`${files.length} drafts -> ${out}`);
