import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  AlertTriangle, Apple, BookOpen, CheckCircle2, FlaskConical, Heart, Leaf,
  Pill, ShieldAlert, Sparkles, Stethoscope, XCircle, Activity, Brain,
} from "lucide-react";
import { DISEASES, getDisease } from "@/data/diseases-index";
import { getDiseaseDetail } from "@/data/diseases-detail";
import { getHerb } from "@/data/herbs";
import { getMedicine } from "@/data/medicines";
import { getLab } from "@/data/clinical";
import {
  Breadcrumbs, KeyTakeaway, DoctorBox, EmergencyBox, FaqAccordion,
  ShareButtons, AdSlot, DisclaimerBar, LikeButton, Newsletter,
} from "@/components/ui";
import { EvidenceStack, RiskBarChart } from "@/components/charts";
import { articleJsonLd, faqJsonLd, breadcrumbJsonLd } from "@/lib/seo";
import { formatDate } from "@/lib/format";
import { LiveResearchSection } from "@/components/research";
import { HealthProductRecommendations } from "@/components/monetization/HealthProductRecommendations";
import { MonetizationCTA } from "@/components/monetization/MonetizationCTA";
import { AdInArticle, AdRectangle, AdBanner } from "@/components/monetization/AdComponents";
import { DIGITAL_PRODUCTS, PREMIUM_REPORTS } from "@/lib/monetization/config";

export function generateStaticParams() {
  return DISEASES.map((d) => ({ slug: d.slug }));
}

// The valid slug set is fixed and known at build time — anything else must 404.
// Without this, unknown slugs are rendered on demand, and because the root
// loading.tsx streams the response shell with a 200 before notFound() throws,
// they were served as soft 404s (HTTP 200 with "not found" content).
export const dynamicParams = false;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const d = getDisease(slug);
  if (!d) return { title: "Disease not found" };
  return {
    title: `${d.name} — Symptoms, Causes, Tests, Treatment & Diet`,
    description: d.short,
    alternates: { canonical: `/diseases/${slug}` },
    openGraph: { title: `${d.name} | Bharat Health Guide`, description: d.short, type: "article" },
  };
}

function Section({ id, icon, title, children }: { id: string; icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-28 rounded-3xl border border-stone-200 bg-white p-5 md:p-6 dark:border-stone-700 dark:bg-stone-900">
      <h2 className="font-display flex items-center gap-2 text-xl font-bold text-stone-900 md:text-2xl dark:text-stone-50">
        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-200">{icon}</span>{title}
      </h2>
      <div className="mt-3 text-[15px] leading-relaxed text-stone-700 dark:text-stone-200">{children}</div>
    </section>
  );
}

function Bullets({ items, icon }: { items: string[]; icon?: React.ReactNode }) {
  return (
    <ul className="space-y-2">
      {items.map((it, i) => (
        <li key={i} className="flex gap-2.5">{icon || <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-emerald-600" />}<span>{it}</span></li>
      ))}
    </ul>
  );
}

export default async function DiseasePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const detail = getDiseaseDetail(slug);
  if (!detail) notFound();

  const toc = [
    ["definition", "Definition & quick facts"], ["symptoms", "Symptoms"], ["causes", "Causes & risk factors"],
    ["types", "Types"], ["diagnosis", "Diagnosis & tests"], ["modern", "Modern treatment"],
    ["ayurveda", "Ayurveda view"], ["herbs", "Herbs"], ["nutrition", "Nutrition"],
    ["lifestyle", "Lifestyle & yoga"], ["homeopathy", "Homeopathy note"], ["evidence", "What evidence says"],
    ["safety", "Safety & warnings"], ["complications", "Complications"], ["emergency", "Emergency signs"],
    ["doctor", "When to see a doctor"], ["research", "Live research & trials"], ["faq", "FAQs"], ["references", "References"],
  ];

  const relatedHerbs = detail.relatedHerbs.map(getHerb).filter(Boolean);
  const relatedMeds = detail.relatedMedicines.map(getMedicine).filter(Boolean);
  const relatedLabs = detail.relatedLabs.map(getLab).filter(Boolean);
  const relatedDis = detail.relatedDiseases.map(getDisease).filter(Boolean);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Diseases", href: "/diseases" }, { label: detail.name }]} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd({ title: detail.name, description: detail.short, slug: `/diseases/${slug}`, category: detail.category })) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd(detail.faqs)) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Diseases", path: "/diseases" }, { name: detail.name, path: `/diseases/${slug}` }])) }} />

      {/* Hero */}
      <div className="hero-pattern mt-3 overflow-hidden rounded-3xl border border-emerald-100 p-6 md:p-8 dark:border-stone-700">
        <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold uppercase tracking-wider">
          <span className="rounded-full bg-emerald-700 px-3 py-1 text-white">{detail.system}</span>
          <span className="rounded-full bg-amber-100 px-3 py-1 text-amber-800 dark:bg-amber-900 dark:text-amber-200">{detail.category}</span>
          <span className="rounded-full border border-stone-300 px-3 py-1 text-stone-600 dark:border-stone-600 dark:text-stone-300">{detail.chronic ? "Chronic" : "Episodic"} · {detail.common ? "Common" : "Less common"}</span>
        </div>
        <h1 className="font-display mt-3 text-3xl font-black leading-tight md:text-[2.75rem]">{detail.name}</h1>
        {detail.hindiName && <p className="mt-1 text-lg text-stone-500 dark:text-stone-400">{detail.hindiName}</p>}
        <p className="mt-3 max-w-3xl text-[16px] leading-relaxed text-stone-600 dark:text-stone-300">{detail.definition}</p>
        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-stone-500 dark:text-stone-400">
          <span>By <strong>BHG Editorial Team</strong></span>
          <span>Medically reviewed by: <strong>Review pending — placeholder</strong></span>
          <span>Updated: {formatDate(detail.updatedAt)}</span>
          <LikeButton id={slug} />
        </div>
        <div className="mt-3"><ShareButtons title={detail.name} path={`/diseases/${slug}`} /></div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[240px_1fr_300px]">
        {/* TOC */}
        <aside className="hidden lg:block">
          <nav className="sticky top-32 rounded-2xl border border-stone-200 bg-white p-4 dark:border-stone-700 dark:bg-stone-900" aria-label="Table of contents">
            <p className="mb-2 text-xs font-bold uppercase tracking-wider text-stone-500">On this page</p>
            <ul className="space-y-1">
              {toc.map(([id, label]) => (
                <li key={id}><a href={`#${id}`} className="toc-link block rounded-lg px-2 py-1 text-[13px] text-stone-600 hover:bg-emerald-50 hover:text-emerald-800 dark:text-stone-300">{label}</a></li>
              ))}
            </ul>
          </nav>
        </aside>

        {/* Main */}
        <div className="space-y-5">
          <div className="lg:hidden">
            <details className="rounded-2xl border border-stone-200 bg-white p-4 dark:border-stone-700 dark:bg-stone-900">
              <summary className="cursor-pointer text-sm font-bold">Table of contents</summary>
              <ul className="mt-2 grid grid-cols-2 gap-1">{toc.map(([id, label]) => <li key={id}><a href={`#${id}`} className="text-[13px] text-emerald-700 underline">{label}</a></li>)}</ul>
            </details>
          </div>

          <Section id="definition" icon={<BookOpen className="h-4 w-4" />} title="Definition & quick facts">
            <div className="grid gap-2 sm:grid-cols-2">
              {detail.quickFacts.map((f) => (
                <div key={f.label} className="rounded-2xl bg-stone-50 p-3 dark:bg-stone-800/60">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-stone-500">{f.label}</p>
                  <p className="mt-0.5 text-sm font-semibold">{f.value}</p>
                </div>
              ))}
            </div>
          </Section>

          <KeyTakeaway points={[detail.short, `Course: ${detail.chronic ? "often long-term — focus on control and complication prevention" : "often episodic — focus on triggers and timely care"}.`, "Never stop prescribed medicines without supervision."]} />

          <Section id="symptoms" icon={<Activity className="h-4 w-4" />} title="Symptoms">
            <Bullets items={detail.symptoms} />
          </Section>

          <Section id="causes" icon={<AlertTriangle className="h-4 w-4" />} title="Causes & risk factors">
            <p className="mb-2 text-sm font-bold">Common causes & contributors</p>
            <Bullets items={detail.causes} />
            <p className="mb-2 mt-4 text-sm font-bold">Risk factors</p>
            <div className="flex flex-wrap gap-1.5">{detail.riskFactors.map((r) => <span key={r} className="rounded-full bg-amber-50 px-3 py-1.5 text-[13px] font-medium text-amber-900 dark:bg-amber-950/50 dark:text-amber-100">{r}</span>)}</div>
            <div className="mt-4"><RiskBarChart title="Which risk factors matter most? (educational pattern)" source="BHG editorial synthesis — illustrative, not trial data" data={detail.riskFactors.slice(0, 5).map((r, i) => ({ name: r.length > 18 ? r.slice(0, 18) + "…" : r, value: 90 - i * 14 }))} /></div>
          </Section>

          <Section id="types" icon={<BookOpen className="h-4 w-4" />} title="Types & patterns">
            <div className="grid gap-2 sm:grid-cols-2">
              {(detail.types || []).map((t) => (
                <div key={t.name} className="rounded-2xl border border-stone-100 p-3 dark:border-stone-800"><p className="text-sm font-bold">{t.name}</p><p className="mt-1 text-[13px] text-stone-600 dark:text-stone-300">{t.desc}</p></div>
              ))}
            </div>
          </Section>

          <Section id="diagnosis" icon={<FlaskConical className="h-4 w-4" />} title="How diagnosis works & investigations">
            <Bullets items={detail.diagnosis} />
            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead><tr className="border-b text-xs uppercase text-stone-500"><th className="py-2 pr-3">Investigation</th><th className="py-2">Purpose</th></tr></thead>
                <tbody>{detail.investigations.map((t) => <tr key={t.test} className="border-b last:border-0 dark:border-stone-800"><td className="py-2 pr-3 font-medium">{t.slug ? <Link href={`/lab-tests/${t.slug}`} className="text-emerald-700 underline">{t.test}</Link> : t.test}</td><td className="py-2 text-stone-600 dark:text-stone-300">{t.purpose}</td></tr>)}</tbody>
              </table>
            </div>
          </Section>

          <AdSlot slot="In-content" />

          <Section id="modern" icon={<Stethoscope className="h-4 w-4" />} title="Modern medical treatment overview">
            <p className="mb-2 rounded-xl bg-sky-50 p-2.5 text-[13px] text-sky-900 dark:bg-sky-950/50 dark:text-sky-100"><strong>Evidence: strong</strong> for guideline-directed care. Treatment is individualised — this overview never replaces your doctor&apos;s plan.</p>
            <Bullets items={detail.modernTreatment} />
          </Section>

          <Section id="ayurveda" icon={<Sparkles className="h-4 w-4" />} title="Ayurveda perspective (traditional)">
            <p className="mb-2 rounded-xl bg-amber-50 p-2.5 text-[13px] text-amber-900 dark:bg-amber-950/50 dark:text-amber-100"><strong>Traditional framework</strong> — concepts below are classical, not modern diagnoses. Evidence for disease modification is generally limited.</p>
            <Bullets items={detail.ayurvedaView} />
          </Section>

          <Section id="herbs" icon={<Leaf className="h-4 w-4" />} title="Herbs traditionally used">
            <div className="grid gap-2 sm:grid-cols-2">
              {detail.herbsUsed.map((h) => (
                <Link key={h.slug} href={`/herbs/${h.slug}`} className="rounded-2xl border border-stone-100 p-3 hover:border-emerald-300 dark:border-stone-800">
                  <p className="text-sm font-bold text-emerald-700">{h.name} →</p>
                  <p className="mt-1 text-[13px] text-stone-600 dark:text-stone-300">{h.note}</p>
                </Link>
              ))}
            </div>
          </Section>

          <Section id="nutrition" icon={<Apple className="h-4 w-4" />} title="Nutrition considerations">
            <Bullets items={detail.nutrition} />
            <p className="mt-2 text-sm\">Explore: <Link href="/nutrition" className="font-bold text-emerald-700 underline\">food guides</Link> · <Link href="/diet" className="font-bold text-emerald-700 underline\">meal plans</Link> · <Link href="/recipes" className="font-bold text-emerald-700 underline\">recipes</Link></p>
          </Section>

          {/* Monetization: Middle - Calculator + Premium Guide — preserves educational content, enhances journey */}
          <div className="space-y-4">
            <AdInArticle placement="disease_middle" page={`/diseases/${slug}`} />
            <div className="rounded-3xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50 p-5 dark:border-emerald-800 dark:from-emerald-950/30">
              <h3 className="font-bold">Calculate Your Risk — Free + Premium Report ₹49-₹99</h3>
              <p className="mt-1 text-sm text-stone-600 dark:text-stone-300\">Free: BMI, diabetes-risk, heart-risk estimators. Premium: Detailed BMI & Wellness Report ₹49, Personalized Nutrition Report ₹99 — educational, includes interpretation, lifestyle worksheet, questions for doctor, not diagnosis, no prescriptions.</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Link href="/health-calculators" className="rounded-xl bg-emerald-700 px-4 py-2 text-xs font-bold text-white">Open Calculators →</Link>
                {PREMIUM_REPORTS.slice(0, 2).map((r) => (
                  <Link key={r.id} href={`/store/${r.slug}`} className="rounded-xl border border-emerald-300 bg-white px-4 py-2 text-xs font-bold text-emerald-800 hover:bg-emerald-50">{r.title.split("—")[0]} — ₹{r.price} →</Link>
                ))}
              </div>
            </div>
            <div className="rounded-3xl border border-amber-200 bg-white p-5 dark:border-amber-800 dark:bg-stone-900">
              <h3 className="font-bold">Premium Guide — After Educational Section — Educational Resource</h3>
              <p className="mt-1 text-sm text-stone-600 dark:text-stone-300\">Free: basic explanation, symptoms, risk factors, general prevention, basic nutrition. Premium: downloadable PDF, detailed educational information, checklist, questions to ask doctor, lifestyle worksheet, food checklist, monitoring checklist, references. Never hide emergency info behind paywall.</p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {DIGITAL_PRODUCTS.filter((p) => p.active).slice(0, 2).map((p) => (
                  <div key={p.id} className="rounded-xl border border-stone-200 p-3 dark:border-stone-700">
                    <p className="text-[11px] font-bold uppercase text-amber-600">{p.category} · {p.pages} pages · {p.fileSize}</p>
                    <p className="mt-1 text-sm font-bold">{p.title}</p>
                    <p className="mt-1 text-xs text-stone-500">{p.description.slice(0, 80)}… Educational, not medical promise.</p>
                    <Link href={`/store/${p.slug}`} className="mt-2 inline-block rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-stone-900">{p.ctaText}</Link>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <Section id="lifestyle" icon={<Heart className="h-4 w-4" />} title="Lifestyle & yoga / activity">
            <Bullets items={detail.lifestyle} />
            <p className="mb-2 mt-4 text-sm font-bold\">Yoga & physical activity</p>
            <Bullets items={detail.yogaActivity} />
          </Section>

          {/* Monetization: Product Section — Contextual, neutral language */}
          <HealthProductRecommendations condition={slug} limit={4} page={`/diseases/${slug}`} />
          <MonetizationCTA pageType="disease" page={`/diseases/${slug}`} />
          <AdRectangle placement="disease_bottom" page={`/diseases/${slug}`} />

          {/* Monetization: Bottom — Diet Plan + Newsletter */}
          <div className="rounded-3xl border border-stone-200 bg-white p-5 dark:border-stone-700 dark:bg-stone-900">
            <h3 className="font-bold">Relevant Diet Plan — Educational Nutrition Resource</h3>
            <p className="mt-1 text-sm text-stone-600 dark:text-stone-300\">Educational nutrition resource — discuss dietary changes with qualified healthcare professional. Do not market generic diet plans as treatment for disease. Language: “Educational nutrition resource”.</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {DIGITAL_PRODUCTS.filter((p) => p.category === "Diet Plans").slice(0, 2).map((p) => (
                <div key={p.id} className="rounded-xl border border-stone-200 p-3 dark:border-stone-700">
                  <p className="text-[11px] font-bold uppercase text-emerald-600">{p.category} · {p.pages} pages</p>
                  <p className="mt-1 text-sm font-bold">{p.title}</p>
                  <Link href={`/store/${p.slug}`} className="mt-2 inline-block rounded-xl bg-emerald-700 px-4 py-2 text-xs font-bold text-white">{p.ctaText}</Link>
                </div>
              ))}
            </div>
          </div>

          <Section id="homeopathy" icon={<Brain className="h-4 w-4" />} title="Homeopathy section (evidence status)">
            <p className="mb-2 rounded-xl bg-indigo-50 p-2.5 text-[13px] text-indigo-900 dark:bg-indigo-950/50 dark:text-indigo-100"><strong>Evidence: insufficient</strong> for most claimed uses. Never replace effective treatment for serious disease.</p>
            <Bullets items={detail.homeopathyNote} />
            <p className="mt-2 text-sm\"><Link href="/homeopathy" className="font-bold text-emerald-700 underline\">Read our honest homeopathy explainer →</Link></p>
          </Section>

          <Section id="evidence" icon={<CheckCircle2 className="h-4 w-4" />} title="What evidence says">
            <Bullets items={detail.evidenceNotes} />
            <div className="mt-4"><EvidenceStack items={[{ label: "Lifestyle (diet, activity, sleep)", level: "Strong", color: "bg-emerald-500", width: "w-[92%]" }, { label: "Guideline medicines", level: "Strong", color: "bg-emerald-500", width: "w-[88%]" }, { label: "Herbal adjuncts", level: "Limited–Mixed", color: "bg-amber-400", width: "w-[35%]" }, { label: "Homeopathy for this condition", level: "Insufficient", color: "bg-rose-500", width: "w-[10%]" }]} /></div>
          </Section>

          <Section id="safety" icon={<ShieldAlert className="h-4 w-4" />} title="What NOT to do · Medication safety">
            <p className="mb-2 text-sm font-bold\">Avoid these</p>
            <Bullets items={detail.shouldNotDo} icon={<XCircle className="mt-1 h-4 w-4 shrink-0 text-rose-500" />} />
            <p className="mb-2 mt-4 text-sm font-bold\">Medication safety</p>
            <Bullets items={detail.medicationSafety} icon={<Pill className="mt-1 h-4 w-4 shrink-0 text-sky-600" />} />
          </Section>

          <Section id="complications" icon={<AlertTriangle className="h-4 w-4" />} title="Potential complications">
            <div className="flex flex-wrap gap-1.5\">{detail.complications.map((c) => <span key={c} className="rounded-full bg-rose-50 px-3 py-1.5 text-[13px] font-medium text-rose-900 dark:bg-rose-950/50 dark:text-rose-100\">{c}</span>)}</div>
          </Section>

          <div id="emergency" className="scroll-mt-28\"><EmergencyBox signs={detail.emergencySigns} /></div>
          <div id="doctor" className="scroll-mt-28\"><DoctorBox points={detail.whenToSeeDoctor} /></div>

          <Section id="research" icon={<BookOpen className="h-4 w-4" />} title="Live research & clinical trials">
            <p className="mb-3 text-[13px] text-stone-600 dark:text-stone-300\">Latest peer-reviewed studies from PubMed (NCBI E-utilities) and registered trials from ClinicalTrials.gov — free, keyless, server-side, cached 6h, with graceful fallback. Sandbox preview blocks external APIs, so this shows fallback there and goes live automatically on real deployment.</p>
            <LiveResearchSection diseaseName={detail.name} diseaseSlug={slug} />
          </Section>

          <Section id="faq" icon={<BookOpen className="h-4 w-4" />} title="Frequently asked questions">
            <FaqAccordion faqs={detail.faqs} />
          </Section>

          <Section id="references" icon={<BookOpen className="h-4 w-4" />} title="References">
            <ol className="list-decimal space-y-1 pl-5 text-sm text-stone-600 dark:text-stone-300">
              {detail.references.map((r, i) => <li key={i}>{r.title} — <em>{r.source}</em>{r.year ? ` (${r.year})` : ""}</li>)}
            </ol>
            <p className="mt-2 text-xs text-stone-500\">We cite guidelines and reviews, never fabricated studies. Specific trial citations are added during medical review.</p>
          </Section>

          {/* Related */}
          <section className="rounded-3xl border border-stone-200 bg-gradient-to-br from-emerald-50/60 to-amber-50/60 p-5 dark:border-stone-700 dark:from-stone-900 dark:to-stone-900" aria-label="Related content">
            <h2 className="font-display text-xl font-bold\">Related content</h2>
            <div className="mt-3 grid gap-4 sm:grid-cols-2">
              {relatedDis.length > 0 && <div><p className="text-xs font-bold uppercase tracking-wider text-stone-500\">Related diseases</p><ul className="mt-1 space-y-1\">{relatedDis.map((r) => r && <li key={r.slug}><Link href={`/diseases/${r.slug}`} className="text-sm font-medium text-emerald-700 underline\">{r.name}</Link></li>)}</ul></div>}
              {relatedMeds.length > 0 && <div><p className="text-xs font-bold uppercase tracking-wider text-stone-500\">Related medicines</p><ul className="mt-1 space-y-1\">{relatedMeds.map((r) => r && <li key={r.slug}><Link href={`/medicines/${r.slug}`} className="text-sm font-medium text-emerald-700 underline\">{r.genericName}</Link></li>)}</ul></div>}
              {relatedHerbs.length > 0 && <div><p className="text-xs font-bold uppercase tracking-wider text-stone-500\">Related herbs</p><ul className="mt-1 space-y-1\">{relatedHerbs.map((r) => r && <li key={r.slug}><Link href={`/herbs/${r.slug}`} className="text-sm font-medium text-emerald-700 underline\">{r.name}</Link></li>)}</ul></div>}
              {relatedLabs.length > 0 && <div><p className="text-xs font-bold uppercase tracking-wider text-stone-500\">Related lab tests</p><ul className="mt-1 space-y-1\">{relatedLabs.map((r) => r && <li key={r.slug}><Link href={`/lab-tests/${r.slug}`} className="text-sm font-medium text-emerald-700 underline\">{r.name}</Link></li>)}</ul></div>}
            </div>
          </section>

          <Newsletter />
          <DisclaimerBar />
        </div>

        {/* Sidebar */}
        <aside className="space-y-4">
          <div className="rounded-2xl border border-stone-200 bg-white p-4 dark:border-stone-700 dark:bg-stone-900">
            <p className="text-xs font-bold uppercase tracking-wider text-stone-500\">Quick facts</p>
            <dl className="mt-2 space-y-2 text-[13px]\">
              <div className="flex justify-between gap-2\"><dt className="text-stone-500\">System</dt><dd className="font-semibold\">{detail.system}</dd></div>
              <div className="flex justify-between gap-2\"><dt className="text-stone-500\">Course</dt><dd className="font-semibold\">{detail.chronic ? "Chronic" : "Episodic"}</dd></div>
              <div className="flex justify-between gap-2\"><dt className="text-stone-500\">Nutrition role</dt><dd className="font-semibold\">{detail.nutritionRelevance}</dd></div>
              {detail.ayurvedaCategory && <div className="flex justify-between gap-2\"><dt className="text-stone-500\">Ayurveda</dt><dd className="text-right font-semibold\">{detail.ayurvedaCategory}</dd></div>}
            </dl>
          </div>
          <AdSlot slot="Sidebar" />
          <AdBanner placement="products_sidebar" page={`/diseases/${slug}`} />
          <div className="rounded-2xl border border-stone-200 bg-white p-4 dark:border-stone-700 dark:bg-stone-900">
            <p className="text-xs font-bold uppercase tracking-wider text-stone-500\">Common symptoms</p>
            <div className="mt-2 flex flex-wrap gap-1.5\">{detail.symptoms.map((s) => <Link key={s} href="/symptoms" className="rounded-full bg-stone-100 px-2.5 py-1 text-xs font-medium hover:bg-emerald-100 dark:bg-stone-800\">{s}</Link>)}</div>
          </div>
          <div className="rounded-2xl bg-gradient-to-br from-emerald-800 to-teal-800 p-4 text-white">
            <p className="text-sm font-bold\">Calculate your risk</p>
            <p className="mt-1 text-xs text-emerald-100/80\">BMI, diabetes-risk and heart-risk estimators.</p>
            <Link href="/health-calculators" className="mt-2 inline-block rounded-xl bg-white/15 px-3 py-1.5 text-xs font-bold hover:bg-white/25">Open calculators →</Link>
          </div>
          <AdSlot slot="Sidebar 2" />
        </aside>
      </div>
    </div>
  );
}
