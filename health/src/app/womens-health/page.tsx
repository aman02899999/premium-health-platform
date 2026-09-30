import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs, TopicCard, AdSlot, DisclaimerBar } from "@/components/ui";
import { getDisease } from "@/data/diseases-index";
import { PremiumCTA } from "@/components/earning/PremiumCTA";
import { AffiliateProducts } from "@/components/earning/AffiliateProducts";
import { LatestArticles } from "@/components/blog/LatestArticles";
import { UniquePageSEO } from "@/components/seo/UniquePageSEO";
import { SITE } from "@/lib/site";

const seoTitle = "Women's Health — PCOS, Periods, Pregnancy, Thyroid | BHG";
const seoDescription = "Indian women's health hub: menstrual health, PCOS, thyroid, anemia, pregnancy nutrition and menopause with responsible guidance. SEO pro + earning.";
const url = "/womens-health";
const absoluteUrl = `${SITE.url}${url}`;
const ogImage = `${SITE.url}/api/og?title=${encodeURIComponent("Women's Health — PCOS India")}&category=${encodeURIComponent("Women's Health")}&type=tool`;

export const metadata: Metadata = {
  title: seoTitle.slice(0, 60),
  description: seoDescription.slice(0, 155),
  alternates: { canonical: url, languages: { "en-IN": absoluteUrl, "en": absoluteUrl, "x-default": absoluteUrl } },
  openGraph: { title: seoTitle, description: seoDescription, url: absoluteUrl, type: "website", images: [{ url: ogImage, width: 1200, height: 630, alt: seoTitle }] },
  twitter: { card: "summary_large_image", title: seoTitle, description: seoDescription, images: [ogImage] },
};

export default function WomensPage() {
  const slugs = ["pcos", "menstrual-health", "pregnancy-nutrition", "iron-deficiency", "hypothyroidism", "menopause", "anemia", "fertility", "breast-health"];
  const items = slugs.map(getDisease).filter(Boolean);
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Women's Health" }]} />
      <UniquePageSEO
        breadcrumbs={[{ name: "Home", item: "/" }, { name: "Women's Health", item: "/womens-health" }]}
        faqs={[
          { q: "What is PCOS?", a: "Polycystic ovary syndrome — irregular periods, androgen signs, polycystic ovaries on ultrasound (Rotterdam criteria). Lifestyle first-line: 5-10% weight loss, strength 3x/week, protein 1.2-1.6g/kg, sleep 8h. See /blog/pcos-complete-guide-indian-women." },
          { q: "When to see doctor for periods?", a: "Heavy bleeding >7 days, >80ml, clots >2.5cm, cycle <21 or >35 days, intermenstrual bleeding, severe pain — see gynecologist. Track periods, anemia CBC+ferritin+B12." },
        ]}
        howTo={{ name: "How to use women's health hub", steps: ["Pick topic: PCOS, menstrual health, pregnancy nutrition, iron deficiency, thyroid, menopause", "Read symptoms, causes, tests, treatment, nutrition, India cost", "Check related blog + diet + lab tests + calculators", "Book consult via lead form if red flags"] }}
      />
      <div className="mt-3 rounded-3xl bg-gradient-to-br from-rose-800 via-pink-800 to-emerald-900 p-6 text-white md:p-8">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-rose-200">SEO Pro — Earning Platform — Women's Health — ItemList</p>
        <h1 className="font-display mt-1 text-3xl font-black md:text-4xl">Women's Health — PCOS, Periods, Pregnancy, Thyroid & More</h1>
        <p className="mt-2 max-w-2xl text-sm text-white/90">Periods, PCOS, thyroid, anemia, pregnancy and menopause — explained kindly, with nutrition, tests and when to seek care. Pregnancy content carries extra safety warnings. SEO HowTo+FAQ+OG+PremiumCTA+Affiliate.</p>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((d) => d && <TopicCard key={d.slug} href={`/diseases/${d.slug}`} title={d.name} hindi={d.hindiName} desc={d.short} />)}
          </div>
          <p className="mt-6 text-sm">Also read: <Link href="/blog/pcos-complete-guide-indian-women" className="font-bold text-emerald-700 underline">PCOS complete guide</Link> · <Link href="/diet" className="font-bold text-emerald-700 underline">PCOS nutrition plan</Link> · <Link href="/thali-builder" className="font-bold text-emerald-700 underline">thali builder →</Link> · <Link href="/india-risk" className="font-bold text-emerald-700 underline">anemia risk →</Link></p>
          <div className="mt-6 space-y-4">
            <AffiliateProducts limit={4} title="Women's Health — Affiliate" />
            <LatestArticles limit={4} />
          </div>
        </div>
        <div className="space-y-4">
          <PremiumCTA compact />
          <div className="rounded-3xl border border-stone-200 bg-white p-5 dark:border-stone-700 dark:bg-stone-900">
            <h3 className="text-sm font-bold">Why Women's Health is SEO Pro + Earning</h3>
            <ul className="mt-2 list-disc pl-5 text-xs text-stone-600 dark:text-stone-300">
              <li>9 topics: PCOS, menstrual health, pregnancy nutrition, iron deficiency, thyroid, menopause, anemia, fertility, breast health</li>
              <li>Earning: lab bookings + dietitian + affiliate + premium</li>
              <li>SEO: FAQ + HowTo + Breadcrumb + OG /api/og + ItemList JSON-LD + internal linking</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="mt-8 space-y-4"><AdSlot slot="Hub footer" /><DisclaimerBar compact /></div>
    </div>
  );
}
