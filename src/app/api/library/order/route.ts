import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { createRazorpayOrder, razorpayConfigured, razorpayKeyId } from "@/lib/payments/razorpay";
import { parseBuyerForm, quoteLibrary } from "@/lib/library/pricing";
import { insertBookOrder } from "@/lib/library/orders";

export const dynamic = "force-dynamic";

const recent = new Map<string, number[]>();
function rateLimited(ip: string) {
  const now = Date.now();
  const hits = (recent.get(ip) ?? []).filter((t) => now - t < 10 * 60 * 1000);
  hits.push(now);
  recent.set(ip, hits);
  return hits.length > 10;
}

// Step 1 of buying a book or the complete library: price it on the server and open a Razorpay order.
export async function POST(req: Request) {
  if (!razorpayConfigured()) return NextResponse.json({ error: "Online payment isn't available yet — please WhatsApp us to buy." }, { status: 503 });
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body || typeof body !== "object") return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (rateLimited(ip)) return NextResponse.json({ error: "Too many attempts — please try again in a few minutes." }, { status: 429 });

  const quote = quoteLibrary(typeof body.itemId === "string" ? body.itemId : "");
  if (!quote) return NextResponse.json({ error: "That book isn't available." }, { status: 400 });
  const buyer = parseBuyerForm(body);
  if (typeof buyer === "string") return NextResponse.json({ error: buyer }, { status: 400 });

  try {
    const order = await createRazorpayOrder({
      amountPaise: quote.amountPaise,
      receipt: `lib_${randomUUID().slice(0, 18)}`,
      notes: { kind: "library", item: quote.itemId, name: buyer.name, email: buyer.email },
    });
    await insertBookOrder(order.id, quote, buyer);
    return NextResponse.json({
      orderId: order.id,
      keyId: razorpayKeyId(),
      amount: quote.amountPaise,
      currency: "INR",
      description: quote.title,
      prefill: { name: buyer.name, email: buyer.email, contact: `+91${buyer.phone}` },
    });
  } catch (err) {
    console.error("[library] order failed:", (err as Error).message);
    return NextResponse.json({ error: "Couldn't start the payment right now. Please try again." }, { status: 502 });
  }
}
