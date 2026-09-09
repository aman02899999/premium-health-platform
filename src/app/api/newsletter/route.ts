import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db, isDbConfigured } from "@/db";
import { newsletterSubscribers } from "@/db/schema";

export const dynamic = "force-dynamic";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/**
 * Indian Health Weekly — newsletter sign-up.
 * Idempotent: re-subscribing the same address is a no-op success.
 */
export async function POST(request: Request) {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
  }
  const v = json as Record<string, unknown>;
  const email = typeof v.email === "string" ? v.email.trim().toLowerCase().slice(0, 255) : "";
  if (!email || !EMAIL_RE.test(email)) {
    return NextResponse.json(
      { ok: false, error: "Please enter a valid email address" },
      { status: 400 },
    );
  }
  if (!isDbConfigured) {
    return NextResponse.json(
      { ok: false, error: "Subscriptions are temporarily unavailable — please try again later" },
      { status: 503 },
    );
  }
  const consent = v.consent !== false;
  try {
    const existing = await db
      .select({ id: newsletterSubscribers.id })
      .from(newsletterSubscribers)
      .where(eq(newsletterSubscribers.email, email))
      .limit(1);
    if (existing.length) {
      return NextResponse.json({ ok: true, status: "already-subscribed" });
    }
    await db.insert(newsletterSubscribers).values({ email, consent });
    return NextResponse.json({ ok: true, status: "subscribed" }, { status: 201 });
  } catch (error) {
    console.error("newsletter subscribe failed:", error);
    return NextResponse.json(
      { ok: false, error: "Could not save your subscription. Please try again." },
      { status: 500 },
    );
  }
}
