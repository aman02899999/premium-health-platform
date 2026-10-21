import { NextResponse } from "next/server";
import { adminIdentity, adminRole } from "@/lib/auth";
import { isDbConfigured } from "@/health/db";
import { markSeen, notificationsFor } from "@/lib/admin/notifications";

// The admin bell (everyone on the team; each role sees only what it may open).
// GET                       the last 3 days, newest first, and how many are new
// POST { action: "seen" }   everything up to now has been seen
export const dynamic = "force-dynamic";

export async function GET() {
  const role = await adminRole();
  if (!role) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isDbConfigured) return NextResponse.json({ items: [], unread: 0, seenAt: null });
  try {
    return NextResponse.json(await notificationsFor(await adminIdentity(), role));
  } catch (err) {
    console.error("[notifications]", (err as Error).message);
    return NextResponse.json({ error: "Couldn't load notifications." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  if (!(await adminRole())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isDbConfigured) return NextResponse.json({ ok: true });
  const origin = req.headers.get("origin");
  if (origin && origin !== new URL(req.url).origin) return NextResponse.json({ error: "Bad origin" }, { status: 403 });
  const b = (await req.json().catch(() => null)) as { action?: string } | null;
  if (b?.action !== "seen") return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  try {
    await markSeen(await adminIdentity());
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[notifications]", (err as Error).message);
    return NextResponse.json({ error: "Couldn't save. Is the latest database migration applied?" }, { status: 500 });
  }
}
