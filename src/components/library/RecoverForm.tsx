"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";

export function RecoverForm() {
  const [email, setEmail] = useState("");
  const [paymentId, setPaymentId] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const res = await fetch("/api/library/recover", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, paymentId }) });
    const out = await res.json().catch(() => ({}));
    if (res.ok && out.accessUrl) window.location.href = out.accessUrl;
    else {
      setError(out.error || "Something went wrong. Please try again.");
      setBusy(false);
    }
  }

  const input = "w-full rounded-xl border border-white/15 bg-black/30 px-4 py-3 text-white placeholder:text-white/35 focus:border-brand focus:outline-none";
  return (
    <form onSubmit={submit} className="space-y-3">
      <input required type="email" placeholder="Email used at checkout" value={email} onChange={(e) => setEmail(e.target.value)} className={input} />
      <input required placeholder="Payment ID (starts with pay_)" value={paymentId} onChange={(e) => setPaymentId(e.target.value.trim())} className={input} />
      {error && <p role="alert" className="rounded-xl bg-red-500/15 px-4 py-3 text-sm text-red-200">{error}</p>}
      <button disabled={busy} className="btn-brand flex w-full items-center justify-center gap-2 rounded-full px-6 py-3 font-bold disabled:opacity-60">
        {busy && <Loader2 className="h-5 w-5 animate-spin" />} Find my books
      </button>
    </form>
  );
}
