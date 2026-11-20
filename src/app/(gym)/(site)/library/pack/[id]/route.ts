import { NextResponse, type NextRequest } from "next/server";
import { packById, packCheckoutPath } from "@/lib/library/packs";
import { SITE_URL } from "@/lib/site";

// Short link said in the library videos (royalfitnesclub.in/library/pack/yoga): opens checkout with
// the pack's five books in the cart. UTM tags on the short link are passed through.
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const pack = packById(id);
  // Built on SITE_URL, not the request URL: behind Cloud Run the request host is the container's 0.0.0.0:8080.
  if (!pack) return NextResponse.redirect(new URL("/library", SITE_URL), 302);
  const target = new URL(packCheckoutPath(pack), SITE_URL);
  for (const [k, v] of request.nextUrl.searchParams) if (/^utm_[a-z]+$/.test(k)) target.searchParams.set(k, v.slice(0, 100));
  if (!target.searchParams.has("utm_content") && target.searchParams.has("utm_source")) target.searchParams.set("utm_content", pack.id);
  return NextResponse.redirect(target, 302);
}
