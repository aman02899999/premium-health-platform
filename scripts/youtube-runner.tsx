// Renders and uploads one YouTube Short on the GitHub runner, so the Vercel functions don't spend
// their CPU allowance on video. Run by .github/workflows/youtube-shorts.yml:
//   npx tsx --conditions=react-server scripts/youtube-runner.tsx <slot|all>
// Needs CRON_SECRET (the same value as in Vercel) and optionally SITE_URL. The site picks the script,
// claims the slot and gives a one-hour YouTube token; this machine renders, uploads and reports back.
import { SHORTS } from "@/lib/youtube/shorts-bank";
import { renderShort } from "@/lib/youtube/shorts";
import { uploadVideo, type UploadResult } from "@/lib/youtube/client";
import type { RunnerJob } from "@/lib/youtube/automation";

const SITE = (process.env.SITE_URL || "https://www.royalfitnesclub.in").replace(/\/$/, "");
const SECRET = process.env.CRON_SECRET ?? "";

async function call(body: object): Promise<Record<string, unknown>> {
  const res = await fetch(`${SITE}/api/youtube/runner`, {
    method: "POST",
    headers: { authorization: `Bearer ${SECRET}`, "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok && res.status !== 409) throw new Error(`site answered HTTP ${res.status}: ${JSON.stringify(json).slice(0, 200)}`);
  return json;
}

async function runSlot(slot: number): Promise<boolean> {
  const claim = await call({ action: "claim", slot });
  const job = claim.job as RunnerJob | undefined;
  if (!job) {
    console.log(`slot ${slot}: ${String(claim.status)}`);
    // A failed sign-in is recorded by the site; make the run red so GitHub emails the owner.
    return !String(claim.status).startsWith("failed");
  }
  const short = SHORTS[job.index];
  let result: UploadResult;
  if (!short || short.id !== job.shortId) {
    result = { ok: false, error: `Runner: script ${job.shortId} not found in this checkout`, quota: false };
  } else {
    try {
      const started = Date.now();
      const video = await renderShort(short, job.index, job.biz);
      console.log(`slot ${slot}: rendered ${short.id} (${(video.length / 1e6).toFixed(1)} MB) in ${Math.round((Date.now() - started) / 1000)} s`);
      result = await uploadVideo(job.token, video, job.meta);
    } catch (err) {
      result = { ok: false, error: `Render/upload: ${(err as Error).message}`.slice(0, 300), quota: false };
    }
  }
  await call({ action: "result", id: job.id, result });
  console.log(`slot ${slot}: ${result.ok ? `published ${result.url}` : `failed: ${result.error}`}`);
  return result.ok;
}

async function main() {
  if (!SECRET) throw new Error("CRON_SECRET is not set (GitHub → Settings → Secrets and variables → Actions)");
  const arg = process.argv[2] ?? "all";
  const slots = arg === "all" ? [1, 2, 3] : [Number(arg)];
  let ok = true;
  for (const s of slots) ok = (await runSlot(s)) && ok;
  if (!ok) process.exitCode = 1;
}

main().catch((err) => {
  console.error((err as Error).message);
  process.exitCode = 1;
});
