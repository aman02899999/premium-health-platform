// Acquisition attribution: where a visitor first came from and what brought them back last.
// Pure and shared: the browser writes the cookie (AttributionTracker), the server reads and
// re-validates it before storing it on a lead or an order. Nothing here is a financial fact:
// amounts always come from the server's own prices.

export const ATTRIBUTION_COOKIE = "rfc_attr";
export const ATTRIBUTION_DAYS = 90;

export type Channel = "paid" | "social" | "email" | "messaging" | "organic" | "referral" | "direct" | "other";

export type Touch = {
  source: string | null;
  medium: string | null;
  campaign: string | null;
  content: string | null;
  term: string | null;
  /** Host of the referring site, never the full URL. */
  referrer: string | null;
  /** Path the visit started on, without the query string. */
  landing: string;
  /** A paid click id was present (its value isn't kept). */
  clickId: "gclid" | "fbclid" | null;
  channel: Channel;
  at: string;
};

export type Attribution = { first: Touch; last: Touch };

const SEARCH = /(^|\.)(google|bing|duckduckgo|yahoo|yandex|ecosia)\./;
const SOCIAL = /(^|\.)(facebook|fb|instagram|t|twitter|x|linkedin|youtube|pinterest|reddit|threads)\.(com|me|co|net)$|(^|\.)(l\.facebook|lm\.facebook|l\.instagram)\.com$/;

/** UTM values: short, plain text only (they end up in admin screens and reports). */
const tag = (v: unknown): string | null => {
  if (typeof v !== "string") return null;
  const t = v.trim().toLowerCase().slice(0, 80);
  return t && /^[a-z0-9 ._\-+/:|()&]+$/.test(t) ? t : null;
};

const host = (v: unknown): string | null => {
  if (typeof v !== "string" || !v) return null;
  try {
    const h = new URL(v.includes("://") ? v : `https://${v}`).hostname.toLowerCase();
    return /^[a-z0-9.-]{1,100}$/.test(h) ? h.replace(/^www\./, "") : null;
  } catch {
    return null;
  }
};

const path = (v: unknown): string => (typeof v === "string" && /^\/[A-Za-z0-9/_\-.~%]{0,150}$/.test(v) ? v : "/");

/** Sorts a touch into a channel from its tags, click id and referrer. Missing data stays "direct", never invented. */
export function channelOf(t: Pick<Touch, "source" | "medium" | "referrer" | "clickId">): Channel {
  const medium = t.medium ?? "";
  const source = t.source ?? "";
  if (t.clickId || /^(cpc|ppc|paid|paidsocial|paid-social|paid_social|display|cpm|ads?)$/.test(medium)) return "paid";
  if (medium === "email" || source === "newsletter" || source === "email") return "email";
  if (/^(whatsapp|wa|sms)$/.test(source) || medium === "whatsapp") return "messaging";
  if (/^(social|social-media|organic-social)$/.test(medium) || SOCIAL.test(source + ".com")) return "social";
  if (medium === "organic") return "organic";
  if (t.source || t.medium) return medium === "referral" ? "referral" : "other";
  if (t.referrer) return SEARCH.test(t.referrer) ? "organic" : /(^|\.)(wa\.me|whatsapp\.com)$/.test(t.referrer) ? "messaging" : SOCIAL.test(t.referrer) ? "social" : "referral";
  return "direct";
}

/**
 * The touch for one page view, or null when the view carries nothing new: an internal
 * navigation, or a reload with no tags and no outside referrer.
 */
export function touchFrom(url: URL, referrer: string, ownHost: string, now = new Date()): Touch | null {
  const q = url.searchParams;
  const ref = host(referrer);
  const external = ref && ref !== ownHost.replace(/^www\./, "") ? ref : null;
  const clickId = q.get("gclid") ? "gclid" : q.get("fbclid") ? "fbclid" : null;
  const t = {
    source: tag(q.get("utm_source")),
    medium: tag(q.get("utm_medium")),
    campaign: tag(q.get("utm_campaign")),
    content: tag(q.get("utm_content")),
    term: tag(q.get("utm_term")),
    referrer: external,
    clickId,
    landing: path(url.pathname),
    at: now.toISOString(),
  } as const;
  if (!t.source && !t.medium && !t.campaign && !t.referrer && !t.clickId) return null;
  return { ...t, channel: channelOf(t) };
}

function cleanTouch(v: unknown): Touch | null {
  if (!v || typeof v !== "object") return null;
  const o = v as Record<string, unknown>;
  const at = typeof o.at === "string" && !Number.isNaN(Date.parse(o.at)) ? new Date(o.at).toISOString() : null;
  if (!at) return null;
  const clickId: Touch["clickId"] = o.clickId === "gclid" || o.clickId === "fbclid" ? o.clickId : null;
  const t = { source: tag(o.source), medium: tag(o.medium), campaign: tag(o.campaign), content: tag(o.content), term: tag(o.term), referrer: host(o.referrer), clickId, landing: path(o.landing), at };
  // The channel is recomputed: the cookie is the visitor's to edit.
  return { ...t, channel: channelOf(t) };
}

/** Reads and re-validates the cookie value. Anything malformed is dropped, not repaired into a guess. */
export function parseAttribution(raw: string | undefined | null): Attribution | null {
  if (!raw || raw.length > 3000) return null;
  try {
    const v = JSON.parse(decodeURIComponent(raw)) as { first?: unknown; last?: unknown };
    const first = cleanTouch(v.first);
    if (!first) return null;
    return { first, last: cleanTouch(v.last) ?? first };
  } catch {
    return null;
  }
}

/** First touch is kept for the life of the cookie; any new tagged or referred visit becomes the last touch. */
export function mergeTouch(prev: Attribution | null, touch: Touch | null): Attribution | null {
  if (!touch) return prev;
  return prev ? { first: prev.first, last: touch } : { first: touch, last: touch };
}

export const serializeAttribution = (a: Attribution) => encodeURIComponent(JSON.stringify(a));

/** Reads the cookie from a request's Cookie header. */
export function attributionFromRequest(req: Request): Attribution | null {
  const cookie = req.headers.get("cookie") ?? "";
  const m = cookie.match(new RegExp(`(?:^|;\\s*)${ATTRIBUTION_COOKIE}=([^;]*)`));
  return parseAttribution(m?.[1]);
}
