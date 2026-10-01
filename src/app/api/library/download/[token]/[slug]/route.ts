import { NextResponse } from "next/server";
import { bookBySlug } from "@/lib/library/pricing";
import { claimDownload, orderByToken } from "@/lib/library/orders";
import { librarySigningConfigured, signedBookUrl } from "@/lib/library/storage";

export const dynamic = "force-dynamic";

// Checks the paid order, counts the download, then redirects to a 60-second signed URL.
export async function GET(_req: Request, { params }: { params: Promise<{ token: string; slug: string }> }) {
  const { token, slug } = await params;
  const book = bookBySlug(slug);
  if (!book) return NextResponse.json({ error: "Unknown book" }, { status: 404 });
  if (!librarySigningConfigured()) return NextResponse.json({ error: "Downloads are being set up — please try again shortly." }, { status: 503 });

  try {
    const order = await orderByToken(token);
    if (!order || !order.slugs.includes(slug)) return NextResponse.json({ error: "This download link isn't valid or has expired." }, { status: 404 });
    if (!(await claimDownload(order.id, slug))) {
      return NextResponse.json({ error: "Download limit reached for this book. WhatsApp us if you need help." }, { status: 429 });
    }
    const filename = `Vol-${String(book.volume).padStart(2, "0")}-${book.title.replace(/[^A-Za-z0-9]+/g, "-").replace(/^-|-$/g, "")}.pdf`;
    return NextResponse.redirect(await signedBookUrl(slug, filename), { status: 302, headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    console.error("[library] download failed:", (err as Error).message);
    return NextResponse.json({ error: "The file isn't available right now. Please try again in a few minutes." }, { status: 502 });
  }
}
