"use client";

import { useState } from "react";
import { CheckCircle2, Loader2, Lock, MessageCircle } from "lucide-react";
import type { RequestState } from "@/lib/payments/requests-core";

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

const inr = (n: number) => `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

/** A payment link from a WhatsApp chat: shows what it's for and opens Razorpay Checkout. */
export function PayRequest(p: { token: string; gym: string; phone: string; purpose: string; rupees: number; name: string; state: RequestState; paymentId: string | null }) {
  const [state, setState] = useState(p.state);
  const [paymentId, setPaymentId] = useState(p.paymentId);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const help = `https://wa.me/${p.phone.replace(/\D/g, "").replace(/^(\d{10})$/, "91$1")}?text=${encodeURIComponent(`Hi, about my payment for ${p.purpose}`)}`;

  async function pay() {
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/pay/${p.token}`, { method: "POST" });
      const order = await res.json();
      if (!res.ok) throw new Error(order.error || "Couldn't start the payment.");
      if (!(await loadCheckoutScript())) throw new Error("Couldn't load the payment window. Check your connection and try again.");
      const Razorpay = (window as unknown as { Razorpay: RazorpayCtor }).Razorpay;
      const rzp = new Razorpay({
        key: order.keyId,
        order_id: order.orderId,
        amount: order.amount,
        currency: order.currency,
        name: p.gym,
        description: order.description,
        prefill: order.prefill,
        theme: { color: "#e8394b" },
        modal: { ondismiss: () => setBusy(false) },
        handler: async (r: RazorpayResponse) => {
          const v = await fetch("/api/pay/verify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(r) });
          const out = await v.json().catch(() => ({}));
          setPaymentId(r.razorpay_payment_id);
          if (v.ok) setState("paid");
          else setError(out.error || `Payment received (ID ${r.razorpay_payment_id}). We'll confirm it shortly.`);
          setBusy(false);
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

  return (
    <div className="glass rounded-3xl p-6 text-center sm:p-8">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand">{p.gym}</p>
      {state === "paid" ? (
        <>
          <CheckCircle2 className="mx-auto mt-6 h-14 w-14 text-emerald-400" />
          <h1 className="font-display mt-4 text-3xl text-white">Paid. Thank you!</h1>
          <p className="mt-2 text-white/70">
            {p.purpose}: {inr(p.rupees)}
          </p>
          {paymentId && <p className="mt-1 text-sm text-white/50">Payment ID: {paymentId}</p>}
          <p className="mt-4 text-sm text-white/60">A receipt has been sent to you on WhatsApp.</p>
        </>
      ) : (
        <>
          <h1 className="font-display mt-4 text-2xl text-white">{p.purpose}</h1>
          {p.name && <p className="mt-1 text-white/60">For {p.name}</p>}
          <p className="font-display mt-6 text-5xl text-white">{inr(p.rupees)}</p>
          {state === "open" ? (
            <>
              <button onClick={pay} disabled={busy} className="btn-brand mt-8 inline-flex w-full items-center justify-center gap-2 rounded-full px-6 py-4 text-lg font-bold disabled:opacity-60">
                {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <Lock className="h-5 w-5" />} Pay {inr(p.rupees)}
              </button>
              <p className="mt-3 text-xs text-white/50">UPI, cards, netbanking and wallets, secured by Razorpay.</p>
            </>
          ) : (
            <p className="mt-8 rounded-xl bg-amber-400/10 px-4 py-3 text-sm text-amber-100">{state === "expired" ? "This payment link has expired." : "This payment link was cancelled."} Message us for a new one.</p>
          )}
          {error && <p className="mt-4 rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-100">{error}</p>}
        </>
      )}
      <a href={help} className="mt-6 inline-flex items-center gap-1.5 text-sm text-white/60 underline">
        <MessageCircle className="h-4 w-4" /> Questions? WhatsApp us
      </a>
    </div>
  );
}
