import { NextRequest, NextResponse } from "next/server";
import { rateLimitFromRequest } from "@/health/services/health/cache/rate-limit";
import { isDbConfigured, pool } from "@/health/db";
import { saveLead } from "@/lib/content/store";

export const dynamic = "force-dynamic";

/** Lead capture is spam-prone: max 5 submissions per minute per IP. */
const LEAD_RATE_LIMIT_PER_MINUTE = 5;
const RATE_LIMIT_WINDOW_SECONDS = 60;

/** Health service enquiries (lab test, dietitian, doctor consult) from /health/lead. */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_RE = /^[6-9]\d{9}$/;

export async function POST(req: NextRequest) {
  // AUDIT FIX (defect #4): the 5/min-per-IP requirement was never enforced, so the
  // lead endpoint could be scripted at will. Reject with 429 + Retry-After.
  const rl = rateLimitFromRequest(req, LEAD_RATE_LIMIT_PER_MINUTE);
  if (!rl.allowed) {
    return NextResponse.json(
      { ok: false, error: "Too many requests — maximum 5 lead submissions per minute." },
      { status: 429, headers: { "Retry-After": String(RATE_LIMIT_WINDOW_SECONDS) } }
    );
  }

  try {
    const body = await req.json();
    const { name, email, phone, type, message } = body as {
      name?: string;
      email?: string;
      phone?: string;
      type?: string;
      message?: string;
    };

    const TYPES = { lab: "Lab test", dietitian: "Dietitian consult", consult: "Doctor consult" } as const;
    const digits = (phone || "").replace(/\D/g, "").slice(-10);
    if (!name || name.trim().length < 2) {
      return NextResponse.json({ ok: false, error: "Please enter your name." }, { status: 400 });
    }
    if (!PHONE_RE.test(digits)) {
      return NextResponse.json({ ok: false, error: "Please enter a valid 10-digit mobile number so we can call you back." }, { status: 400 });
    }
    if (email && !EMAIL_RE.test(email)) {
      return NextResponse.json({ ok: false, error: "Please enter a valid email, or leave it blank." }, { status: 400 });
    }
    if (!type || !(type in TYPES)) {
      return NextResponse.json({ ok: false, error: "Choose what you need: lab test, dietitian or doctor consult." }, { status: 400 });
    }

    // Saved to the same leads list as the gym's enquiries (Admin → Growth → Leads), marked with a
    // health-* source. follow_ups stays off: the automatic WhatsApp messages are about gym trials.
    const lead = {
      name: name.trim().slice(0, 80),
      phone: digits,
      goal: TYPES[type as keyof typeof TYPES],
      message: [email ? `Email: ${email.trim().toLowerCase()}` : "", (message || "").trim()].filter(Boolean).join(" · ").slice(0, 600),
      source: `health-${type}`,
    };
    if (isDbConfigured) {
      await pool.query(`insert into public.leads (name, phone, goal, message, source, follow_ups) values ($1, $2, $3, $4, $5, false)`, [lead.name, lead.phone, lead.goal, lead.message, lead.source]);
    } else {
      await saveLead(lead);
    }
    return NextResponse.json({ ok: true, message: `Thanks ${lead.name.split(" ")[0]} — we've received your request and will call you on ${digits}.` }, { status: 201 });
  } catch (e: any) {
    console.error("[health lead] save failed:", e?.message);
    return NextResponse.json({ ok: false, error: "Couldn't save your request right now. Please try again or WhatsApp us." }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ endpoint: "/health/api/lead", method: "POST", body: { name: "string", phone: "10-digit mobile", email: "optional", type: "lab|dietitian|consult", message: "optional" } });
}
