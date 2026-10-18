"use client";

import { ArrowLeft, BadgeCheck, Check, ExternalLink, RefreshCw, Star, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import type { AdminReview } from "@/lib/reviews/store";

const card = "rounded-2xl border border-white/10 bg-white/[0.03] p-4";
const btn = "inline-flex items-center justify-center gap-1.5 rounded-xl px-3 py-1.5 text-sm font-bold disabled:opacity-40";
const FILTERS = ["pending", "approved", "rejected"] as const;

export function ReviewsAdmin() {
  const [reviews, setReviews] = useState<AdminReview[] | null>(null);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("pending");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/reviews", { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
      setReviews(json.reviews);
      setError("");
    } catch (err) {
      setError((err as Error).message);
    }
  }, []);
  useEffect(() => {
    const t = setTimeout(load, 0);
    return () => clearTimeout(t);
  }, [load]);

  async function decide(id: string, decision: "approved" | "rejected") {
    setBusy(id);
    try {
      const res = await fetch("/api/admin/reviews", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ id, decision }) });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
      setReviews((rs) => rs?.map((r) => (r.id === id ? { ...r, status: decision } : r)) ?? rs);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy("");
    }
  }

  const shown = (reviews ?? []).filter((r) => r.status === filter);
  const count = (s: string) => (reviews ?? []).filter((r) => r.status === s).length;

  return (
    <div className="min-h-screen bg-[#0b0d12] text-white">
      <header className="border-b border-white/10 px-4 py-4">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3">
          <a href="/admin" className="inline-flex items-center gap-2 text-sm text-white/70 hover:text-white">
            <ArrowLeft className="h-4 w-4" /> Admin
          </a>
          <h1 className="text-lg font-bold">Verified reviews</h1>
          <div className="flex gap-2">
            <a href="/reviews" target="_blank" className={`${btn} bg-white/10 hover:bg-white/15`}>
              <ExternalLink className="h-4 w-4" /> Public page
            </a>
            <button type="button" onClick={() => void load()} className={`${btn} bg-white/10 hover:bg-white/15`}>
              <RefreshCw className="h-4 w-4" /> Refresh
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl space-y-4 px-4 py-6">
        <p className={`${card} text-sm text-white/70`}>
          Only members and paid diet-plan clients can post: the number is checked against your records. Approve every genuine review, including critical ones. Reject only spam, abuse, or reviews that aren&apos;t about your gym. Hiding honest criticism breaks Google&apos;s and India&apos;s consumer rules.
        </p>
        <div className="flex gap-2">
          {FILTERS.map((f) => (
            <button key={f} type="button" onClick={() => setFilter(f)} className={`${btn} capitalize ${filter === f ? "bg-amber-400/20 ring-1 ring-amber-400/50" : "bg-white/5 hover:bg-white/10"}`}>
              {f} ({count(f)})
            </button>
          ))}
        </div>
        {error && <p className="rounded-xl bg-red-500/15 px-4 py-2 text-sm text-red-200">{error}</p>}
        {reviews === null && !error && <p className="text-white/55">Loading…</p>}
        {reviews && shown.length === 0 && <p className="text-white/55">No {filter} reviews.</p>}
        {shown.map((r) => (
          <article key={r.id} className={card}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <Star key={n} className={`h-4 w-4 ${n <= r.rating ? "fill-amber-300 text-amber-300" : "text-white/25"}`} />
                ))}
                <span className="ml-2 text-sm text-white/55">{r.date}</span>
              </div>
              <span className="inline-flex items-center gap-1 text-xs text-emerald-300">
                <BadgeCheck className="h-3.5 w-3.5" /> {r.verifiedAs === "member" ? "Member" : "Diet-plan client"}
              </span>
            </div>
            {r.title && <p className="mt-2 font-semibold">{r.title}</p>}
            <p className="mt-1 whitespace-pre-line text-white/80">{r.body}</p>
            <p className="mt-2 text-sm text-white/55">
              {r.fullName} · {r.phone}
              {r.city && ` · ${r.city}`} · shown as “{r.name}”
            </p>
            <div className="mt-3 flex gap-2">
              {r.status !== "approved" && (
                <button type="button" disabled={busy === r.id} onClick={() => void decide(r.id, "approved")} className={`${btn} bg-emerald-500/20 text-emerald-100 ring-1 ring-emerald-400/40 hover:bg-emerald-500/30`}>
                  <Check className="h-4 w-4" /> Approve
                </button>
              )}
              {r.status !== "rejected" && (
                <button type="button" disabled={busy === r.id} onClick={() => void decide(r.id, "rejected")} className={`${btn} bg-white/5 hover:bg-white/10`}>
                  <X className="h-4 w-4" /> Reject (spam / abuse)
                </button>
              )}
            </div>
          </article>
        ))}
      </main>
    </div>
  );
}
