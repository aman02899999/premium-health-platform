// The admin Command Center: every tool in one launcher, grouped the way a messaging-marketing
// console groups them (Start here / Grow / Manage / Settings), with live numbers on the tiles that
// need a person. Pure (tile list, search, chart maths) so it is tested without a database; the
// numbers come from hub-data.ts.

export type Counters = {
  /** WhatsApp conversations whose last message is the customer's (last 7 days). */
  chatsWaiting: number;
  leadsToday: number;
  /** Form leads still "new" 2 hours to 3 days after arriving. */
  leadsUncontacted: number;
  trialsToday: number;
  activeMembers: number;
  expiring7: number;
  /** Paid diet plans waiting for the coach. */
  plansToReview: number;
  /** Messages waiting in the outbox (campaign promotions held by the daily cap included). */
  pending: number;
  failed7: number;
  revenueToday: number;
  revenue30: number;
  /** Campaign messages sent in the last 7 days, and how many were delivered / read / clicked. */
  campaign7: { sent: number; delivered: number; read: number; clicked: number };
  shopToShip: number;
  reviewsPending: number;
};

export type CounterKey = Exclude<keyof Counters, "campaign7">;

export type Tile = {
  id: string;
  title: string;
  hint: string;
  href: string;
  /** Lucide icon name, resolved by the page. */
  icon: string;
  /** Extra words people search for ("broadcast" finds Campaigns). */
  keywords: string;
  /** The live number on the tile, and whether a non-zero value needs attention. */
  badge?: { key: CounterKey; alert?: boolean; format?: "inr" };
};

export type Section = { id: string; title: string; tiles: Tile[] };

export const HUB_SECTIONS: Section[] = [
  {
    id: "start",
    title: "Start here",
    tiles: [
      { id: "chats", title: "Live Chat", hint: "WhatsApp inbox, quick replies, templates", href: "/admin/chats", icon: "MessageCircle", keywords: "whatsapp inbox reply conversation team inbox", badge: { key: "chatsWaiting", alert: true } },
      { id: "broadcast", title: "Broadcast", hint: "Send an offer to a segment, WhatsApp + email", href: "/admin/audience", icon: "Megaphone", keywords: "campaign bulk send blast promotion offer", badge: { key: "pending" } },
      { id: "ads", title: "Ads Manager", hint: "Ad links, spend, cost per lead, return on spend", href: "/admin/ads", icon: "TrendingUp", keywords: "ads advertising facebook instagram meta google campaign spend roi roas cpl click to whatsapp audience" },
      { id: "today", title: "Today's tasks", hint: "Who to call, renewals, trials, follow-ups", href: "/admin/growth?tab=today", icon: "ListChecks", keywords: "todo calls renewals dashboard", badge: { key: "trialsToday" } },
      { id: "social", title: "Social & Reels", hint: "Daily posts, reels, Business app kit", href: "/admin/growth?tab=social", icon: "Clapperboard", keywords: "instagram facebook reel post images ai creative greeting away quick replies", badge: undefined },
    ],
  },
  {
    id: "grow",
    title: "Grow",
    tiles: [
      { id: "campaigns", title: "Campaigns", hint: "Delivered, read, clicked, replied, revenue", href: "/admin/audience", icon: "Send", keywords: "broadcast results funnel delivered read clicks roi" },
      { id: "contacts", title: "Contacts", hint: "Everyone in one list: tags, lists, attributes", href: "/admin/contacts", icon: "Contact", keywords: "people crm audience list tags attributes segment export csv customer" },
      { id: "import", title: "Import & segments", hint: "Upload lists, segment sizes, Meta ads audience export", href: "/admin/audience#contacts", icon: "Upload", keywords: "import upload excel csv sheet segment ads custom audience" },
      { id: "leads", title: "Leads", hint: "Enquiries, trial bookings, follow-ups", href: "/admin/growth?tab=leads", icon: "UserPlus", keywords: "enquiry prospect trial crm", badge: { key: "leadsUncontacted", alert: true } },
      { id: "members", title: "Members", hint: "Add, renew, import the desk sheet", href: "/admin/growth?tab=members", icon: "Users", keywords: "membership renew expiry desk import", badge: { key: "expiring7" } },
      { id: "automations", title: "Automations", hint: "Scheduled messages: renewals, nurture, receipts", href: "/admin/growth?tab=messages", icon: "Workflow", keywords: "outbox sequence drip scheduled auto reminder", badge: { key: "failed7", alert: true } },
      { id: "qr", title: "QR codes & opt-ins", hint: "Posters that open WhatsApp, scans, consent", href: "/admin/qr", icon: "QrCode", keywords: "qr poster scan print opt-in optin consent subscribe opt-out stop promotions review" },
      { id: "templates", title: "WhatsApp templates", hint: "Meta approval status, submit missing ones", href: "/api/admin/whatsapp-templates", icon: "FileCheck2", keywords: "template meta approval utility marketing" },
      { id: "referrals", title: "Referrals", hint: "Member codes and bonus days", href: "/admin/growth?tab=referrals", icon: "Gift", keywords: "refer friend reward code" },
      { id: "marketing", title: "Content calendar", hint: "Today's post, captions, hashtags", href: "/admin/growth?tab=marketing", icon: "CalendarDays", keywords: "calendar caption hashtag content plan" },
      { id: "analytics", title: "Analytics", hint: "Leads, messages, revenue, by day", href: "/admin/analytics", icon: "BarChart3", keywords: "insights report stats chart performance", badge: { key: "revenue30", format: "inr" } },
      { id: "reviews", title: "Reviews", hint: "Approve reviews, Google review requests", href: "/admin/reviews", icon: "Star", keywords: "rating google testimonial", badge: { key: "reviewsPending", alert: true } },
    ],
  },
  {
    id: "sell",
    title: "Sell",
    tiles: [
      { id: "payments", title: "Payments", hint: "Online memberships and refunds", href: "/admin/website?tab=payments", icon: "IndianRupee", keywords: "razorpay order refund money", badge: { key: "revenueToday", format: "inr" } },
      { id: "diet", title: "Diet plan orders", hint: "Write, approve and send paid plans", href: "/admin/growth?tab=diet", icon: "Salad", keywords: "diet chart order plan nutrition", badge: { key: "plansToReview", alert: true } },
      { id: "shop", title: "Supplements store", hint: "Products, combos, orders, shipping", href: "/admin/shop", icon: "ShoppingBag", keywords: "shop store product order ship supplement", badge: { key: "shopToShip", alert: true } },
      { id: "diet-pro", title: "Diet calculator", hint: "Build a plan for a client", href: "/admin/diet-pro", icon: "Calculator", keywords: "macro calorie food plan builder" },
    ],
  },
  {
    id: "manage",
    title: "Manage",
    tiles: [
      { id: "website", title: "Website content", hint: "Business info, home, programs, plans, trainers", href: "/admin/website", icon: "LayoutTemplate", keywords: "edit site page hero program plan price trainer gallery" },
      { id: "enquiries", title: "Enquiries", hint: "Every website form submission", href: "/admin/website?tab=leads", icon: "Inbox", keywords: "form contact submission", badge: { key: "leadsToday" } },
      { id: "blog", title: "Blog", hint: "Write and publish articles", href: "/admin/website?tab=blog", icon: "FileText", keywords: "article post seo write" },
      { id: "seo", title: "SEO & theme", hint: "Titles, descriptions, colours", href: "/admin/website?tab=seo", icon: "Search", keywords: "google meta title description theme colour" },
      { id: "library", title: "Book library", hint: "E-books, sales and reviews", href: "/admin/website?tab=library", icon: "BookOpen", keywords: "ebook book pdf" },
      { id: "faqs", title: "FAQs & results", hint: "Questions, member results, testimonials", href: "/admin/website?tab=faqs", icon: "HelpCircle", keywords: "faq question answer result testimonial" },
    ],
  },
  {
    id: "settings",
    title: "Settings",
    tiles: [
      { id: "system", title: "System status", hint: "WhatsApp, email, payments, daily run", href: "/admin/growth?tab=today#system", icon: "Activity", keywords: "health setup status cron integration api key" },
      { id: "business", title: "Business details", hint: "Phone, WhatsApp, hours, address", href: "/admin/website?tab=business", icon: "Building2", keywords: "phone number hours address timing whatsapp" },
      { id: "site", title: "View live site", hint: "Open the website in a new tab", href: "/", icon: "ExternalLink", keywords: "preview open website" },
    ],
  },
];

const words = (s: string) => s.toLowerCase().split(/\s+/).filter(Boolean);

/** Tiles matching every word of the query (title, hint and keywords); the whole layout when empty. */
export function filterSections(query: string, sections: Section[] = HUB_SECTIONS): Section[] {
  const q = words(query);
  if (!q.length) return sections;
  return sections
    .map((s) => ({ ...s, tiles: s.tiles.filter((t) => { const hay = `${t.title} ${t.hint} ${t.keywords} ${s.title}`.toLowerCase(); return q.every((w) => hay.includes(w)); }) }))
    .filter((s) => s.tiles.length);
}

export const inr = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;
export const pctOf = (part: number, whole: number) => (whole ? Math.round((part / whole) * 100) : 0);

export function badgeText(t: Tile, c: Counters | null): string | null {
  if (!t.badge || !c) return null;
  const v = c[t.badge.key];
  if (!v) return null;
  return t.badge.format === "inr" ? inr(v) : String(v);
}

/** What needs a person right now, most urgent first, in plain words. */
export function attention(c: Counters): { text: string; href: string; tone: "red" | "amber" }[] {
  const out: { text: string; href: string; tone: "red" | "amber" }[] = [];
  const s = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;
  if (c.chatsWaiting) out.push({ text: `${s(c.chatsWaiting, "WhatsApp chat is", "WhatsApp chats are")} waiting for a reply`, href: "/admin/chats", tone: "red" });
  if (c.leadsUncontacted) out.push({ text: `${s(c.leadsUncontacted, "lead hasn't", "leads haven't")} been called yet`, href: "/admin/growth?tab=leads", tone: "red" });
  if (c.trialsToday) out.push({ text: `${s(c.trialsToday, "free trial", "free trials")} booked today`, href: "/admin/growth?tab=today", tone: "amber" });
  if (c.plansToReview) out.push({ text: `${s(c.plansToReview, "paid diet plan needs", "paid diet plans need")} the coach`, href: "/admin/growth?tab=diet", tone: "red" });
  if (c.shopToShip) out.push({ text: `${s(c.shopToShip, "store order", "store orders")} to pack and ship`, href: "/admin/shop", tone: "amber" });
  if (c.expiring7) out.push({ text: `${s(c.expiring7, "membership ends", "memberships end")} in the next 7 days`, href: "/admin/growth?tab=members", tone: "amber" });
  if (c.failed7) out.push({ text: `${s(c.failed7, "message", "messages")} failed this week`, href: "/admin/growth?tab=messages", tone: "amber" });
  if (c.reviewsPending) out.push({ text: `${s(c.reviewsPending, "review waits", "reviews wait")} for approval`, href: "/admin/reviews", tone: "amber" });
  return out;
}

// ── Analytics ────────────────────────────────────────────────────────────────────────────

export type DayRow = { day: string; leads: number; sent: number; delivered: number; read: number; clicked: number; inbound: number; revenue: number; orders: number };

export const ANALYTICS_RANGES = [7, 30, 90] as const;
export const analyticsRange = (v: unknown): (typeof ANALYTICS_RANGES)[number] => ANALYTICS_RANGES.find((r) => String(r) === String(v)) ?? 30;

/** One row per day from `from` to `to` (inclusive), zeros where the database had nothing. */
export function fillDays(rows: Partial<DayRow>[], from: string, to: string): DayRow[] {
  const by = new Map(rows.map((r) => [r.day, r]));
  const out: DayRow[] = [];
  for (let d = new Date(`${from}T00:00:00Z`); d.toISOString().slice(0, 10) <= to; d.setUTCDate(d.getUTCDate() + 1)) {
    const day = d.toISOString().slice(0, 10);
    const r = by.get(day) ?? {};
    out.push({ day, leads: r.leads ?? 0, sent: r.sent ?? 0, delivered: r.delivered ?? 0, read: r.read ?? 0, clicked: r.clicked ?? 0, inbound: r.inbound ?? 0, revenue: r.revenue ?? 0, orders: r.orders ?? 0 });
  }
  return out;
}

export function totals(rows: DayRow[]): Omit<DayRow, "day"> {
  return rows.reduce((t, r) => ({ leads: t.leads + r.leads, sent: t.sent + r.sent, delivered: t.delivered + r.delivered, read: t.read + r.read, clicked: t.clicked + r.clicked, inbound: t.inbound + r.inbound, revenue: t.revenue + r.revenue, orders: t.orders + r.orders }), {
    leads: 0,
    sent: 0,
    delivered: 0,
    read: 0,
    clicked: 0,
    inbound: 0,
    revenue: 0,
    orders: 0,
  });
}

/** Change against the previous period of the same length, as a whole percent (null when there was nothing before). */
export const change = (now: number, before: number): number | null => (before ? Math.round(((now - before) / before) * 100) : null);
