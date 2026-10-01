import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// In-memory store for demo — in production use DB with migrations, privacy controls, rate limiting
const LEADS: any[] = [];
const RATE_LIMIT: Record<string, { count: number; resetAt: number }> = {};

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = RATE_LIMIT[ip];
  if (!entry || now > entry.resetAt) {
    RATE_LIMIT[ip] = { count: 1, resetAt: now + 60 * 1000 }; // 1 min window
    return false;
  }
  if (entry.count >= 5) return true; // 5 per minute
  entry.count++;
  return false;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const limit = Math.min(parseInt(searchParams.get("limit") || "20", 10), 100);
  // Admin-only in production — check auth
  return NextResponse.json({ ok: true, count: LEADS.length, leads: LEADS.slice(-limit).reverse() });
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
  if (isRateLimited(ip)) {
    return NextResponse.json({ ok: false, error: "Rate limited — please try again in a minute" }, { status: 429 });
  }

  try {
    const body = await req.json();
    const { name, email, phone, service, message, consent, formId, page, utm } = body;

    // Input validation
    if (!name || typeof name !== "string" || name.length < 2 || name.length > 100) {
      return NextResponse.json({ ok: false, error: "Invalid name" }, { status: 400 });
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ ok: false, error: "Invalid email" }, { status: 400 });
    }
    if (!consent) {
      return NextResponse.json({ ok: false, error: "Consent required" }, { status: 400 });
    }
    if (message && (typeof message !== "string" || message.length > 1000)) {
      return NextResponse.json({ ok: false, error: "Message too long" }, { status: 400 });
    }

    // Do not request unnecessary sensitive medical info — only collect necessary fields
    const lead = {
      id: `lead_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone?.trim() || "",
      service: service || "general",
      message: message?.trim()?.slice(0, 1000) || "",
      consent: !!consent,
      formId: formId || "unknown",
      page: page || "/",
      utm: utm || {},
      ip: ip === "unknown" ? undefined : ip.slice(0, 20), // minimal, for spam protection only
      timestamp: new Date().toISOString(),
    };

    LEADS.push(lead);

    // In production: send email, store in DB, trigger CRM, etc.

    return NextResponse.json({ ok: true, id: lead.id, message: "Lead submitted successfully" });
  } catch (e) {
    return NextResponse.json({ ok: false, error: "Invalid request body" }, { status: 400 });
  }
}
