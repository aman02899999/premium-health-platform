import { NextRequest, NextResponse } from "next/server";
import { DIGITAL_PRODUCTS } from "@/lib/monetization/config";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = DIGITAL_PRODUCTS.find((p) => p.slug === slug || p.id === slug);
  if (!product) return NextResponse.json({ ok: false, error: "Product not found" }, { status: 404 });

  // Demo preview — in production, return first 2 pages or watermarked preview, not full file
  return NextResponse.json({
    ok: true,
    slug: product.slug,
    title: product.title,
    description: product.description,
    pages: product.pages,
    fileSize: product.fileSize,
    format: product.format,
    preview: `Preview of ${product.title} — 2 pages sample. Full PDF available after purchase with expiring token.`,
    disclaimer: "Educational resource — not a medical diagnosis. Discuss with qualified healthcare professional.",
  });
}
