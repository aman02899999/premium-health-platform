import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { BOOKS } from "@/lib/library/catalog";
import { LIBRARY_BUCKET, bookPath, librarySigningConfigured } from "@/lib/library/storage";
import { listBookOrders } from "@/lib/library/orders";
import { razorpayConfigured } from "@/lib/payments/razorpay";

export const dynamic = "force-dynamic";

// Admin: which book PDFs are in the private bucket, plus recent book orders.
export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const supabase = await createClient();
  const { data, error } = await supabase.storage.from(LIBRARY_BUCKET).list("books", { limit: 1000 });
  const uploaded = new Set((data ?? []).map((f) => f.name.replace(/\.pdf$/, "")));
  let orders: Awaited<ReturnType<typeof listBookOrders>> = [];
  let ordersError: string | undefined;
  try {
    orders = await listBookOrders();
  } catch (err) {
    console.error("[library] admin orders failed:", (err as Error).message);
    ordersError = "Couldn't load book orders from the database.";
  }
  return NextResponse.json({
    razorpay: razorpayConfigured(),
    signing: librarySigningConfigured(),
    storageError: error?.message,
    books: BOOKS.map((b) => ({ volume: b.volume, slug: b.slug, title: b.title, uploaded: uploaded.has(b.slug) })),
    orders,
    ordersError,
  });
}

// Admin: upload one book PDF. The file name must match a catalogue slug, e.g. 01-foundations-of-strength.pdf.
export async function POST(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "No file" }, { status: 400 });
  const slug = file.name.replace(/\.pdf$/i, "");
  if (!BOOKS.some((b) => b.slug === slug)) return NextResponse.json({ error: `${file.name} doesn't match any book in the catalogue` }, { status: 400 });
  if (file.size > 4 * 1024 * 1024) return NextResponse.json({ error: "File too large (max 4 MB)" }, { status: 413 });
  const bytes = Buffer.from(await file.arrayBuffer());
  if (bytes.subarray(0, 5).toString() !== "%PDF-") return NextResponse.json({ error: `${file.name} isn't a PDF` }, { status: 400 });

  const supabase = await createClient();
  const { error } = await supabase.storage.from(LIBRARY_BUCKET).upload(bookPath(slug), bytes, { contentType: "application/pdf", upsert: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, slug });
}
