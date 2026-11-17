import { NextResponse } from "next/server";
import { adminIdentity, isAdmin, isManager } from "@/lib/auth";
import { isDbConfigured } from "@/health/db";
import { isSameOrigin } from "@/lib/same-origin";
import { decideQueue, listQueue } from "@/lib/youtube/queue";

// The YouTube Short queue in Admin → Social (see src/lib/youtube/queue.ts).
// GET                                         latest items with their drafts and whether they posted
// POST { id, action: "save"|"approve", draft }  edit a draft (checked again), and approve it to post
// POST { id, action: "reject" }               never posts
// Only owners and managers decide: an approved item goes on the channel the next midday slot.
export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isDbConfigured) return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  try {
    return NextResponse.json({ items: await listQueue() }, { headers: { "cache-control": "no-store" } });
  } catch (err) {
    console.error("[youtube-queue]", (err as Error).message);
    return NextResponse.json({ error: "Couldn't load the queue. Is the latest database migration applied?" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!(await isManager())) return NextResponse.json({ error: "Only the owner or a manager can approve Shorts" }, { status: 403 });
  if (!isDbConfigured) return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  if (!isSameOrigin(req)) return NextResponse.json({ error: "Bad origin" }, { status: 403 });
  const b = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const action = b?.action;
  if (!b || typeof b.id !== "string" || !UUID.test(b.id) || (action !== "save" && action !== "approve" && action !== "reject")) return NextResponse.json({ error: "Bad request" }, { status: 400 });
  try {
    const r = await decideQueue(b.id, action, b.draft, await adminIdentity());
    return r.ok ? NextResponse.json({ ok: true }) : NextResponse.json({ ok: false, errors: r.errors }, { status: 422 });
  } catch (err) {
    console.error("[youtube-queue]", (err as Error).message);
    return NextResponse.json({ error: "Couldn't save" }, { status: 500 });
  }
}
