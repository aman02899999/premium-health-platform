import { NextResponse } from "next/server";
import { adminIdentity, adminRole } from "@/lib/auth";
import { isDbConfigured } from "@/health/db";
import { analyse } from "@/lib/lab/analyse";
import { adminViewReports, liveMarkers } from "@/lib/lab/store";

// Owner only (see team-core): open one member's saved reports, for example when they ask the
// coach to go through them. A reason is required and the look is logged before anything is read.
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const role = await adminRole();
  if (!role) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  // Health data: owners only, checked here as well as in the proxy.
  if (role !== "owner") return NextResponse.json({ error: "Only an owner can open members' reports." }, { status: 403 });
  if (!isDbConfigured) return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  const b = (await req.json().catch(() => null)) as { email?: unknown; reason?: unknown } | null;
  const email = typeof b?.email === "string" ? b.email.trim().toLowerCase() : "";
  const reason = typeof b?.reason === "string" ? b.reason.replace(/\s+/g, " ").trim().slice(0, 300) : "";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return NextResponse.json({ error: "Enter the member's email." }, { status: 400 });
  if (reason.length < 10) return NextResponse.json({ error: "Write why you need to see this member's reports (for example: 'Member asked for a review call on WhatsApp')." }, { status: 400 });
  try {
    const [markers, reports] = await Promise.all([liveMarkers(), adminViewReports(email, await adminIdentity(), reason)]);
    return NextResponse.json(
      { reports: reports.map((r) => ({ id: r.id, createdAt: r.createdAt, person: r.person, analysis: analyse(markers, r.results, r.person) })) },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (err) {
    console.error("[admin blood-report reports]", (err as Error).message);
    return NextResponse.json({ error: "Couldn't load the reports." }, { status: 500 });
  }
}
