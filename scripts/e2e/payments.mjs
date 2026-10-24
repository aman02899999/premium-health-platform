// End-to-end check of every money path against a running copy of the site, a throwaway database
// and a fake Razorpay. Nothing here reaches the real Razorpay, Meta, Resend or any customer.
//
//   1. A disposable Postgres with supabase/migrations applied (see docs/PAYMENTS_E2E.md).
//   2. The site, pointed at it:
//        POSTGRES_URL=postgresql://postgres@127.0.0.1:5433/rfc_test \
//        RAZORPAY_KEY_ID=rzp_test_e2elocal RAZORPAY_KEY_SECRET=e2e_key_secret \
//        RAZORPAY_WEBHOOK_SECRET=e2e_webhook_secret RAZORPAY_API_URL=http://127.0.0.1:4010 \
//        npx next dev -p 3100
//   3. node scripts/e2e/payments.mjs
//
// For each product: order → browser verify → webhook → same webhook again (expect "duplicate")
// → refund webhook → receipt → admin view. Also: a payment whose tab was closed (webhook only),
// a forged signature, a wrong amount and a failed-then-paid order.
import { createHmac, randomBytes } from "node:crypto";
import pg from "pg";
import { startFakeRazorpay } from "./fake-razorpay.mjs";

const SITE = process.env.E2E_SITE ?? "http://localhost:3100";
const DB = process.env.E2E_DATABASE_URL ?? "postgresql://postgres@127.0.0.1:5433/rfc_test";
const KEY_SECRET = process.env.E2E_KEY_SECRET ?? "e2e_key_secret";
const WEBHOOK_SECRET = process.env.E2E_WEBHOOK_SECRET ?? "e2e_webhook_secret";
if (!/127\.0\.0\.1|localhost/.test(DB) || !/127\.0\.0\.1|localhost/.test(SITE)) throw new Error("Refusing to run against anything but a local site and database");

const pool = new pg.Pool({ connectionString: DB });
const rzp = await startFakeRazorpay(4010);
const results = [];
const check = (path, step, ok, detail = "") => {
  results.push({ path, step, ok, detail });
  console.log(`${ok ? "PASS" : "FAIL"}  ${path.padEnd(11)} ${step}${detail ? `  (${detail})` : ""}`);
};

const post = async (url, body, headers = {}) => {
  const res = await fetch(`${SITE}${url}`, { method: "POST", headers: { "Content-Type": "application/json", ...headers }, body: typeof body === "string" ? body : JSON.stringify(body) });
  return { status: res.status, json: await res.json().catch(() => ({})) };
};
const checkoutSig = (orderId, paymentId) => createHmac("sha256", KEY_SECRET).update(`${orderId}|${paymentId}`).digest("hex");
let eventSeq = 0;
/** A Razorpay webhook delivery, signed like Razorpay signs it. Returns the HTTP result and the raw delivery for replays. */
async function webhook(event, entity, { eventId, raw } = {}) {
  const id = eventId ?? `evt_e2e_${Date.now()}_${eventSeq++}`;
  const body = raw ?? JSON.stringify({ entity: "event", event, payload: event.startsWith("refund.") ? { refund: { entity: entity.refund }, payment: { entity: entity.payment } } : { payment: { entity } }, created_at: Math.floor(Date.now() / 1000) });
  const sig = createHmac("sha256", WEBHOOK_SECRET).update(body).digest("hex");
  const res = await post("/api/webhooks/razorpay", body, { "x-razorpay-signature": sig, "x-razorpay-event-id": id });
  return { ...res, eventId: id, raw: body };
}
const payment = (orderId, paymentId, amount, extra = {}) => ({ id: paymentId, entity: "payment", order_id: orderId, amount, currency: "INR", status: "captured", email: "e2e@example.com", contact: "+919876543210", ...extra });
const row = async (sql, params) => (await pool.query(sql, params)).rows[0];

/** The shared tail of every path: webhook, replay, refund. */
async function webhookRefundDuplicate(path, table, orderId, paymentId, amount) {
  const first = await webhook("payment.captured", payment(orderId, paymentId, amount));
  check(path, "webhook payment.captured", first.status === 200 && first.json.outcome === "applied", `${first.status} ${first.json.outcome ?? first.json.error}`);
  const again = await webhook("payment.captured", null, { eventId: first.eventId, raw: first.raw });
  check(path, "same webhook again → duplicate", again.status === 200 && again.json.outcome === "duplicate", `${again.status} ${again.json.outcome}`);
  const r1 = await row(`select status, razorpay_payment_id from ${table} where razorpay_order_id = $1`, [orderId]);
  check(path, "order is paid with the payment id", r1?.status === "paid" && r1?.razorpay_payment_id === paymentId, JSON.stringify(r1));
  const refund = await webhook("refund.processed", { refund: { id: `rfnd_${randomBytes(5).toString("hex")}`, payment_id: paymentId, amount, currency: "INR" }, payment: payment(orderId, paymentId, amount, { amount_refunded: amount, status: "refunded" }) });
  check(path, "webhook refund.processed", refund.status === 200 && refund.json.outcome === "applied", `${refund.status} ${refund.json.outcome}`);
  const r2 = await row(`select refunded_paise from ${table} where razorpay_order_id = $1`, [orderId]);
  check(path, "refund recorded on the order", Number(r2?.refunded_paise) === amount, `refunded_paise=${r2?.refunded_paise}`);
  const refundAgain = await webhook("refund.processed", null, { eventId: refund.eventId, raw: refund.raw });
  check(path, "same refund again → duplicate", refundAgain.json.outcome === "duplicate", refundAgain.json.outcome);
}

const outboxFor = async (pattern) => (await pool.query(`select kind, channel, status from public.message_outbox where dedupe_key like $1 order by created_at`, [pattern])).rows;

// Admin session (local dev password; production uses Google sign-in instead).
const login = await fetch(`${SITE}/api/admin/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password: "royal-admin" }), redirect: "manual" });
const cookie = (login.headers.get("set-cookie") ?? "").split(";")[0];
const adminGet = async (url) => {
  const res = await fetch(`${SITE}${url}`, { headers: { cookie } });
  return { status: res.status, text: await res.text() };
};

try {
  await pool.query("truncate public.payment_events, public.message_outbox, public.members, public.membership_orders, public.book_orders, public.payment_requests, public.diet_orders, public.shop_orders cascade");

  /* ---------- membership /join ---------- */
  {
    const P = "membership";
    const o = await post("/api/membership/order", { planId: "monthly", name: "E2E Member", phone: "9876500001", email: "e2e-member@example.com" });
    check(P, "order created at the server's price", o.status === 200 && Number.isInteger(o.json.amount), `${o.status} amount=${o.json.amount} ${o.json.error ?? ""}`);
    const fakeOrder = rzp.orders.get(o.json.orderId);
    check(P, "Razorpay order amount = server price", fakeOrder?.amount === o.json.amount, `rzp=${fakeOrder?.amount}`);
    const forged = await post("/api/membership/verify", { orderId: o.json.orderId, paymentId: "pay_forged0000001", signature: "00".repeat(32) });
    check(P, "forged checkout signature refused", forged.status === 400, String(forged.status));
    const pay = rzp.newPaymentId();
    const v = await post("/api/membership/verify", { orderId: o.json.orderId, paymentId: pay, signature: checkoutSig(o.json.orderId, pay) });
    check(P, "browser verify marks it paid", v.status === 200 && v.json.ok === true && !v.json.pending, `${v.status} validUntil=${v.json.validUntil}`);
    const member = await row(`select m.expires_on from public.members m join public.membership_orders o on o.phone = m.phone where o.razorpay_order_id = $1`, [o.json.orderId]);
    check(P, "member record created", Boolean(member), JSON.stringify(member));
    const wa = await outboxFor(`welcome:%`);
    check(P, "receipt queued (WhatsApp welcome)", wa.length === 1, JSON.stringify(wa));
    await webhookRefundDuplicate(P, "public.membership_orders", o.json.orderId, pay, o.json.amount);
    const admin = await adminGet("/api/admin/payments");
    check(P, "admin Payments lists the order", admin.status === 200 && admin.text.includes(o.json.orderId), `HTTP ${admin.status}`);
    const welcomeAfter = await outboxFor(`welcome:%`);
    check(P, "no second receipt after webhook + replay", welcomeAfter.length === 1, `${welcomeAfter.length} welcome rows`);

    // Tab closed before verify: the webhook alone must record it.
    const o2 = await post("/api/membership/order", { planId: "monthly", name: "E2E Closed Tab", phone: "9876500002" }, { "x-forwarded-for": "10.0.0.2" });
    const pay2 = rzp.newPaymentId();
    const w = await webhook("payment.captured", payment(o2.json.orderId, pay2, o2.json.amount));
    const r = await row(`select status from public.membership_orders where razorpay_order_id = $1`, [o2.json.orderId]);
    check(P, "closed tab: webhook alone marks it paid", w.json.outcome === "applied" && r?.status === "paid", `${w.json.outcome} ${r?.status}`);

    // A capture for less than the order must never be applied.
    const o3 = await post("/api/membership/order", { planId: "monthly", name: "E2E Short Pay", phone: "9876500003" }, { "x-forwarded-for": "10.0.0.3" });
    const w3 = await webhook("payment.captured", payment(o3.json.orderId, rzp.newPaymentId(), 100));
    const r3 = await row(`select status from public.membership_orders where razorpay_order_id = $1`, [o3.json.orderId]);
    check(P, "wrong amount refused and flagged", w3.json.outcome === "amount_mismatch" && r3?.status !== "paid", `${w3.json.outcome} ${r3?.status}`);

    // Failed attempt first, then a successful one.
    const o4 = await post("/api/membership/order", { planId: "monthly", name: "E2E Retry", phone: "9876500004" }, { "x-forwarded-for": "10.0.0.4" });
    await webhook("payment.failed", payment(o4.json.orderId, rzp.newPaymentId(), o4.json.amount, { status: "failed" }));
    const pay4 = rzp.newPaymentId();
    await webhook("payment.captured", payment(o4.json.orderId, pay4, o4.json.amount));
    const r4 = await row(`select status from public.membership_orders where razorpay_order_id = $1`, [o4.json.orderId]);
    check(P, "failed then paid ends paid", r4?.status === "paid", r4?.status);

    const unsigned = await post("/api/webhooks/razorpay", JSON.stringify({ event: "payment.captured" }), { "x-razorpay-signature": "bad" });
    check("webhook", "unsigned webhook refused (401)", unsigned.status === 401, String(unsigned.status));
  }

  /* ---------- diet plans ---------- */
  {
    const P = "diet";
    const o = await post(
      "/api/diet-chart/order",
      { plan: "starter", name: "E2E Diet", phone: "9876500011", email: "e2e-diet@example.com", age: 30, heightCm: 172, weightKg: 78, sex: "male", goal: "fat-loss", diet: "veg", activity: "moderate", consent: true },
      { "x-forwarded-for": "10.0.1.1" },
    );
    check(P, "order created at the server's price", o.status === 200 && Number.isInteger(o.json.amount), `${o.status} amount=${o.json.amount} ${o.json.error ?? ""}`);
    const pay = rzp.newPaymentId();
    const v = await post("/api/diet-chart/verify", { razorpay_order_id: o.json.orderId, razorpay_payment_id: pay, razorpay_signature: checkoutSig(o.json.orderId, pay), orderId: o.json.orderId, paymentId: pay, signature: checkoutSig(o.json.orderId, pay) });
    check(P, "browser verify marks it paid", v.status === 200, `${v.status} ${JSON.stringify(v.json).slice(0, 120)}`);
    await new Promise((r) => setTimeout(r, 1500)); // receipts are queued after the response
    const rec = (await pool.query(`select o.kind, o.channel from public.message_outbox o join public.diet_orders d on o.dedupe_key like '%' || d.id || '%' where d.razorpay_order_id = $1`, [o.json.orderId])).rows;
    check(P, "receipt queued (WhatsApp + email)", rec.some((x) => x.channel === "whatsapp") && rec.some((x) => x.channel === "email"), JSON.stringify(rec));
    await webhookRefundDuplicate(P, "public.diet_orders", o.json.orderId, pay, o.json.amount);
  }

  /* ---------- supplement store ---------- */
  {
    const P = "shop";
    await pool.query(`delete from public.shop_products where slug = 'e2e-whey'`);
    const prod = await row(`insert into public.shop_products (slug, name, brand, list_price, stock, size, active) values ('e2e-whey', 'E2E Whey', 'Test', 3000, 5, '1 kg', true) returning id`);
    const o = await post(
      "/api/shop/order",
      { name: "E2E Shopper", email: "e2e-shop@example.com", phone: "9876500021", line1: "House 1, Main Road", city: "Noida", state: "Uttar Pradesh", pincode: "201304", lines: [{ kind: "product", id: prod.id, qty: 1 }] },
      { "x-forwarded-for": "10.0.2.1" },
    );
    check(P, "order created at the server's price", o.status === 200 && Number.isInteger(o.json.amount), `${o.status} amount=${o.json.amount} ${o.json.error ?? ""}`);
    if (o.status === 200) {
      const pay = rzp.newPaymentId();
      const v = await post("/api/shop/verify", { razorpay_order_id: o.json.orderId, razorpay_payment_id: pay, razorpay_signature: checkoutSig(o.json.orderId, pay), orderId: o.json.orderId, paymentId: pay, signature: checkoutSig(o.json.orderId, pay) });
      check(P, "browser verify marks it paid", v.status === 200, `${v.status} ${JSON.stringify(v.json).slice(0, 120)}`);
      const stock = await row(`select stock from public.shop_products where id = $1`, [prod.id]);
      await webhookRefundDuplicate(P, "public.shop_orders", o.json.orderId, pay, o.json.amount);
      const stock2 = await row(`select stock from public.shop_products where id = $1`, [prod.id]);
      check(P, "stock taken once (verify + webhook + replay)", stock.stock === 4 && stock2.stock === 4, `after verify ${stock.stock}, after webhooks ${stock2.stock}`);
      const admin = await adminGet("/api/admin/shop");
      check(P, "admin Store lists the order", admin.status === 200 && admin.text.includes(o.json.number), `HTTP ${admin.status}`);
    }
  }

  /* ---------- library books (seeded: the order route needs the PDFs in Supabase storage) ---------- */
  {
    const P = "library";
    const orderId = `order_e2elib${randomBytes(4).toString("hex")}`;
    const token = randomBytes(16).toString("hex");
    await pool.query(
      `insert into public.book_orders (razorpay_order_id, item_id, title, slugs, amount_paise, name, email, phone, access_token) values ($1, 'book:e2e', 'E2E Book', array['e2e'], 49900, 'E2E Reader', 'e2e-reader@example.com', '9876500031', $2)`,
      [orderId, token],
    );
    const pay = rzp.newPaymentId();
    const v = await post("/api/library/verify", { razorpay_order_id: orderId, razorpay_payment_id: pay, razorpay_signature: checkoutSig(orderId, pay) });
    check(P, "browser verify unlocks downloads", v.status === 200 && v.json.accessUrl === `/library/access/${token}`, `${v.status} ${v.json.accessUrl ?? v.json.error}`);
    const rec = (await pool.query(`select o.kind, o.channel from public.message_outbox o join public.book_orders b on o.dedupe_key = 'book-access-email:' || b.id where b.razorpay_order_id = $1`, [orderId])).rows;
    check(P, "receipt with the download link sent", rec.length > 0, rec.length ? JSON.stringify(rec) : "nothing queued: the buyer only sees the link in the browser");
    await webhookRefundDuplicate(P, "public.book_orders", orderId, pay, 49900);
    const recAfter = (await pool.query(`select count(*)::int n from public.message_outbox o join public.book_orders b on o.dedupe_key = 'book-access-email:' || b.id where b.razorpay_order_id = $1`, [orderId])).rows[0];
    check(P, "no second receipt after webhook + replay", recAfter.n === 1, `${recAfter.n} receipt rows`);
  }

  /* ---------- payment links /pay/<token> (seeded as if the link had been opened) ---------- */
  {
    const P = "pay-link";
    const orderId = `order_e2epay${randomBytes(4).toString("hex")}`;
    await pool.query(`insert into public.payment_requests (token, purpose, amount_paise, expires_at, razorpay_order_id) values ($1, 'E2E fee', 150000, now() + interval '1 day', $2)`, [randomBytes(8).toString("hex"), orderId]);
    const pay = rzp.newPaymentId();
    const v = await post("/api/pay/verify", { razorpay_order_id: orderId, razorpay_payment_id: pay, razorpay_signature: checkoutSig(orderId, pay) });
    check(P, "browser verify marks it paid", v.status === 200 && v.json.ok === true, `${v.status}`);
    await webhookRefundDuplicate(P, "public.payment_requests", orderId, pay, 150000);
  }
} finally {
  const failed = results.filter((r) => !r.ok);
  console.log(`\n${results.length - failed.length} passed, ${failed.length} failed`);
  await rzp.close();
  await pool.end();
  process.exitCode = failed.length ? 1 : 0;
}
