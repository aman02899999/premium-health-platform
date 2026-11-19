import { NextResponse, type NextRequest } from "next/server";
import { packById, packCheckoutPath } from "@/lib/library/packs";

// Short link said in the library videos (royalfitnesclub.in/library/pack/yoga): opens checkout with
// the pack's five books in the cart. UTM tags on the short link are passed through.
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const pack = packById(id);
  const url = request.nextUrl.clone();
  url.search = "";
  if (!pack) {
    url.pathname = "/library";
    return NextResponse.redirect(url, 302);
  }
  const target = new URL(packCheckoutPath(pack), url);
  for (const [k, v] of request.nextUrl.searchParams) if (/^utm_[a-z]+$/.test(k)) target.searchParams.set(k, v.slice(0, 100));
  if (!target.searchParams.has("utm_content") && target.searchParams.has("utm_source")) target.searchParams.set("utm_content", pack.id);
  return NextResponse.redirect(target, 302);
}
