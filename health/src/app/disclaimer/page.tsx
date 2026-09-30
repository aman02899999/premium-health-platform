import type { Metadata } from "next";
import { Breadcrumbs, EmergencyBox, AdSlot, DisclaimerBar } from "@/components/ui";
import { SITE } from "@/lib/site";
import { UniquePageSEO } from "@/components/seo/UniquePageSEO";

const seoTitle = "Medical Disclaimer — Educational Only | BHG";
const seoDescription = "Bharat Health Guide is educational information only — not diagnosis, treatment or emergency care. Read full disclaimer, emergency guidance, medicines, herbs safety.";
const url = "/disclaimer";
const absoluteUrl = `${SITE.url}${url}`;
const ogImage = `${SITE.url}/api/og?title=${encodeURIComponent("Disclaimer — BHG")}&category=${encodeURIComponent("Disclaimer")}&type=tool`;

export const metadata: Metadata = {
  title: seoTitle.slice(0, 60),
  description: seoDescription.slice(0, 155),
  alternates: { canonical: url, languages: { "en-IN": absoluteUrl, "en": absoluteUrl, "x-default": absoluteUrl } },
  openGraph: { title: seoTitle, description: seoDescription, url: absoluteUrl, type: "website", images: [{ url: ogImage, width: 1200, height: 630, alt: seoTitle }] },
  twitter: { card: "summary_large_image", title: seoTitle, description: seoDescription, images: [ogImage] },
};

export default function DisclaimerPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Disclaimer" }]} />
      <UniquePageSEO
        breadcrumbs={[{ name: "Home", item: "/" }, { name: "Disclaimer", item: "/disclaimer" }]}
        faqs={[
          { q: "Is BHG medical advice?", a: "No — educational only, not diagnosis, treatment or emergency care. Never start, stop, reduce or change medicines without medical supervision. For emergency, call 102/108." },
          { q: "Are herbs & Ayurveda safe?", a: "Traditional uses distinguished from clinical evidence. Concentrated products can interact with medicines or harm liver/kidney — coordinate Vaidya + doctor, buy AYUSH-licensed tested products." },
        ]}
        howTo={{ name: "How to use BHG safely", steps: ["Read as education, not prescription", "Never self-adjust medicines based on BHG", "Consult doctor + pharmacist + Vaidya for personal advice", "For emergency symptoms, call 102/108 immediately, not BHG tools"] }}
      />
      <div className="mt-3 rounded-3xl bg-gradient-to-br from-amber-800 to-stone-800 p-6 text-white md:p-8">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-amber-200">SEO Pro — E-E-A-T — Trust — Disclaimer — Emergency Guidance</p>
        <h1 className="font-display mt-1 text-3xl font-black">Medical Disclaimer — Educational Only — Not Diagnosis</h1>
        <p className="mt-2 max-w-2xl text-sm text-amber-100/90">Bharat Health Guide is educational information only — not diagnosis, treatment or emergency care. Read full disclaimer, emergency guidance, medicines, herbs safety, calculators limits. SEO HowTo+FAQ+OG.</p>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="rounded-3xl border-2 border-amber-300 bg-amber-50 p-5 text-[15px] leading-relaxed text-amber-950 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-100">
            <strong>{SITE.disclaimer}</strong> Never disregard professional advice or delay seeking it because of something you read here.
          </div>
          <div className="prose-health mt-4 space-y-4 rounded-3xl border border-stone-200 bg-white p-6 text-[14px] leading-relaxed text-stone-700 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200">
            <p><strong>Medicines:</strong> Never start, stop, reduce or change prescribed medicines without medical supervision. Medicine pages carry no personalised doses. See /drug-lookup + /herb-interaction.</p>
            <p><strong>Herbs & Ayurveda:</strong> Traditional uses distinguished from clinical evidence. Concentrated products can interact with medicines or harm liver/kidney — coordinate all practitioners. See /herb-interaction + /ayurveda.</p>
            <p><strong>Symptom tools & calculators:</strong> Educational estimates only, never diagnoses. Emergency symptoms need immediate care, not home tools. See /symptoms + /health-calculators + /india-risk.</p>
            <p><strong>Pregnancy & children:</strong> Extra caution applies. Doses individual and weight-based; this site never provides personalised pediatric or obstetric dosing. See /womens-health + /child-health + /child-growth.</p>
            <p><strong>Monetisation:</strong> Ads and affiliates never override safety. Sponsored content clearly labelled. Affiliate disclosure at /affiliate-disclosure + /deals + /products + Product JSON-LD.</p>
          </div>
          <div className="mt-4"><EmergencyBox signs={["Chest pain or pressure", "Severe difficulty breathing", "Sudden weakness / face droop / speech difficulty", "Severe allergic reaction or loss of consciousness", "Severe bleeding or suspected stroke", "Severe hypoglycaemia (confusion, seizures)"]} /></div>
        </div>
        <div className="space-y-4">
          <div className="rounded-3xl border border-stone-200 bg-white p-5 dark:border-stone-700 dark:bg-stone-900">
            <h3 className="text-sm font-bold">Why Disclaimer is E-E-A-T + SEO Pro</h3>
            <ul className="mt-2 list-disc pl-5 text-xs text-stone-600 dark:text-stone-300">
              <li>E-E-A-T: About + Contact + Privacy + Terms + Disclaimer + Affiliate Disclosure — trust signals</li>
              <li>EmergencyBox with 6 red flags — safety + SEO</li>
              <li>SEO: FAQ + HowTo + Breadcrumb + OG /api/og + canonical+hreflang + internal linking</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="mt-8 space-y-4"><AdSlot slot="Disclaimer footer" /><DisclaimerBar compact /></div>
    </div>
  );
}
