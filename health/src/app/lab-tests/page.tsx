import type { Metadata } from "next";
import { FlaskConical } from "lucide-react";
import { LAB_TESTS } from "@/data/clinical";
import { Breadcrumbs, TopicCard, InfoNote, AdSlot, DisclaimerBar } from "@/components/ui";
import { PremiumCTA } from "@/components/earning/PremiumCTA";
import { AffiliateProducts } from "@/components/earning/AffiliateProducts";
import { LatestArticles } from "@/components/blog/LatestArticles";
import { UniquePageSEO } from "@/components/seo/UniquePageSEO";
import { SITE } from "@/lib/site";

const seoTitle = "Lab Tests — HbA1c, Thyroid, Lipid, CBC | India Guide | BHG";
const seoDescription = "Lab tests guide: HbA1c, TSH, lipid, CBC, creatinine, vitamin D, B12 — when to test, cost INR, fasting, India labs. SEO pro + lead gen earning.";
const url = "/lab-tests";
const absoluteUrl = `${SITE.url}${url}`;
const ogImage = `${SITE.url}/api/og?title=${encodeURIComponent("Lab Tests — HbA1c Thyroid India")}&category=${encodeURIComponent("Lab Tests")}&type=tool`;

export const metadata: Metadata = {
  title: seoTitle.slice(0, 60),
  description: seoDescription.slice(0, 155),
  alternates: { canonical: url, languages: { "en-IN": absoluteUrl, "en": absoluteUrl, "x-default": absoluteUrl } },
  openGraph: { title: seoTitle, description: seoDescription, url: absoluteUrl, type: "website", images: [{ url: ogImage, width: 1200, height: 630, alt: seoTitle }] },
  twitter: { card: "summary_large_image", title: seoTitle, description: seoDescription, images: [ogImage] },
};

export default function LabTestsPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Lab Tests" }]} />
      <UniquePageSEO
        breadcrumbs={[{ name: "Home", item: "/" }, { name: "Lab Tests", item: "/lab-tests" }]}
        faqs={[
          { q: "When to test HbA1c?", a: "Every 3-6 months if diabetic, yearly if prediabetes risk. Fasting not needed for HbA1c, but needed for lipid + fasting sugar. Cost INR 300-500." },
          { q: "What is CBC + ferritin + B12 for anemia?", a: "CBC types anemia, ferritin checks iron stores, B12 checks deficiency — common in veg Indians. See /india-risk anemia + anemia guide blog. Lead gen for lab bookings." },
        ]}
        howTo={{ name: "How to book lab test", steps: ["Search test: e.g., HbA1c, TSH, lipid, CBC", "Check when to test, fasting, cost INR, India labs", "Book via lead form — lab partner contacts, home sample", "Track results, compare trends in premium"] }}
      />
      <div className="mt-3 rounded-3xl bg-gradient-to-br from-sky-800 to-blue-900 p-6 text-white md:p-8">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-sky-200">SEO Pro — Earning Platform — Lab Tests — Lead Gen</p>
        <h1 className="font-display mt-1 text-3xl font-black md:text-4xl">Lab Tests — HbA1c, Thyroid, Lipid, CBC — India Guide</h1>
        <p className="mt-2 max-w-2xl text-sm text-sky-100/90">What each test measures, why doctors order it, how to prepare, what abnormal values can mean — and their limits. Never diagnose from one value alone. SEO HowTo+FAQ+OG+LeadGen+PremiumCTA.</p>
      </div>
      <div className="mt-4"><InfoNote text="Reference ranges vary slightly by lab and method. Always interpret reports with your doctor, who knows your medicines, symptoms and trends." /></div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {LAB_TESTS.map((l) => (
              <TopicCard key={l.slug} href={`/lab-tests/${l.slug}`} title={l.name} desc={l.short} icon={<FlaskConical className="h-5 w-5" />} badge={<span className="rounded-full bg-cyan-100 px-2 py-0.5 text-[10px] font-bold uppercase text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200">{l.shortName || "Test"}</span>} />
            ))}
          </div>
          <div className="mt-6 space-y-4">
            <AffiliateProducts limit={4} title="Lab Test Booking — Affiliate + Lead Gen" />
            <LatestArticles limit={4} />
          </div>
        </div>
        <div className="space-y-4">
          <PremiumCTA compact />
          <div className="rounded-3xl border border-stone-200 bg-white p-5 dark:border-stone-700 dark:bg-stone-900">
            <h3 className="text-sm font-bold">Why Lab Tests is SEO Pro + Earning</h3>
            <ul className="mt-2 list-disc pl-5 text-xs text-stone-600 dark:text-stone-300">
              <li>12 tests: HbA1c, TSH, lipid, CBC, creatinine, vitamin D, B12 — when to test, cost INR, fasting</li>
              <li>Earning: lab bookings Rs150-300/lead via /api/lead + affiliate + premium history</li>
              <li>SEO: FAQ + HowTo + Breadcrumb + OG /api/og + internal linking to /india-risk + blog</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="mt-8 space-y-4"><AdSlot slot="Lab tests footer" /><DisclaimerBar compact /></div>
    </div>
  );
}
