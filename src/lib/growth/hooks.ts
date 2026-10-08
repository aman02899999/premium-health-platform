import "server-only";
import { DIET_CHART } from "./config";
import { business } from "./daily";
import { markDietPaid } from "./diet-orders";
import { applyPaidOrder } from "./members";
import { dietReceivedMessage, leadMessage, referralBonusMessage, welcomeMessage } from "./messages";
import { latestLeadByPhone } from "./leads";
import { cancelPending, dispatch, enqueue } from "./outbox";

// Called after a payment is confirmed (browser verify or Razorpay webhook, in either order).
// Each step is idempotent. Failures are logged, never thrown: the payment itself is already
// recorded, and the admin page lists paid orders that weren't applied.

export async function afterMembershipPaid(razorpayOrderId: string): Promise<void> {
  try {
    const applied = await applyPaidOrder(razorpayOrderId);
    if (!applied) return;
    const biz = await business();
    const drafts = [welcomeMessage(applied.member, biz, applied.orderId)];
    if (applied.reward) drafts.push(referralBonusMessage(applied.reward.referrer, applied.member.name, applied.reward.days, biz, applied.reward.id));
    // Renewal reminders for the old expiry date are now pointless.
    await cancelPending("", applied.member.id);
    await enqueue(drafts);
    await dispatch(5);
  } catch (err) {
    console.error("[growth] membership automation failed:", (err as Error).message);
  }
}

/** Returns true if the order id was a diet-chart order. */
export async function afterDietPaid(razorpayOrderId: string, paymentId: string): Promise<boolean> {
  const res = await markDietPaid(razorpayOrderId, paymentId);
  if (!res) return false;
  if (res.firstTime) {
    try {
      await enqueue([dietReceivedMessage(res.order, await business(), DIET_CHART.turnaround)]);
      await dispatch(5);
    } catch (err) {
      console.error("[growth] diet order message failed:", (err as Error).message);
    }
  }
  return true;
}

/** Thanks a new trial lead on WhatsApp straight away (or queues it for the admin). */
export async function afterLeadSaved(phone: string): Promise<void> {
  try {
    const lead = await latestLeadByPhone(phone);
    if (!lead) return;
    const d = leadMessage("lead-0", lead, await business());
    if (!d) return;
    await enqueue([d]);
    await dispatch(3);
  } catch (err) {
    console.error("[growth] lead follow-up failed:", (err as Error).message);
  }
}
