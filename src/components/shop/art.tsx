// Marketing artwork drawn in SVG: sharp at any size, no image requests, and no fake product
// photos (the tubs are deliberately unbranded). Admin-uploaded photos replace them when set.
import { useId } from "react";

type Tone = { a: string; b: string; lid: string; label: string };
const TONES: Record<string, Tone> = {
  gold: { a: "#fcd34d", b: "#b45309", lid: "#1c1917", label: "#0c0a09" },
  ink: { a: "#3f3f46", b: "#09090b", lid: "#f59e0b", label: "#fbbf24" },
  red: { a: "#f43f5e", b: "#7f1d1d", lid: "#0c0a09", label: "#fde68a" },
  emerald: { a: "#34d399", b: "#065f46", lid: "#0c0a09", label: "#ecfccb" },
  sky: { a: "#38bdf8", b: "#0c4a6e", lid: "#0c0a09", label: "#e0f2fe" },
};

/** One supplement tub at (x, y), `w` wide. */
function Tub({ x, y, w, tone, word, id }: { x: number; y: number; w: number; tone: Tone; word: string; id: string }) {
  const h = w * 1.18;
  const lid = w * 0.16;
  return (
    <g transform={`translate(${x} ${y})`}>
      <defs>
        <linearGradient id={`${id}-body`} x1="0" x2="1">
          <stop offset="0" stopColor={tone.b} />
          <stop offset=".45" stopColor={tone.a} />
          <stop offset="1" stopColor={tone.b} />
        </linearGradient>
      </defs>
      <ellipse cx={w / 2} cy={h + lid + 6} rx={w * 0.55} ry={w * 0.08} fill="#000" opacity=".45" />
      <rect x={w * 0.04} y={lid} width={w * 0.92} height={h} rx={w * 0.12} fill={`url(#${id}-body)`} />
      <rect x="0" y="0" width={w} height={lid + 4} rx={w * 0.06} fill={tone.lid} />
      <rect x={w * 0.04} y={lid - 2} width={w * 0.92} height="5" fill="#fff" opacity=".12" />
      <rect x={w * 0.12} y={lid + h * 0.28} width={w * 0.76} height={h * 0.42} rx={w * 0.05} fill={tone.label} opacity=".92" />
      <path d={`M${w / 2 - 9} ${lid + h * 0.36} l4 7 5-9 5 9 4-7 -2 14 h-14z`} fill={tone.a} />
      <text x={w / 2} y={lid + h * 0.62} textAnchor="middle" fontFamily="var(--font-oswald), Oswald, sans-serif" fontWeight="700" fontSize={w * 0.13} fill={tone.a} letterSpacing="1">
        {word}
      </text>
      <rect x={w * 0.14} y={lid + 10} width={w * 0.08} height={h - 20} rx="4" fill="#fff" opacity=".18" />
    </g>
  );
}

/** Hero composition: three tubs, glow, sale sticker. */
export function HeroArt({ off, className = "" }: { off: number; className?: string }) {
  const id = useId().replace(/:/g, "");
  return (
    <svg viewBox="0 0 520 460" className={className} role="img" aria-label={off ? `Mega sale — up to ${off}% off supplements` : "Supplements"}>
      <defs>
        <radialGradient id={`${id}-glow`} cx="50%" cy="55%" r="50%">
          <stop offset="0" stopColor="#f59e0b" stopOpacity=".55" />
          <stop offset="1" stopColor="#f59e0b" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${id}-stick`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fde68a" />
          <stop offset="1" stopColor="#d97706" />
        </linearGradient>
      </defs>
      <circle cx="260" cy="250" r="230" fill={`url(#${id}-glow)`} />
      <circle cx="260" cy="250" r="200" fill="none" stroke="#fbbf24" strokeOpacity=".18" strokeDasharray="2 10" />
      <circle cx="260" cy="250" r="160" fill="none" stroke="#fbbf24" strokeOpacity=".12" />
      <Tub id={`${id}a`} x={70} y={170} w={130} tone={TONES.ink} word="AMINO" />
      <Tub id={`${id}c`} x={330} y={180} w={125} tone={TONES.red} word="PRE" />
      <Tub id={`${id}b`} x={175} y={110} w={170} tone={TONES.gold} word="WHEY" />
      {off > 0 && (
        <g transform="translate(395 70) rotate(12)">
          <circle r="62" fill={`url(#${id}-stick)`} />
          <circle r="54" fill="none" stroke="#0c0a09" strokeOpacity=".35" strokeDasharray="3 5" />
          <text y="-14" textAnchor="middle" fontFamily="var(--font-inter), sans-serif" fontWeight="800" fontSize="13" fill="#0c0a09" letterSpacing="2">
            UP TO
          </text>
          <text y="24" textAnchor="middle" fontFamily="var(--font-oswald), Oswald, sans-serif" fontWeight="700" fontSize="44" fill="#0c0a09">
            {off}%
          </text>
          <text y="42" textAnchor="middle" fontFamily="var(--font-inter), sans-serif" fontWeight="800" fontSize="12" fill="#0c0a09" letterSpacing="3">
            OFF
          </text>
        </g>
      )}
      <g fill="#fde68a">
        <path d="M60 90l4 10 10 4-10 4-4 10-4-10-10-4 10-4z" opacity=".8" />
        <path d="M470 330l3 7 7 3-7 3-3 7-3-7-7-3 7-3z" opacity=".6" />
        <path d="M120 400l2 5 5 2-5 2-2 5-2-5-5-2 5-2z" opacity=".5" />
      </g>
    </svg>
  );
}

/** Small art for promo banners. */
export function BannerArt({ tone = "gold", word, className = "" }: { tone?: keyof typeof TONES; word: string; className?: string }) {
  const id = useId().replace(/:/g, "");
  const t = TONES[tone];
  return (
    <svg viewBox="0 0 200 200" className={className} aria-hidden>
      <defs>
        <radialGradient id={`${id}-g`} cx="50%" cy="55%" r="50%">
          <stop offset="0" stopColor={t.a} stopOpacity=".5" />
          <stop offset="1" stopColor={t.a} stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="100" cy="105" r="95" fill={`url(#${id}-g)`} />
      <Tub id={`${id}t`} x={45} y={30} w={110} tone={t} word={word} />
    </svg>
  );
}
