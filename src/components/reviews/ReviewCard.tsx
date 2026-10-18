import { BadgeCheck, Star } from "lucide-react";
import { VERIFIED_LABEL, type PublicReview } from "@/lib/reviews/validate";
import { formatDate } from "@/lib/growth/dates";

export function Stars({ rating, className = "h-4 w-4" }: { rating: number; className?: string }) {
  return (
    <div className="flex gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, k) => (
        <Star key={k} className={`${className} ${k < rating ? "fill-brand text-brand" : "text-white/25"}`} />
      ))}
    </div>
  );
}

export function ReviewCard({ r }: { r: PublicReview }) {
  return (
    <figure className="glass flex h-full flex-col rounded-3xl p-7">
      <div className="flex items-center justify-between gap-3">
        <Stars rating={r.rating} />
        <time dateTime={r.date} className="text-xs text-white/45">
          {formatDate(r.date)}
        </time>
      </div>
      {r.title && <p className="mt-4 font-semibold text-white">{r.title}</p>}
      <blockquote className="mt-2 flex-1 whitespace-pre-line text-white/80">“{r.body}”</blockquote>
      <figcaption className="mt-5">
        <span className="block font-semibold text-white">
          {r.name}
          {r.city && <span className="font-normal text-white/55"> · {r.city}</span>}
        </span>
        <span className="mt-1 inline-flex items-center gap-1 text-xs text-emerald-300">
          <BadgeCheck className="h-3.5 w-3.5" /> {VERIFIED_LABEL[r.verifiedAs]}
        </span>
      </figcaption>
    </figure>
  );
}
