// Contacts: the pure half (keys, tag and attribute rules, CSV). The database half is contacts.ts.
// One person = one key: their 10-digit Indian mobile, or their lowercase email when there is no
// mobile, the same rule campaigns use so a person never gets two copies of one message.

export type ContactKind = "member" | "ex-member" | "lead" | "customer" | "imported" | "chat" | "subscriber";

export const KIND_LABELS: Record<ContactKind, string> = {
  member: "Member",
  "ex-member": "Ex-member",
  lead: "Lead",
  customer: "Paid online",
  imported: "Imported",
  chat: "WhatsApp chat",
  subscriber: "Subscriber",
};
export const KINDS = Object.keys(KIND_LABELS) as ContactKind[];
export const isKind = (k: unknown): k is ContactKind => KINDS.includes(k as ContactKind);

/** 10-digit Indian mobile from anything people type or WhatsApp sends ("+91 98…", "9198…"). */
export function mobile10(phone: string | null | undefined): string | null {
  const d = (phone ?? "").replace(/\D/g, "");
  const t = d.length === 12 && d.startsWith("91") ? d.slice(2) : d.length === 11 && d.startsWith("0") ? d.slice(1) : d;
  return /^[6-9]\d{9}$/.test(t) ? t : null;
}

const EMAIL = /^[^@\s]+@[^@\s]+$/;
export function contactKey(phone: string | null | undefined, email: string | null | undefined): string | null {
  const m = mobile10(phone);
  if (m) return m;
  const e = (email ?? "").trim().toLowerCase();
  return EMAIL.test(e) && e.length <= 120 ? e : null;
}
export const isContactKey = (k: unknown): k is string => typeof k === "string" && (/^[6-9]\d{9}$/.test(k) || (EMAIL.test(k) && k.length <= 120 && k === k.toLowerCase()));

/**
 * A tag as stored: lowercase, letters/digits/space/_/-, up to 30 characters ("VIP Members!" →
 * "vip members"). Null when nothing usable is left. Import tags are folded the same way, so an
 * uploaded list "Old members 2024" is the same list as a tag typed "old members 2024".
 */
export function normTag(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const t = raw
    .toLowerCase()
    .replace(/[^a-z0-9 _-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 30)
    .trim();
  return /^[a-z0-9][a-z0-9 _-]{0,29}$/.test(t) ? t : null;
}

/** Campaign audiences beyond the built-in segments: "tag:<tag>" sends to everyone with that tag. */
export const tagSegment = (tag: string) => `tag:${tag}`;
export function segmentTag(segment: unknown): string | null {
  if (typeof segment !== "string" || !segment.startsWith("tag:")) return null;
  const t = segment.slice(4);
  return normTag(t) === t ? t : null;
}

/** Attribute names as stored: "Preferred time" → "preferred_time". */
export function normAttr(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const n = raw
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .replace(/^[0-9_]+/, "")
    .slice(0, 30)
    .replace(/_+$/, "");
  return /^[a-z][a-z0-9_]{0,29}$/.test(n) ? n : null;
}
export const attrLabel = (name: string) => name.replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase());

/** Attributes the desk usually fills, offered first in the contact panel. */
export const SUGGESTED_ATTRS = ["goal", "preferred_time", "area", "gender", "birthday", "trainer", "how_found_us"] as const;

export type ContactRow = {
  key: string;
  name: string;
  phone: string | null;
  email: string | null;
  kinds: ContactKind[];
  tags: string[];
  lastAt: string | null;
  memberUntil: string | null;
  /** WhatsApp: opted out of promotions, or a number WhatsApp can't deliver to. */
  waBlocked: boolean;
  emailUnsubscribed: boolean;
};

const cell = (v: string) => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
// A cell starting with = + - @ runs as a formula in Excel; prefix it so names stay text.
const safe = (v: string) => cell(/^[=+\-@]/.test(v) ? `'${v}` : v);

export function contactsCsv(rows: ContactRow[]): string {
  const head = ["name", "mobile", "email", "type", "tags", "member_until", "last_activity", "whatsapp_ok", "email_ok"];
  const body = rows.map((r) =>
    [r.name, r.phone ?? "", r.email ?? "", r.kinds.map((k) => KIND_LABELS[k]).join("; "), r.tags.join("; "), r.memberUntil ?? "", r.lastAt?.slice(0, 10) ?? "", r.phone && !r.waBlocked ? "yes" : "no", r.email && !r.emailUnsubscribed ? "yes" : "no"]
      .map(safe)
      .join(","),
  );
  return [head.join(","), ...body].join("\n") + "\n";
}
