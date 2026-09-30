import { NextRequest, NextResponse } from "next/server";
import { BUSINESS_LISTINGS } from "@/lib/monetization/config";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");
  const tier = searchParams.get("tier");
  const limit = Math.min(parseInt(searchParams.get("limit") || "20", 10), 50);

  let listings = BUSINESS_LISTINGS.filter((l) => l.active);
  if (type) listings = listings.filter((l) => l.providerType.toLowerCase() === type.toLowerCase());
  if (tier) listings = listings.filter((l) => l.tier === tier);
  listings = listings.sort((a, b) => b.priority - a.priority).slice(0, limit);

  return NextResponse.json({
    ok: true,
    count: listings.length,
    providers: listings.map((l) => ({
      id: l.id,
      slug: l.slug,
      title: l.title,
      providerType: l.providerType,
      tier: l.tier,
      location: l.location,
      verified: l.verified,
      credentials: l.credentials,
      description: l.description,
      featured: l.featured,
    })),
    disclaimer: "Do not imply paid listing = medically superior. Clearly separate Featured from Recommended based on clinical evidence. Do not fabricate credentials.",
  });
}
