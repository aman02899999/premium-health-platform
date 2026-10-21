import { NextResponse } from "next/server";
import { adminIdentity, isAdmin } from "@/lib/auth";
import { isDbConfigured } from "@/health/db";
import { OUTCOMES, isOutcome } from "@/lib/growth/call-list-core";
import { callList, logCall } from "@/lib/growth/call-list";

// The call list (desk agents too): people who replied to an offer or clicked its link.
// GET                                         who to call, hottest first
// POST { contact, outcome, note?, name? }     records a call ("interested" makes them a lead)
export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isDbConfigured) return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  try {
    return NextResponse.json({ prospects: await callList(), outcomes: OUTCOMES });
  } catch (err) {
    console.error("[call-list]", (err as Error).message);
    return NextResponse.json({ error: "Couldn't load the call list. Is the latest database migration applied?" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isDbConfigured) return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  const origin = req.headers.get("origin");
  if (origin && origin !== new URL(req.url).origin) return NextResponse.json({ error: "Bad origin" }, { status: 403 });
  const b = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!b || typeof b.contact !== "string" || !isOutcome(b.outcome)) return NextResponse.json({ error: "Pick what happened on the call." }, { status: 400 });
  try {
    const r = await logCall(b.contact, b.outcome, typeof b.note === "string" ? b.note : "", await adminIdentity(), typeof b.name === "string" ? b.name : "");
    return r.ok ? NextResponse.json(r) : NextResponse.json({ error: r.error }, { status: 400 });
  } catch (err) {
    console.error("[call-list]", (err as Error).message);
    return NextResponse.json({ error: "Couldn't save the call. Is the latest database migration applied?" }, { status: 500 });
  }
}
