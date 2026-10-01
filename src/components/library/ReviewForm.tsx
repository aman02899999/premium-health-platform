"use client";

import { useState } from "react";
import { CheckCircle2, Loader2, Star } from "lucide-react";
import { REVIEW_COUNTRIES } from "@/lib/library/review-form";

/** A verified buyer rates and reviews one book from their download page. */
export function ReviewForm({ token, slug, title, defaultName, existing }: { token: string; slug: string; title: string; defaultName: string; existing?: { rating: number; status: string } }) {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(existing?.rating ?? 0);
  const [hover, setHover] = useState(0);
  const [form, setForm] = useState({ body: "", displayName: defaultName, city: "", country: "India" });
  const [state, setState] = useState<"idle" | "busy" | "done">("idle");
  const [error, setError] = useState("");

  if (state === "done") return <p className="flex items-center gap-2 text-sm text-emerald-300"><CheckCircle2 className="h-4 w-4" /> Thanks! Your review will appear once it&apos;s checked.</p>;
  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="text-sm font-semibold text-brand underline">
        {existing ? `Edit your review (${existing.status === "approved" ? "published" : existing.status === "rejected" ? "not published" : "awaiting check"})` : "Rate & review this book"}
      </button>
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setState("busy");
    setError("");
    const res = await fetch("/api/library/review", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token, slug, rating, ...form }) });
    const out = await res.json().catch(() => ({}));
    if (res.ok) setState("done");
    else {
      setError(out.error || "Couldn't save your review.");
      setState("idle");
    }
  }

  const input = "w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-white/35 focus:border-brand focus:outline-none";
  return (
    <form onSubmit={submit} className="mt-3 space-y-2 rounded-xl border border-white/10 bg-black/20 p-3">
      <p className="text-xs text-white/55">Your rating for {title}</p>
      <div className="flex gap-1" onMouseLeave={() => setHover(0)}>
        {[1, 2, 3, 4, 5].map((i) => (
          <button key={i} type="button" aria-label={`${i} star${i > 1 ? "s" : ""}`} onClick={() => setRating(i)} onMouseEnter={() => setHover(i)}>
            <Star className={`h-6 w-6 ${(hover || rating) >= i ? "fill-amber-400 text-amber-400" : "text-white/25"}`} />
          </button>
        ))}
      </div>
      <textarea required minLength={20} maxLength={1500} rows={3} placeholder="What did you find useful? Who would you recommend it to?" value={form.body} onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))} className={input} />
      <div className="grid gap-2 sm:grid-cols-3">
        <input required maxLength={40} placeholder="Name to show" value={form.displayName} onChange={(e) => setForm((f) => ({ ...f, displayName: e.target.value }))} className={input} />
        <input maxLength={60} placeholder="City (optional)" value={form.city} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))} className={input} />
        <select value={form.country} onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))} className={input}>
          {REVIEW_COUNTRIES.map((c) => (
            <option key={c} value={c} className="bg-coal">{c}</option>
          ))}
        </select>
      </div>
      {error && <p role="alert" className="text-sm text-red-300">{error}</p>}
      <button disabled={state === "busy" || rating === 0} className="btn-brand inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold disabled:opacity-50">
        {state === "busy" && <Loader2 className="h-4 w-4 animate-spin" />} Submit review
      </button>
    </form>
  );
}
