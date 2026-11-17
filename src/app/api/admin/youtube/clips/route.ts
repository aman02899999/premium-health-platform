import { NextResponse } from "next/server";
import { adminIdentity, isAdmin, isManager } from "@/lib/auth";
import { isDbConfigured } from "@/health/db";
import { isSameOrigin } from "@/lib/same-origin";
import { cancelClip, clipsConfigured, finishClip, listClips, retryClip, startClip } from "@/lib/youtube/clips";

// The owner's phone clips in Admin → Social (src/lib/youtube/clips.ts).
// GET                                                        latest clips and where they posted
// POST { action: "start", ext }                              a row and a one-time upload URL (the browser uploads straight to storage)
// POST { action: "finish", id, hook, captions, medical, consent }  ready to post on the next runner run
// POST { action: "cancel" | "retry", id }
// Owners and managers only: whatever is saved here goes on the gym's channels.
export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isDbConfigured) return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  try {
    return NextResponse.json({ clips: await listClips(), configured: clipsConfigured() }, { headers: { "cache-control": "no-store" } });
  } catch (err) {
    console.error("[clips]", (err as Error).message);
    return NextResponse.json({ error: "Couldn't load clips. Is the latest database migration applied?" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!(await isManager())) return NextResponse.json({ error: "Only the owner or a manager can post clips" }, { status: 403 });
  if (!isDbConfigured) return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  if (!isSameOrigin(req)) return NextResponse.json({ error: "Bad origin" }, { status: 403 });
  const b = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!b) return NextResponse.json({ error: "Bad request" }, { status: 400 });
  try {
    if (b.action === "start") {
      const ext = typeof b.ext === "string" ? b.ext.slice(0, 5) : "mp4";
      return NextResponse.json({ ok: true, ...(await startClip(ext, await adminIdentity())) });
    }
    if (typeof b.id !== "string" || !UUID.test(b.id)) return NextResponse.json({ error: "Bad id" }, { status: 400 });
    if (b.action === "finish") {
      const r = await finishClip(b.id, b);
      return r.ok ? NextResponse.json({ ok: true }) : NextResponse.json({ ok: false, errors: r.errors }, { status: 422 });
    }
    if (b.action === "cancel") await cancelClip(b.id);
    else if (b.action === "retry") await retryClip(b.id);
    else return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[clips]", (err as Error).message);
    return NextResponse.json({ error: (err as Error).message.startsWith("Supabase") ? (err as Error).message : "Couldn't save" }, { status: 500 });
  }
}
