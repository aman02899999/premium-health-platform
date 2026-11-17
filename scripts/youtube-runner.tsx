// Renders and uploads one YouTube Short on the GitHub runner, so the Vercel functions don't spend
// their CPU allowance on video. Run by .github/workflows/youtube-shorts.yml:
//   npx tsx --conditions=react-server scripts/youtube-runner.tsx <slot|all>
// Needs CRON_SECRET (the same value as in Vercel) and optionally SITE_URL. The site picks the script,
// claims the slot and gives a one-hour YouTube token; this machine renders, uploads and reports back.
import { SHORTS } from "@/lib/youtube/shorts-bank";
import { renderShort } from "@/lib/youtube/shorts";
import { uploadVideo, type UploadResult, type VideoMeta } from "@/lib/youtube/client";
import { appendFile, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { setThumbnail } from "@/lib/youtube/client";
import { hindiThumbnail } from "@/lib/youtube/hindi-thumb";
import type { RunnerJob, RunnerLongJob } from "@/lib/youtube/automation";
import type { RunnerClipJob } from "@/lib/youtube/clips";
import { renderClip } from "@/lib/youtube/clips-render";
import { RELEASE_INTRO, noteEntry, packFileName, releaseTag } from "@/lib/rumble/pack";

const SITE = (process.env.SITE_URL || "https://www.royalfitnesclub.in").replace(/\/$/, "");
const SECRET = process.env.CRON_SECRET ?? "";

// Every video that goes on YouTube is also kept in rumble-pack/ so the workflow can attach it to
// this week's Rumble release (see src/lib/rumble/pack.ts). A failure here never fails the run:
// the YouTube upload already happened.
const PACK_DIR = path.join(process.cwd(), "rumble-pack");
async function keepForRumble(video: Buffer, label: string, id: string, meta: VideoMeta, youtubeUrl: string): Promise<void> {
  try {
    const now = new Date();
    const name = packFileName(now, label, id);
    await mkdir(PACK_DIR, { recursive: true });
    await writeFile(path.join(PACK_DIR, name), video);
    await writeFile(path.join(PACK_DIR, "TAG"), releaseTag(now));
    await writeFile(path.join(PACK_DIR, "INTRO"), RELEASE_INTRO);
    await appendFile(path.join(PACK_DIR, "notes.md"), noteEntry(name, meta, youtubeUrl) + "\n");
    console.log(`rumble pack: kept ${name}`);
  } catch (err) {
    console.log(`rumble pack: not kept: ${(err as Error).message.slice(0, 120)}`);
  }
}

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
  // Queue Shorts (a viewer's question, a trend) come with their script; bank Shorts are read from this checkout.
  const short = job.script ?? SHORTS[job.index];
  let result: UploadResult;
  if (!short || short.id !== job.shortId) {
    result = { ok: false, error: `Runner: script ${job.shortId} not found in this checkout`, quota: false };
  } else {
    try {
      const started = Date.now();
      const video = await renderShort(short, job.index, job.biz);
      console.log(`slot ${slot}: rendered ${short.id} (${(video.length / 1e6).toFixed(1)} MB) in ${Math.round((Date.now() - started) / 1000)} s`);
      result = await uploadVideo(job.token, video, job.meta);
      if (result.ok) await keepForRumble(video, `short slot${slot}`, short.id, job.meta, result.url);
    } catch (err) {
      result = { ok: false, error: `Render/upload: ${(err as Error).message}`.slice(0, 300), quota: false };
    }
  }
  await call({ action: "result", id: job.id, result });
  console.log(`slot ${slot}: ${result.ok ? `published ${result.url}` : `failed: ${result.error}`}`);
  return result.ok;
}

// The day's long video: a ready-made MP4 in public/youtube/long/, read from this checkout so Vercel
// never downloads or streams it. Up to two per run (a day can have three).
async function runLong(): Promise<boolean> {
  for (let n = 0; n < 2; n++) {
    const claim = await call({ action: "claim-long" });
    const job = claim.job as RunnerLongJob | undefined;
    if (!job) {
      console.log(`long: ${String(claim.status)}`);
      return !String(claim.status).startsWith("failed");
    }
    let result: UploadResult;
    try {
      const mp4 = await readFile(path.join(process.cwd(), "public", job.file));
      result = await uploadVideo(job.token, mp4, job.meta);
    } catch (err) {
      result = { ok: false, error: `Read/upload: ${(err as Error).message}`.slice(0, 300), quota: false };
    }
    await call({ action: "result-long", id: job.id, result });
    if (!result.ok) {
      console.log(`long ${job.videoId}: failed: ${result.error}`);
      return false;
    }
    console.log(`long ${job.videoId}: published https://www.youtube.com/watch?v=${result.id}`);
    await keepForRumble(await readFile(path.join(process.cwd(), "public", job.file)), "long", job.videoId, job.meta, `https://www.youtube.com/watch?v=${result.id}`);
    // A nice-to-have: an unverified channel can't set thumbnails, and the video is already up.
    try {
      const jpeg = await readFile(path.join(process.cwd(), "public", job.thumb));
      // Hindi-first: a Devanagari headline on the thumbnail when the video has one; the plain one if that fails.
      const thumb = job.hindi ? await hindiThumbnail(jpeg, job.hindi).catch(() => jpeg) : jpeg;
      const t = await setThumbnail(job.token, result.id, thumb);
      if (!t.ok) console.log(`long ${job.videoId}: thumbnail not set: ${t.error.slice(0, 120)}`);
    } catch (err) {
      console.log(`long ${job.videoId}: thumbnail not set: ${(err as Error).message.slice(0, 120)}`);
    }
  }
  return true;
}

// The owner's phone clips (Admin → Social): at most one per run, so a big clip never delays the Shorts.
async function runClip(): Promise<boolean> {
  const claim = await call({ action: "claim-clip" });
  const job = claim.job as RunnerClipJob | undefined;
  if (!job) {
    console.log(`clip: ${String(claim.status)}`);
    return !String(claim.status).startsWith("failed");
  }
  let result: UploadResult;
  let uploadedFinal = false;
  try {
    const res = await fetch(job.rawUrl);
    if (!res.ok) throw new Error(`download raw clip: HTTP ${res.status}`);
    const video = await renderClip(Buffer.from(await res.arrayBuffer()), job.input, job.index);
    result = await uploadVideo(job.token, video, job.meta);
    // The finished file goes back to storage so Instagram / Facebook can fetch it later.
    const put = await fetch(job.finalUpload, { method: "PUT", headers: { "content-type": "video/mp4", "x-upsert": "true" }, body: new Uint8Array(video) }).catch(() => null);
    uploadedFinal = !!put?.ok;
    if (!uploadedFinal) console.log(`clip ${job.id.slice(0, 8)}: final file not stored (HTTP ${put?.status ?? "error"}), so no Reel copy`);
    if (result.ok) await keepForRumble(video, "clip", job.id.slice(0, 8), job.meta, result.url);
  } catch (err) {
    result = { ok: false, error: `Clip: ${(err as Error).message}`.slice(0, 300), quota: false };
  }
  await call({ action: "result-clip", id: job.id, result, uploadedFinal });
  console.log(`clip ${job.id.slice(0, 8)}: ${result.ok ? `published ${result.url}` : `failed: ${result.error}`}`);
  return result.ok;
}

async function main() {
  if (!SECRET) throw new Error("CRON_SECRET is not set (GitHub → Settings → Secrets and variables → Actions)");
  const arg = process.argv[2] ?? "all";
  const slots = arg === "all" ? [1, 2, 3] : [Number(arg)];
  let ok = true;
  for (const s of slots) ok = (await runSlot(s)) && ok;
  // Long videos go out with the midday slot, and the late run retries any that failed.
  if (arg === "2" || arg === "all") ok = (await runLong()) && ok;
  ok = (await runClip()) && ok;
  if (!ok) process.exitCode = 1;
}

main().catch((err) => {
  console.error((err as Error).message);
  process.exitCode = 1;
});
