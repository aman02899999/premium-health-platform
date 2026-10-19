import { ArrowDown, ArrowRight, Target } from "lucide-react";
import type { FlowStep } from "@/lib/content/program-guides";

/** Program-flow infographic: numbered phases joined by arrows, then the expected outcomes. Pure HTML/CSS so it scales and prints. */
export function ProgramFlow({ steps, outcomes, session }: { steps: FlowStep[]; outcomes: string[]; session: { part: string; minutes: number }[] }) {
  const total = session.reduce((s, p) => s + p.minutes, 0);
  return (
    <figure className="glass brand-border rounded-3xl p-5 sm:p-8" aria-label="Program flow and expected outcomes">
      <ol className="grid gap-3 lg:grid-cols-[1fr_auto_1fr_auto_1fr_auto_1fr] lg:items-stretch">
        {steps.map((s, i) => (
          <li key={s.title} className="contents">
            <div className="rounded-2xl bg-black/30 p-4 ring-1 ring-white/10">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand font-display text-lg text-white">{i + 1}</span>
                <div>
                  <p className="font-display text-lg leading-tight text-white">{s.title}</p>
                  <p className="text-xs font-semibold uppercase tracking-wider text-brand">{s.weeks}</p>
                </div>
              </div>
              <p className="mt-3 text-sm text-white/65">{s.detail}</p>
            </div>
            {i < steps.length - 1 && (
              <div className="flex items-center justify-center text-brand/70" aria-hidden>
                <ArrowDown className="h-5 w-5 lg:hidden" />
                <ArrowRight className="hidden h-5 w-5 lg:block" />
              </div>
            )}
          </li>
        ))}
      </ol>

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/50">Typical session · about {total} min</p>
          <div className="mt-3 flex h-9 overflow-hidden rounded-full ring-1 ring-white/10" role="img" aria-label={session.map((p) => `${p.part} ${p.minutes} minutes`).join(", ")}>
            {session.map((p, i) => (
              <div key={p.part} style={{ width: `${(p.minutes / total) * 100}%`, opacity: 1 - i * 0.18 }} className="flex items-center justify-center bg-brand text-[11px] font-bold text-white">
                {p.minutes}′
              </div>
            ))}
          </div>
          <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-white/60">
            {session.map((p, i) => (
              <li key={p.part} className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-brand" style={{ opacity: 1 - i * 0.18 }} />
                {p.part}
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-2xl bg-brand/10 p-4 ring-1 ring-brand/30">
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-brand">
            <Target className="h-4 w-4" /> What to expect
          </p>
          <ul className="mt-3 space-y-2 text-sm text-white/80">
            {outcomes.map((o) => (
              <li key={o} className="flex gap-2">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
                {o}
              </li>
            ))}
          </ul>
          <p className="mt-3 text-[11px] text-white/45">General guidelines when the plan is followed consistently. Individual results vary.</p>
        </div>
      </div>
    </figure>
  );
}
