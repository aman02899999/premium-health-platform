import { NextResponse, after } from "next/server";
import { saveLead } from "@/lib/content/store";
import { isDbConfigured } from "@/health/db";
import { afterLeadSaved } from "@/lib/growth/hooks";

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

  try {
    await saveLead({ name, phone, goal: clean(body.goal, 60), message: clean(body.message, 600), source: clean(body.source, 40) || "website" });
    // After the response: thank them on WhatsApp (or queue it for the admin to send).
    if (isDbConfigured) after(() => afterLeadSaved(phone));
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[leads] save failed:", (err as Error).message);
    return NextResponse.json({ error: "Could not save your request right now." }, { status: 500 });
  }
}
