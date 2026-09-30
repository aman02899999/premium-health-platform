import { NextResponse } from "next/server";

export async function GET() {
  // Demo stats — in prod query DB + /api/affiliate/click logs + merchant reports
  const stats = {
    totalClicks: 342,
    totalConversions: 28,
    conversionRate: "8.2%",
    avgCommission: 160,
    totalRevenue: 28 * 160,
    topProducts: [
      { productId: "digital-glucometer-combo", name: "Digital Glucometer + 50 Strips", clicks: 89, conversions: 8, revenue: 8 * 160 },
      { productId: "upper-arm-bp-monitor", name: "Upper-Arm BP Monitor", clicks: 67, conversions: 6, revenue: 6 * 180 },
      { productId: "millet-combo-pack", name: "Millet Combo", clicks: 54, conversions: 5, revenue: 5 * 40 },
      { productId: "yoga-mat-6mm", name: "Yoga Mat 6mm", clicks: 43, conversions: 3, revenue: 3 * 80 },
      { productId: "whey-protein-1kg", name: "Whey Protein 1kg", clicks: 38, conversions: 3, revenue: 3 * 300 },
    ],
    utmSources: [
      { source: "instagram", clicks: 89, conv: "12%" },
      { source: "google", clicks: 121, conv: "8%" },
      { source: "youtube", clicks: 54, conv: "15%" },
      { source: "referral", clicks: 32, conv: "22% best" },
    ],
    earning: "Affiliate 8% avg — Rs160-360 per sale — tracked via gtag affiliate_click + UTM + /api/affiliate/click POST + localStorage bhg-aff-clicks",
    apis: { click: "/api/affiliate/click POST productId", stats: "/api/affiliate/stats GET", deals: "/deals + /products" },
    timestamp: new Date().toISOString(),
  };

  return NextResponse.json({ ok: true, stats, note: "Demo aggregated — production uses DB + merchant reports + /admin/earning dashboard" });
}
