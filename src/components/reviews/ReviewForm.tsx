"use client";

import { useState } from "react";
import { Check, Loader2, Star } from "lucide-react";

export function ReviewForm() {
  const [rating, setRating] = useState(0);
  const [state, setState] = useState<"idle" | "sending" | "done">("idle");
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;
    if (!rating) return setError("Please choose a star rating.");
    setState("sending");
    setError("");
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...data, rating, consent: data.consent === "on" }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || "Couldn't send your review. Please try again.");
      setState("done");
    } catch (err) {
      setError((err as Error).message);
      setState("idle");
    }
  }

  if (state === "done") {
    return (
      <div className="glass rounded-3xl p-8 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-brand/15">
          <Check className="h-8 w-8 text-brand" />
        </div>
        <h3 className="font-display mt-5 text-3xl text-white">Thank you!</h3>
        <p className="mt-3 text-white/70">Your review is verified against your membership and will appear here after a quick check (usually within a day).</p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="glass brand-border space-y-4 rounded-3xl p-6 sm:p-8">
      <div>
        <span className="mb-1.5 block text-sm text-white/75">Your rating *</span>
        <div role="radiogroup" aria-label="Rating" className="flex gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} type="button" role="radio" aria-checked={rating === n} aria-label={`${n} star${n > 1 ? "s" : ""}`} onClick={() => setRating(n)} className="rounded p-1">
              <Star className={`h-8 w-8 ${n <= rating ? "fill-brand text-brand" : "text-white/30"}`} />
            </button>
          ))}
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1.5 block text-sm text-white/75">Your name *</span>
          <input name="name" required minLength={2} maxLength={80} autoComplete="name" className="field" placeholder="Shown as first name + initial" />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm text-white/75">Mobile number you joined with *</span>
          <input name="phone" required type="tel" inputMode="tel" autoComplete="tel" className="field" placeholder="10-digit mobile (never shown)" />
        </label>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1.5 block text-sm text-white/75">Area / city</span>
          <input name="city" maxLength={60} className="field" placeholder="e.g. Sector 93, Noida" />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm text-white/75">Headline</span>
          <input name="title" maxLength={80} className="field" placeholder="e.g. Lost 8 kg in 4 months" />
        </label>
      </div>
      <label className="block">
        <span className="mb-1.5 block text-sm text-white/75">Your experience *</span>
        <textarea name="body" required minLength={20} maxLength={1200} rows={5} className="field" placeholder="What did you train for, what changed, what could be better?" />
      </label>
      <input name="company" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
      <label className="flex items-start gap-3 text-sm text-white/70">
        <input type="checkbox" name="consent" required className="mt-1 accent-[#e8394b]" />
        <span>My review is my own honest experience, and it can be shown on this website with my first name, initial and area.</span>
      </label>
      {error && <p role="alert" className="text-sm text-red-300">{error}</p>}
      <button type="submit" disabled={state === "sending"} className="btn-brand inline-flex w-full items-center justify-center gap-2 rounded-full px-8 py-3.5 font-bold disabled:opacity-60 sm:w-auto">
        {state === "sending" && <Loader2 className="h-5 w-5 animate-spin" />} Submit review
      </button>
    </form>
  );
}
