import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Lead gen — high ticket: lab tests, dietitian, insurance
 * Digital marketing optimized: UTM, gtag, FB Pixel
 * Earning platform: lead gen revenue
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_RE = /^[6-9]\d{9}$/;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, phone, type, message, utm } = body as {
      name?: string;
      email?: string;
      phone?: string;
      type?: "lab" | "dietitian" | "insurance" | "consult";
      message?: string;
      utm?: Record<string, string>;
    };

    if (!name || name.trim().length < 2) {
      return NextResponse.json({ ok: false, error: "Name required (min 2 chars)" }, { status: 400 });
    }
    if (email && !EMAIL_RE.test(email)) {
      return NextResponse.json({ ok: false, error: "Invalid email" }, { status: 400 });
    }
    if (phone && !PHONE_RE.test(phone.replace(/\D/g, "").slice(-10))) {
      return NextResponse.json({ ok: false, error: "Invalid Indian phone (10 digits, start 6-9)" }, { status: 400 });
    }
    if (!type) {
      return NextResponse.json({ ok: false, error: "Lead type required: lab/dietitian/insurance/consult" }, { status: 400 });
    }

    // In prod: save to DB, send to CRM, trigger email, etc.
    // For demo: log + return success
    const lead = {
      id: `lead_${Date.now()}`,
      name: name.trim(),
      email: email?.trim().toLowerCase(),
      phone: phone?.trim(),
      type,
      message: message?.trim().slice(0, 1000),
      utm: utm || {},
      createdAt: new Date().toISOString(),
      status: "new",
      // Earning: lead value
      estimatedValue: type === "insurance" ? 500 : type === "lab" ? 150 : type === "dietitian" ? 300 : 200,
    };

    console.log("[Lead] New lead:", lead);

    return NextResponse.json({ ok: true, lead, message: "Lead captured — our team will contact you within 24h (demo mode)" }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "Lead capture failed" }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    endpoint: "/api/lead",
    method: "POST",
    body: { name: "string", email: "optional", phone: "optional", type: "lab|dietitian|insurance|consult", message: "optional", utm: "object" },
    earning: "Lead gen — Rs 150-500 per lead (demo)",
    seo: "High intent keywords: lab test booking, dietitian consult, health insurance",
  });
}
