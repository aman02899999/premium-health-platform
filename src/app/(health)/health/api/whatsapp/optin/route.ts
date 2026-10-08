import { NextRequest, NextResponse } from "next/server";
import { isDbConfigured } from "@/health/db";
import { isAdmin } from "@/health/lib/auth/server";
import { contactStats, saveContact } from "@/health/lib/signups";

export const dynamic = "force-dynamic";

/** Indian mobile → "91XXXXXXXXXX"; other countries keep their code. null if not a phone number. */
function normalisePhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  if (/^[6-9]\d{9}$/.test(digits)) return `91${digits}`;
  if (/^0[6-9]\d{9}$/.test(digits)) return `91${digits.slice(1)}`;
  if (/^91[6-9]\d{9}$/.test(digits)) return digits;
  return raw.trim().startsWith("+") && /^\d{10,15}$/.test(digits) ? digits : null;
}

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ ok: false, error: "Invalid request" }, { status: 400 });
  const phone = normalisePhone(typeof body.phone === "string" ? body.phone : "");
  if (!phone) return NextResponse.json({ ok: false, error: "Please enter a valid mobile number, e.g. 98765 43210." }, { status: 400 });
  if (body.consent !== true) return NextResponse.json({ ok: false, error: "Please agree to receive WhatsApp messages." }, { status: 400 });
  if (!isDbConfigured) return NextResponse.json({ ok: false, error: "Sign-ups are temporarily unavailable. Please try again later." }, { status: 503 });
  try {
    const result = await saveContact("whatsapp", phone, { source: "whatsapp-optin", utm_source: body.utm_source });
    return NextResponse.json({ ok: true, status: result === "exists" ? "already-subscribed" : "subscribed" });
  } catch (err) {
    console.error("[whatsapp optin] save failed:", (err as Error).message);
    return NextResponse.json({ ok: false, error: "Couldn't save your number. Please try again." }, { status: 500 });
  }
}

export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  if (!isDbConfigured) return NextResponse.json({ ok: false, error: "Database not configured" }, { status: 503 });
  const s = await contactStats();
  return NextResponse.json({ ok: true, total: s.whatsapp });
}
