import "server-only";
import { DIET_CHART, dietPlan } from "./config";
import { prepareDietPlan } from "./plan-delivery";
import { business, nurtureBusiness } from "./daily";
import { markDietPaid } from "./diet-orders";
import { applyPaidOrder, type Member } from "./members";
import { dietReceivedEmail, dietReceivedMessage, leadMessage, referralBonusMessage, welcomeMessage } from "./messages";
import { getLead, latestLeadByPhone } from "./leads";
import { nurtureDrafts } from "./nurture";
import { daysBetween, todayIST } from "./dates";
import { cancelPending, dispatch, enqueue } from "./outbox";
import { trackMemberJoined, trackMemberRenewed, trackMembership, trackTrialBooked } from "./resend-events";

// Called after a payment is confirmed (browser verify or Razorpay webhook, in either order).
// Each step is idempotent. Failures are logged, never thrown: the payment itself is already
// recorded, and the admin page lists paid orders that weren't applied.

/** Returns true if the order was a paid membership order that is now applied. */
export async function afterMembershipPaid(razorpayOrderId: string): Promise<boolean> {
  try {
    const applied = await applyPaidOrder(razorpayOrderId);
    if (!applied) return false;
    // Stops the Resend welcome series from sending its "join us" nudge to a paying member.
    if (applied.member.email) {
      await trackMembership(applied.member.email, applied.member.planName);
      // Email sequences: onboarding for a first membership, stop the renewal reminders for a renewal.
      if (applied.isNew) await trackMemberJoined(applied.member.email, applied.member.planName, applied.member.name);
      else await trackMemberRenewed(applied.member.email);
    }
    const biz = await business();
    const drafts = [welcomeMessage(applied.member, biz, applied.orderId)];
    if (applied.reward) drafts.push(referralBonusMessage(applied.reward.referrer, applied.member.name, applied.reward.days, biz, applied.reward.id));
    // Renewal reminders for the old expiry date are now pointless.
    await cancelPending("", applied.member.id);
    await enqueue(drafts);
    await dispatch(5);
    return true;
  } catch (err) {
    console.error("[growth] membership automation failed:", (err as Error).message);
    return false;
  }
}

/**
 * A member added or edited at the front desk (cash or UPI at the gym). Keeps the Resend sequences
 * in step with online payments: marks the contact as a member, starts onboarding for someone who
 * joined in the last week, and stops the renewal emails when the end date moves later.
 */
export async function afterDeskMemberSaved(before: Member | null, after: Member, today = todayIST()): Promise<void> {
  if (!after.email) return;
  try {
    await trackMembership(after.email, after.planName);
    const sameEmail = before?.email?.trim().toLowerCase() === after.email.trim().toLowerCase();
    if (!before || !sameEmail) {
      // A long-standing member entered (or given an email) now shouldn't get "your first week" emails.
      const since = daysBetween(after.startOn, today);
      if (since >= 0 && since <= 7) await trackMemberJoined(after.email, after.planName, after.name);
    }
    if (before && after.expiresOn > before.expiresOn) await trackMemberRenewed(after.email);
  } catch (err) {
    console.error("[growth] desk member email sync failed:", (err as Error).message);
  }
}

/**
 * Returns true if the order id was a diet-chart order. The first call for a payment confirms it to
 * the client (WhatsApp + email) and builds the draft plan. `defer` lets a route run the slow part
 * after its response (Next's after()); without it everything runs inline.
 */
export async function afterDietPaid(razorpayOrderId: string, paymentId: string, defer?: (fn: () => Promise<void>) => void): Promise<boolean> {
  const res = await markDietPaid(razorpayOrderId, paymentId);
  if (!res) return false;
  if (res.firstTime) {
    const work = async () => {
      try {
        const biz = await business();
        const planName = dietPlan(res.order.plan).name;
        const drafts = [dietReceivedMessage(res.order, biz, DIET_CHART.turnaround)];
        if (res.order.email) drafts.push(dietReceivedEmail({ id: res.order.id, name: res.order.name, email: res.order.email }, planName, DIET_CHART.turnaround, biz));
        await enqueue(drafts);
        await dispatch(5);
      } catch (err) {
        console.error("[growth] diet order message failed:", (err as Error).message);
      }
      try {
        await prepareDietPlan(res.order.id);
      } catch (err) {
        // The coach can still open the order in Diet Pro and make the plan by hand.
        console.error("[growth] diet plan generation failed:", (err as Error).message);
      }
    };
    if (defer) defer(work);
    else await work();
  }
  return true;
}

/**
 * Straight after a lead is saved: the WhatsApp thank-you (trial leads from forms) and the first
 * marketing email (anyone who opted in). Pass the lead id when known, else the latest by phone.
 */
export async function afterLeadSaved(phone: string, leadId?: string): Promise<void> {
  try {
    const lead = leadId ? await getLead(leadId) : await latestLeadByPhone(phone);
    if (!lead) return;
    // Free-trial form (home / contact page) with an email: the trial confirmation email sequence.
    if (lead.email && (lead.source === "home" || lead.source === "contact")) await trackTrialBooked(lead.email, lead.name);
    const drafts = [];
    if (lead.followUps) {
      const d = leadMessage("lead-0", lead, await business());
      if (d) drafts.push(d);
    }
    if (leadId) {
      const full = lead as Awaited<ReturnType<typeof getLead>>;
      if (full?.email && full.marketing && (full.interest === "diet" || full.interest === "pt" || full.interest === "membership"))
        drafts.push(...nurtureDrafts(todayIST(), [{ id: full.id, name: full.name, email: full.email, interest: full.interest, createdAt: full.createdAt }], await nurtureBusiness()));
    }
    if (!drafts.length) return;
    await enqueue(drafts);
    await dispatch(3);
  } catch (err) {
    console.error("[growth] lead follow-up failed:", (err as Error).message);
  }
}
