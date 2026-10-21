// Ads Manager: the pure half (campaign tags, ad links, the WhatsApp ad message, the maths).
// The database half is ads.ts. Spend is typed in from the ad platform's bill; every result
// is counted from the site's own leads and orders, so nothing here is estimated.
import { QR_PAGES } from "./qr-core";

export type Platform = "meta" | "google" | "youtube" | "other";
export const PLATFORMS: { id: Platform; label: string; utmSource: string }[] = [
  { id: "meta", label: "Facebook / Instagram (Meta)", utmSource: "facebook" },
  { id: "google", label: "Google Ads", utmSource: "google" },
  { id: "youtube", label: "YouTube", utmSource: "youtube" },
  { id: "other", label: "Other (newspaper, JustDial, …)", utmSource: "other" },
];
export const isPlatform = (p: unknown): p is Platform => PLATFORMS.some((x) => x.id === p);

/** Landing pages an ad can send people to: the same list the QR codes use. */
export const AD_PAGES = QR_PAGES;

/** "Diwali Offer – Sector 93!" → "diwali-offer-sector-93". */
export function adSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40)
    .replace(/-+$/, "");
}
export const isSlug = (s: unknown): s is string => typeof s === "string" && /^[a-z0-9][a-z0-9-]{2,39}$/.test(s);

/** The website link to paste into the ad, tagged so every lead and order is credited to it. */
export function adLink(siteUrl: string, landing: string, platform: Platform, slug: string): string {
  const [path, hash] = landing.split("#");
  const u = new URL(path || "/", siteUrl);
  u.searchParams.set("utm_source", PLATFORMS.find((p) => p.id === platform)!.utmSource);
  u.searchParams.set("utm_medium", "paid");
  u.searchParams.set("utm_campaign", slug);
  return `${u.toString()}${hash ? `#${hash}` : ""}`;
}

/** "(ad <slug>)" at the end of a Click-to-WhatsApp ad's pre-filled message. */
export const adRefLine = (slug: string) => `(ad ${slug})`;
export const whatsappAdText = (slug: string) => `Hi! I saw your ad. Please share the membership offer. ${adRefLine(slug)}`;
export function adRefFromText(text: string): string | null {
  const m = /\(ad ([a-z0-9][a-z0-9-]{2,39})\)\s*$/i.exec(text.trim());
  return m ? m[1].toLowerCase() : null;
}
export const adSource = (slug: string) => `ad:${slug}`;

export type AdResult = { spendPaise: number; leads: number; orders: number; netPaise: number };
export type AdMetrics = { cpl: number | null; cpo: number | null; roas: number | null };

/** Cost per lead, cost per paid order (rupees) and return on ad spend (revenue ÷ spend). */
export function adMetrics(r: AdResult): AdMetrics {
  const spend = r.spendPaise / 100;
  return {
    cpl: r.leads && spend ? Math.round(spend / r.leads) : null,
    cpo: r.orders && spend ? Math.round(spend / r.orders) : null,
    roas: spend ? Math.round((r.netPaise / 100 / spend) * 100) / 100 : null,
  };
}

/** Plain advice once there is enough to judge (5+ leads or ₹2,000+ spent), never from noise. */
export function adVerdict(r: AdResult, m: AdMetrics): string | null {
  if (r.spendPaise < 200000 && r.leads < 5) return null;
  if (!r.leads) return "Money spent and no leads yet: check the ad links to this campaign's tagged URL or WhatsApp text.";
  if (m.roas !== null && m.roas >= 3) return "Paying back 3× or more: raise the budget gradually (20% every few days).";
  if (m.roas !== null && m.roas >= 1) return "Paying for itself. Test a new creative against it before adding budget.";
  if (r.orders === 0 && r.leads >= 10) return "Leads but no sales: the ad works; follow-up is the leak. Call these leads the same day.";
  return "Costing more than it brings in so far. Change the offer or audience, or pause it.";
}

/** Rupees from what the admin types ("12,500", "₹ 800"); null when it isn't a number. */
export function parseRupees(v: unknown): number | null {
  if (typeof v === "number") return Number.isFinite(v) && v >= 0 && v <= 1e8 ? Math.round(v) : null;
  if (typeof v !== "string") return null;
  const t = v.replace(/[₹,\s]/g, "");
  if (!/^\d+(\.\d{1,2})?$/.test(t)) return null;
  const n = Number(t);
  return n <= 1e8 ? Math.round(n) : null;
}
