import { NextRequest, NextResponse } from "next/server";
import { isManager } from "@/lib/auth";
import { isDbConfigured, pool } from "@/health/db";
import { saveLead } from "@/lib/content/store";
import { parseHealthLead } from "@/health/lib/monetization/lead-intake";

export const dynamic = "force-dynamic";

// The consultation, partner, advertise and providers forms on /health. Each enquiry is saved to
// public.leads (Admin → Leads) with a health-* source. Until 25 Oct 2026 they were kept only in
// the server's memory and lost.

const RATE_LIMIT: Record<string, { count: number; resetAt: number }> = {};

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  // Forget expired entries now and then, so the table of IPs can't grow without limit.
  if (Object.keys(RATE_LIMIT).length > 5000) for (const k of Object.keys(RATE_LIMIT)) if (RATE_LIMIT[k].resetAt < now) delete RATE_LIMIT[k];
  const entry = RATE_LIMIT[ip];
  if (!entry || now > entry.resetAt) {
    RATE_LIMIT[ip] = { count: 1, resetAt: now + 60 * 1000 }; // 1 min window
    return false;
  }
  if (entry.count >= 5) return true; // 5 per minute
  entry.count++;
  return false;
}

/** The latest /health enquiries, for the health admin's monetization view. */
export async function GET(req: NextRequest) {
  if (!(await isManager())) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const limit = Math.min(Math.max(parseInt(searchParams.get("limit") || "20", 10) || 20, 1), 100);
  if (!isDbConfigured) return NextResponse.json({ ok: true, count: 0, leads: [] });
  const { rows } = await pool.query(
    `select id, created_at as "createdAt", name, phone, email, goal, message, source, status from public.leads
      where source like 'health-%' order by created_at desc limit $1`,
    [limit],
  );
  return NextResponse.json({ ok: true, count: rows.length, leads: rows });
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (isRateLimited(ip)) {
    return NextResponse.json({ ok: false, error: "Too many requests. Please try again in a minute." }, { status: 429 });
  }
  const lead = parseHealthLead(await req.json().catch(() => null));
  if (typeof lead === "string") return NextResponse.json({ ok: false, error: lead }, { status: 400 });
  try {
    // follow_ups stays off: the automatic WhatsApp messages are about gym trials. The desk calls back.
    if (isDbConfigured) {
      const { rows } = await pool.query<{ id: string }>(
        `insert into public.leads (name, phone, email, goal, interest, message, source, follow_ups) values ($1, $2, $3, $4, $5, $6, $7, false) returning id`,
        [lead.name, lead.phone, lead.email, lead.goal, lead.interest, lead.message, lead.source],
      );
      return NextResponse.json({ ok: true, id: rows[0].id }, { status: 201 });
    }
    await saveLead({ name: lead.name, phone: lead.phone, goal: lead.goal, message: [lead.email ? `Email: ${lead.email}` : "", lead.message].filter(Boolean).join(" · ").slice(0, 600), source: lead.source });
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (e) {
    console.error("[health leads] save failed:", (e as Error).message);
    return NextResponse.json({ ok: false, error: "Couldn't save your request right now. Please try again or WhatsApp us." }, { status: 500 });
  }
}
