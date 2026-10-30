import type { Business, SiteContent } from "./content/types";

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.royalfitnesclub.in").replace(/\/$/, "");

export const NAV = [
  { href: "/", label: "Home" },
  { href: "/programs", label: "Programs" },
  { href: "/membership", label: "Membership" },
  { href: "/health-hub", label: "Health Hub" },
  { href: "/tools", label: "Tools" },
  { href: "/blog", label: "Blog" },
  { href: "/library", label: "Library" },
  { href: "/store", label: "Store" },
  { href: "/gallery", label: "Gallery" },
  { href: "/contact", label: "Contact" },
] as const;

/** Neighbourhoods the gym serves: shown on /contact and in the LocalBusiness structured data. */
export const AREAS_SERVED = ["Gejha", "Sector 93", "Sector 93A", "Sector 93B", "Sector 100", "Sector 104"] as const;

/**
 * Registration details shown in the footers and on /shop/policies (payment-gateway and buyer
 * checks look for them). The shop's own settings can override the FSSAI number.
 */
export const LEGAL = {
  name: "Royal Fitness Club",
  entity: "Proprietorship (MSME – Micro)",
  udyam: "UDYAM-UP-28-0184630",
  fssai: "22726926001404",
} as const;

export const FOOTER_LINKS = [...NAV, { href: "/about", label: "About" }, { href: "/why-royal-fitness", label: "Why Royal Fitness" }, { href: "/reviews", label: "Reviews" }, { href: "/faq", label: "FAQ" }, { href: "/app", label: "Get the app" }] as const;

export const telHref = (phone: string) => `tel:${phone.replace(/[^\d+]/g, "")}`;

export function whatsappHref(b: Business, message = `Hi ${b.name}, I'd like to book a free trial session.`) {
  return `https://wa.me/${b.whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(message)}`;
}

/** "919266840289" → "+91 92668 40289" (Indian mobiles); other numbers as "+<digits>". */
export function formatWhatsApp(digits: string) {
  const d = digits.replace(/\D/g, "");
  return /^91\d{10}$/.test(d) ? `+91 ${d.slice(2, 7)} ${d.slice(7)}` : `+${d}`;
}

/**
 * The number people call and chat with a person on (the WhatsApp Business app). The API number
 * (business.whatsapp) sends and auto-replies; every message it sends points here for a human.
 */
export const liveDigits = (phone: string) => {
  const d = phone.replace(/\D/g, "");
  return d.length === 10 ? `91${d}` : d;
};

/** Click-to-chat on the live number, with a first message already typed. */
export const liveChatUrl = (phone: string, text: string) => `https://wa.me/${liveDigits(phone)}?text=${encodeURIComponent(text)}`;

/**
 * The bare handle from whatever the admin typed: "name", "@name" or a pasted profile link
 * ("https://www.instagram.com/name?igsh=…"). Pasted links used to end up doubled in hrefs.
 */
export function instagramHandle(value: string) {
  const v = value.trim();
  const fromUrl = v.match(/instagram\.com\/([A-Za-z0-9._]+)/i)?.[1];
  return (fromUrl ?? v).replace(/^@/, "").replace(/[/?#].*$/, "");
}

export const instagramHref = (handle: string) => `https://www.instagram.com/${instagramHandle(handle)}/`;

export const formatINR = (n: number) => `₹${n.toLocaleString("en-IN")}`;

export function formatTime(hhmm: string) {
  const [h, m] = hhmm.split(":").map(Number);
  const suffix = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, "0")} ${suffix}`;
}

/** Short open-days summary, naming the closed day when the week runs Monday–Saturday. */
export function hoursDays(hours: Business["hours"]) {
  const ranges = [...new Set(hours.map((h) => h.days))];
  if (ranges.length === 1 && /mon\w*\s*[–-]\s*sun/i.test(ranges[0])) return "Open all 7 days";
  if (ranges.length === 1 && /mon\w*\s*[–-]\s*sat/i.test(ranges[0])) return "Monday – Saturday · Sunday closed";
  return ranges.join(" · ");
}

export function fullAddress(b: Business) {
  const a = b.address;
  return `${a.street}, ${a.locality}, ${a.city}, ${a.region} ${a.postalCode}`;
}

export function absoluteUrl(path: string) {
  if (!path) return SITE_URL;
  return /^https?:/.test(path) ? path : `${SITE_URL}${path.startsWith("/") ? "" : "/"}${path}`;
}

export const publishedPosts = (c: SiteContent) =>
  c.posts.filter((p) => !p.draft).sort((a, b) => b.published.localeCompare(a.published));

export const categorySlug = (cat: string) => cat.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
