// One-time job (GitHub Action "Gemini visuals"): Imagen stills and Veo clips for social posts,
// Reels, Shorts and ads, paid from the Google Cloud credit. Files go to the workflow's download
// (artifact); nothing is stored in Google Cloud, so nothing keeps costing money.
//
//   GCP_ACCESS_TOKEN=... GCP_PROJECT_ID=... KIND=image|video SET=default|anatomy START=0 COUNT=8 npx tsx scripts/gemini/visuals.ts

import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fullPrompt, promptProblems, promptSet, type VisualPrompt } from "@/lib/ai/visual-prompts";
import { IMAGE_MODELS, modelOrder, VIDEO_MODELS, withModelFallback } from "@/lib/ai/vertex-schema";
import { listModels } from "./models";

const token = process.env.GCP_ACCESS_TOKEN;
const project = process.env.GCP_PROJECT_ID;
const kind = process.env.KIND === "video" ? "video" : "image";
const start = Math.max(0, Number(process.env.START) || 0);
const count = Math.max(1, Math.min(kind === "video" ? 10 : 20, Number(process.env.COUNT) || 4));
// Imagen was retired on Vertex AI in 2026; stills now come from Gemini's image models.
// Retired names are skipped on 404, and the first model that answers is kept for the run.
let imageModels = modelOrder(process.env.IMAGE_MODEL, IMAGE_MODELS);
let videoModels = modelOrder(process.env.VIDEO_MODEL, VIDEO_MODELS);
const OUT = path.join(process.cwd(), "out/visuals");
const BASE = `https://us-central1-aiplatform.googleapis.com/v1/projects/${project}/locations/us-central1/publishers/google/models`;
const GLOBAL = `https://aiplatform.googleapis.com/v1/projects/${project}/locations/global/publishers/google/models`;
if (!token || !project) throw new Error("GCP_ACCESS_TOKEN and GCP_PROJECT_ID are required");

const headers = { authorization: `Bearer ${token}`, "content-type": "application/json" };
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function post(url: string, body: unknown, timeout = 120_000): Promise<{ ok: boolean; status: number; json: Record<string, unknown> }> {
  const res = await fetch(url, { method: "POST", headers, body: JSON.stringify(body), signal: AbortSignal.timeout(timeout) });
  return { ok: res.ok, status: res.status, json: (await res.json().catch(() => ({}))) as Record<string, unknown> };
}
/** Vertex answers 429 when calls come too fast for the project's per-minute quota: wait and retry. */
async function postWithRetry(url: string, body: unknown): Promise<{ ok: boolean; status: number; json: Record<string, unknown> }> {
  let r = await post(url, body);
  for (const wait of [20_000, 40_000, 60_000, 90_000]) {
    if (r.status !== 429) break;
    console.log(`  rate limited, waiting ${wait / 1000}s`);
    await sleep(wait);
    r = await post(url, body);
  }
  return r;
}
const errorOf = (r: { status: number; json: Record<string, unknown> }) => `HTTP ${r.status}: ${(r.json.error as { message?: string } | undefined)?.message ?? ""}`.slice(0, 300);

async function image(p: VisualPrompt, aspect: "9:16" | "3:4" | "1:1"): Promise<Buffer | string> {
  // 9:16 for Stories/Reels covers, 3:4 for feed posts (crop to 4:5), 1:1 for ads.
  const { model, result: r } = await withModelFallback(imageModels, (m) =>
    postWithRetry(`${GLOBAL}/${m}:generateContent`, { contents: [{ role: "user", parts: [{ text: fullPrompt(p) }] }], generationConfig: { responseModalities: ["IMAGE"], imageConfig: { aspectRatio: aspect } } }),
  );
  if (r.status === 404) return `no image model found (tried ${imageModels.join(", ")}). Available: ${await listModels(token!, "image")}`;
  imageModels = [model];
  if (!r.ok) return errorOf(r);
  const parts = ((r.json.candidates as { content?: { parts?: { inlineData?: { data?: string } }[] } }[] | undefined)?.[0]?.content?.parts ?? []);
  const b64 = parts.find((x) => x.inlineData?.data)?.inlineData?.data;
  return b64 ? Buffer.from(b64, "base64") : "no image returned (filtered by safety rules?)";
}

async function video(p: VisualPrompt): Promise<Buffer | string> {
  // Silent clips: every Reel gets its own licence-safe music later (house rule).
  const { model: videoModel, result: r } = await withModelFallback(videoModels, (m) =>
    postWithRetry(`${BASE}/${m}:predictLongRunning`, { instances: [{ prompt: fullPrompt(p) }], parameters: { aspectRatio: "9:16", durationSeconds: 8, sampleCount: 1, generateAudio: false, personGeneration: "allow_adult" } }),
  );
  if (r.status === 404) return `no video model found (tried ${videoModels.join(", ")}). Available: ${await listModels(token!, "veo")}`;
  videoModels = [videoModel];
  if (!r.ok) return errorOf(r);
  const operationName = r.json.name as string;
  for (let i = 0; i < 40; i++) {
    await sleep(15_000);
    const op = await post(`${BASE}/${videoModel}:fetchPredictOperation`, { operationName });
    if (!op.ok) return errorOf(op);
    if (!op.json.done) continue;
    if (op.json.error) return `failed: ${JSON.stringify(op.json.error).slice(0, 200)}`;
    const v = ((op.json.response as { videos?: { bytesBase64Encoded?: string }[] } | undefined)?.videos ?? [])[0];
    return v?.bytesBase64Encoded ? Buffer.from(v.bytesBase64Encoded, "base64") : "no video returned (filtered by safety rules?)";
  }
  return "timed out after 10 minutes";
}

async function main() {
  mkdirSync(OUT, { recursive: true });
  const list = promptSet(process.env.SET, kind).slice(start, start + count);
  const problems = list.flatMap(promptProblems);
  if (problems.length) throw new Error(`prompts break the house rules: ${problems.join(", ")}`);
  const lines: string[] = [];
  for (const p of list) {
    // The anatomy set feeds vertical Reels only, so one 9:16 still per prompt.
    const shapes = kind === "video" || process.env.SET === "anatomy" ? (["9:16"] as const) : (["9:16", "3:4", "1:1"] as const);
    for (const shape of shapes) {
      if (lines.length) await sleep(kind === "video" ? 10_000 : 6_000); // stay under the per-minute quota
      const out = kind === "video" ? await video(p) : await image(p, shape);
      const name = `AI-${p.id}-${shape.replace(":", "x")}.${kind === "video" ? "mp4" : "png"}`;
      if (typeof out === "string") { lines.push(`- ${name}: FAILED (${out})`); continue; }
      writeFileSync(path.join(OUT, name), out);
      lines.push(`- ${name}: saved (${Math.round(out.length / 1024)} KB), use: ${p.use}`);
    }
  }
  const readme = [
    `AI visuals, ${new Date().toISOString().slice(0, 10)}, ${(kind === "video" ? videoModels : imageModels).join(" / ")}`,
    "",
    "Rules for using these files:",
    "- Turn on the AI label when posting (Instagram/Facebook \"AI info\", YouTube \"altered or synthetic content\").",
    "- Never caption them as our gym, our members, our coaches or anyone's results.",
    "- Videos are silent: add a different licence-safe track to each one.",
    "",
    ...lines,
  ].join("\n");
  writeFileSync(path.join(OUT, "README.txt"), `${readme}\n`);
  console.log(readme);
  if (process.env.GITHUB_STEP_SUMMARY) writeFileSync(process.env.GITHUB_STEP_SUMMARY, `${readme}\n`, { flag: "a" });
  // A run that made nothing shows red in GitHub instead of a quiet green tick.
  if (lines.length && !lines.some((l) => l.includes("saved"))) process.exitCode = 1;
}

main().catch((e) => { console.error(e); process.exit(1); });
