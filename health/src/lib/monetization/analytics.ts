// Privacy-conscious monetization analytics
// Tracks: affiliate_product_view, affiliate_product_click, digital_product_view, checkout_started, purchase_completed, download_started, lead_submitted, coupon_clicked, sponsor_clicked, newsletter_signup, calculator_completed, premium_report_purchase, ad_impression, ad_click, cta_click
// Minimizes personal-data collection, no unnecessary health info

import type { MonetizationEvent, MonetizationEventType } from "./types";

const STORAGE_KEY = "bhg-monetization-events";
const MAX_EVENTS = 500;

function getStoredEvents(): MonetizationEvent[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function storeEvent(event: MonetizationEvent) {
  if (typeof window === "undefined") return;
  try {
    const events = getStoredEvents();
    events.push(event);
    // keep last MAX_EVENTS
    if (events.length > MAX_EVENTS) {
      events.splice(0, events.length - MAX_EVENTS);
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
  } catch {}
}

export function trackMonetizationEvent(params: {
  type: MonetizationEventType;
  productId?: string;
  page: string;
  campaign?: string;
  source?: string;
  cta?: string;
  utm?: { source?: string; medium?: string; campaign?: string; content?: string; term?: string };
}) {
  const event: MonetizationEvent = {
    id: `evt_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    type: params.type,
    productId: params.productId,
    page: params.page,
    campaign: params.campaign,
    source: params.source,
    cta: params.cta,
    timestamp: new Date().toISOString(),
    utm: params.utm,
  };

  // Store locally
  storeEvent(event);

  // gtag if available
  try {
    if (typeof window !== "undefined" && (window as any).gtag) {
      (window as any).gtag("event", params.type, {
        product_id: params.productId,
        page: params.page,
        campaign: params.campaign,
        source: params.source,
        cta: params.cta,
      });
    }
  } catch {}

  // Send to server API for aggregation (fire-and-forget)
  try {
    if (typeof window !== "undefined") {
      fetch("/api/monetization/analytics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(event),
      }).catch(() => {});
    }
  } catch {}

  return event;
}

// Revenue attribution — every monetization event attributable to page, product, campaign, source, CTA, timestamp
export function getAttributionFromUrl(): { source?: string; medium?: string; campaign?: string; content?: string; term?: string } {
  if (typeof window === "undefined") return {};
  try {
    const params = new URLSearchParams(window.location.search);
    return {
      source: params.get("utm_source") || undefined,
      medium: params.get("utm_medium") || undefined,
      campaign: params.get("utm_campaign") || undefined,
      content: params.get("utm_content") || undefined,
      term: params.get("utm_term") || undefined,
    };
  } catch {
    return {};
  }
}

export function getMonetizationStats() {
  const events = getStoredEvents();
  const now = Date.now();
  const last24h = events.filter((e) => now - new Date(e.timestamp).getTime() < 24 * 60 * 60 * 1000);
  const last7d = events.filter((e) => now - new Date(e.timestamp).getTime() < 7 * 24 * 60 * 60 * 1000);

  const countByType = (type: MonetizationEventType) => events.filter((e) => e.type === type).length;

  return {
    totalEvents: events.length,
    last24h: last24h.length,
    last7d: last7d.length,
    affiliateViews: countByType("affiliate_product_view"),
    affiliateClicks: countByType("affiliate_product_click"),
    digitalViews: countByType("digital_product_view"),
    checkoutStarted: countByType("checkout_started"),
    purchases: countByType("purchase_completed"),
    downloads: countByType("download_started"),
    leads: countByType("lead_submitted"),
    coupons: countByType("coupon_clicked"),
    sponsors: countByType("sponsor_clicked"),
    newsletter: countByType("newsletter_signup"),
    calculator: countByType("calculator_completed"),
    premiumReports: countByType("premium_report_purchase"),
    adImpressions: countByType("ad_impression"),
    adClicks: countByType("ad_click"),
    ctaClicks: countByType("cta_click"),
    ctr: events.length ? (countByType("affiliate_product_click") / Math.max(1, countByType("affiliate_product_view"))) * 100 : 0,
    topPages: Object.entries(
      events.reduce((acc: Record<string, number>, e) => {
        acc[e.page] = (acc[e.page] || 0) + 1;
        return acc;
      }, {})
    )
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10),
    topProducts: Object.entries(
      events
        .filter((e) => e.productId)
        .reduce((acc: Record<string, number>, e) => {
          acc[e.productId!] = (acc[e.productId!] || 0) + 1;
          return acc;
        }, {})
    )
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10),
  };
}
