import "server-only";
import { randomUUID } from "node:crypto";
import { pool } from "@/health/db";
import { facebookConfigured, instagramConfigured, publishFacebookReel, publishInstagramReel } from "@/lib/social/meta";
import { SITE_URL } from "@/lib/site";
import type { UploadResult, VideoMeta } from "./client";
import { CLIP_INDEX_BASE, CLIP_TAGS, checkClipInput, clipDescription, clipPath, clipReelCaption, clipTitle, finalPath, type ClipInput } from "./clips-core";

// The owner's phone clips (clips-core.ts). The browser uploads the raw file straight to Supabase
// Storage with a one-time signed URL (no size limit from the website's host), the GitHub runner
// renders and posts it, and the daily job shares the finished video as an Instagram / Facebook
// Reel once those are connected.

const BUCKET = "social-media";
const base = () => (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "").replace(/\/$/, "");
const key = () => process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY || "";
export const clipsConfigured = () => Boolean(base() && key());
const publicUrl = (path: string) => `${base()}/storage/v1/object/public/${BUCKET}/${path}`;

/** A one-time URL the browser (or the runner) can PUT one file to. */
async function signedUpload(path: string): Promise<string> {
  const res = await fetch(`${base()}/storage/v1/object/upload/sign/${BUCKET}/${path}`, {
    method: "POST",
    headers: { authorization: `Bearer ${key()}`, apikey: key(), "content-type": "application/json", "x-upsert": "true" },
    body: "{}",
    signal: AbortSignal.timeout(15_000),
  });
  const j = (await res.json().catch(() => ({}))) as { url?: string; signedURL?: string };
  const u = j.url ?? j.signedURL;
  if (!res.ok || !u) throw new Error(`Storage sign failed: HTTP ${res.status}`);
  return `${base()}/storage/v1${u}`;
}

/** Step 1 in Admin: a row and a signed URL for the raw file. */
export async function startClip(ext: string, by: string): Promise<{ id: string; uploadUrl: string }> {
  if (!clipsConfigured()) throw new Error("Supabase Storage is not configured");
  const id = randomUUID();
  const path = clipPath(id, ext);
  const uploadUrl = await signedUpload(path);
  await pool.query(`insert into public.phone_clips (id, source_path, hook, consent, created_by) values ($1, $2, '', true, $3)`, [id, path, by.slice(0, 200)]);
  return { id, uploadUrl };
}

/** Step 2 in Admin, after the upload finished: the hook, captions and consent. Then it's ready to post. */
export async function finishClip(id: string, raw: unknown): Promise<{ ok: true } | { ok: false; errors: string[] }> {
  const c = checkClipInput(raw);
  if (!c.ok) return c;
  const { rowCount } = await pool.query(`update public.phone_clips set hook = $2, captions = $3, medical = $4, consent = true, status = 'ready' where id = $1 and status = 'uploading'`, [
    id,
    c.value.hook,
    JSON.stringify(c.value.captions),
    c.value.medical,
  ]);
  return rowCount ? { ok: true } : { ok: false, errors: ["This clip was already saved"] };
}

export async function cancelClip(id: string): Promise<void> {
  await pool.query(`update public.phone_clips set status = 'cancelled' where id = $1 and status in ('uploading', 'ready', 'failed')`, [id]);
}

export type ClipRow = { id: string; status: string; hook: string; captions: string[]; youtubeUrl: string | null; reelStatus: string | null; reelPermalink: string | null; error: string | null; createdAt: string };

export async function listClips(limit = 10): Promise<ClipRow[]> {
  const { rows } = await pool.query<{ id: string; status: string; hook: string; captions: string[]; youtube_url: string | null; reel_status: string | null; reel_permalink: string | null; error: string | null; created_at: Date }>(
    `select id, status, hook, captions, youtube_url, reel_status, reel_permalink, error, created_at from public.phone_clips where status <> 'uploading' or created_at > now() - interval '1 day' order by created_at desc limit $1`,
    [limit],
  );
  return rows.map((r) => ({ id: r.id, status: r.status, hook: r.hook, captions: r.captions, youtubeUrl: r.youtube_url, reelStatus: r.reel_status, reelPermalink: r.reel_permalink, error: r.error, createdAt: new Date(r.created_at).toISOString() }));
}

// ---------- the runner ----------

export type RunnerClipJob = { id: string; rawUrl: string; finalUpload: string; input: ClipInput; index: number; token: string; meta: VideoMeta };

/** The oldest ready clip (or one stuck rendering for 30 minutes), claimed for the runner. */
export async function claimClip(token: string, phone: string, privacy: VideoMeta["privacy"]): Promise<RunnerClipJob | null> {
  const { rows } = await pool.query<{ id: string; seq: string; source_path: string; hook: string; captions: string[]; medical: boolean }>(
    `update public.phone_clips set status = 'pending', claimed_at = now(), error = null
      where id = (select id from public.phone_clips
                   where status = 'ready' or (status = 'pending' and claimed_at < now() - interval '30 minutes')
                   order by created_at limit 1 for update skip locked)
      returning id, seq, source_path, hook, captions, medical`,
  );
  const r = rows[0];
  if (!r) return null;
  const input: ClipInput = { hook: r.hook, captions: r.captions, consent: true, medical: r.medical };
  const finalUpload = await signedUpload(finalPath(r.id));
  return {
    id: r.id,
    rawUrl: publicUrl(r.source_path),
    finalUpload,
    input,
    index: CLIP_INDEX_BASE + Number(r.seq),
    token,
    meta: { title: clipTitle(r.hook), description: clipDescription(input, SITE_URL, phone, r.id), tags: CLIP_TAGS, privacy },
  };
}

/** The runner's report. A failed clip can be posted again from Admin (it goes back to ready). */
export async function recordClip(id: string, result: UploadResult, uploadedFinal: boolean): Promise<boolean> {
  const { rowCount } = await pool.query(
    `update public.phone_clips set status = $2, youtube_id = $3, youtube_url = $4, error = $5, final_path = $6 where id = $1 and status = 'pending'`,
    [id, result.ok ? "published" : "failed", result.ok ? result.id : null, result.ok ? result.url : null, result.ok ? null : result.error.slice(0, 300), result.ok && uploadedFinal ? finalPath(id) : null],
  );
  return (rowCount ?? 0) > 0;
}

export async function retryClip(id: string): Promise<void> {
  await pool.query(`update public.phone_clips set status = 'ready', error = null where id = $1 and status = 'failed'`, [id]);
}

// ---------- Instagram / Facebook ----------

/**
 * Daily: the oldest posted clip not yet on Instagram goes up as a Reel (and to Facebook). Waits
 * quietly while the Meta tokens are missing or broken, so clips catch up once they are fixed.
 */
export async function shareClipsAsReels(phone: string): Promise<string> {
  if (!instagramConfigured() && !facebookConfigured()) return "instagram/facebook not connected";
  const { rows } = await pool.query<{ id: string; hook: string; captions: string[]; medical: boolean; final_path: string; reel_status: string | null }>(
    `select id, hook, captions, medical, final_path, reel_status from public.phone_clips
      where status = 'published' and final_path is not null and (reel_status is null or reel_status like 'retry%') order by created_at limit 1`,
  );
  const r = rows[0];
  if (!r) return "nothing to share";
  const caption = clipReelCaption({ hook: r.hook, captions: r.captions, consent: true, medical: r.medical }, phone);
  const url = publicUrl(r.final_path);
  const ig = instagramConfigured() ? await publishInstagramReel(url, caption) : null;
  const fb = facebookConfigured() ? await publishFacebookReel(url, caption) : null;
  const ok = (ig?.ok ?? false) || (fb?.ok ?? false);
  const errors = [ig && !ig.ok ? `IG: ${ig.error}` : "", fb && !fb.ok ? `FB: ${fb.error}` : ""].filter(Boolean).join("; ");
  // An expired or rejected token isn't the clip's fault: it waits, untouched, until the token is fixed.
  if (!ok && /token|oauth|session|permission|expired/i.test(errors)) return `waiting for a working Meta token: ${errors.slice(0, 160)}`;
  // Otherwise one retry the next day, then it stays failed (shown in Admin) instead of trying forever.
  const status = ok ? "posted" : r.reel_status?.startsWith("retry") ? "failed" : "retry";
  await pool.query(`update public.phone_clips set reel_status = $2, reel_permalink = $3 where id = $1`, [
    r.id,
    ok ? "posted" : `${status}: ${errors}`.slice(0, 300),
    ig?.ok ? ig.permalink ?? null : fb?.ok ? fb.permalink ?? null : null,
  ]);
  return ok ? `reel posted for ${r.id.slice(0, 8)}` : `reel ${status}: ${errors}`;
}
