// The marketing audience and campaigns, as pure functions: reading a contacts sheet (old members:
// name, mobile, email), the segments, the messages a campaign sends, and the customer list for
// Meta ads. The database side is in campaigns.ts.
import { mapHeader, parsePhone, MAX_ROWS } from "./member-import";
import { TEMPLATES, type Draft } from "./messages";
import { liveChatUrl } from "@/lib/site";
import { linkCode, trackedUrl } from "./tracking-core";

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

/**
 * Where the campaign's button goes. UTM-tagged so sales from each campaign show up in analytics.
 * The supplement shop is email-only: WhatsApp's commerce policy doesn't allow selling supplements.
 */
export const LINKS = {
  trial: { label: "Start the ₹49 trial", path: "/diet-chart?plan=trial", whatsapp: true },
  plans: { label: "See diet plans", path: "/diet-chart", whatsapp: true },
  membership: { label: "See membership offers", path: "/membership", whatsapp: true },
  gymtrial: { label: "Book a free gym trial", path: "/contact", whatsapp: true },
  shop: { label: "Shop supplements (email only)", path: "/shop", whatsapp: false },
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

/** Meme cards for offer emails, in our own words; one per campaign so a whole send matches. */
export const CAMPAIGN_MEMES: [string, string][] = [
  ["Me: I'll start from Monday", "Also me, 6 Mondays later 😐"],
  ["Me before the offer: \"too expensive\"", "Me after the offer: no excuses left 😎"],
  ["Buying a gym membership in January", "Buying it at offer price today 😎"],
  ["Nobody:", "Me after week 1: checking my biceps in every mirror"],
  ["Rest day?", "Coach: it's leg day 🦵"],
];
const memeIndex = (id: string) => [...id].reduce((a, ch) => (a * 31 + ch.charCodeAt(0)) >>> 0, 7) % CAMPAIGN_MEMES.length;

/** One message per recipient, deduped per campaign so a re-run never sends twice. */
export function campaignDraft(c: CampaignInput, r: Recipient, biz: { name: string; siteUrl: string; coach: string; phone?: string }): Draft | null {
  const target = campaignUrl(biz.siteUrl, c.link, c.name, c.channel);
  const hi = first(r.name);
  // Every person gets their own short link, so a click shows who opened the offer.
  const tracked = (dedupeKey: string) => {
    const code = linkCode(dedupeKey);
    return { url: trackedUrl(biz.siteUrl, code), link: { code, url: target } };
  };
  if (c.channel === "whatsapp") {
    if (!r.phone) return null;
    const { url, link } = tracked(`campaign:${c.id}:91${r.phone}`);
    // The template sends from the API number; the offer text names the line a person answers.
    const offer = biz.phone ? `${offerText(c.offer).replace(/[.\s]+$/, "")}. Call or WhatsApp ${biz.phone}` : offerText(c.offer);
    const params = [hi || "there", biz.name, offer, url];
    return {
      channel: "whatsapp",
      to: `91${r.phone}`,
      toName: r.name,
      kind: "offer-broadcast",
      body: TEMPLATES["offer-broadcast"].text.replace(/\{\{(\d)\}\}/g, (_, n) => params[Number(n) - 1] ?? ""),
      template: TEMPLATES["offer-broadcast"].name,
      params,
      dedupeKey: `campaign:${c.id}:91${r.phone}`,
      link,
    };
  }
  if (!r.email) return null;
  const { url, link } = tracked(`campaign:${c.id}:${r.email.toLowerCase()}`);
  return {
    channel: "email",
    to: r.email.toLowerCase(),
    toName: r.name,
    // "nurture-" emails carry the unsubscribe link and headers, and stop after an unsubscribe.
    kind: "nurture-campaign",
    subject: (c.subject.trim() || c.name).slice(0, 120),
    // The button goes right under the offer, so it shows without scrolling on a phone.
    body: [
      `Hi${hi ? ` ${hi}` : ""},`,
      `🔥 WOW, this one is for you. ${biz.name} just unlocked something special:`,
      c.offer.trim(),
      `[[CTA:${LINKS[c.link].label}|${url}]]`,
      `[[MEME:${CAMPAIGN_MEMES[memeIndex(c.id)][0]}|${CAMPAIGN_MEMES[memeIndex(c.id)][1]}]]`,
      `Your dream physique won't build itself, but a coach by your side makes it a lot easier. Grab it before it's gone.`,
      ...(biz.phone ? [`Prefer to talk? Call or WhatsApp ${biz.phone}: ${liveChatUrl(biz.phone, `Hi, I'd like the offer: ${c.name}`)}`] : []),
      `— ${biz.coach}, ${biz.name}`,
    ].join("\n\n"),
    template: "",
    params: [],
    dedupeKey: `campaign:${c.id}:${r.email.toLowerCase()}`,
    link,
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

export type Preset = { id: string; name: string; segment: SegmentId; channel: "whatsapp" | "email"; link: LinkId; repeat: "none" | "weekly" | "monthly"; offer: string; subject: string; why: string };
type PlanLike = { id: string; name: string; price: number; duration: string; offer?: { title: string; gets: string; endsOn: string } };

const rupees = (n: number) => `₹${n.toLocaleString("en-IN")}`;
const fit = (s: string) => (s.length <= 160 ? s : `${s.slice(0, 157).trimEnd()}…`);

/**
 * The standard campaign for each segment, built from today's plans and any running offer, so the
 * text never quotes a price the plan cards don't show. Picking one only fills the form.
 */
export function playbook(plans: PlanLike[], months: (duration: string) => number): Preset[] {
  const monthly = plans.find((p) => p.id === "monthly") ?? plans[0];
  const yearly = plans.find((p) => p.id === "yearly");
  const cheapest = plans.length ? Math.min(...plans.map((p) => Math.round(p.price / months(p.duration)))) : 0;
  const until = (p?: PlanLike) => (p?.offer ? ` till ${p.offer.endsOn.split("-").reverse().join("/")}` : "");
  const presets: Preset[] = [];
  presets.push({
    id: "comeback",
    name: "Comeback: left in last 3 months",
    segment: "ex-recent",
    channel: "whatsapp",
    link: "membership",
    repeat: "monthly",
    offer: fit(monthly?.offer ? `${monthly.offer.title}: restart with ${monthly.offer.gets} for ${rupees(monthly.price)}${until(monthly)}` : `your spot is still here. Restart this month, plans from ${rupees(cheapest)} a month`),
    subject: "",
    why: "Recently lapsed members come back most often. Runs monthly for whoever newly lapses.",
  });
  presets.push({
    id: "winback",
    name: "Win-back: left over 3 months ago",
    segment: "ex-old",
    channel: "email",
    link: "gymtrial",
    repeat: "monthly",
    offer: "It's been a while! Come in for a free trial session with a trainer, see what's new on the floor, and restart only if it feels right.",
    subject: "Your free comeback session at Royal Fitness Club",
    why: "Email first: cheaper, and it doesn't risk WhatsApp blocks from people who've moved on.",
  });
  presets.push({
    id: "renew",
    name: "Renew & upgrade: expiring in 30 days",
    segment: "expiring",
    channel: "whatsapp",
    link: "membership",
    repeat: "weekly",
    offer: fit(yearly?.offer ? `renew before your plan ends. Annual is ${yearly.offer.gets} for ${rupees(yearly.price)}${until(yearly)}` : yearly ? `renew before your plan ends. Annual works out to ${rupees(Math.round(yearly.price / months(yearly.duration)))} a month` : "renew before your plan ends and keep your progress going"),
    subject: "",
    why: "On top of the automatic 7-day and 1-day reminders: pushes the longer plan a few weeks earlier.",
  });
  presets.push({
    id: "referral",
    name: "Refer a friend: current members",
    segment: "current",
    channel: "whatsapp",
    link: "gymtrial",
    repeat: "monthly",
    offer: "bring a friend! Their first trial session is free, and you both get bonus days when they join with your member code",
    subject: "",
    why: "Happy members are the cheapest new members. Bonus days are added automatically.",
  });
  presets.push({
    id: "leads",
    name: "Nudge: enquired but didn't join",
    segment: "leads",
    channel: "whatsapp",
    link: "gymtrial",
    repeat: "weekly",
    offer: "your free trial session with a trainer is still waiting. Pick a morning or evening batch that suits you",
    subject: "",
    why: "Catches enquiries the automatic 3-message follow-up didn't convert.",
  });
  return presets;
}
