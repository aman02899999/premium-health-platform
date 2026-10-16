import "server-only";

// Rendered Reels go to the public Supabase Storage bucket "social-media": Instagram and Facebook
// download the video from its public URL when they publish it. Nothing private is ever stored here.

const BUCKET = "social-media";
const base = () => (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "").replace(/\/$/, "");
const key = () => process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY || "";
export const mediaStorageConfigured = () => Boolean(base() && key());

/** Uploads (or replaces) a file and returns its public URL. */
export async function putPublicMedia(path: string, data: Buffer, contentType: string): Promise<string> {
  if (!/^[a-z0-9][a-z0-9/_.-]{2,120}$/i.test(path) || path.includes("..")) throw new Error("Invalid media path");
  if (!mediaStorageConfigured()) throw new Error("Supabase Storage is not configured");
  const res = await fetch(`${base()}/storage/v1/object/${BUCKET}/${path}`, {
    method: "POST",
    headers: { authorization: `Bearer ${key()}`, apikey: key(), "content-type": contentType, "x-upsert": "true", "cache-control": "max-age=300" },
    body: new Uint8Array(data),
    signal: AbortSignal.timeout(60_000),
  });
  if (!res.ok) throw new Error(`Media upload failed: HTTP ${res.status} ${(await res.text().catch(() => "")).slice(0, 160)}`);
  return `${base()}/storage/v1/object/public/${BUCKET}/${path}`;
}

/** Deletes a file; a missing one is not an error. */
export async function removePublicMedia(path: string): Promise<void> {
  if (!mediaStorageConfigured()) return;
  await fetch(`${base()}/storage/v1/object/${BUCKET}/${path}`, {
    method: "DELETE",
    headers: { authorization: `Bearer ${key()}`, apikey: key() },
    signal: AbortSignal.timeout(10_000),
  });
}
