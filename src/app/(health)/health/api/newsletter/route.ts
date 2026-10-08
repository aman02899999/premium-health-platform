import { NextRequest, NextResponse } from "next/server";
import { isDbConfigured } from "@/health/db";
import { isAdmin } from "@/health/lib/auth/server";
import { contactStats, saveContact } from "@/health/lib/signups";

export const dynamic = "force-dynamic";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ ok: false, error: "Invalid request" }, { status: 400 });
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!EMAIL_RE.test(email) || email.length > 120) return NextResponse.json({ ok: false, error: "Please enter a valid email address." }, { status: 400 });
  if (!isDbConfigured) return NextResponse.json({ ok: false, error: "Sign-ups are temporarily unavailable. Please try again later." }, { status: 503 });
  try {
    const result = await saveContact("email", email, { name: body.name, source: body.leadMagnet ?? "newsletter", utm_source: body.utm_source, utm_medium: body.utm_medium, utm_campaign: body.utm_campaign });
    return NextResponse.json({ ok: true, status: result === "exists" ? "already-subscribed" : "subscribed", message: result === "exists" ? "You're already on the list." : "You're subscribed." });
  } catch (err) {
    console.error("[newsletter] save failed:", (err as Error).message);
    return NextResponse.json({ ok: false, error: "Couldn't save your sign-up. Please try again." }, { status: 500 });
  }
}

/** Admin only: subscriber counts and the latest sign-ups. */
export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  if (!isDbConfigured) return NextResponse.json({ ok: false, error: "Database not configured" }, { status: 503 });
  return NextResponse.json({ ok: true, ...(await contactStats()) });
}
