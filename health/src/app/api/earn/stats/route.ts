import { NextResponse } from "next/server";

export async function GET() {
  // Demo aggregated stats — in prod query DB + analytics
  const stats = {
    mrr: { users: 1247, price: 199, total: 1247 * 199, currency: "INR", period: "monthly", growth: "+12% MoM" },
    affiliate: { clicks: 342, conversions: 28, rate: "8.2%", avgCommission: 160, total: 28 * 160, topProduct: "Digital Glucometer + 50 Strips" },
    ads: { views: 120000, cpm: 35, total: Math.round(120000 / 1000 * 35), note: "AdSense + direct, premium ad-free" },
    leadGen: { leads: 89, avgValue: 250, total: 89 * 250, types: { lab: 42, dietitian: 23, insurance: 15, consult: 9 } },
    newsletter: { subscribers: 3421, openRate: "20%", clickRate: "5%", premiumConv: "2%", totalPremiumFromNewsletter: Math.round(3421 * 0.02) },
    push: { subscribers: 1234, openRate: "30%", clickRate: "8%", reEngagement: "high" },
    whatsapp: { optins: 892, openRate: "40%", clickRate: "15%", best: true },
    referral: { referrals: 89, convRate: "22%", bestUtm: true, viralCoefficient: 1.3 },
    total: {
      monthly: 1247 * 199 + 28 * 160 + Math.round(120000 / 1000 * 35) + 89 * 250,
      breakdown: "MRR + affiliate + ads + lead gen — newsletter/push/whatsapp/referral drive premium conversion",
    },
    seo: {
      pages: 330,
      uniqueIndia: 19,
      blog: 12,
      categories: 13,
      sitemap: "/sitemap.xml",
      robots: "/robots.txt",
      jsonLd: "breadcrumb, FAQ, HowTo, Article, BlogPosting, Product, ItemList, CollectionPage, Website, Organization",
    },
    digitalMarketing: {
      utm: "bhg-utm localStorage + gtag + FB Pixel",
      gtagEvents: ["page_view", "scroll_depth", "affiliate_click", "generate_lead", "referral", "purchase", "newsletter_subscribe", "whatsapp_optin", "push_subscribe"],
      leadMagnets: ["thali-builder PDF 7-day", "millet swap calendar", "fasting calendar"],
      exitIntent: true,
      stickyCTA: true,
      newsletterPopup: true,
    },
    timestamp: new Date().toISOString(),
  };

  return NextResponse.json({ ok: true, stats, note: "Demo aggregated — production queries DB + GA4 + /admin/earning dashboard — earning platform pro" });
}
