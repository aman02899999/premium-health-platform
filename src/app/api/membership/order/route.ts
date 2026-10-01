import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { getContent } from "@/lib/content/store";
import { parseCheckoutForm, quoteMembership } from "@/lib/payments/membership";
import { createRazorpayOrder, razorpayConfigured, razorpayKeyId } from "@/lib/payments/razorpay";
import { insertOrder } from "@/lib/payments/orders";

export const dynamic = "force-dynamic";

const recent = new Map<string, number[]>();
function rateLimited(ip: string) {
  const now = Date.now();
  const hits = (recent.get(ip) ?? []).filter((t) => now - t < 10 * 60 * 1000);
  hits.push(now);
  recent.set(ip, hits);
  return hits.length > 8;
}

// Step 1 of online joining: price the plan on the server and open a Razorpay order.
export async function POST(req: Request) {
  if (!razorpayConfigured()) return NextResponse.json({ error: "Online payment isn't available yet — please call or WhatsApp us." }, { status: 503 });
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body || typeof body !== "object") return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (rateLimited(ip)) return NextResponse.json({ error: "Too many attempts — please WhatsApp us instead." }, { status: 429 });

  const couple = body.couple === true;
  const quote = quoteMembership((await getContent()).plans, typeof body.planId === "string" ? body.planId : "", couple);
  if (!quote) return NextResponse.json({ error: "That plan isn't available online. Please pick another plan." }, { status: 400 });
  const form = parseCheckoutForm(body, couple);
  if (typeof form === "string") return NextResponse.json({ error: form }, { status: 400 });

  try {
    const order = await createRazorpayOrder({
      amountPaise: quote.amountPaise,
      receipt: `rfc_${randomUUID().slice(0, 18)}`,
      notes: { plan: `${quote.planName}${couple ? " (couple)" : ""}`, name: form.name, phone: form.phone },
    });
    await insertOrder(order.id, quote, form);
    return NextResponse.json({
      orderId: order.id,
      keyId: razorpayKeyId(),
      amount: quote.amountPaise,
      currency: "INR",
      description: `${quote.planName} membership · ${quote.duration}${couple ? " · couple" : ""}`,
      prefill: { name: form.name, contact: `+91${form.phone}`, email: form.email ?? undefined },
    });
  } catch (err) {
    console.error("[membership] order failed:", (err as Error).message);
    return NextResponse.json({ error: "Couldn't start the payment right now. Please try again or WhatsApp us." }, { status: 502 });
  }
}
