import { Star } from "lucide-react";

/** Read-only star rating (supports halves by rounding to the nearest half). */
export function Stars({ value, className = "h-4 w-4" }: { value: number; className?: string }) {
  const r = Math.round(value * 2) / 2;
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${value.toFixed(1)} out of 5 stars`} role="img">
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className="relative inline-block">
          <Star className={`${className} text-white/20`} />
          {r >= i - 0.5 && (
            <span className="absolute inset-0 overflow-hidden" style={{ width: r >= i ? "100%" : "50%" }}>
              <Star className={`${className} fill-amber-400 text-amber-400`} />
            </span>
          )}
        </span>
      ))}
    </span>
  );
}
