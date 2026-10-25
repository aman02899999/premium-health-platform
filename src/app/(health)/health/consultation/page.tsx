import type { Metadata } from "next";
import { Breadcrumbs, AdSlot, DisclaimerBar } from "@/health/components/ui";
import { UniquePageSEO } from "@/health/components/seo/UniquePageSEO";
import { SITE } from "@/health/lib/site";
import { LEAD_FORMS } from "@/health/lib/monetization/config";
import { LeadForm } from "@/health/components/monetization/LeadForm";
import { PremiumCTA } from "@/health/components/earning/PremiumCTA";
import { LatestArticles } from "@/health/components/blog/LatestArticles";
import { AdBanner } from "@/health/components/monetization/AdComponents";

const seoTitle = "Consultation — Diet, Fitness, Wellness | Bharat Health Guide";
const seoDescription = "Lead generation: diet consultation, fitness, wellness, health package, clinic inquiry, corporate wellness — minimal data, consent, rate limiting, spam protection.";
const url = "/health/consultation";
const absoluteUrl = `${SITE.url}${url}`;
const ogImage = `${SITE.url}/health/api/og?title=${encodeURIComponent("Consultation — Lead Gen")}&category=${encodeURIComponent("Lead Generation")}&type=tool`;

export const metadata: Metadata = {
  title: seoTitle.slice(0, 60),
  description: seoDescription.slice(0, 155),
  alternates: { canonical: url, languages: { "en-IN": absoluteUrl, "en": absoluteUrl, "x-default": absoluteUrl } },
  openGraph: { title: seoTitle, description: seoDescription, url: absoluteUrl, type: "website", images: [{ url: ogImage, width: 1200, height: 630, alt: seoTitle }] },
};

export default function ConsultationPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <Breadcrumbs items={[{ label: "Home", href: "/health" }, { label: "Consultation" }]} />
      <UniquePageSEO
        breadcrumbs={[{ name: "Home", item: "/health" }, { name: "Consultation", item: "/health/consultation" }]}
        faqs={[
          { q: "What can I ask for?", a: "Diet, fitness and wellness consultations, health packages and corporate wellness. Tell us what you need and we'll get back to you." },
          { q: "What details do you need?", a: "Only your name, email or phone and a short message. Please don't share medical reports in the form; we'll ask if we need them." },
        ]}
        howTo={{ name: "How to request a consultation", steps: ["Pick the service you're interested in", "Fill in your name, contact details and a short message", "Submit the form", "We contact you, usually within 24 hours"] }}
      />
      <div className="mt-3 rounded-3xl bg-gradient-to-br from-emerald-900 to-teal-800 p-6 text-white md:p-8">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-emerald-200">Lead Generation — Privacy-Conscious — Rate Limited</p>
        <h1 className="font-display mt-1 text-3xl font-black">Consultation — Diet, Fitness, Wellness, Corporate — Lead Gen</h1>
        <p className="mt-2 max-w-2xl text-sm text-emerald-100/90">Connect with qualified professionals — diet, fitness, wellness, health package, clinic, corporate wellness. Minimal data collection, consent, timestamp, spam protection, rate limiting. Never request unnecessary sensitive medical info.</p>
      </div>

      <div className="mt-4"><AdBanner placement="homepage_top" page="/health/consultation" /></div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {LEAD_FORMS.map((f) => (
            <LeadForm key={f.id} config={f} page="/health/consultation" />
          ))}
        </div>
        <div className="space-y-4">
          <PremiumCTA compact />
          <LatestArticles limit={4} />
        </div>
      </div>

      <div className="mt-8 space-y-4"><AdSlot slot="Consultation footer" /><DisclaimerBar compact /></div>
    </div>
  );
}
