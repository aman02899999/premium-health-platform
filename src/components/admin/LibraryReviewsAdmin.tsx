"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, Loader2, X } from "lucide-react";
import { Stars } from "@/components/library/Stars";

type Review = { id: string; createdAt: string; slug: string; rating: number; body: string; displayName: string; city: string | null; country: string; status: "pending" | "approved" | "rejected" };

/** Approve or reject buyer reviews before they appear on the book pages. */
export function LibraryReviewsAdmin({ titles }: { titles: Record<string, string> }) {
  const [reviews, setReviews] = useState<Review[] | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");

  const load = useCallback(() => {
    fetch("/api/admin/library/reviews")
      .then((r) => r.json())
      .then((d) => {
        setReviews(d.reviews ?? []);
        setError(d.error ?? "");
      })
      .catch(() => setError("Couldn't load reviews."));
  }, []);
  useEffect(load, [load]);

  async function decide(id: string, status: "approved" | "rejected") {
    setBusy(id);
    const res = await fetch("/api/admin/library/reviews", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, status }) });
    if (!res.ok) setError((await res.json().catch(() => ({}))).error || "Couldn't update the review.");
    setBusy("");
    load();
  }

  const pending = reviews?.filter((r) => r.status === "pending").length ?? 0;
  return (
    <section className="rounded-2xl bg-coal p-5 ring-1 ring-white/10 sm:p-6">
      <h2 className="font-display text-xl text-white">Buyer reviews</h2>
      <p className="mt-1 text-sm text-white/50">Only paying buyers can review. Nothing shows on the site until you approve it. {pending > 0 && <strong className="text-white">{pending} waiting.</strong>}</p>
      {error && <p className="mt-4 rounded-xl bg-red-500/15 p-3 text-sm text-red-200">{error}</p>}
      {!reviews ? (
        <Loader2 className="mt-4 h-5 w-5 animate-spin text-brand" />
      ) : reviews.length === 0 ? (
        <p className="mt-4 text-white/55">No reviews yet.</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {reviews.map((r) => (
            <li key={r.id} className="rounded-xl border border-white/10 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-sm">
                  <Stars value={r.rating} className="h-3.5 w-3.5" />
                  <span className="text-white/80">{titles[r.slug] ?? r.slug}</span>
                </div>
                <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${r.status === "approved" ? "bg-emerald-500/15 text-emerald-300" : r.status === "rejected" ? "bg-red-500/15 text-red-300" : "bg-yellow-500/15 text-yellow-200"}`}>{r.status}</span>
              </div>
              <p className="mt-2 whitespace-pre-line text-sm text-white/75">{r.body}</p>
              <p className="mt-2 text-xs text-white/45">
                {r.displayName} · {[r.city, r.country].filter(Boolean).join(", ")} · {new Date(r.createdAt).toLocaleDateString("en-IN")}
              </p>
              <div className="mt-3 flex gap-2">
                {r.status !== "approved" && (
                  <button type="button" disabled={busy === r.id} onClick={() => decide(r.id, "approved")} className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-3 py-1.5 text-xs font-bold text-emerald-200 disabled:opacity-50">
                    <Check className="h-3.5 w-3.5" /> Approve
                  </button>
                )}
                {r.status !== "rejected" && (
                  <button type="button" disabled={busy === r.id} onClick={() => decide(r.id, "rejected")} className="inline-flex items-center gap-1 rounded-full bg-red-500/15 px-3 py-1.5 text-xs font-bold text-red-200 disabled:opacity-50">
                    <X className="h-3.5 w-3.5" /> Reject
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
