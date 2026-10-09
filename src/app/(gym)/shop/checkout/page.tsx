"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CheckCircle2, Loader2, Lock } from "lucide-react";
import { useCart } from "@/components/shop/cart";
import { useQuote } from "@/components/shop/useQuote";
import { inr } from "@/lib/shop/format";
import { INDIAN_STATES } from "@/lib/shop/checkout";
import { getBrowserClient } from "@/lib/supabase/browser";
import { loadCheckoutScript, type RazorpayResponse } from "@/components/join/JoinCheckout";

const FORM_KEY = "rs-checkout-v1";
type Form = { name: string; email: string; phone: string; line1: string; line2: string; landmark: string; city: string; state: string; pincode: string; note: string };
const EMPTY: Form = { name: "", email: "", phone: "", line1: "", line2: "", landmark: "", city: "", state: "Uttar Pradesh", pincode: "", note: "" };

export default function CheckoutPage() {
  const cart = useCart();
  const { quote, error: quoteError, loading } = useQuote();
  const [f, setF] = useState<Form>(EMPTY);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState<{ number: string; paymentId: string; total: number } | null>(null);

  // Remember the address on this device, and prefill the email of a signed-in customer.
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(FORM_KEY) || "null");
      // eslint-disable-next-line react-hooks/set-state-in-effect -- restore saved details after mount
      if (saved) setF((x) => ({ ...x, ...saved, note: "" }));
    } catch {
      /* ignore */
    }
    getBrowserClient()
      ?.auth.getUser()
      .then(({ data }) => {
        const u = data.user;
        if (u?.email) setF((x) => ({ ...x, email: x.email || u.email!, name: x.name || (u.user_metadata?.full_name as string) || "" }));
      })
      .catch(() => {});
  }, []);

  const set = (k: keyof Form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setF((x) => ({ ...x, [k]: e.target.value }));

  async function pay(e: React.FormEvent) {
    e.preventDefault();
    if (!quote) return;
    setBusy(true);
    setError("");
    try {
      const { note: _note, ...keep } = f;
      try {
        localStorage.setItem(FORM_KEY, JSON.stringify(keep));
      } catch {
        /* ignore */
      }
      const res = await fetch("/api/shop/order", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...f, lines: cart.lines, expectedTotal: quote.total }) });
      const order = await res.json();
      if (!res.ok) throw new Error(order.error || "Couldn't start the payment.");
      if (!(await loadCheckoutScript()) || !window.Razorpay) throw new Error("Couldn't load the payment window. Check your connection and try again.");
      const rzp = new window.Razorpay({
        key: order.keyId,
        order_id: order.orderId,
        amount: order.amount,
        currency: order.currency,
        name: order.name,
        description: order.description,
        prefill: order.prefill,
        theme: { color: "#f59e0b" },
        modal: { ondismiss: () => setBusy(false) },
        handler: async (r: RazorpayResponse) => {
          const v = await fetch("/api/shop/verify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ orderId: r.razorpay_order_id, paymentId: r.razorpay_payment_id, signature: r.razorpay_signature }) });
          const out = await v.json().catch(() => ({}));
          setBusy(false);
          if (v.ok) {
            cart.clear();
            setDone({ number: order.number, paymentId: r.razorpay_payment_id, total: order.amount / 100 });
            window.scrollTo({ top: 0 });
          } else setError(`${out.error || "We couldn't confirm the payment."} Payment ID: ${r.razorpay_payment_id}`);
        },
      });
      rzp.on("payment.failed", (r) => {
        setError(r.error?.description || "The payment failed. No money was taken — please try again.");
        setBusy(false);
      });
      rzp.open();
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  if (done) {
    return (
      <section className="mx-auto max-w-xl px-4 py-14 text-center">
        <CheckCircle2 className="mx-auto h-16 w-16 text-emerald-400" />
        <h1 className="font-display mt-4 text-4xl text-white">Order confirmed!</h1>
        <p className="mt-2 text-white/70">
          {inr(done.total)} paid. Your order number is <b className="font-mono text-amber-300">{done.number}</b>.
        </p>
        <p className="mt-2 text-sm text-white/55">Keep this order number. You can follow packing and delivery any time under My orders — sign in with {f.email}.</p>
        <p className="mt-1 font-mono text-xs text-white/40">Payment ID {done.paymentId}</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link href="/shop/account" className="btn-gold rounded-full px-6 py-3 font-bold">
            Track my order
          </Link>
          <Link href="/shop" className="rounded-full border border-white/20 px-6 py-3 font-bold text-white">
            Keep shopping
          </Link>
        </div>
      </section>
    );
  }

  if (cart.ready && cart.lines.length === 0) {
    return (
      <section className="mx-auto max-w-xl px-4 py-16 text-center">
        <h1 className="font-display text-3xl text-white">Your cart is empty</h1>
        <Link href="/shop/products" className="btn-gold mt-6 inline-flex rounded-full px-6 py-3 font-bold">
          Start shopping
        </Link>
      </section>
    );
  }

  const field = "field mt-1";
  const blocked = !quote || quote.total <= 0 || quote.problems.length > 0;
  return (
    <form onSubmit={pay} className="mx-auto grid max-w-6xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[1fr_360px]">
      <div className="space-y-6">
        <h1 className="font-display text-4xl text-white">Checkout</h1>
        <fieldset className="grid gap-3 rounded-3xl border border-white/10 bg-white/[.03] p-5 sm:grid-cols-2">
          <legend className="font-display px-1 text-xl text-white">Contact</legend>
          <label className="text-sm text-white/70">
            Full name
            <input required autoComplete="name" value={f.name} onChange={set("name")} className={field} />
          </label>
          <label className="text-sm text-white/70">
            Mobile number
            <input required type="tel" inputMode="numeric" autoComplete="tel-national" placeholder="10-digit mobile" value={f.phone} onChange={set("phone")} className={field} />
          </label>
          <label className="text-sm text-white/70 sm:col-span-2">
            Email <span className="text-white/40">(order confirmation and tracking)</span>
            <input required type="email" autoComplete="email" value={f.email} onChange={set("email")} className={field} />
          </label>
        </fieldset>
        <fieldset className="grid gap-3 rounded-3xl border border-white/10 bg-white/[.03] p-5 sm:grid-cols-2">
          <legend className="font-display px-1 text-xl text-white">Delivery address</legend>
          <label className="text-sm text-white/70 sm:col-span-2">
            House / flat no., building, street
            <input required autoComplete="address-line1" value={f.line1} onChange={set("line1")} className={field} />
          </label>
          <label className="text-sm text-white/70 sm:col-span-2">
            Area, sector, locality <span className="text-white/40">(optional)</span>
            <input autoComplete="address-line2" value={f.line2} onChange={set("line2")} className={field} />
          </label>
          <label className="text-sm text-white/70">
            Landmark <span className="text-white/40">(optional)</span>
            <input value={f.landmark} onChange={set("landmark")} className={field} />
          </label>
          <label className="text-sm text-white/70">
            PIN code
            <input required inputMode="numeric" autoComplete="postal-code" maxLength={6} value={f.pincode} onChange={set("pincode")} className={field} />
          </label>
          <label className="text-sm text-white/70">
            City
            <input required autoComplete="address-level2" value={f.city} onChange={set("city")} className={field} />
          </label>
          <label className="text-sm text-white/70">
            State
            <select required autoComplete="address-level1" value={f.state} onChange={set("state")} className={field}>
              {INDIAN_STATES.map((s) => (
                <option key={s} value={s} className="bg-ink">
                  {s}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm text-white/70 sm:col-span-2">
            Note for the delivery <span className="text-white/40">(optional)</span>
            <textarea rows={2} maxLength={500} value={f.note} onChange={set("note")} className={field} />
          </label>
        </fieldset>
      </div>
      <aside className="h-fit rounded-3xl border border-white/10 bg-white/[.03] p-5 lg:sticky lg:top-24">
        <h2 className="font-display text-2xl text-white">Your order</h2>
        {loading && !quote ? (
          <p className="mt-4 flex items-center gap-2 text-white/60">
            <Loader2 className="h-4 w-4 animate-spin" /> Calculating…
          </p>
        ) : quote ? (
          <>
            <ul className="mt-3 space-y-2 text-sm">
              {quote.lines.map((l, i) => (
                <li key={i} className={`flex justify-between gap-3 ${l.problem ? "text-red-300" : "text-white/80"}`}>
                  <span className="min-w-0">
                    {l.qty} × {l.name}
                    {l.flavour ? ` (${l.flavour})` : ""}
                    {l.problem && <span className="block text-xs">{l.problem}</span>}
                  </span>
                  <span className="shrink-0">{l.problem ? "—" : inr(l.lineTotal)}</span>
                </li>
              ))}
            </ul>
            <dl className="mt-4 space-y-2 border-t border-white/10 pt-3 text-sm">
              <div className="flex justify-between font-semibold text-emerald-400">
                <dt>You save</dt>
                <dd>−{inr(quote.discountTotal)}</dd>
              </div>
              <div className="flex justify-between text-white/70">
                <dt>Delivery</dt>
                <dd>{quote.shipping ? inr(quote.shipping) : "FREE"}</dd>
              </div>
              <div className="flex justify-between text-lg font-bold text-white">
                <dt>Total</dt>
                <dd>{inr(quote.total)}</dd>
              </div>
            </dl>
          </>
        ) : null}
        {(error || quoteError) && (
          <p role="alert" className="mt-4 rounded-xl bg-red-500/15 p-3 text-sm text-red-200">
            {error || quoteError}
          </p>
        )}
        <button type="submit" disabled={busy || blocked} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-amber-400 py-4 font-black text-black disabled:opacity-40">
          {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <Lock className="h-4 w-4" />} Pay {quote ? inr(quote.total) : ""}
        </button>
        <p className="mt-3 text-center text-xs text-white/45">UPI, cards, net banking & wallets via Razorpay. By paying you agree to our <Link href="/shop/policies" className="underline">shipping & return policy</Link>.</p>
      </aside>
    </form>
  );
}
