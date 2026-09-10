import { NextRequest, NextResponse } from "next/server";

type WAOptIn = {
  id: string;
  phone: string;
  consent: boolean;
  utm_source?: string;
  timestamp: string;
};

const optins: WAOptIn[] = [];
const PHONE_RE = /^\+?[0-9]{10,15}$/;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { phone, consent, utm_source } = body;
    if (!phone || !PHONE_RE.test(String(phone).replace(/\s/g, ""))) {
      return NextResponse.json({ ok: false, error: "Valid phone required, e.g., +919999999999" }, { status: 400 });
    }
    if (!consent) {
      return NextResponse.json({ ok: false, error: "Consent required for WhatsApp" }, { status: 400 });
    }

    const opt: WAOptIn = {
      id: `wa_${Date.now()}`,
      phone: String(phone).replace(/\s/g, ""),
      consent: true,
      utm_source: utm_source?.toString().slice(0, 100),
      timestamp: new Date().toISOString(),
    };
    optins.push(opt);
    if (optins.length > 1000) optins.shift();

    return NextResponse.json({
      ok: true,
      id: opt.id,
      message: "WhatsApp opt-in saved — weekly thali PDF + fasting reminders — 40% open rate demo",
      earning: "WhatsApp 40% open, 15% click — highest engagement + premium conversion — earning platform",
      next: "/premium?utm_source=whatsapp",
    });
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }
}

export async function GET() {
  return NextResponse.json({ ok: true, total: optins.length, note: "Demo in-memory — production use WhatsApp Business API + /admin/earning" });
}
