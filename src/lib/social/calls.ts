import "server-only";
import { pool } from "@/health/db";
import { business } from "@/lib/growth/daily";
import { callFollowUpMessage } from "@/lib/growth/messages";
import { optedOutOfPromotions } from "@/lib/growth/optouts";
import { dispatch, enqueue } from "@/lib/growth/outbox";
import { wantsCallFollowUp, type CallEvent } from "./inbound";

// WhatsApp voice calls: every webhook event is stored (with its raw payload), and a customer's ended
// call gets the rfc_call_followup_v1 template, at most once per number per 7 days, never to a number
// that tapped "Stop promotions". Sending waits for CALL_FOLLOWUP=on, set once a real call's payload
// has confirmed the shape.

export const callFollowUpOn = () => process.env.CALL_FOLLOWUP === "on";

export async function handleCall(c: CallEvent): Promise<"duplicate" | "logged" | "off" | "opted-out" | "limited" | "queued"> {
  const ins = await pool.query(
    `insert into public.whatsapp_calls (id, event, from_id, status, direction, payload) values ($1, $2, $3, $4, $5, $6) on conflict (id, event) do nothing`,
    [c.id, c.event, c.from, c.status, c.direction, JSON.stringify(c.raw ?? null).slice(0, 20000)],
  );
  if (!ins.rowCount) return "duplicate";
  if (!wantsCallFollowUp(c)) return "logged";
  if (!callFollowUpOn()) return "off";
  if (await optedOutOfPromotions(c.from)) return "opted-out";
  const { rowCount } = await pool.query(
    `select 1 from public.message_outbox where kind = 'call-followup' and to_address = $1 and status in ('pending', 'sent') and created_at > now() - interval '7 days'`,
    [c.from],
  );
  if (rowCount) return "limited";
  await enqueue([callFollowUpMessage(c, await business())]);
  await dispatch(3);
  return "queued";
}
