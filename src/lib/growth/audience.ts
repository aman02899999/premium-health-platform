// The marketing audience and campaigns, as pure functions: reading a contacts sheet (old members:
// name, mobile, email), the segments, the messages a campaign sends, and the customer list for
// Meta ads. The database side is in campaigns.ts.
import { mapHeader, parsePhone, MAX_ROWS } from "./member-import";
import type { Draft } from "./messages";

export type Contact = { row: number; name: string; phone: string | null; email: string | null };
export type ContactError = { row: number; message: string };

const clean = (s: string | undefined, max: number) => (s ?? "").trim().replace(/\s+/g, " ").slice(0, max);
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** A contacts sheet: a header row with a name column and a mobile and/or email column. */
export function toContacts(rows: string[][]): { contacts: Contact[]; errors: ContactError[]; columns: Record<string, string> } | string {
  let index = -1;
  let mapping = mapHeader([]);
  for (let i = 0; i < Math.min(rows.length, 10); i++) {
    const m = mapHeader(rows[i]);
    if (m.name && (m.phone || m.email)) {
      index = i;
      mapping = m;
      break;
    }
  }
  if (index < 0) return "Couldn't find the header row. The first row should have column names such as Name, Mobile and Email.";
  const data = rows.slice(index + 1);
  if (data.length > MAX_ROWS) return `The sheet has ${data.length} rows; import at most ${MAX_ROWS} at a time.`;
  const at = (r: string[], f: "name" | "phone" | "email") => (mapping[f] ? (r[mapping[f]!.column] ?? "") : "");
  const contacts: Contact[] = [];
  const errors: ContactError[] = [];
  const seen = new Set<string>();
  data.forEach((r, i) => {
    const row = index + i + 2;
    if (r.every((c) => !String(c ?? "").trim())) return;
    const name = clean(at(r, "name"), 100);
    const rawPhone = at(r, "phone").trim();
    const phone = rawPhone ? parsePhone(rawPhone) : null;
    const rawEmail = clean(at(r, "email"), 120).toLowerCase();
    const email = EMAIL.test(rawEmail) ? rawEmail : null;
    if (!name && !rawPhone && !rawEmail) return; // only a serial number: an empty row
    if (!phone && !email) return void errors.push({ row, message: rawPhone ? `"${rawPhone}" isn't a 10-digit mobile number, and there's no valid email.` : "No mobile number or email." });
    const key = phone ?? email!;
    if (seen.has(key)) return void errors.push({ row, message: `Same ${phone ? "mobile" : "email"} as an earlier row.` });
    seen.add(key);
    contacts.push({ row, name, phone, email });
  });
  return { contacts, errors, columns: Object.fromEntries(Object.entries(mapping).map(([k, v]) => [k, v!.header])) };
}

export type SegmentId = "current" | "expiring" | "ex-recent" | "ex-old" | "imported" | "leads" | "everyone";
export const SEGMENTS: { id: SegmentId; label: string; hint: string }[] = [
  { id: "current", label: "Current members", hint: "Membership active today" },
  { id: "expiring", label: "Expiring in 30 days", hint: "Renewal and upgrade offers" },
  { id: "ex-recent", label: "Left in the last 3 months", hint: "Most likely to come back" },
  { id: "ex-old", label: "Left over 3 months ago", hint: "Win-back offers" },
  { id: "imported", label: "Imported contacts", hint: "Old members and lists you uploaded" },
  { id: "leads", label: "Leads who didn't join", hint: "Enquired but never paid" },
  { id: "everyone", label: "Everyone", hint: "All of the above, each person once" },
];
export const isSegment = (s: unknown): s is SegmentId => SEGMENTS.some((x) => x.id === s);

export type Recipient = { name: string; phone: string | null; email: string | null };

/** Where the campaign's button goes. UTM-tagged so sales from each campaign show up in analytics. */
export const LINKS = {
  trial: { label: "Start the ₹49 trial", path: "/diet-chart?plan=trial" },
  plans: { label: "See diet plans", path: "/diet-chart" },
  membership: { label: "See membership offers", path: "/membership" },
  gymtrial: { label: "Book a free gym trial", path: "/contact" },
  shop: { label: "Shop supplements", path: "/shop" },
} as const;
export type LinkId = keyof typeof LINKS;
export const isLink = (s: unknown): s is LinkId => typeof s === "string" && s in LINKS;

export function campaignUrl(siteUrl: string, link: LinkId, campaign: string, channel: "whatsapp" | "email"): string {
  const { path } = LINKS[link];
  const tag = `utm_source=${channel}&utm_medium=campaign&utm_campaign=${encodeURIComponent(campaign.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "campaign")}`;
  const hash = link === "trial" ? "#order" : link === "gymtrial" ? "#trial" : "";
  return `${siteUrl}${path}${path.includes("?") ? "&" : "?"}${tag}${hash}`;
}

/** WhatsApp template parameters can't hold new lines, tabs or long runs of spaces. */
export const offerText = (s: string) => s.replace(/[\r\n\t]+/g, " ").replace(/ {2,}/g, " ").trim().slice(0, 160);

const first = (name: string) => name.trim().split(/\s+/)[0] || "";

export type CampaignInput = { id: string; name: string; channel: "whatsapp" | "email"; offer: string; link: LinkId; subject: string };

/** One message per recipient, deduped per campaign so a re-run never sends twice. */
export function campaignDraft(c: CampaignInput, r: Recipient, biz: { name: string; siteUrl: string; coach: string }): Draft | null {
  const url = campaignUrl(biz.siteUrl, c.link, c.name, c.channel);
  const hi = first(r.name);
  if (c.channel === "whatsapp") {
    if (!r.phone) return null;
    const params = [hi || "there", biz.name, offerText(c.offer), url];
    return {
      channel: "whatsapp",
      to: `91${r.phone}`,
      toName: r.name,
      kind: "offer-broadcast",
      body: `Hi ${params[0]}, ${biz.name} has something for you: ${params[2]}. See details here: ${url}`,
      template: "rfc_offer_broadcast_v1",
      params,
      dedupeKey: `campaign:${c.id}:91${r.phone}`,
    };
  }
  if (!r.email) return null;
  return {
    channel: "email",
    to: r.email.toLowerCase(),
    toName: r.name,
    // "nurture-" emails carry the unsubscribe link and headers, and stop after an unsubscribe.
    kind: "nurture-campaign",
    subject: (c.subject.trim() || c.name).slice(0, 120),
    body: `Hi${hi ? ` ${hi}` : ""},\n\n${c.offer.trim()}\n\n[[CTA:${LINKS[c.link].label}|${url}]]\n\n— ${biz.coach}, ${biz.name}`,
    template: "",
    params: [],
    dedupeKey: `campaign:${c.id}:${r.email.toLowerCase()}`,
  };
}

/**
 * Customer list for Meta Ads Manager (Audiences → Custom audience → Customer list): Meta hashes it
 * on upload. Use it to show ads to your own members on Instagram and Facebook, or build a
 * lookalike audience of people like them.
 */
export function metaAudienceCsv(recipients: Recipient[]): string {
  const cell = (v: string) => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
  const rows = recipients
    .filter((r) => r.phone || r.email)
    .map((r) => {
      const [fn = "", ...rest] = r.name.trim().split(/\s+/);
      return [r.email ?? "", r.phone ? `91${r.phone}` : "", fn, rest.join(" "), "in"].map(cell).join(",");
    });
  return ["email,phone,fn,ln,country", ...rows].join("\n") + "\n";
}
