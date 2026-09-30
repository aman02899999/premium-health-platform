import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs, AdSlot, DisclaimerBar } from "@/components/ui";
import { PremiumCTA } from "@/components/earning/PremiumCTA";
import { AffiliateProducts } from "@/components/earning/AffiliateProducts";
import { LatestArticles } from "@/components/blog/LatestArticles";
import { UniquePageSEO } from "@/components/seo/UniquePageSEO";
import { SITE } from "@/lib/site";

const seoTitle = "Exercises — Yoga + Home Workout India | wger + BHG | BHG";
const seoDescription = "Exercises: yoga, pranayama, home workout — India heat friendly, no equipment + 400+ wger free keyless. Unique India, premium + affiliate earning.";
const url = "/exercises";
const absoluteUrl = `${SITE.url}${url}`;
const ogImage = `${SITE.url}/api/og?title=${encodeURIComponent("Exercises — Yoga India")}&category=${encodeURIComponent("Exercises India")}&type=tool`;

export const metadata: Metadata = {
  title: seoTitle.slice(0, 60),
  description: seoDescription.slice(0, 155),
  alternates: { canonical: url, languages: { "en-IN": absoluteUrl, "en": absoluteUrl, "x-default": absoluteUrl } },
  openGraph: { title: seoTitle, description: seoDescription, url: absoluteUrl, type: "website", images: [{ url: ogImage, width: 1200, height: 630, alt: seoTitle }] },
  twitter: { card: "summary_large_image", title: seoTitle, description: seoDescription, images: [ogImage] },
};

async function getExercises(q: string) {
  try {
    const base = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    const res = await fetch(`${base}/api/health/exercises?q=${encodeURIComponent(q)}&limit=12`, { next: { revalidate: 3600 } }).catch(() => null);
    if (!res?.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export default async function ExercisesPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const query = q?.trim() || "chest";
  const data = await getExercises(query);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Exercises India" }]} />
      <UniquePageSEO
        breadcrumbs={[{ name: "Home", item: "/" }, { name: "Exercises India", item: "/exercises" }]}
        faqs={[
          { q: "Which exercise best for diabetes?", a: "Brisk walk 30 min + 2 days strength — lowers HbA1c ~0.5-0.7%. Yoga: surya namaskar + pranayama helps stress + insulin sensitivity. wger 400+ exercises free keyless, educational." },
          { q: "Can I do yoga daily?", a: "Yes — 15-30 min daily safe for most. Avoid inversions if uncontrolled BP, avoid if dizzy. Start 3 days/week, increase. Premium gives progression." },
        ]}
        howTo={{ name: "How to pick exercise", steps: ["Filter by goal: diabetes, weight loss, flexibility, stress", "Search wger 400+ exercises: e.g., chest, squat, pushup", "Pick yoga or home workout, no equipment needed", "Save plan in premium, get weekly progression, track streak"] }}
      />
      <div className="mt-3 rounded-3xl bg-gradient-to-br from-violet-800 to-rose-700 p-6 text-white md:p-8">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-violet-200">Unique India — Earning Platform — SEO Pro — wger + BHG</p>
        <h1 className="font-display mt-1 text-3xl font-black md:text-4xl">Exercises — Yoga + Home Workout — India Friendly + wger 400+</h1>
        <p className="mt-2 max-w-2xl text-sm text-violet-100/90">400+ exercises from <strong>wger</strong> (AGPL-3.0, free keyless) — muscles, equipment, categories + India yoga, home workout, heat friendly. SEO HowTo+FAQ+OG+PremiumCTA+Latest.</p>
        <form className="mt-4 flex gap-2" action="/exercises">
          <input name="q" defaultValue={query} placeholder="Try pushup, squat, chest, biceps…" className="h-11 w-full max-w-md rounded-xl border border-white/20 bg-white/10 px-4 text-sm placeholder:text-emerald-200/60 focus:border-amber-300 focus:outline-none" />
          <button className="h-11 rounded-xl bg-amber-500 px-6 text-sm font-bold text-emerald-950 hover:bg-amber-400">Search</button>
        </form>
        <p className="mt-2 text-[11px] text-emerald-200/70">Source: wger.de API v2 — {data?.source ?? "wger"} · Live: {data?.live ? "yes" : "fallback"} · Cache: {data?.cached ? "hit" : "miss"} · SEO OG /api/og</p>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {data?.data?.map((ex: { id: string; name: string; category?: string; muscles: string[]; equipment: string[]; description?: string }) => (
              <div key={ex.id} className="rounded-2xl border border-stone-200 bg-white p-5 dark:border-stone-700 dark:bg-stone-900">
                <h3 className="font-bold">{ex.name}</h3>
                <p className="mt-1 text-xs text-stone-500">{ex.category} · {ex.muscles?.join(", ") || "—"} · {ex.equipment?.join(", ") || "No equipment"}</p>
                {ex.description && <p className="mt-2 line-clamp-3 text-[13px] text-stone-600 dark:text-stone-300">{ex.description.slice(0, 200)}</p>}
                <p className="mt-2 text-[11px] text-stone-400">ID: {ex.id} · wger.de</p>
              </div>
            )) ?? <p className="text-sm text-stone-500">No exercises found — try a different term or check /api/health/exercises?q={query}</p>}
          </div>

          <div className="mt-8">
            <h2 className="text-sm font-bold">Workout Plans (synthesized) — Earning + SEO</h2>
            <p className="mt-1 text-xs text-stone-500">Example plans built from wger exercises — see /api/health/workouts + workout-builder + yoga-timer — internal linking SEO</p>
            <div className="mt-3 flex gap-2">
              <Link href="/api/health/workouts?q=beginner" className="rounded-xl border px-4 py-2 text-sm font-bold hover:border-emerald-300">View workout API →</Link>
              <Link href="/health-calculators" className="rounded-xl bg-stone-900 px-4 py-2 text-sm font-bold text-white hover:bg-stone-700">Calculators →</Link>
              <Link href="/workout-builder" className="rounded-xl bg-emerald-700 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-600">Workout Builder →</Link>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            <AffiliateProducts limit={4} title="Yoga Mat + Bands — Affiliate" />
            <LatestArticles limit={4} />
          </div>
        </div>
        <div className="space-y-4">
          <PremiumCTA compact />
          <div className="rounded-3xl border border-stone-200 bg-white p-5 dark:border-stone-700 dark:bg-stone-900">
            <h3 className="text-sm font-bold">Why Exercises India is Unique India</h3>
            <ul className="mt-2 list-disc pl-5 text-xs text-stone-600 dark:text-stone-300">
              <li>wger 400+ exercises free keyless AGPL-3.0 + India yoga, home workout, heat friendly</li>
              <li>Earning: yoga mat + bands affiliate + premium plans + ad</li>
              <li>SEO: FAQ (diabetes exercise, daily yoga) + HowTo 4 steps + Breadcrumb + OG</li>
              <li>Internal linking: workout-builder + yoga-timer + health-calculators reduces bounce</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="mt-8 space-y-4"><AdSlot slot="Exercises footer" /><DisclaimerBar compact /></div>
    </div>
  );
}
