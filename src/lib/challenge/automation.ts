// What happens without anyone pressing a button (owner, 28 Nov: "fully automated"):
//  1. A player finishes → if they ticked "you may contact me", they become a website lead
//     (source "challenge"), which starts the normal sales follow-up: the welcome WhatsApp, the
//     coach's speed-to-lead email and the nurture emails. Once per person per month.
//  2. The month ends → the daily cron finalises it: prizes are handed out within the caps, each
//     winner gets an email with their claim code, and the coach gets the winners list.
import "server-only";
import { after } from "next/server";
import { business } from "@/lib/growth/daily";
import { afterLeadSaved } from "@/lib/growth/hooks";
import { insertLead } from "@/lib/growth/leads";
import { enqueue } from "@/lib/growth/outbox";
import type { Draft } from "@/lib/growth/messages";
import { SITE_URL } from "@/lib/site";
import { levelName, monthLabel, monthOf, scorePct, tierFor } from "./levels";
import { PRIZES, inr, type PrizeId } from "./prizes";
import { finaliseMonth, getProfile, isFinalised, markLeadSent, type Finished } from "./store";

/** Hands a finished player to the sales follow-up, when they agreed to be contacted. */
export async function toSalesFunnel(userId: string, f: Finished): Promise<boolean> {
  const p = await getProfile(userId);
  if (!p?.contactConsent) return false;
  if (!(await markLeadSent(userId, f.month))) return false;
  const pct = scorePct(f.correct);
  const id = await insertLead({
    name: `${p.firstName}${p.lastInitial ? ` ${p.lastInitial}.` : ""}`,
    phone: p.phone,
    email: p.email || null,
    interest: p.area === "ncr" ? "membership" : "diet",
    goal: "Knowledge Challenge",
    message: `Royal Knowledge Challenge: ${levelName(f.level)} ${pct}%${tierFor(f.correct) ? " (passed)" : ""}. ${p.area === "ncr" ? "Lives in Noida/NCR." : "Outside NCR: offer the online diet plan."}`,
    source: "challenge",
    marketing: true,
  });
  after(() => afterLeadSaved(p.phone, id));
  return true;
}

export function prizeLine(prize: PrizeId): string {
  const p = PRIZES[prize];
  return `${p.name}${p.extra ? ` ${p.extra}` : ""}${p.worth ? ` (worth ${inr(p.worth)})` : ""}`;
}

/** The winner's email: what they won, the claim code, how to collect it. */
export function winnerEmail(w: { email: string; firstName: string; prize: PrizeId; claimCode: string; month: string }, phone: string): Draft {
  const gym = PRIZES[w.prize].gym;
  const how = gym
    ? `Collect it at the gym within 30 days. Bring this claim code and a photo ID with the same name.\nRoyal Fitness Club, Main Road, near Gali No. 3, Gejha Village, Sector 93, Noida\nMon–Sat 5:30–11:00 AM and 4:00–10:00 PM (Sunday closed)`
    : `To start your plan, message or call us on ${phone} within 30 days with this claim code. Our coach will set it up with you.`;
  const body = [
    `Hi ${w.firstName},`,
    `Badhai ho! In the Royal Knowledge Challenge for ${monthLabel(w.month)} you won:\n${prizeLine(w.prize)}`,
    `Your claim code: ${w.claimCode}`,
    how,
    `Questions? Call or WhatsApp ${phone}.`,
    `[[CTA:See your prize|${SITE_URL}/challenge/me]]`,
  ].join("\n\n");
  return { channel: "email", to: w.email, toName: w.firstName, kind: "challenge-winner", subject: `You won: ${PRIZES[w.prize].name}`, body, template: "", params: [], dedupeKey: `challenge-winner:${w.claimCode}` };
}

export function coachSummary(month: string, winners: { firstName: string; prize: PrizeId; claimCode: string }[], to: string): Draft {
  const lines = winners.map((w) => `• ${w.firstName}: ${PRIZES[w.prize].name} (${w.claimCode})`);
  const body = [
    `${monthLabel(month)} Knowledge Challenge is finalised: ${winners.length} prize${winners.length === 1 ? "" : "s"}.`,
    lines.join("\n") || "No one qualified for a prize this month.",
    `Mark each prize collected in Admin → Knowledge Challenge when they come in.`,
    `[[CTA:Open the prize desk|${SITE_URL}/admin/challenge]]`,
  ].join("\n\n");
  return { channel: "email", to, toName: "Coach", kind: "admin-challenge-winners", subject: `Knowledge Challenge winners: ${monthLabel(month)}`, body: body.slice(0, 6000), template: "", params: [], dedupeKey: `admin-challenge-winners:${month}` };
}

/** The month before `now`'s India month, e.g. on 1 Jan 2027 → "2026-12". */
export function previousMonth(now = new Date()): string {
  const [y, m] = monthOf(now).split("-").map(Number);
  return m === 1 ? `${y - 1}-12` : `${y}-${String(m - 1).padStart(2, "0")}`;
}

/** Finalises a month once and queues the winner emails and the coach's list. Null if already done. */
export async function finaliseAndNotify(month: string, by: string): Promise<{ awards: number; queued: number } | null> {
  const winners = await finaliseMonth(month, by);
  if (!winners) return null;
  const phone = (await business()).phone;
  const drafts = winners.filter((w) => w.email).map((w) => winnerEmail({ ...w, month }, phone));
  const coach = process.env.COACH_EMAIL;
  if (coach) drafts.push(coachSummary(month, winners, coach));
  return { awards: winners.length, queued: await enqueue(drafts) };
}

/** Called by the daily cron: finalises last month once and queues the emails. */
export async function monthEndJob(now = new Date()): Promise<{ month: string; finalised: boolean; awards: number; queued: number }> {
  const month = previousMonth(now);
  if (month < "2026-12" || (await isFinalised(month))) return { month, finalised: false, awards: 0, queued: 0 };
  const r = await finaliseAndNotify(month, "automatic (daily run)");
  return r ? { month, finalised: true, ...r } : { month, finalised: false, awards: 0, queued: 0 };
}
