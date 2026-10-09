import "server-only";
import { promises as fs } from "fs";
import path from "path";

// Plan PDFs live in the private Supabase Storage bucket "diet-plans" and are only ever shared
// through short-lived signed links. Without Supabase keys (local development) they are kept
// in .data/diet-plans so the whole flow still works end to end.

const BUCKET = "diet-plans";
const base = () => (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "").replace(/\/$/, "");
const key = () => process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY || "";
export const storageConfigured = () => Boolean(base() && key());
const LOCAL_DIR = path.join(process.cwd(), ".data", BUCKET);
const safe = (p: string) => {
  if (!/^[a-z0-9][a-z0-9/_.-]{2,180}$/i.test(p) || p.includes("..")) throw new Error("Invalid storage path");
  return p;
};
const auth = () => ({ authorization: `Bearer ${key()}`, apikey: key() });

export async function putFile(p: string, data: Buffer, contentType = "application/pdf"): Promise<void> {
  safe(p);
  if (!storageConfigured()) {
    await fs.mkdir(path.dirname(path.join(LOCAL_DIR, p)), { recursive: true });
    await fs.writeFile(path.join(LOCAL_DIR, p), data);
    return;
  }
  const res = await fetch(`${base()}/storage/v1/object/${BUCKET}/${p}`, {
    method: "POST",
    headers: { ...auth(), "content-type": contentType, "x-upsert": "true" },
    body: new Uint8Array(data),
    signal: AbortSignal.timeout(20_000),
  });
  if (!res.ok) throw new Error(`Storage upload failed: HTTP ${res.status} ${(await res.text().catch(() => "")).slice(0, 200)}`);
}

export async function getFile(p: string): Promise<Buffer> {
  safe(p);
  if (!storageConfigured()) return fs.readFile(path.join(LOCAL_DIR, p));
  const res = await fetch(`${base()}/storage/v1/object/authenticated/${BUCKET}/${p}`, { headers: auth(), signal: AbortSignal.timeout(20_000) });
  if (!res.ok) throw new Error(`Storage download failed: HTTP ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

/** A link that works for `seconds` (WhatsApp fetches the document from it). Null without Storage. */
export async function signedUrl(p: string, seconds = 7 * 86_400): Promise<string | null> {
  safe(p);
  if (!storageConfigured()) return null;
  const res = await fetch(`${base()}/storage/v1/object/sign/${BUCKET}/${p}`, {
    method: "POST",
    headers: { ...auth(), "content-type": "application/json" },
    body: JSON.stringify({ expiresIn: seconds }),
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) return null;
  const json = (await res.json().catch(() => ({}))) as { signedURL?: string; signedUrl?: string };
  const rel = json.signedURL || json.signedUrl;
  return rel ? `${base()}/storage/v1${rel.startsWith("/") ? "" : "/"}${rel}` : null;
}
