import { NextResponse } from "next/server";
import { AFFILIATE_PRODUCTS } from "@/health/lib/monetization/config";

// Real numbers only: commissions are reported by the affiliate networks (EarnKaro, Amazon
// Associates) in their own dashboards, so this endpoint doesn't invent clicks or revenue.
export async function GET() {
  return NextResponse.json({
    ok: true,
    stats: {
      activeProducts: AFFILIATE_PRODUCTS.filter((p) => p.active).length,
      totalClicks: null,
      totalConversions: null,
      totalRevenue: null,
      source: "See your EarnKaro / Amazon Associates dashboard for clicks, orders and commission.",
      timestamp: new Date().toISOString(),
    },
  });
}
