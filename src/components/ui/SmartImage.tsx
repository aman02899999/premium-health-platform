/* eslint-disable @next/next/no-img-element -- admin-uploaded images come from /api/media or arbitrary hosts */
import { Icon } from "@/components/Icon";

// Shows the admin-provided image, or a branded 3D-ish artwork when none is set,
// so the site never looks broken before real photos are uploaded.
export function SmartImage({
  src,
  alt,
  className = "",
  icon = "Crown",
  label,
  priority = false,
}: {
  src?: string;
  alt: string;
  className?: string;
  icon?: string;
  label?: string;
  priority?: boolean;
}) {
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
  const hue = 30 + (seed % 25);
  return (
    <div
      role="img"
      aria-label={alt}
      className={`relative flex h-full w-full items-center justify-center overflow-hidden ${className}`}
      style={{
        background: `radial-gradient(circle at ${20 + (seed % 60)}% 25%, hsla(${hue},70%,55%,.35), transparent 55%), radial-gradient(circle at 80% 90%, rgba(226,59,59,.18), transparent 50%), linear-gradient(160deg,#17171f,#0a0a0e)`,
      }}
    >
      <div className="grid-floor absolute inset-x-0 bottom-0 h-2/3 [transform:perspective(400px)_rotateX(60deg)] origin-bottom" />
      <div className="relative flex flex-col items-center gap-3 text-center">
        <div className="rounded-2xl border border-gold/40 bg-black/40 p-4 shadow-[0_0_40px_-8px_rgba(212,169,74,.6)]">
          <Icon name={icon} className="h-10 w-10 text-gold" />
        </div>
        {label && <span className="font-display text-lg tracking-wider text-white/85">{label}</span>}
      </div>
    </div>
  );
}
