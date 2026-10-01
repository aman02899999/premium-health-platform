"use client";

import Link from "next/link";
import { useState } from "react";
import { BadgePercent, Crown, Loader2, Lock, ShoppingBag, Trash2 } from "lucide-react";
import { MULTI_BUY, priceCart, type PriceTable } from "@/lib/library/cart";
import { useCart } from "./useCart";

type RazorpayResponse = { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string };
type RazorpayInstance = { open: () => void; on: (event: string, cb: (r: { error?: { description?: string } }) => void) => void };
type RazorpayCtor = new (options: Record<string, unknown>) => RazorpayInstance;

function loadCheckoutScript(): Promise<boolean> {
  const w = window as unknown as { Razorpay?: RazorpayCtor };
  if (w.Razorpay) return Promise.resolve(true);
  return new Promise((resolve) => {
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;

/** Cart review + buyer details + Razorpay payment. */
export function Checkout({ table, online, whatsappBase }: { table: PriceTable; online: boolean; whatsappBase: string }) {
  const { items, remove, replace, clear } = useCart();
  const [form, setForm] = useState({ name: "", email: "", phone: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));

  // Drop ids that no longer exist (e.g. a renamed bundle) rather than blocking checkout.
  const valid = items.filter((id) => id === table.complete.id || table.bundles[id] || table.books[id]);
  const quote = valid.length ? priceCart(valid, table) : null;

  if (!quote) {
    return (
      <div className="glass rounded-3xl p-10 text-center">
        <ShoppingBag className="mx-auto h-10 w-10 text-white/40" />
        <h2 className="font-display mt-4 text-2xl text-white">Your cart is empty</h2>
        <p className="mt-2 text-white/60">Pick a single book, a combo offer, or the complete library.</p>
        <Link href="/library" className="btn-brand mt-6 inline-block rounded-full px-6 py-3 font-bold">Browse the library</Link>
      </div>
    );
  }

  const looseCount = quote.lines.filter((l) => l.kind === "book" && !l.included).length;
  const nextTier = [...MULTI_BUY].reverse().find((t) => looseCount < t.min);
  const fullPrice = quote.lines.filter((l) => !l.included).reduce((s, l) => s + l.price, 0);

  async function pay(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/library/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: valid, ...form }),
      });
      const order = await res.json();
      if (!res.ok) throw new Error(order.error || "Couldn't start the payment.");
      if (!(await loadCheckoutScript())) throw new Error("Couldn't load the payment window. Check your connection and try again.");
      const Razorpay = (window as unknown as { Razorpay: RazorpayCtor }).Razorpay;
      const rzp = new Razorpay({
        key: order.keyId,
        order_id: order.orderId,
        amount: order.amount,
        currency: order.currency,
        name: "Royal Fitness Club · Premium Library",
        description: order.description,
        prefill: order.prefill,
        theme: { color: "#e8394b" },
        modal: { ondismiss: () => setBusy(false) },
        handler: async (r: RazorpayResponse) => {
          const v = await fetch("/api/library/verify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(r) });
          const out = await v.json().catch(() => ({}));
          if (v.ok && out.accessUrl) {
            clear();
            window.location.href = `${out.accessUrl}?paid=1`;
          } else {
            setError(out.error || `Payment received (ID ${r.razorpay_payment_id}). Use "Recover my books" with this ID.`);
            setBusy(false);
          }
        },
      });
      rzp.on("payment.failed", (resp) => {
        setError(resp.error?.description || "Payment failed. No money was taken — please try again.");
        setBusy(false);
      });
      rzp.open();
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  const waText = `${whatsappBase}${encodeURIComponent(
    `Hi, I'd like to buy from the Premium Library:\n${quote.lines.filter((l) => !l.included).map((l) => `• ${l.title} (${inr(l.price)})`).join("\n")}\nTotal: ${inr(quote.total)}`,
  )}`;
  const input = "w-full rounded-xl border border-white/15 bg-black/30 px-4 py-3 text-white placeholder:text-white/35 focus:border-brand focus:outline-none";

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_400px]">
      <section className="glass rounded-3xl p-5 sm:p-7">
        <h2 className="font-display text-2xl text-white">Your order</h2>
        <ul className="mt-5 divide-y divide-white/10">
          {quote.lines.map((l) => (
            <li key={l.id} className="flex items-start justify-between gap-4 py-3">
              <div className="min-w-0">
                <p className={`font-semibold ${l.included ? "text-white/45 line-through" : "text-white"}`}>{l.title}</p>
                <p className="text-xs text-white/45">
                  {l.kind === "complete" ? "All books" : l.kind === "bundle" ? `${table.bundles[l.id].slugs.length} books · bundle` : "Single book"}
                  {l.included && " · already included in your bundle"}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <span className={l.included ? "text-white/40" : "font-semibold text-white"}>{l.included ? "—" : inr(l.price)}</span>
                <button type="button" onClick={() => remove(l.id)} aria-label={`Remove ${l.title}`} className="text-white/40 hover:text-red-300">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>

        {nextTier && looseCount > 0 && (
          <p className="mt-4 flex gap-2 rounded-2xl bg-brand/10 p-3 text-sm text-white/80">
            <BadgePercent className="h-5 w-5 shrink-0 text-brand" />
            Add {nextTier.min - looseCount} more {nextTier.min - looseCount === 1 ? "book" : "books"} to save {Math.round(nextTier.rate * 100)}% on your single books.
          </p>
        )}
        {quote.completeIsCheaper && (
          <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-emerald-400/30 bg-emerald-500/10 p-4 text-sm text-emerald-100 sm:flex-row sm:items-center sm:justify-between">
            <p className="flex gap-2">
              <Crown className="h-5 w-5 shrink-0" /> The complete library ({Object.keys(table.books).length} books) costs less than this cart: {inr(table.complete.price)}.
            </p>
            <button type="button" onClick={() => replace([table.complete.id])} className="shrink-0 rounded-full bg-emerald-400 px-4 py-2 font-bold text-black">
              Switch & save
            </button>
          </div>
        )}
        <p className="mt-5 text-xs text-white/45">
          Multi-book savings on single books: {MULTI_BUY.slice().reverse().map((t) => `${t.min}+ books ${Math.round(t.rate * 100)}% off`).join(" · ")}. Bundles are already discounted.
        </p>
      </section>

      <aside className="glass brand-border h-fit self-start rounded-3xl p-5 sm:p-7 lg:sticky lg:top-28">
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between text-white/70">
            <dt>Subtotal</dt>
            <dd>{inr(fullPrice)}</dd>
          </div>
          {quote.discount > 0 && (
            <div className="flex justify-between text-emerald-300">
              <dt>Multi-book saving ({Math.round(quote.discountRate * 100)}%)</dt>
              <dd>−{inr(quote.discount)}</dd>
            </div>
          )}
          <div className="flex justify-between border-t border-white/10 pt-3 text-lg font-bold text-white">
            <dt>Total</dt>
            <dd>{inr(quote.total)}</dd>
          </div>
          <p className="text-xs text-white/45">{quote.slugs.length} {quote.slugs.length === 1 ? "book" : "books"} · instant PDF download · prices in INR, incl. taxes</p>
        </dl>

        {online ? (
          <form onSubmit={pay} className="mt-6 space-y-3">
            <input required autoComplete="name" placeholder="Your name" value={form.name} onChange={set("name")} className={input} />
            <input required type="email" autoComplete="email" placeholder="Email (to recover your downloads)" value={form.email} onChange={set("email")} className={input} />
            <input required type="tel" autoComplete="tel" placeholder="Mobile (10 digits, or +country code)" value={form.phone} onChange={set("phone")} className={input} />
            {error && <p role="alert" className="rounded-xl bg-red-500/15 px-4 py-3 text-sm text-red-200">{error}</p>}
            <button disabled={busy} className="btn-brand flex w-full items-center justify-center gap-2 rounded-full px-6 py-3.5 font-bold disabled:opacity-60">
              {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <Lock className="h-4 w-4" />}
              {busy ? "Opening secure payment…" : `Pay ${inr(quote.total)}`}
            </button>
            <p className="text-center text-xs text-white/45">UPI, cards, net banking & wallets · Secured by Razorpay</p>
            <p className="text-center text-xs text-white/40">
              By paying you agree to our <Link href="/terms" className="underline">Terms</Link> and{" "}
              <Link href="/refund-policy" className="underline">Refund Policy</Link>.
            </p>
          </form>
        ) : (
          <div className="mt-6 space-y-3 text-center">
            <p className="text-sm text-white/70">Online payment is being set up. Send us your order on WhatsApp and we&apos;ll share a payment link.</p>
            <a href={waText} target="_blank" rel="noopener noreferrer" className="btn-brand inline-block w-full rounded-full px-6 py-3.5 font-bold">
              Order on WhatsApp · {inr(quote.total)}
            </a>
          </div>
        )}
      </aside>
    </div>
  );
}
