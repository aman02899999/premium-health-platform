"use client";

import { useState } from "react";
import { Loader2, Lock } from "lucide-react";

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

/** Buyer form + Razorpay Checkout for one book or the complete library. */
export function BuyBox({ itemId, label, price, whatsappUrl, online }: { itemId: string; label: string; price: number; whatsappUrl: string; online: boolean }) {
  const [form, setForm] = useState({ name: "", email: "", phone: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));

  if (!online) {
    return (
      <div className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-5 text-center">
        <p className="text-sm text-white/70">Online checkout is being set up. Message us to buy this today.</p>
        <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="btn-brand inline-block rounded-full px-6 py-3 font-bold">
          Buy on WhatsApp
        </a>
      </div>
    );
  }

  async function pay(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/library/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId, ...form }),
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

  const input = "w-full rounded-xl border border-white/15 bg-black/30 px-4 py-3 text-white placeholder:text-white/35 focus:border-brand focus:outline-none";
  return (
    <form onSubmit={pay} className="space-y-3">
      <input required autoComplete="name" placeholder="Your name" value={form.name} onChange={set("name")} className={input} />
      <input required type="email" autoComplete="email" placeholder="Email (to recover your downloads)" value={form.email} onChange={set("email")} className={input} />
      <input required inputMode="numeric" autoComplete="tel" placeholder="Mobile number" value={form.phone} onChange={set("phone")} className={input} />
      {error && <p role="alert" className="rounded-xl bg-red-500/15 px-4 py-3 text-sm text-red-200">{error}</p>}
      <button disabled={busy} className="btn-brand flex w-full items-center justify-center gap-2 rounded-full px-6 py-3.5 font-bold disabled:opacity-60">
        {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <Lock className="h-4 w-4" />}
        {busy ? "Opening secure payment…" : `${label} · ₹${price.toLocaleString("en-IN")}`}
      </button>
      <p className="text-center text-xs text-white/45">Instant download after payment · UPI, cards, net banking · Secured by Razorpay</p>
    </form>
  );
}
