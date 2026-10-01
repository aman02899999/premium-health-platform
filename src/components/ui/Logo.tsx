import Image from "next/image";

// The owner's logo is navy/red on white, so on the dark site it sits on a
// white badge to keep its colours readable.
export function BrandMark({ className = "h-10" }: { className?: string }) {
  return (
    <span className={`inline-flex shrink-0 items-center justify-center rounded-xl bg-white px-1.5 py-1 shadow-[0_0_24px_-6px_rgba(124,192,238,.55)] ring-1 ring-sky/50 ${className}`}>
      <Image src="/brand/logo-mark.png" alt="" width={352} height={160} className="h-full w-auto" priority />
    </span>
  );
}

export function Logo({ name, compact = false }: { name: string; compact?: boolean }) {
  const [first, ...rest] = name.split(" ");
  return (
    <span className="flex items-center gap-2.5">
      <BrandMark className="h-11" />
      <span className="leading-none">
        <span className="font-display block text-xl tracking-wider text-white">{first}</span>
        {!compact && <span className="block text-[10px] font-semibold uppercase tracking-[0.35em] text-brand">{rest.join(" ")}</span>}
      </span>
    </span>
  );
}

export function FullLogo({ name, className = "w-48" }: { name: string; className?: string }) {
  return (
    <span className={`block overflow-hidden rounded-2xl bg-white p-3 ring-1 ring-brand/40 ${className}`}>
      <Image src="/brand/logo-full.png" alt={`${name}, Sector 93 Noida logo`} width={640} height={572} className="h-auto w-full" />
    </span>
  );
}
