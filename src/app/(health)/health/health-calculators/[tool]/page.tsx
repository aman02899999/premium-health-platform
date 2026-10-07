import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BookOpenCheck, ExternalLink } from "lucide-react";
import { Breadcrumbs, DisclaimerBar } from "@/health/components/ui";
import { UniquePageSEO } from "@/health/components/seo/UniquePageSEO";
import { BmiTool, BodyFatTool, CalorieTool, DueDateTool, OvulationTool } from "@/health/components/calculators/tools";
import { CALCULATOR_PAGES, calculatorPage } from "@/health/data/calculator-pages";
import { SITE } from "@/health/lib/site";

const TOOLS: Record<string, () => React.ReactElement> = {
  "pregnancy-due-date-calculator": DueDateTool,
  "ovulation-calculator": OvulationTool,
  "bmi-calculator": BmiTool,
  "calorie-calculator": CalorieTool,
  "body-fat-calculator": BodyFatTool,
};

export const dynamicParams = false;
export function generateStaticParams() {
  return CALCULATOR_PAGES.map((c) => ({ tool: c.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ tool: string }> }): Promise<Metadata> {
  const c = calculatorPage((await params).tool);
  if (!c) return {};
  const url = `/health/health-calculators/${c.slug}`;
  const og = `${SITE.url}/health/api/og?title=${encodeURIComponent(c.name)}&category=${encodeURIComponent("Calculators")}&type=tool`;
  return {
    title: c.seoTitle,
    description: c.seoDescription,
    alternates: { canonical: url },
    openGraph: { title: c.seoTitle, description: c.seoDescription, url: `${SITE.url}${url}`, type: "website", images: [{ url: og, width: 1200, height: 630, alt: c.name }] },
    twitter: { card: "summary_large_image", title: c.seoTitle, description: c.seoDescription, images: [og] },
  };
}

export default async function CalculatorPage({ params }: { params: Promise<{ tool: string }> }) {
  const { tool } = await params;
  const c = calculatorPage(tool);
  const Tool = TOOLS[tool];
  if (!c || !Tool) notFound();
  const path = `/health/health-calculators/${c.slug}`;
  const app = { "@context": "https://schema.org", "@type": "WebApplication", name: c.name, url: `${SITE.url}${path}`, applicationCategory: "HealthApplication", operatingSystem: "Any", offers: { "@type": "Offer", price: "0", priceCurrency: "INR" }, description: c.seoDescription };
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Breadcrumbs items={[{ label: "Home", href: "/health" }, { label: "Calculators", href: "/health/health-calculators" }, { label: c.name }]} />
      <UniquePageSEO breadcrumbs={[{ name: "Home", item: "/health" }, { name: "Calculators", item: "/health/health-calculators" }, { name: c.name, item: path }]} faqs={c.faqs} howTo={{ name: `How to use the ${c.name}`, steps: c.howTo }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(app) }} />

      <header className="mt-3 rounded-3xl bg-gradient-to-br from-emerald-800 via-teal-800 to-stone-900 p-6 text-white md:p-8">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-emerald-200">Free calculator · no sign-up</p>
        <h1 className="font-display mt-1 text-3xl font-black md:text-4xl">{c.h1}</h1>
        <p className="mt-2 max-w-2xl text-sm text-emerald-50/90 md:text-base">{c.intro}</p>
      </header>

      <div className="mt-6"><Tool /></div>

      <div className="mt-10 grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <section className="rounded-3xl border border-stone-200 bg-white p-6 dark:border-stone-700 dark:bg-stone-900">
            <h2 className="font-display flex items-center gap-2 text-xl font-bold"><BookOpenCheck className="h-5 w-5 text-emerald-600" />How it&apos;s calculated</h2>
            <ul className="mt-3 space-y-2 text-[15px] leading-relaxed text-stone-700 dark:text-stone-200">
              {c.method.map((m) => <li key={m} className="flex gap-2"><span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-600" />{m}</li>)}
            </ul>
            <h3 className="mt-5 text-sm font-bold uppercase tracking-wider text-stone-500">Sources</h3>
            <ul className="mt-2 space-y-1.5 text-sm">
              {c.sources.map((s) => <li key={s.url}><a href={s.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-emerald-700 underline dark:text-emerald-300">{s.label}<ExternalLink className="h-3 w-3" /></a></li>)}
            </ul>
          </section>
          <section className="rounded-3xl border border-stone-200 bg-white p-6 dark:border-stone-700 dark:bg-stone-900">
            <h2 className="font-display text-xl font-bold">Questions people ask</h2>
            <div className="mt-3 divide-y divide-stone-100 dark:divide-stone-800">
              {c.faqs.map((f) => (
                <details key={f.q} className="group py-3">
                  <summary className="cursor-pointer list-none font-semibold marker:hidden">{f.q}</summary>
                  <p className="mt-2 text-[15px] leading-relaxed text-stone-600 dark:text-stone-300">{f.a}</p>
                </details>
              ))}
            </div>
          </section>
        </div>
        <aside className="space-y-3">
          <p className="text-xs font-bold uppercase tracking-wider text-stone-500">More calculators</p>
          {CALCULATOR_PAGES.filter((o) => o.slug !== c.slug).map((o) => (
            <Link key={o.slug} href={`/health/health-calculators/${o.slug}`} className="block rounded-2xl border border-stone-200 bg-white p-4 transition hover:border-emerald-400 dark:border-stone-700 dark:bg-stone-900">
              <p className="font-bold">{o.name}</p>
              <p className="mt-0.5 line-clamp-2 text-xs text-stone-500">{o.intro}</p>
            </Link>
          ))}
        </aside>
      </div>
      <div className="mt-8"><DisclaimerBar compact /></div>
    </div>
  );
}
