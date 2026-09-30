export function CrownMark({ className = "h-9 w-9" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden>
      <defs>
        <linearGradient id="rfc-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f7e3a1" />
          <stop offset=".5" stopColor="#d4a94a" />
          <stop offset="1" stopColor="#9c6f1e" />
        </linearGradient>
      </defs>
      <rect x="1" y="1" width="46" height="46" rx="12" fill="#0b0b0f" stroke="url(#rfc-g)" strokeWidth="2" />
      <path d="M10 32 8 15l9 8 7-11 7 11 9-8-2 17Z" fill="url(#rfc-g)" />
      <rect x="10" y="34" width="28" height="4" rx="2" fill="url(#rfc-g)" />
    </svg>
  );
}

export function Logo({ name, compact = false }: { name: string; compact?: boolean }) {
  const [first, ...rest] = name.split(" ");
  return (
    <span className="flex items-center gap-2.5">
      <CrownMark />
      <span className="leading-none">
        <span className="font-display block text-xl tracking-wider text-white">{first}</span>
        {!compact && <span className="block text-[10px] font-semibold uppercase tracking-[0.35em] text-gold">{rest.join(" ")}</span>}
      </span>
    </span>
  );
}
