import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { isDbConfigured } from "@/health/db";
import { DIET_CHART } from "@/lib/growth/config";
import { parseDietOrder } from "@/lib/growth/diet-intake";
import { insertDietOrder } from "@/lib/growth/diet-orders";
import { createRazorpayOrder, razorpayConfigured, razorpayKeyId } from "@/lib/payments/razorpay";

export const dynamic = "force-dynamic";

const recent = new Map<string, number[]>();
function rateLimited(ip: string) {
  const now = Date.now();
  const hits = (recent.get(ip) ?? []).filter((t) => now - t < 10 * 60 * 1000);
  hits.push(now);
  recent.set(ip, hits);
  return hits.length > 8;
}

// Step 1: validate the intake, price it on the server, open a Razorpay order.
export async function POST(req: Request) {
  if (!razorpayConfigured() || !isDbConfigured) return NextResponse.json({ error: "Online payment isn't available yet — please WhatsApp us." }, { status: 503 });
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body || typeof body !== "object") return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (rateLimited(ip)) return NextResponse.json({ error: "Too many attempts — please WhatsApp us instead." }, { status: 429 });

  const parsed = parseDietOrder(body);
  if (typeof parsed === "string") return NextResponse.json({ error: parsed }, { status: 400 });
  const amountPaise = DIET_CHART.priceRupees * 100;
  try {
    const order = await createRazorpayOrder({ amountPaise, receipt: `rfc_diet_${randomUUID().slice(0, 13)}`, notes: { item: "Personal diet chart", name: parsed.buyer.name, phone: parsed.buyer.phone } });
    await insertDietOrder(order.id, amountPaise, parsed.buyer, parsed.intake);
    return NextResponse.json({
      orderId: order.id,
      keyId: razorpayKeyId(),
      amount: amountPaise,
      currency: "INR",
      description: "Personal Indian diet chart",
      prefill: { name: parsed.buyer.name, contact: `+91${parsed.buyer.phone}`, email: parsed.buyer.email ?? undefined },
    });
  } catch (err) {
    console.error("[diet-chart] order failed:", (err as Error).message);
    return NextResponse.json({ error: "Couldn't start the payment right now. Please try again or WhatsApp us." }, { status: 502 });
  }
}
