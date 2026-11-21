// One-time job (GitHub Action "Gemini drafts"): Gemini on Vertex AI writes rewrite drafts for
// disease pages that still use the shared template. Paid from the Google Cloud credit.
//
//   GCP_ACCESS_TOKEN=... GCP_PROJECT_ID=... LIMIT=10 MODEL=gemini-2.5-pro npx tsx scripts/gemini/disease-drafts.ts
//
// Output: content/drafts/diseases/<slug>.json, reviewStatus pending-medical-review. Nothing here
// changes the live site; a person reviews each draft before it moves into DISEASE_REWRITES.

import { existsSync, mkdirSync, readdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { DISEASES } from "@/health/data/diseases-index";
import { DISEASE_REWRITES } from "@/health/data/diseases-rewrites";
import { HERBS } from "@/health/data/herbs";
import { LAB_TESTS } from "@/health/data/clinical";
import { MEDICINES } from "@/health/data/medicines";
import { INDEXED_DISEASES } from "@/health/lib/content-quality";
import { checkDraft, DRAFT_SYSTEM, draftPrompt, pendingSlugs, REWRITE_SCHEMA, type Rewrite } from "@/lib/ai/disease-drafts-core";
import { modelOrder, PRO_MODELS, toVertexSchema, withModelFallback } from "@/lib/ai/vertex-schema";
import { listModels } from "./models";

const OUT = path.join(process.cwd(), "content/drafts/diseases");
const token = process.env.GCP_ACCESS_TOKEN;
const project = process.env.GCP_PROJECT_ID;
// Blank MODEL = the newest available model from PRO_MODELS (retired ones are skipped on 404).
let models = modelOrder(process.env.MODEL, PRO_MODELS);
let model = models[0];
const limit = Math.max(1, Math.min(40, Number(process.env.LIMIT) || 10));
// An empty "slugs" box in the workflow arrives as "", which means "no filter".
const picked = (process.env.SLUGS ?? "").split(",").map((s) => s.trim()).filter(Boolean);
const only = picked.length ? picked : null;
if (!token || !project) throw new Error("GCP_ACCESS_TOKEN and GCP_PROJECT_ID are required");

async function gemini(prompt: string): Promise<{ ok: true; raw: unknown; tokens: number } | { ok: false; error: string }> {
  const picked = await withModelFallback(models, (m) =>
    fetch(`https://aiplatform.googleapis.com/v1/projects/${project}/locations/global/publishers/google/models/${m}:generateContent`, {
      method: "POST",
      headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
      signal: AbortSignal.timeout(300_000),
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: DRAFT_SYSTEM }] },
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json", responseSchema: toVertexSchema(REWRITE_SCHEMA), maxOutputTokens: 32_000, temperature: 0.4 },
      }),
    }),
  );
  const res = picked.result;
  if (res.status !== 404) { model = picked.model; models = [model]; }
  const json = (await res.json().catch(() => ({}))) as { error?: { message?: string }; candidates?: { finishReason?: string; content?: { parts?: { text?: string }[] } }[]; usageMetadata?: { totalTokenCount?: number } };
  if (res.status === 404) return { ok: false, error: `no model found (tried ${models.join(", ")}). Available: ${await listModels(token!, "gemini")}`.slice(0, 600) };
  if (!res.ok) return { ok: false, error: `HTTP ${res.status}: ${json.error?.message ?? ""}`.slice(0, 300) };
  const c = json.candidates?.[0];
  const text = (c?.content?.parts ?? []).map((p) => p.text ?? "").join("");
  if (c?.finishReason && c.finishReason !== "STOP") return { ok: false, error: `stopped: ${c.finishReason}` };
  try {
    return { ok: true, raw: JSON.parse(text), tokens: json.usageMetadata?.totalTokenCount ?? 0 };
  } catch {
    return { ok: false, error: "answer was not JSON" };
  }
}

/** A cited page has to really open; made-up links are dropped. */
async function opens(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, { redirect: "follow", headers: { "user-agent": "Mozilla/5.0 (compatible; source checker)" }, signal: AbortSignal.timeout(15_000) });
    return res.ok;
  } catch {
    return false;
  }
}

async function main() {
  mkdirSync(OUT, { recursive: true });
  const drafted = existsSync(OUT) ? readdirSync(OUT).filter((f) => f.endsWith(".json")).map((f) => f.slice(0, -5)) : [];
  const skip = [...Object.keys(DISEASE_REWRITES), ...INDEXED_DISEASES, ...drafted];
  const queue = (only ? DISEASES.filter((d) => only.includes(d.slug)) : pendingSlugs(DISEASES, skip)).slice(0, limit);
  const slugs = { diseases: DISEASES.map((d) => d.slug), herbs: HERBS.map((h) => h.slug), labs: LAB_TESTS.map((l) => l.slug), medicines: MEDICINES.map((m) => m.slug) };
  const known = { diseases: new Set(slugs.diseases), herbs: new Set(slugs.herbs), labs: new Set(slugs.labs), medicines: new Set(slugs.medicines) };
  const example = DISEASE_REWRITES["high-blood-pressure"] as Rewrite;
  const today = new Date().toISOString().slice(0, 10);
  let tokens = 0;
  const summary: string[] = [];

  console.log(`${queue.length} disease page(s) to draft; models to try: ${models.join(", ")}`);
  for (const d of queue) {
    const g = await gemini(draftPrompt(d, example, slugs));
    if (!g.ok) { summary.push(`- ${d.slug}: FAILED (${g.error})`); continue; }
    tokens += g.tokens;
    const raw = g.raw as { references?: { url?: string }[] };
    const refs = raw.references ?? [];
    const live = [];
    for (const r of refs) if (typeof r.url === "string" && (await opens(r.url))) live.push(r);
    raw.references = live;
    const c = checkDraft(raw, known, today);
    if (!c.ok) { summary.push(`- ${d.slug}: held back (${c.errors.join("; ")})`); continue; }
    const deadLinks = refs.length - live.length;
    writeFileSync(path.join(OUT, `${d.slug}.json`), `${JSON.stringify({
      slug: d.slug,
      name: d.name,
      reviewStatus: "pending-medical-review",
      generatedBy: `${model} on Vertex AI`,
      generatedAt: today,
      notes: [...c.warnings, ...(deadLinks ? [`${deadLinks} reference link(s) did not open and were dropped`] : [])],
      draft: c.draft,
    }, null, 2)}\n`);
    summary.push(`- ${d.slug}: drafted${c.warnings.length || deadLinks ? ` (${[...c.warnings, deadLinks ? `${deadLinks} dead link(s) dropped` : ""].filter(Boolean).join("; ")})` : ""}`);
  }
  const report = [`Gemini disease drafts, ${today}, model ${model}, ${tokens.toLocaleString("en-IN")} tokens`, ...summary].join("\n");
  console.log(report);
  if (process.env.GITHUB_STEP_SUMMARY) writeFileSync(process.env.GITHUB_STEP_SUMMARY, `${report}\n`, { flag: "a" });
  // A run that made nothing shows red in GitHub instead of a quiet green tick.
  if (summary.length && !summary.some((l) => l.includes("drafted"))) process.exitCode = 1;
}

main().catch((e) => { console.error(e); process.exit(1); });
