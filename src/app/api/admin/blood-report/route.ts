import { NextResponse } from "next/server";
import { adminIdentity, isAdmin } from "@/lib/auth";
import { isDbConfigured } from "@/health/db";
import { MARKERS, PANELS } from "@/lib/lab/markers";
import { parseOverride } from "@/lib/lab/overrides";
import { accessList, eligiblePeople, grantAccess, liveMarkers, markerOverrides, recentLog, resetOverride, revokeAccess, saveOverride, savingEnabled, usage } from "@/lib/lab/store";

// Admin control of the blood report analyser: who has access, the marker library, usage and the
// audit log. Members' saved reports are a separate, owner-only route (./reports).
export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isDbConfigured) return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  try {
    const [access, eligible, stats, log, overrides, markers] = await Promise.all([accessList(), eligiblePeople(), usage(30), recentLog(200), markerOverrides(), liveMarkers()]);
    return NextResponse.json({
      saving: savingEnabled(),
      access,
      eligible,
      stats,
      log,
      panels: PANELS,
      markers: markers.map((m) => ({ ...m, edited: Boolean(overrides[m.id] && Object.keys(overrides[m.id]).length) })),
    });
  } catch (err) {
    console.error("[admin blood-report]", (err as Error).message);
    return NextResponse.json({ error: "Couldn't load the analyser. Is the latest database migration applied?" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isDbConfigured) return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  const b = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const me = await adminIdentity();
  try {
    switch (b?.action) {
      case "grant": {
        const emails = Array.isArray(b.emails) ? b.emails.filter((e): e is string => typeof e === "string").slice(0, 1000) : [];
        const expiresOn = typeof b.expiresOn === "string" && /^\d{4}-\d{2}-\d{2}$/.test(b.expiresOn) ? b.expiresOn : null;
        const n = await grantAccess(emails, me, typeof b.note === "string" ? b.note : "", expiresOn);
        return n ? NextResponse.json({ ok: true, granted: n }) : NextResponse.json({ error: "Enter at least one valid email." }, { status: 400 });
      }
      case "revoke": {
        const ok = typeof b.email === "string" && (await revokeAccess(b.email, me));
        return ok ? NextResponse.json({ ok: true }) : NextResponse.json({ error: "Not found" }, { status: 404 });
      }
      case "marker": {
        const markers = await liveMarkers();
        const base = markers.find((m) => m.id === b.id);
        if (!base || typeof b.data !== "object" || !b.data) return NextResponse.json({ error: "Unknown test" }, { status: 404 });
        const parsed = parseOverride(base, markers, b.data as Record<string, unknown>);
        if (typeof parsed === "string") return NextResponse.json({ error: parsed }, { status: 400 });
        await saveOverride(base.id, parsed, me);
        return NextResponse.json({ ok: true });
      }
      case "reset": {
        if (!MARKERS.some((m) => m.id === b.id)) return NextResponse.json({ error: "Unknown test" }, { status: 404 });
        await resetOverride(String(b.id), me);
        return NextResponse.json({ ok: true });
      }
      default:
        return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }
  } catch (err) {
    console.error("[admin blood-report] save failed:", (err as Error).message);
    return NextResponse.json({ error: "Couldn't save. Please try again." }, { status: 500 });
  }
}
