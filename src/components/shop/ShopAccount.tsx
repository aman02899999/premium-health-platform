"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, Circle, Loader2, LogOut, Mail, Package, Truck } from "lucide-react";
import { getBrowserClient, signInWithEmail, signInWithGoogle, verifyEmailCode } from "@/lib/supabase/browser";
import type { Order } from "@/lib/shop/types";
import { inr } from "@/lib/shop/format";

const STEPS: { key: Order["fulfilment"]; label: string }[] = [
  { key: "new", label: "Confirmed" },
  { key: "packed", label: "Packed" },
  { key: "shipped", label: "Shipped" },
  { key: "delivered", label: "Delivered" },
];

function Timeline({ o }: { o: Order }) {
  if (o.fulfilment === "cancelled" || o.fulfilment === "refunded") return <p className="mt-3 text-sm font-semibold text-red-300">{o.fulfilment === "cancelled" ? "Cancelled" : "Refunded"}</p>;
  const at = STEPS.findIndex((s) => s.key === o.fulfilment);
  return (
    <ol className="mt-4 grid grid-cols-4 gap-1 text-center text-[11px]">
      {STEPS.map((s, i) => (
        <li key={s.key} className={i <= at ? "text-emerald-300" : "text-white/35"}>
          {i <= at ? <CheckCircle2 className="mx-auto h-5 w-5" /> : <Circle className="mx-auto h-5 w-5" />}
          {s.label}
        </li>
      ))}
    </ol>
  );
}

export function ShopAccount() {
  const [state, setState] = useState<"loading" | "out" | "in">("loading");
  const [email, setEmail] = useState("");
  const [orders, setOrders] = useState<Order[]>([]);
  const [msg, setMsg] = useState("");
  const [sent, setSent] = useState(false);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch("/api/shop/my-orders", { cache: "no-store" });
    if (res.status === 401) return setState("out");
    const j = await res.json().catch(() => ({}));
    if (!res.ok) {
      setMsg(j.error || "Couldn't load your orders.");
      return setState("in");
    }
    setEmail(j.email);
    setOrders(j.orders);
    setState("in");
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial load
    void load();
  }, [load]);

  if (state === "loading")
    return (
      <p className="mt-6 flex items-center gap-2 text-white/60">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading…
      </p>
    );

  if (state === "out") {
    return (
      <div className="mt-6 rounded-3xl border border-white/10 bg-white/[.03] p-6">
        <p className="text-white/70">Sign in with the email you used at checkout to see your orders and delivery status.</p>
        <button
          type="button"
          onClick={async () => {
            const err = await signInWithGoogle("/shop/account");
            if (err) setMsg(err);
          }}
          className="mt-5 flex w-full items-center justify-center gap-3 rounded-full bg-white py-3.5 font-bold text-ink"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
            <path fill="#4285F4" d="M22.6 12.2c0-.8-.1-1.5-.2-2.2H12v4.2h6c-.3 1.4-1 2.5-2.2 3.3v2.7h3.5c2.1-1.9 3.3-4.7 3.3-8z" />
            <path fill="#34A853" d="M12 23c3 0 5.5-1 7.3-2.7l-3.5-2.7c-1 .7-2.3 1.1-3.8 1.1-2.9 0-5.4-2-6.3-4.6H2.1v2.8C3.9 20.5 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.7 14.1c-.2-.7-.4-1.4-.4-2.1s.1-1.4.4-2.1V7.1H2.1C1.4 8.6 1 10.2 1 12s.4 3.4 1.1 4.9l3.6-2.8z" />
            <path fill="#EA4335" d="M12 5.4c1.6 0 3.1.6 4.2 1.7l3.1-3.1C17.5 2.2 15 1 12 1 7.7 1 3.9 3.5 2.1 7.1l3.6 2.8C6.6 7.3 9.1 5.4 12 5.4z" />
          </svg>
          Continue with Google
        </button>
        <div className="my-5 flex items-center gap-3 text-xs text-white/40">
          <span className="h-px flex-1 bg-white/10" /> or with email <span className="h-px flex-1 bg-white/10" />
        </div>
        {!sent ? (
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setBusy(true);
              const err = await signInWithEmail(email, "/shop/account");
              setBusy(false);
              if (err) setMsg(err);
              else {
                setSent(true);
                setMsg("");
              }
            }}
            className="flex flex-col gap-2 sm:flex-row"
          >
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" className="field flex-1" />
            <button disabled={busy} className="btn-gold inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 font-bold disabled:opacity-50">
              <Mail className="h-4 w-4" /> Email me a code
            </button>
          </form>
        ) : (
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setBusy(true);
              const err = await verifyEmailCode(email, code.trim());
              setBusy(false);
              if (err) setMsg(err);
              else void load();
            }}
            className="space-y-3"
          >
            <p className="text-sm text-white/70">
              We&apos;ve emailed <b>{email}</b>. Tap the sign-in link in that email, or type the 6-digit code here:
            </p>
            <div className="flex gap-2">
              <input inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} placeholder="123456" className="field flex-1 tracking-[0.4em]" />
              <button disabled={busy || code.length !== 6} className="btn-gold rounded-full px-5 font-bold disabled:opacity-50">
                Verify
              </button>
            </div>
            <button type="button" onClick={() => setSent(false)} className="py-1 text-xs text-white/50 underline">
              Use a different email
            </button>
          </form>
        )}
        {msg && <p className="mt-3 text-sm text-red-300">{msg}</p>}
      </div>
    );
  }

  return (
    <div className="mt-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2 text-sm text-white/60">
        <span>
          Signed in as <b className="text-white">{email}</b>
        </span>
        <button
          type="button"
          onClick={async () => {
            await getBrowserClient()?.auth.signOut();
            setState("out");
          }}
          className="inline-flex items-center gap-1 py-1 text-white/60 hover:text-white"
        >
          <LogOut className="h-4 w-4" /> Sign out
        </button>
      </div>
      {msg && <p className="mb-3 text-sm text-red-300">{msg}</p>}
      {orders.length === 0 ? (
        <div className="rounded-3xl border border-white/10 p-10 text-center">
          <Package className="mx-auto h-10 w-10 text-white/25" />
          <p className="mt-3 text-white/60">No orders for this email yet.</p>
          <Link href="/shop/products" className="btn-gold mt-5 inline-flex rounded-full px-6 py-3 font-bold">
            Shop now
          </Link>
        </div>
      ) : (
        <ul className="space-y-4">
          {orders.map((o) => (
            <li key={o.id} className="rounded-3xl border border-white/10 bg-white/[.03] p-5">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-mono font-bold text-amber-300">{o.number}</p>
                  <p className="text-xs text-white/50">{new Date(o.createdAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</p>
                </div>
                <p className="text-right font-bold text-white">
                  {inr(o.total)}
                  <span className={`block text-xs font-semibold ${o.status === "paid" ? "text-emerald-300" : "text-red-300"}`}>{o.status === "paid" ? "Paid" : "Payment failed"}</span>
                </p>
              </div>
              <ul className="mt-3 space-y-1 text-sm text-white/75">
                {o.items.map((i, k) => (
                  <li key={k}>
                    {i.qty} × {i.name}
                    {i.flavour ? ` (${i.flavour})` : ""}
                  </li>
                ))}
              </ul>
              {o.status === "paid" && <Timeline o={o} />}
              {o.tracking && (
                <p className="mt-3 flex items-center gap-2 rounded-xl bg-white/5 p-3 text-sm text-white/80">
                  <Truck className="h-4 w-4 text-amber-300" /> {o.courier || "Courier"} · tracking <b className="font-mono">{o.tracking}</b>
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
