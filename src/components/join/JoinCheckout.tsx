"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, Heart, Loader2, Lock, User } from "lucide-react";
import type { Plan } from "@/lib/content/types";
import { formatINR } from "@/lib/site";
import { planMonths } from "@/components/home/PlanGrid";

type RazorpayResponse = { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string };
type RazorpayInstance = { open: () => void; on: (event: string, cb: (r: { error?: { description?: string } }) => void) => void };
declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => RazorpayInstance;
  }
}

function loadCheckoutScript(): Promise<boolean> {
  if (window.Razorpay) return Promise.resolve(true);
  return new Promise((resolve) => {
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

type Receipt = { paymentId: string; plan?: string; amount?: string; name?: string; startDate?: string | null; pending?: boolean };

export function JoinCheckout({ plans, gymName, whatsapp }: { plans: Plan[]; gymName: string; whatsapp: string }) {
  const params = useSearchParams();
  const initialPlan = plans.find((p) => p.id === params.get("plan")) ?? plans.find((p) => p.featured) ?? plans[0];
  const [planId, setPlanId] = useState(initialPlan?.id ?? "");
  const [couple, setCouple] = useState(params.get("couple") === "1" && (initialPlan?.couplePrice ?? 0) > 0);
  const [form, setForm] = useState({ name: "", phone: "", email: "", partnerName: "", startDate: "", referredBy: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [receipt, setReceipt] = useState<Receipt | null>(null);

  const plan = plans.find((p) => p.id === planId);
  const canCouple = (plan?.couplePrice ?? 0) > 0;
  const isCouple = couple && canCouple;
  const price = plan ? (isCouple ? plan.couplePrice : plan.price) : 0;
  const perMonth = plan ? Math.round(price / planMonths(plan.duration)) : 0;
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function pay(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/membership/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId, couple: isCouple, ...form }),
      });
      const order = await res.json();
      if (!res.ok) throw new Error(order.error || "Couldn't start the payment.");
      if (!(await loadCheckoutScript()) || !window.Razorpay) throw new Error("Couldn't load the payment window. Check your connection and try again.");

      const rzp = new window.Razorpay({
        key: order.keyId,
        order_id: order.orderId,
        amount: order.amount,
        currency: order.currency,
        name: gymName,
        description: order.description,
        prefill: order.prefill,
        theme: { color: "#e8394b" },
        modal: { ondismiss: () => setBusy(false) },
        handler: async (r: RazorpayResponse) => {
          const v = await fetch("/api/membership/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ orderId: r.razorpay_order_id, paymentId: r.razorpay_payment_id, signature: r.razorpay_signature }),
          });
          const out = await v.json().catch(() => ({}));
          setBusy(false);
          if (v.ok) {
            setReceipt(out);
            requestAnimationFrame(() => document.getElementById("join-result")?.scrollIntoView({ behavior: "smooth", block: "center" }));
          }
          else setError(`${out.error || "We couldn't confirm the payment."} Payment ID: ${r.razorpay_payment_id}`);
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

  if (receipt) {
    const msg = `Hi ${gymName}, I just joined online. Name: ${receipt.name ?? form.name}. Plan: ${receipt.plan ?? plan?.name}. Payment ID: ${receipt.paymentId}.`;
    return (
      <div id="join-result" className="glass brand-border scroll-mt-28 space-y-5 rounded-3xl p-8 text-center">
        <CheckCircle2 className="mx-auto h-14 w-14 text-emerald-400" />
        <h2 className="font-display text-3xl text-white">Welcome to the club!</h2>
        <p className="text-white/75">
          {receipt.pending ? "Your payment went through and is being recorded." : `${receipt.amount} paid for ${receipt.plan}.`}
          {receipt.startDate && ` Your membership starts on ${receipt.startDate}.`}
        </p>
        <p className="rounded-xl bg-white/5 px-4 py-3 font-mono text-sm text-white/80">Payment ID: {receipt.paymentId}</p>
        <p className="text-sm text-white/55">Show this screen at the front desk, or send it to us on WhatsApp so we can get your first session ready.</p>
        <a href={`https://wa.me/${whatsapp}?text=${encodeURIComponent(msg)}`} target="_blank" rel="noopener noreferrer" className="inline-flex rounded-full bg-[#25d366] px-6 py-3 font-bold text-white">
          Send confirmation on WhatsApp
        </a>
      </div>
    );
  }

  return (
    <form onSubmit={pay} className="glass brand-border space-y-6 rounded-3xl p-6 sm:p-8">
      <fieldset>
        <legend className="font-display text-xl text-white">1. Choose your plan</legend>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {plans.map((p) => (
            <label key={p.id} className={`flex cursor-pointer items-center justify-between gap-3 rounded-2xl px-4 py-3 ring-1 ${p.id === planId ? "bg-brand/15 ring-brand" : "bg-white/[.03] ring-white/10 hover:ring-white/25"}`}>
              <span>
                <span className="block font-semibold text-white">{p.name}</span>
                <span className="text-xs text-white/55">{p.duration}</span>
              </span>
              <span className="font-bold text-white">{formatINR(couple && p.couplePrice ? p.couplePrice : p.price)}</span>
              <input type="radio" name="plan" value={p.id} checked={p.id === planId} onChange={() => setPlanId(p.id)} className="sr-only" />
            </label>
          ))}
        </div>
        {canCouple && (
          <div role="radiogroup" aria-label="Membership type" className="mt-4 inline-flex rounded-full bg-white/5 p-1">
            {([
              { v: false, l: "Single", icon: User },
              { v: true, l: "Couple", icon: Heart },
            ] as const).map((o) => (
              <button
                key={o.l}
                type="button"
                role="radio"
                aria-checked={isCouple === o.v}
                onClick={() => setCouple(o.v)}
                className={`inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm font-bold ${isCouple === o.v ? "bg-brand text-white" : "text-white/70"}`}
              >
                <o.icon className="h-4 w-4" /> {o.l}
              </button>
            ))}
          </div>
        )}
      </fieldset>

      <fieldset className="space-y-3">
        <legend className="font-display text-xl text-white">2. Your details</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm text-white/70">
            Full name
            <input required minLength={2} maxLength={80} autoComplete="name" value={form.name} onChange={set("name")} className="field mt-1" />
          </label>
          <label className="text-sm text-white/70">
            Mobile number
            <input required type="tel" inputMode="numeric" autoComplete="tel-national" placeholder="10-digit number" value={form.phone} onChange={set("phone")} className="field mt-1" />
          </label>
          {isCouple && (
            <label className="text-sm text-white/70">
              Partner&apos;s name
              <input required minLength={2} maxLength={80} value={form.partnerName} onChange={set("partnerName")} className="field mt-1" />
            </label>
          )}
          <label className="text-sm text-white/70">
            Email <span className="text-white/40">(optional, for the receipt)</span>
            <input type="email" autoComplete="email" value={form.email} onChange={set("email")} className="field mt-1" />
          </label>
          <label className="text-sm text-white/70">
            Start date <span className="text-white/40">(optional)</span>
            <input type="date" min={today} value={form.startDate} onChange={set("startDate")} className="field mt-1" />
          </label>
          <label className="text-sm text-white/70">
            Referred by a member? <span className="text-white/40">(their name or phone)</span>
            <input maxLength={80} value={form.referredBy} onChange={set("referredBy")} className="field mt-1" />
          </label>
        </div>
      </fieldset>

      <div className="flex flex-col gap-4 rounded-2xl bg-black/30 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-white/55">
            {plan?.name} · {plan?.duration}
            {isCouple && " · for 2 people"}
          </p>
          <p className="font-display text-3xl text-white">{formatINR(price)}</p>
          <p className="text-xs text-white/45">≈ {formatINR(perMonth)} / month</p>
        </div>
        <button type="submit" disabled={busy || !plan} className="btn-brand inline-flex items-center justify-center gap-2 rounded-full px-8 py-3.5 font-bold disabled:opacity-60">
          {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <Lock className="h-4 w-4" />} Pay {formatINR(price)}
        </button>
      </div>
      {error && (
        <p role="alert" className="rounded-xl bg-ember/15 p-3 text-sm text-red-200">
          {error}
        </p>
      )}
      <p className="text-xs text-white/45">
        UPI, cards, net banking and wallets accepted. By paying you agree to our <Link href="/terms" className="underline">terms</Link>. Questions about changes or refunds? Contact us before your start date.
      </p>
    </form>
  );
}
