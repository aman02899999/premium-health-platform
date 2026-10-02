/* eslint-disable @next/next/no-img-element -- admin-uploaded images come from /api/media or arbitrary hosts */
import { Icon } from "@/components/Icon";
import { uncropped } from "@/lib/uncropped";

// Shows the admin-provided image, or a branded 3D-ish artwork when none is set,
// so the site never looks broken before real photos are uploaded.
export function SmartImage({
  src,
  alt,
  className = "",
  icon = "Crown",
  label,
  priority = false,
  fit = "cover",
}: {
  src?: string;
  alt: string;
  className?: string;
  icon?: string;
  label?: string;
  priority?: boolean;
  /** "contain" shows the whole photo, with a blurred copy filling the empty sides. */
  fit?: "cover" | "contain";
}) {
  if (src && fit === "contain") {
    const full = uncropped(src);
    return (
      <div className={`relative h-full w-full overflow-hidden bg-black ${className}`}>
        <img src={full} alt="" aria-hidden className="absolute inset-0 h-full w-full scale-110 object-cover opacity-50 blur-2xl" loading={priority ? "eager" : "lazy"} decoding="async" />
        <img
          src={full}
          alt={alt}
          className="relative h-full w-full object-contain"
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          fetchPriority={priority ? "high" : "auto"}
        />
      </div>
    );
  }
  if (src) {
    return (
      <img
        src={src}
        alt={alt}
        className={`h-full w-full object-cover ${className}`}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        fetchPriority={priority ? "high" : "auto"}
      />
    );
  }
  const seed = [...alt].reduce((a, c) => a + c.charCodeAt(0), 0);
  const hue = 200 + (seed % 15);
  return (
    <div
      role="img"
      aria-label={alt}
      className={`relative flex h-full w-full items-center justify-center overflow-hidden ${className}`}
      style={{
        background: `radial-gradient(circle at ${20 + (seed % 60)}% 25%, hsla(${hue},85%,40%,.45), transparent 55%), radial-gradient(circle at 80% 90%, rgba(232,57,75,.2), transparent 50%), linear-gradient(160deg,#0f2438,#06111c)`,
      }}
    >
      <div className="grid-floor absolute inset-x-0 bottom-0 h-2/3 [transform:perspective(400px)_rotateX(60deg)] origin-bottom" />
      <div className="relative flex flex-col items-center gap-3 text-center">
        <div className="rounded-2xl border border-brand/40 bg-black/40 p-4 shadow-[0_0_40px_-8px_rgba(232,57,75,.6)]">
          <Icon name={icon} className="h-10 w-10 text-brand" />
        </div>
        {label && <span className="font-display text-lg tracking-wider text-white/85">{label}</span>}
      </div>
    </div>
  );
}
