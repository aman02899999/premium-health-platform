import type { Metadata } from "next";
import Link from "next/link";
import { Award, BadgeCheck, Clock, Gift, ListChecks, MapPin, ShieldCheck, Trophy, Users } from "lucide-react";
import { getContent } from "@/lib/content/store";
import { pageMeta } from "@/lib/seo";
import { LEVELS, QUESTIONS_PER_ATTEMPT, REFERRAL_RETRY_CAP, RETRY_DAYS, SECONDS_PER_QUESTION } from "@/lib/challenge/levels";
import { PRIZES, inr, prizeFor, type PrizeId } from "@/lib/challenge/prizes";
import { RefCapture } from "@/components/challenge/RefCapture";

export const revalidate = 21600;

export async function generateMetadata(): Promise<Metadata> {
  const c = await getContent();
  return pageMeta(c, {
    title: "Royal Knowledge Challenge: Fitness Quiz with Free Gym Prizes",
    description: `Take the free monthly fitness quiz by ${c.business.name}, Sector 93 Noida. Beginner, Intermediate and Advance levels, a certificate, badges, ranks, and prizes up to 3 months free gym.`,
    path: "/challenge",
  });
}

const TIERS = [
  { key: "gold", label: "90% or more" },
  { key: "silver", label: "80–89%" },
  { key: "bronze", label: "70–79% (pass)" },
] as const;

function PrizeCell({ id }: { id: PrizeId | null }) {
  if (!id) return <span className="text-white/60">Badge + certificate</span>;
  const p = PRIZES[id];
  return (
    <span>
      <span className="font-semibold text-white">{p.name}</span>
      {p.extra && <span className="text-white/70"> {p.extra}</span>}
      {p.worth && <span className="block text-xs text-sky">worth {inr(p.worth)}</span>}
    </span>
  );
}

export default async function ChallengePage() {
  const c = await getContent();
  const steps = [
    { icon: Users, title: "Sign in and fill your details", text: "Google or email, plus your name and mobile number. It takes a minute." },
    { icon: ListChecks, title: `${QUESTIONS_PER_ATTEMPT} questions, ${SECONDS_PER_QUESTION} seconds each`, text: "Read the question, tap to see the 4 options, then pick one. You get one tap per question, and you can't go back." },
    { icon: Award, title: "Get your result straight away", text: "Your score, a badge, your rank and a Certificate of Achievement you can download and share." },
    { icon: Gift, title: "Win a prize", text: "Top scores win prizes every month. Collect a gym prize at the gym with your claim code and photo ID." },
  ];
  return (
    <>
      <RefCapture />
      <section className="relative overflow-hidden border-b border-line bg-gradient-to-b from-steel to-ink">
        <div className="mx-auto max-w-5xl px-4 pb-12 pt-32 text-center sm:px-6 sm:pb-16 sm:pt-40">
          <p className="inline-flex items-center gap-2 rounded-full bg-brand/15 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-brand-soft ring-1 ring-brand/30">
            <Trophy className="h-4 w-4" aria-hidden /> Free monthly fitness quiz
          </p>
          <h1 className="mt-4 font-display text-4xl leading-tight text-white sm:text-5xl">
            Royal Knowledge <span className="text-brand">Challenge</span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base text-white/80 sm:text-lg">
            Fitness ka kitna gyaan hai aapko? Quiz khelo, certificate aur badge paao, aur top score karke jeeto up to <strong className="text-white">3 months free gym</strong> at {c.business.name}, Sector 93 Noida.
          </p>
          <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link prefetch={false} href="/challenge/play" className="btn-brand inline-flex min-h-12 items-center justify-center rounded-xl px-7 text-base font-semibold">
              Start the challenge
            </Link>
            <a href="#prizes" className="inline-flex min-h-12 items-center justify-center rounded-xl px-6 text-base font-semibold text-white ring-1 ring-white/20 hover:ring-white/40">
              See the prizes
            </a>
          </div>
          <p className="mt-4 text-xs text-white/55">Free to play. No payment, ever.</p>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
        <h2 className="font-display text-2xl text-white sm:text-3xl">How it works</h2>
        <ol className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s, i) => (
            <li key={s.title} className="rounded-2xl bg-white/[.04] p-5 ring-1 ring-white/10">
              <s.icon className="h-6 w-6 text-brand" aria-hidden />
              <p className="mt-3 text-xs font-semibold text-sky">Step {i + 1}</p>
              <h3 className="mt-1 font-semibold text-white">{s.title}</h3>
              <p className="mt-1 text-sm text-white/70">{s.text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="mx-auto max-w-5xl px-4 pb-4 sm:px-6">
        <h2 className="font-display text-2xl text-white sm:text-3xl">Three levels</h2>
        <p className="mt-2 text-sm text-white/70">Start with Beginner. Pass it (70% or more) to unlock Intermediate, then Advance.</p>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {LEVELS.map((l, i) => (
            <div key={l.id} className="rounded-2xl bg-white/[.04] p-5 ring-1 ring-white/10">
              <p className="text-xs font-semibold uppercase tracking-wider text-sky">Level {i + 1}</p>
              <h3 className="mt-1 font-display text-xl text-white">{l.name}</h3>
              <p className="mt-2 text-sm text-white/70">{l.blurb}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="prizes" className="mx-auto max-w-5xl scroll-mt-24 px-4 py-12 sm:px-6">
        <h2 className="font-display text-2xl text-white sm:text-3xl">Prizes every month</h2>
        <p className="mt-2 text-sm text-white/70">Worth is our standard price for that plan. You can win one prize a month, the best one your score earns.</p>
        <div className="mt-6 space-y-4 md:hidden">
          {[...LEVELS].reverse().map((l) => (
            <div key={l.id} className="rounded-2xl bg-white/[.04] p-4 ring-1 ring-white/10">
              <h3 className="font-display text-lg text-white">{l.name}</h3>
              <dl className="mt-2 space-y-2 text-sm">
                {TIERS.map((t) => (
                  <div key={t.key} className="flex gap-3">
                    <dt className="w-28 shrink-0 text-white/60">{t.label}</dt>
                    <dd><PrizeCell id={prizeFor(l.id, t.key)} /></dd>
                  </div>
                ))}
              </dl>
            </div>
          ))}
        </div>
        <div className="mt-6 hidden overflow-hidden rounded-2xl ring-1 ring-white/10 md:block">
          <table className="w-full text-left text-sm">
            <thead className="bg-white/[.06] text-white/70">
              <tr>
                <th className="p-4 font-semibold">Level</th>
                {TIERS.map((t) => <th key={t.key} className="p-4 font-semibold">{t.label}</th>)}
              </tr>
            </thead>
            <tbody>
              {[...LEVELS].reverse().map((l) => (
                <tr key={l.id} className="border-t border-white/10 align-top">
                  <th className="p-4 font-display text-base text-white">{l.name}</th>
                  {TIERS.map((t) => <td key={t.key} className="p-4"><PrizeCell id={prizeFor(l.id, t.key)} /></td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-6 rounded-2xl bg-white/[.04] p-5 ring-1 ring-white/10">
          <h3 className="font-semibold text-white">Prizes each month (limited)</h3>
          <ul className="mt-2 grid gap-1 text-sm text-white/75 sm:grid-cols-2">
            {(Object.keys(PRIZES) as PrizeId[]).map((id) => (
              <li key={id}>
                {PRIZES[id].cap} × {PRIZES[id].name}
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-white/55">If more people qualify than there are prizes, the highest scores win; on a tie, the faster total time wins. Everyone who passes still gets a badge and a certificate.</p>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 pb-12 sm:px-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl bg-brand/10 p-5 ring-1 ring-brand/30">
            <Users className="h-6 w-6 text-brand" aria-hidden />
            <h2 className="mt-2 font-display text-xl text-white">Want another go? Earn an attempt</h2>
            <p className="mt-2 text-sm text-white/80">
              You get one attempt per level, and a free one again {RETRY_DAYS} days later. To play sooner:
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-white/80">
              <li><strong className="text-white">Refer a friend.</strong> When a friend signs up with your link or code, using their own mobile number, and finishes a quiz, you get 1 attempt. Each friend counts once, up to {REFERRAL_RETRY_CAP} a month.</li>
              <li><strong className="text-white">Watch and share.</strong> Watch our YouTube video and share your link on WhatsApp, Instagram or anywhere. When 5 different people open it, you get 1 attempt. Once a month.</li>
            </ul>
          </div>
          <div className="rounded-2xl bg-white/[.04] p-5 ring-1 ring-white/10">
            <MapPin className="h-6 w-6 text-sky" aria-hidden />
            <h2 className="mt-2 font-display text-xl text-white">Not in Noida?</h2>
            <p className="mt-2 text-sm text-white/80">
              Play from anywhere. Gym prizes are collected in person at our gym in Sector 93, Noida, so if you live outside Noida/NCR, a gym prize becomes our 1-month online diet plan (worth {inr(PRIZES["diet-1m"].worth!)}).
            </p>
          </div>
        </div>
      </section>

      <section id="rules" className="mx-auto max-w-5xl scroll-mt-24 px-4 pb-16 sm:px-6">
        <h2 className="font-display text-2xl text-white sm:text-3xl">Rules</h2>
        <ul className="mt-4 space-y-2 text-sm text-white/75">
          <li className="flex gap-2"><Clock className="mt-0.5 h-4 w-4 shrink-0 text-sky" aria-hidden />{QUESTIONS_PER_ATTEMPT} random questions, {SECONDS_PER_QUESTION} seconds each, counted from when the question appears. One tap per question; an unanswered question counts as wrong. Leaving the quiz doesn&apos;t pause the clock.</li>
          <li className="flex gap-2"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-sky" aria-hidden />One account per person and per mobile number. Switching tabs or apps during the quiz is noted, and attempts with a lot of switching don&apos;t qualify for prizes. Prizes won by cheating, fake accounts or someone else&apos;s details are cancelled.</li>
          <li className="flex gap-2"><Gift className="mt-0.5 h-4 w-4 shrink-0 text-sky" aria-hidden />Prizes are worked out after each month ends, and winners get an email with a claim code. Collect within 30 days with the claim code and a photo ID with the same name. Prizes can&apos;t be exchanged for cash or given to someone else. Existing members get the free time added to their plan.</li>
          <li className="flex gap-2"><BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-sky" aria-hidden />The certificate is a Certificate of Achievement from {c.business.name}. It is not a professional qualification. Open to anyone aged 18 or over.</li>
          <li className="flex gap-2"><Trophy className="mt-0.5 h-4 w-4 shrink-0 text-sky" aria-hidden />The leaderboard shows only players who choose to appear on it, as first name and surname initial. The questions are general fitness education, not medical advice.</li>
        </ul>
        <div className="mt-8 text-center">
          <Link prefetch={false} href="/challenge/play" className="btn-brand inline-flex min-h-12 items-center justify-center rounded-xl px-7 text-base font-semibold">
            Start the challenge
          </Link>
        </div>
      </section>
    </>
  );
}
