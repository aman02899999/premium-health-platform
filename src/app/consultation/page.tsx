import type { Metadata } from "next";
import { Breadcrumbs, AdSlot, DisclaimerBar } from "@/components/ui";
import { UniquePageSEO } from "@/components/seo/UniquePageSEO";
import { SITE } from "@/lib/site";
import { LEAD_FORMS } from "@/lib/monetization/config";
import { LeadForm } from "@/components/monetization/LeadForm";
import { PremiumCTA } from "@/components/earning/PremiumCTA";
import { LatestArticles } from "@/components/blog/LatestArticles";
import { AdBanner } from "@/components/monetization/AdComponents";

const seoTitle = "Consultation — Diet, Fitness, Wellness | BHG";
const seoDescription = "Lead generation: diet consultation, fitness, wellness, health package, clinic inquiry, corporate wellness — minimal data, consent, rate limiting, spam protection.";
const url = "/consultation";
const absoluteUrl = `${SITE.url}${url}`;
const ogImage = `${SITE.url}/api/og?title=${encodeURIComponent("Consultation — Lead Gen")}&category=${encodeURIComponent("Lead Generation")}&type=tool`;

export const metadata: Metadata = {
  title: seoTitle.slice(0, 60),
  description: seoDescription.slice(0, 155),
  alternates: { canonical: url, languages: { "en-IN": absoluteUrl, "en": absoluteUrl, "x-default": absoluteUrl } },
  openGraph: { title: seoTitle, description: seoDescription, url: absoluteUrl, type: "website", images: [{ url: ogImage, width: 1200, height: 630, alt: seoTitle }] },
};

export default function ConsultationPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Consultation" }]} />
      <UniquePageSEO
        breadcrumbs={[{ name: "Home", item: "/" }, { name: "Consultation", item: "/consultation" }]}
        faqs={[
          { q: "What is lead generation?", a: "Generic lead engine for diet consultation, fitness consultation, wellness consultation, health package inquiry, clinic inquiry, corporate wellness inquiry. Collect only necessary info: name, email, phone, service, message, consent, timestamp. Do not request unnecessary sensitive medical info. Spam protection + rate limiting 5/min via /api/monetization/leads." },
          { q: "How to create lead form?", a: "Add config to LEAD_FORMS in src/lib/monetization/config.ts — id, title, description, service, fields, active, ctaText, successMessage. Render via <LeadForm config={} page='' />. Track lead_submitted via analytics + POST /api/monetization/leads." },
        ]}
        howTo={{ name: "How to request consultation", steps: ["Pick service: diet, fitness, wellness, health package, clinic, corporate", "Fill minimal info — name, email, phone, message, consent", "Submit — rate limiting + validation + privacy policy", "Track via /api/monetization/leads?limit=20 + analytics lead_submitted"] }}
      />
      <div className="mt-3 rounded-3xl bg-gradient-to-br from-emerald-900 to-teal-800 p-6 text-white md:p-8">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-emerald-200">Lead Generation — Modular — Privacy-Conscious — Rate Limited</p>
        <h1 className="font-display mt-1 text-3xl font-black">Consultation — Diet, Fitness, Wellness, Corporate — Lead Gen</h1>
        <p className="mt-2 max-w-2xl text-sm text-emerald-100/90">Connect with qualified professionals — diet, fitness, wellness, health package, clinic, corporate wellness. Minimal data collection, consent, timestamp, spam protection, rate limiting. Never request unnecessary sensitive medical info.</p>
      </div>

      <div className="mt-4"><AdBanner placement="homepage_top" page="/consultation" /></div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {LEAD_FORMS.map((f) => (
            <LeadForm key={f.id} config={f} page="/consultation" />
          ))}
        </div>
        <div className="space-y-4">
          <PremiumCTA compact />
          <LatestArticles limit={4} />
          <div className="rounded-3xl border border-stone-200 bg-white p-5 dark:border-stone-700 dark:bg-stone-900">
            <h3 className="text-sm font-bold">Lead Setup — Admin</h3>
            <ol className="mt-2 list-decimal pl-5 text-xs text-stone-600 dark:text-stone-300">
              <li>Create form config in LEAD_FORMS — id, title, service, fields, ctaText, successMessage</li>
              <li>Render via LeadForm component — handles validation, consent, rate limiting</li>
              <li>POST /api/monetization/leads — validates name 2-100 chars, email regex, consent required, message max 1000</li>
              <li>GET /api/monetization/leads?limit=20 — admin view (auth required in prod)</li>
              <li>Track lead_submitted via /api/monetization/analytics + gtag</li>
              <li>Do not store unnecessary health info — protect customer info — privacy policy</li>
            </ol>
          </div>
        </div>
      </div>

      <div className="mt-8 space-y-4"><AdSlot slot="Consultation footer" /><DisclaimerBar compact /></div>
    </div>
  );
}
