"use client";

import { useState } from "react";
import { Share2, Gift, CheckCircle } from "lucide-react";
import { useAuth } from "@/components/auth/AuthContext";

export function ReferralSystem() {
  const { user } = useAuth();
  const [referredEmail, setReferredEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.email) {
      setError("Login required to refer — SSO optimized");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const utm = (() => { try { return JSON.parse(localStorage.getItem("bhg-utm") || "{}"); } catch { return {}; } })();
      const res = await fetch("/api/referral", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ referrerEmail: user.email, referredEmail, utm }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setDone(data.referral);
      if (typeof window !== "undefined" && (window as any).gtag) {
        (window as any).gtag("event", "referral", { referrer: user.email, referred: referredEmail });
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-3xl border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 p-5 dark:border-amber-800 dark:from-amber-950/30">
      <h3 className="flex items-center gap-2 text-sm font-bold"><Gift className="h-4 w-4 text-amber-600" /> Refer & Earn — Viral Loop</h3>
      <p className="mt-1 text-[11px] text-stone-600 dark:text-stone-300">Refer friend → both get 7 days premium free. Referrer gets Rs 50 credit after conversion (demo). SSO + UTM + gtag tracked.</p>

      {done ? (
        <div className="mt-3 rounded-2xl bg-white p-4 text-center dark:bg-stone-900">
          <CheckCircle className="mx-auto h-6 w-6 text-emerald-600" />
          <p className="mt-1 text-sm font-bold">Referral created: {done.referred} — {done.reward}</p>
          <p className="mt-1 text-xs text-stone-500">ID {done.id} — share link: /register?ref={encodeURIComponent(user?.email || "")}</p>
        </div>
      ) : (
        <form onSubmit={submit} className="mt-3 flex gap-2">
          <input value={referredEmail} onChange={(e) => setReferredEmail(e.target.value)} type="email" required placeholder="Friend's email" className="flex-1 rounded-xl border border-amber-200 bg-white px-3 py-2.5 text-sm dark:border-amber-800 dark:bg-stone-900" />
          <button disabled={loading} type="submit" className="flex items-center gap-2 rounded-xl bg-amber-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-amber-500 disabled:opacity-50">
            <Share2 className="h-4 w-4" /> {loading ? "…" : "Refer"}
          </button>
        </form>
      )}
      {error && <p className="mt-2 rounded-xl bg-rose-50 p-2 text-xs text-rose-700 dark:bg-rose-950/30">{error}</p>}

      <div className="mt-3 rounded-xl bg-white/70 p-3 text-[11px] text-stone-600 dark:bg-stone-900/50">
        <p className="font-bold">Your referral link (SSO optimized):</p>
        <p className="mt-1 break-all font-mono text-xs">https://bharathealthguide.in/register?ref={encodeURIComponent(user?.email || "login-required")}&utm_source=referral&utm_medium=user</p>
      </div>
    </div>
  );
}
