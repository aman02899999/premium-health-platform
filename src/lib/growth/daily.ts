import "server-only";
import { getContent } from "@/lib/content/store";
import { SITE_URL } from "@/lib/site";
import { todayIST } from "./dates";
import { openLeads } from "./leads";
import { membersNearExpiry } from "./members";
import { dueMessages, type Biz } from "./messages";
import { dispatch, enqueue } from "./outbox";

export async function business(): Promise<Biz> {
  const b = (await getContent()).business;
  return { name: b.name, phone: b.phone, siteUrl: SITE_URL };
}

/**
 * The daily automation: queue every reminder and follow-up that is due, then send what the
 * WhatsApp API can send. Safe to run more than once a day (the outbox dedupes).
 */
export async function runDaily(now = new Date()) {
  const today = todayIST(now);
  const [biz, members, leads] = await Promise.all([business(), membersNearExpiry(today), openLeads(today)]);
  const drafts = dueMessages(today, members, leads, biz);
  const queued = await enqueue(drafts);
  const sent = await dispatch();
  return { today, due: drafts.length, queued, ...sent };
}
