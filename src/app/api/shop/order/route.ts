import { NextResponse } from "next/server";
import { orderNumber, parseBuyer, parseCart } from "@/lib/shop/checkout";
import { quoteCart } from "@/lib/shop/pricing";
import { currentCustomer, getCatalog } from "@/lib/shop/server";
import { insertOrder } from "@/lib/shop/store";
import { createRazorpayOrder, razorpayConfigured, razorpayKeyId } from "@/lib/payments/razorpay";

export const dynamic = "force-dynamic";

const recent = new Map<string, number[]>();
function rateLimited(ip: string) {
  const now = Date.now();
  const hits = (recent.get(ip) ?? []).filter((t) => now - t < 10 * 60 * 1000);
  hits.push(now);
  recent.set(ip, hits);
  return hits.length > 10;
}

// Step 1: re-price the cart on the server, save the order, open a Razorpay order for that total.
export async function POST(req: Request) {
  if (!razorpayConfigured()) return NextResponse.json({ error: "Online payment isn't switched on yet — please WhatsApp us to order." }, { status: 503 });
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (rateLimited(ip)) return NextResponse.json({ error: "Too many attempts — please wait a few minutes." }, { status: 429 });

  const buyer = parseBuyer(body);
  if (typeof buyer === "string") return NextResponse.json({ error: buyer }, { status: 400 });
  const cat = await getCatalog({ fresh: true });
  if (cat.offline) return NextResponse.json({ error: "The store is being updated — please try again in a minute." }, { status: 503 });
  const quote = quoteCart(parseCart(body.lines), cat.productById, cat.comboById, cat.settings);
  if (quote.problems.length) return NextResponse.json({ error: quote.problems[0], quote }, { status: 409 });
  if (quote.total <= 0) return NextResponse.json({ error: "Your cart is empty." }, { status: 400 });
  // The total the shopper saw; if prices changed meanwhile, show the new total first.
  if (typeof body.expectedTotal === "number" && body.expectedTotal !== quote.total) {
    return NextResponse.json({ error: `Prices were updated — your new total is ₹${quote.total.toLocaleString("en-IN")}. Please check and pay again.`, quote }, { status: 409 });
  }

  const customer = await currentCustomer().catch(() => null);
  const number = orderNumber();
  try {
    const rzp = await createRazorpayOrder({ amountPaise: quote.total * 100, receipt: number, notes: { store: "shop", order: number, name: buyer.name, phone: buyer.phone } });
    await insertOrder({
      number,
      razorpayOrderId: rzp.id,
      userId: customer?.id ?? null,
      ...buyer,
      items: quote.lines.map((l) => ({ kind: l.kind, id: l.id, slug: l.slug, name: l.name, flavour: l.flavour, qty: l.qty, unitList: l.unitList, unitPrice: l.unitPrice, contents: l.contents })),
      listTotal: quote.listTotal,
      discountTotal: quote.discountTotal,
      shipping: quote.shipping,
      total: quote.total,
    });
    return NextResponse.json({
      number,
      orderId: rzp.id,
      keyId: razorpayKeyId(),
      amount: quote.total * 100,
      currency: "INR",
      name: cat.settings.storeName,
      description: `Order ${number}`,
      prefill: { name: buyer.name, email: buyer.email, contact: `+91${buyer.phone}` },
    });
  } catch (err) {
    console.error("[shop] order failed:", (err as Error).message);
    return NextResponse.json({ error: "Couldn't start the payment. Please try again or WhatsApp us." }, { status: 502 });
  }
}
