// Ad creatives built from the site's live data: the admin's plans and offers, the business
// details and the diet plans. Pure (no I/O), so the image route, the admin gallery and the
// tests all see the same thing. Because every price comes from applyOffer, an ad image can never
// show a price the join page doesn't charge, and offer creatives disappear by themselves the day
// after an offer ends.
//
// House rules baked in: no before/after, no weight-loss promises, no invented counts, the
// rating always names Justdial, and the only deadline shown is the offer's real end date.
import { DIET_PLANS } from "@/lib/growth/config";
import { daysBetween, formatDate } from "@/lib/growth/dates";
import { activeOffer, applyOffer } from "@/lib/offers";
import type { SiteContent } from "@/lib/content/types";

export type CreativeSize = "feed" | "story" | "square";
export const CREATIVE_SIZES: Record<CreativeSize, { w: number; h: number; label: string }> = {
  feed: { w: 1080, h: 1350, label: "Feed 4:5" },
  story: { w: 1080, h: 1920, label: "Story / Reel 9:16" },
  square: { w: 1080, h: 1080, label: "Square 1:1" },
};
export const isCreativeSize = (s: unknown): s is CreativeSize => typeof s === "string" && s in CREATIVE_SIZES;

export type CreativeRow = { label: string; price: string; was?: string; note?: string };

export type Creative = {
  id: string;
  /** Short name for the admin gallery. */
  name: string;
  /** Small line above the headline. */
  kicker: string;
  headline: string;
  sub: string;
  rows: CreativeRow[];
  cta: string;
  /** Ready-to-paste primary text for Ads Manager. */
  primaryText: string;
  /** Ready-to-paste Ads Manager headline (40 characters or fewer). */
  adHeadline: string;
  /** Last day it's true (the offer's end), or null for evergreen creatives. */
  validUntil: string | null;
  /** Where the ad should send people. */
  landing: string;
};

export type CreativeFacts = {
  locality: string;
  street: string;
  phone: string;
  rating: { value: number; count: number; source: string } | null;
  hours: string;
};

const rupees = (n: number) => `₹${n.toLocaleString("en-IN")}`;

export function creativeFacts(c: SiteContent): CreativeFacts {
  const b = c.business;
  const t = (hm: string) => {
    const [h, m] = hm.split(":").map(Number);
    const h12 = ((h + 11) % 12) + 1;
    return `${h12}${m ? `:${String(m).padStart(2, "0")}` : ""} ${h < 12 ? "AM" : "PM"}`;
  };
  const hours = b.hours.length ? `Mon–Sat ${b.hours.map((x) => `${t(x.open)}–${t(x.close)}`).join(" & ")}` : "";
  const r = b.rating;
  return {
    locality: `${b.address.locality}, ${b.address.city}`,
    street: b.address.street,
    phone: b.phone,
    rating: r && r.value > 0 && r.count > 0 ? { value: r.value, count: r.count, source: r.source } : null,
    hours,
  };
}

/** "4.7★ on Justdial (303+ ratings)", never "member reviews". */
export const ratingLine = (f: CreativeFacts) => (f.rating ? `${f.rating.value}★ on ${f.rating.source} (${f.rating.count}+ ratings)` : "");

function footer(f: CreativeFacts) {
  return [`${f.street}, ${f.locality}.`, f.hours, `Call / WhatsApp ${f.phone}.`].filter(Boolean).join(" ");
}

/** Every creative that is true on `today` (YYYY-MM-DD, India time). */
export function adCreatives(c: SiteContent, today: string): Creative[] {
  const f = creativeFacts(c);
  const out: Creative[] = [];
  const offer = activeOffer(today, c.offers ?? []);
  const plans = applyOffer(c.plans, today, c.offers ?? []);
  const rating = ratingLine(f);

  if (offer) {
    const ends = formatDate(offer.endsOn);
    const offerRows: CreativeRow[] = plans
      .filter((p) => p.offer && offer.plans[p.id])
      .map((p) => ({
        label: p.name,
        price: rupees(p.price),
        was: offer.plans[p.id].showStandard && p.offer!.standardPrice > p.price ? rupees(p.offer!.standardPrice) : undefined,
        note: p.offer!.gets,
      }));
    if (offerRows.length) {
      const list = offerRows.map((r) => `${r.label} ${r.price}${r.note ? ` (${r.note})` : ""}`).join(", ");
      out.push({
        id: "offer-prices",
        name: `${offer.title}: price list`,
        kicker: `${offer.title} · till ${ends}`,
        headline: `Join from ${offerRows.reduce((m, r) => (Number(r.price.replace(/\D/g, "")) < Number(m.replace(/\D/g, "")) ? r.price : m), offerRows[0].price)}`,
        sub: `Royal Fitness Club, ${f.locality}`,
        rows: offerRows.slice(0, 4),
        cta: "WhatsApp for a free trial",
        primaryText: `Sector 93 mein gym dhoondh rahe ho? ${offer.title} ${ends} tak: ${list}. Couple prices standard. Free trial ke liye WhatsApp karo. ${footer(f)}`,
        adHeadline: "Free trial at Royal Fitness Club",
        validUntil: offer.endsOn,
        landing: "/membership",
      });
    }

    const female = plans.find((p) => p.id === "female-special");
    if (female) {
      out.push({
        id: "female-special",
        name: "Female's Special",
        kicker: `${offer.title} · till ${ends}`,
        headline: `${female.name} ${rupees(female.price)}`,
        sub: female.offer?.gets || female.duration,
        rows: female.perks.slice(0, 3).map((p) => ({ label: p, price: "" })),
        cta: "WhatsApp for a free trial",
        primaryText: `Ladies, gym shuru karna hai? ${female.name}: ${rupees(female.price)} mein ${female.offer?.gets || female.duration}. Morning & evening batches. ${ends} tak. ${footer(f)}`,
        adHeadline: `${female.name} ${rupees(female.price)}`,
        validUntil: offer.endsOn,
        landing: "/membership",
      });
    }

    const annual = plans.find((p) => p.id === "yearly" && p.offer);
    if (annual) {
      out.push({
        id: "annual-value",
        name: "Annual plan value",
        kicker: `${offer.title} · till ${ends}`,
        headline: `${annual.name} ${rupees(annual.price)}`,
        sub: annual.offer!.gets,
        rows: [...(annual.offer!.perks ?? []), ...annual.perks.filter((p) => !/^Everything in/i.test(p))].filter((p, i, a) => a.indexOf(p) === i).slice(0, 3).map((p) => ({ label: p, price: "" })),
        cta: "WhatsApp to join",
        primaryText: `Poore saal ki fitness, ek baar mein: ${annual.name} ${rupees(annual.price)} = ${annual.offer!.gets}. Sirf ${ends} tak. ${footer(f)}`,
        adHeadline: `${annual.name} ${rupees(annual.price)}, ${offer.title}`.slice(0, 40),
        validUntil: offer.endsOn,
        landing: "/membership",
      });
    }

    // A real deadline, shown only in the last two weeks, with a true day count.
    const left = daysBetween(today, offer.endsOn);
    if (left >= 0 && left <= 14 && offerRows.length) {
      const when = left === 0 ? "Last day today" : left === 1 ? "Ends tomorrow" : `${left + 1} days left`;
      out.push({
        id: "offer-ends",
        name: "Offer ending",
        kicker: when,
        headline: `${offer.title} ends ${ends}`,
        sub: "After that, standard prices come back.",
        rows: offerRows.slice(0, 3),
        cta: "WhatsApp to lock the price",
        primaryText: `${offer.title} ${ends} ko khatam ho raha hai. ${offerRows.map((r) => `${r.label} ${r.price}`).join(", ")}. Uske baad standard prices. ${footer(f)}`,
        adHeadline: `${offer.title} ends ${ends}`.slice(0, 40),
        validUntil: offer.endsOn,
        landing: "/membership",
      });
    }
  }

  out.push({
    id: "free-trial",
    name: "Free trial (evergreen)",
    kicker: `Royal Fitness Club · ${f.locality}`,
    headline: "Your first workout is free",
    sub: "A coach shows you around and trains you through a full session.",
    rows: [
      ...(rating ? [{ label: rating, price: "" }] : []),
      ...(f.hours ? [{ label: f.hours, price: "" }] : []),
      { label: f.street, price: "" },
    ],
    cta: "WhatsApp to book your trial",
    primaryText: `Gym join karne se pehle try karo. Royal Fitness Club mein pehla workout free: coach machine, form aur plan samjhayenge. ${rating ? `${rating}. ` : ""}${footer(f)}`,
    adHeadline: "Book a free trial workout",
    validUntil: null,
    landing: "/membership",
  });

  const trial = DIET_PLANS.find((p) => p.trial);
  if (trial) {
    out.push({
      id: "diet-trial",
      name: `${trial.name} ${rupees(trial.priceRupees)}`,
      kicker: "Personal diet chart",
      headline: `7-day diet plan for ${rupees(trial.priceRupees)}`,
      sub: trial.summary.split(" · ")[0],
      rows: trial.summary
        .split(" · ")
        .slice(1)
        .map((s) => ({ label: s.charAt(0).toUpperCase() + s.slice(1), price: "" })),
      cta: "Order on the website",
      primaryText: `Ghar ka khana, apne goal ke hisaab se. ${trial.name}: ${rupees(trial.priceRupees)} mein ${trial.summary.replace(/ · /g, ", ")}. PDF WhatsApp aur email par. Royal Fitness Club, ${f.locality}.`,
      adHeadline: `${trial.name} ${rupees(trial.priceRupees)}`,
      validUntil: null,
      landing: "/diet-chart?plan=trial#order",
    });
  }

  return out;
}

/** "offer-prices-feed.jpg" → { id, size }. */
export function parseCreativeFile(file: string): { id: string; size: CreativeSize } | null {
  const m = /^([a-z0-9-]{3,40})-(feed|story|square)\.jpg$/.exec(file);
  return m ? { id: m[1], size: m[2] as CreativeSize } : null;
}
