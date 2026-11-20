// Which "contact us" link was tapped: a phone call or a WhatsApp chat. Used to count call and
// WhatsApp taps as conversions in GA4 and the Meta Pixel, so paid ads can be judged on them.
// Only the method is ever reported, never the number in the link (see src/analytics-pii.test.ts).

export type ContactMethod = "call" | "whatsapp";

const WHATSAPP_HOSTS = new Set(["wa.me", "api.whatsapp.com", "web.whatsapp.com", "chat.whatsapp.com", "whatsapp.com", "www.whatsapp.com"]);

export function contactMethod(href: string | null | undefined): ContactMethod | null {
  if (!href) return null;
  const h = href.trim().toLowerCase();
  if (h.startsWith("tel:")) return "call";
  if (h.startsWith("whatsapp:")) return "whatsapp";
  if (!h.startsWith("http://") && !h.startsWith("https://")) return null;
  try {
    return WHATSAPP_HOSTS.has(new URL(h).hostname) ? "whatsapp" : null;
  } catch {
    return null;
  }
}
