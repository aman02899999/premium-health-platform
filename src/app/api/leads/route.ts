import { NextResponse, after } from "next/server";
import { saveLead } from "@/lib/content/store";
import { isDbConfigured } from "@/health/db";
import { afterLeadSaved } from "@/lib/growth/hooks";
import { insertLead } from "@/lib/growth/leads";
import { recordEmailConsent } from "@/lib/growth/marketing";

const INTERESTS = ["diet", "pt", "membership", "other"] as const;

const recent = new Map<string, number[]>();

function rateLimited(ip: string) {
  const now = Date.now();
  const hits = (recent.get(ip) ?? []).filter((t) => now - t < 10 * 60 * 1000);
  hits.push(now);
  recent.set(ip, hits);
  return hits.length > 5;
}

const clean = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  // Honeypot: pretend success so bots don't retry.
  if (clean(body.company, 100)) return NextResponse.json({ ok: true });

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (rateLimited(ip)) return NextResponse.json({ error: "Too many requests — please WhatsApp us instead." }, { status: 429 });

  const name = clean(body.name, 80);
  // Keep only characters the database accepts for phone numbers.
  const phone = clean(body.phone, 20).replace(/[^0-9+ -]/g, "");
  if (name.length < 2) return NextResponse.json({ error: "Please enter your name." }, { status: 400 });
  if (phone.replace(/\D/g, "").length < 10) return NextResponse.json({ error: "Please enter a valid 10-digit mobile number." }, { status: 400 });

  const email = clean(body.email, 120).toLowerCase();
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return NextResponse.json({ error: "Please enter a valid email address, or leave it blank." }, { status: 400 });
  const interest = INTERESTS.find((i) => i === body.interest) ?? "";
  // Marketing emails only with an explicit tick, and only if there is an address to send to.
  const marketing = body.marketing === true && !!email;
  const source = clean(body.source, 40) || "website";

  try {
    if (isDbConfigured) {
      const id = await insertLead({ name, phone, email: email || null, interest, goal: clean(body.goal, 60), message: clean(body.message, 600), source, marketing });
      if (marketing) await recordEmailConsent(email, name, source).catch((e: Error) => console.error("[leads] consent:", e.message));
      // After the response: WhatsApp thank-you and/or the first email (or queue them for the admin).
      after(() => afterLeadSaved(phone, id));
    } else {
      await saveLead({ name, phone, goal: clean(body.goal, 60), message: clean(body.message, 600), source });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[leads] save failed:", (err as Error).message);
    return NextResponse.json({ error: "Could not save your request right now." }, { status: 500 });
  }
}
