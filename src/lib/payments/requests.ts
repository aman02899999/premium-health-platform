import "server-only";
import { pool } from "@/health/db";
import { getContent } from "@/lib/content/store";
import { SITE_URL } from "@/lib/site";
import { indianMobile } from "@/lib/social/inbound";
import { recordReply } from "@/lib/social/chat";
import { sendWhatsAppText } from "@/lib/social/meta";
import { createRazorpayOrder, razorpayConfigured, razorpayKeyId } from "./razorpay";
import { REQUEST_DAYS, cleanPurpose, isToken, newToken, parseAmount, payUrl, receiptMessage, requestState, type RequestState } from "./requests-core";

export type PaymentRequest = {
  id: string;
  token: string;
  url: string;
  purpose: string;
  rupees: number;
  name: string;
  phone: string | null;
  state: RequestState;
  createdAt: string;
  createdBy: string;
  paidAt: string | null;
  paymentId: string | null;
  refundedRupees: number;
};

type Row = { id: string; token: string; purpose: string; amount_paise: number; name: string; phone: string | null; status: string; expires_at: Date; created_at: Date; created_by: string; paid_at: Date | null; razorpay_payment_id: string | null; refunded_paise: number };

const toRequest = (r: Row): PaymentRequest => ({
  id: r.id,
  token: r.token,
  url: payUrl(SITE_URL, r.token),
  purpose: r.purpose,
  rupees: r.amount_paise / 100,
  name: r.name,
  phone: r.phone,
  state: requestState({ status: r.status, expiresAt: r.expires_at }),
  createdAt: r.created_at.toISOString(),
  createdBy: r.created_by,
  paidAt: r.paid_at?.toISOString() ?? null,
  paymentId: r.razorpay_payment_id,
  refundedRupees: r.refunded_paise / 100,
});

const COLS = `id, token, purpose, amount_paise, name, phone, status, expires_at, created_at, created_by, paid_at, razorpay_payment_id, refunded_paise`;

export async function createRequest(b: { purpose?: unknown; amount?: unknown; peer?: string; name?: string }, by: string): Promise<{ ok: true; request: PaymentRequest } | { ok: false; error: string }> {
  const purpose = cleanPurpose(b.purpose);
  if (!purpose) return { ok: false, error: "Say what the payment is for." };
  const rupees = parseAmount(b.amount);
  if (rupees === null) return { ok: false, error: "Enter an amount between ₹1 and ₹5,00,000." };
  const phone = b.peer ? indianMobile(b.peer) : null;
  const { rows } = await pool.query<Row>(
    `insert into public.payment_requests (created_by, token, purpose, amount_paise, name, phone, expires_at)
     values ($1, $2, $3, $4, $5, $6, now() + make_interval(days => $7)) returning ${COLS}`,
    [by.slice(0, 200), newToken(), purpose, Math.round(rupees * 100), (b.name ?? "").slice(0, 80), phone, REQUEST_DAYS],
  );
  return { ok: true, request: toRequest(rows[0]) };
}

export async function requestsFor(peer: string, limit = 10): Promise<PaymentRequest[]> {
  const phone = indianMobile(peer);
  if (!phone) return [];
  const { rows } = await pool.query<Row>(`select ${COLS} from public.payment_requests where phone = $1 order by created_at desc limit $2`, [phone, limit]);
  return rows.map(toRequest);
}

export async function listRequests(limit = 100): Promise<PaymentRequest[]> {
  const { rows } = await pool.query<Row>(`select ${COLS} from public.payment_requests order by created_at desc limit $1`, [limit]);
  return rows.map(toRequest);
}

/** The public view of a request for /pay/<token>, or null when the code is unknown. */
export async function requestByToken(token: string): Promise<PaymentRequest | null> {
  if (!isToken(token)) return null;
  const { rows } = await pool.query<Row>(`select ${COLS} from public.payment_requests where token = $1`, [token]);
  return rows[0] ? toRequest(rows[0]) : null;
}

/**
 * Starts (or resumes) the Razorpay order for an open request. One order per request: opening
 * the link twice reuses it, so the customer can never be charged twice through one link.
 */
export async function startRequestOrder(token: string): Promise<{ ok: true; keyId: string; orderId: string; amount: number; currency: "INR"; description: string; prefill: { name: string; contact: string } } | { ok: false; status: number; error: string }> {
  if (!razorpayConfigured()) return { ok: false, status: 503, error: "Online payment isn't available right now. Please pay at the desk." };
  const { rows } = await pool.query<Row & { razorpay_order_id: string | null }>(`select ${COLS}, razorpay_order_id from public.payment_requests where token = $1`, [token]);
  const r = rows[0];
  if (!r) return { ok: false, status: 404, error: "This payment link doesn't exist." };
  const state = requestState({ status: r.status, expiresAt: r.expires_at });
  if (state !== "open") return { ok: false, status: 409, error: state === "paid" ? "This has already been paid. Thank you!" : "This payment link has expired. Ask us on WhatsApp for a new one." };
  let orderId = r.razorpay_order_id;
  if (!orderId) {
    const order = await createRazorpayOrder({ amountPaise: r.amount_paise, receipt: `req_${r.id.slice(0, 30)}`, notes: { kind: "request", purpose: r.purpose.slice(0, 100) } });
    // Two taps at once: keep whichever order was stored first.
    const set = await pool.query<{ razorpay_order_id: string }>(
      `update public.payment_requests set razorpay_order_id = coalesce(razorpay_order_id, $2) where id = $1 returning razorpay_order_id`,
      [r.id, order.id],
    );
    orderId = set.rows[0].razorpay_order_id;
  }
  return { ok: true, keyId: razorpayKeyId(), orderId, amount: r.amount_paise, currency: "INR", description: r.purpose, prefill: { name: r.name, contact: r.phone ? `+91${r.phone}` : "" } };
}

/** Marks a request paid (idempotent; the verify call, the webhook and reconciliation all land here). */
export async function markRequestPaid(razorpayOrderId: string, paymentId: string): Promise<PaymentRequest | null> {
  const { rows } = await pool.query<Row>(
    `update public.payment_requests set status = 'paid', razorpay_payment_id = $2, paid_at = now()
      where razorpay_order_id = $1 and status <> 'paid' returning ${COLS}`,
    [razorpayOrderId, paymentId],
  );
  const r = rows[0];
  if (!r) return null;
  const req = toRequest(r);
  // The receipt goes to the chat the request came from (usually still inside WhatsApp's 24-hour window).
  if (req.phone) {
    const gym = (await getContent()).business.name;
    const body = receiptMessage({ purpose: req.purpose, rupees: req.rupees, paymentId, gym });
    const res = await sendWhatsAppText(`91${req.phone}`, body).catch((err: Error) => ({ ok: false as const, error: err.message, retry: false }));
    await recordReply({ to: `91${req.phone}`, body, by: "payment receipt", ok: res.ok, error: res.ok ? null : res.error, externalId: res.ok ? res.id : null }).catch(() => {});
  }
  return req;
}

/** Stops an unpaid link working (a paid one can only be refunded, in Razorpay). */
export async function cancelRequest(id: string): Promise<boolean> {
  if (!/^[0-9a-f-]{36}$/.test(id)) return false;
  const { rowCount } = await pool.query(`update public.payment_requests set status = 'cancelled' where id = $1 and status = 'created'`, [id]);
  return !!rowCount;
}
