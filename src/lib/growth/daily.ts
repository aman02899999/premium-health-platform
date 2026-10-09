import "server-only";
import { getContent } from "@/lib/content/store";
import { SITE_URL } from "@/lib/site";
import { todayIST } from "./dates";
import { nurtureLeads, openLeads } from "./leads";
import { nurtureDrafts, type NurtureBiz } from "./nurture";
import { membersNearExpiry } from "./members";
import { dueMessages, type Biz } from "./messages";
import { dispatch, enqueue } from "./outbox";

export async function business(): Promise<Biz> {
  const b = (await getContent()).business;
  return { name: b.name, phone: b.phone, siteUrl: SITE_URL };
}

/** Business details the marketing emails need (WhatsApp link, coach, lowest membership price). */
export async function nurtureBusiness(): Promise<NurtureBiz> {
  const c = await getContent();
  // "Membership starts at ₹X a month": the one-month plan's price, if there is one.
  const monthly = (c.plans ?? []).find((p) => /^\s*1\s*month/i.test(p.duration) && p.price > 0);
  return {
    name: c.business.name,
    phone: c.business.phone,
    whatsapp: c.business.whatsapp || c.business.phone.replace(/\D/g, ""),
    siteUrl: SITE_URL,
    coach: `Coach ${(c.trainers?.[0]?.name || "Aman Sharma").replace(/^coach\s+/i, "")}`,
    membershipFrom: monthly?.price,
  };
}

/**
 * The daily automation: queue every reminder and follow-up that is due, then send what the
 * WhatsApp API can send. Safe to run more than once a day (the outbox dedupes).
 */
export async function runDaily(now = new Date()) {
  const today = todayIST(now);
  const [biz, members, leads, nb, nl] = await Promise.all([business(), membersNearExpiry(today), openLeads(today), nurtureBusiness(), nurtureLeads(today)]);
  const drafts = [...dueMessages(today, members, leads, biz), ...nurtureDrafts(today, nl, nb)];
  const queued = await enqueue(drafts);
  const sent = await dispatch();
  return { today, due: drafts.length, queued, ...sent };
}
