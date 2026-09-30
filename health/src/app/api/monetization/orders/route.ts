import { NextRequest, NextResponse } from "next/server";
import { DIGITAL_PRODUCTS, PREMIUM_REPORTS } from "@/lib/monetization/config";
import { getPaymentProvider, generateDownloadToken } from "@/lib/monetization/payment";

export const dynamic = "force-dynamic";

const ORDERS: any[] = [];

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const limit = Math.min(parseInt(searchParams.get("limit") || "20", 10), 100);
  // In production, admin auth + user-specific filtering
  return NextResponse.json({ ok: true, count: ORDERS.length, orders: ORDERS.slice(-limit).reverse() });
}

export async function POST(req: NextRequest) {
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

    return NextResponse.json({ ok: true, order, checkoutUrl: paymentOrder.checkoutUrl });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message || "Failed to create order" }, { status: 500 });
  }
}
