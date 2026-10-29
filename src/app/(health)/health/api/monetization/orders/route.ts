import { NextRequest, NextResponse } from "next/server";
import { DIGITAL_PRODUCTS, PREMIUM_REPORTS } from "@/health/lib/monetization/config";
import { getPaymentProvider, generateDownloadToken } from "@/health/lib/monetization/payment";
import { isManager } from "@/lib/auth";
import { healthPaymentsLive, paymentsUnavailable } from "@/health/lib/monetization/live-guard";

export const dynamic = "force-dynamic";

const ORDERS: any[] = [];
const MAX_KEPT = 200;

export async function GET(req: NextRequest) {
  if (!(await isManager())) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const limit = Math.min(parseInt(searchParams.get("limit") || "20", 10), 100);
  return NextResponse.json({ ok: true, count: ORDERS.length, orders: ORDERS.slice(-limit).reverse() });
}

export async function POST(req: NextRequest) {
  // Mock orders only: on the live site nobody can start a simulated purchase.
  if (!healthPaymentsLive()) return paymentsUnavailable();
  try {
    const body = await req.json();
    const { productId, productType, email, page, utm } = body;

    if (!productId) return NextResponse.json({ ok: false, error: "Missing productId" }, { status: 400 });

    // Find product
    const allProducts = [...DIGITAL_PRODUCTS, ...PREMIUM_REPORTS];
    const product = allProducts.find((p) => p.id === productId || p.slug === productId);
    if (!product) return NextResponse.json({ ok: false, error: "Product not found" }, { status: 400 });

    // Create payment order via abstraction
    const provider = getPaymentProvider();
    const paymentOrder = await provider.createOrder({
      productId: product.id,
      productType: (productType as any) || "digital",
      amount: product.price,
      currency: product.currency as any,
      email,
      attribution: { page: page || "/", utm },
    });

    const order = {
      id: paymentOrder.id,
      productId: product.id,
      productSlug: product.slug,
      productTitle: product.title,
      productType: productType || "digital",
      amount: product.price,
      currency: product.currency,
      status: "pending",
      paymentProvider: provider.name,
      providerOrderId: paymentOrder.providerOrderId,
      checkoutUrl: paymentOrder.checkoutUrl,
      email: email?.toLowerCase(),
      page,
      utm,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    ORDERS.push(order);
    // In-memory demo list: keep it bounded so it can't grow without limit.
    if (ORDERS.length > MAX_KEPT) ORDERS.splice(0, ORDERS.length - MAX_KEPT);

    return NextResponse.json({ ok: true, order, checkoutUrl: paymentOrder.checkoutUrl });
  } catch (e: any) {
    console.error("[health orders] create failed:", e?.message);
    return NextResponse.json({ ok: false, error: "Failed to create order" }, { status: 500 });
  }
}
