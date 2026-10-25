import type { Metadata } from "next";
import { Breadcrumbs, AdSlot, DisclaimerBar } from "@/health/components/ui";
import { UniquePageSEO } from "@/health/components/seo/UniquePageSEO";
import { SITE } from "@/health/lib/site";
import { BUSINESS_LISTINGS } from "@/health/lib/monetization/config";
import { ProviderCard } from "@/health/components/monetization/ProviderCard";
import { AdBanner } from "@/health/components/monetization/AdComponents";
import { PremiumCTA } from "@/health/components/earning/PremiumCTA";
import { LeadForm } from "@/health/components/monetization/LeadForm";
import { LEAD_FORMS } from "@/health/lib/monetization/config";

const seoTitle = "Providers — Dietitians, Yoga, Clinics";
const seoDescription = "Business directory: Dietitians, Nutritionists, Fitness coaches, Yoga instructors, Clinics, Diagnostic centers, Wellness — Free/Featured/Premium listings, verified.";
const url = "/health/providers";
const absoluteUrl = `${SITE.url}${url}`;
const ogImage = `${SITE.url}/health/api/og?title=${encodeURIComponent("Providers Directory")}&category=${encodeURIComponent("Business Directory")}&type=tool`;

export const metadata: Metadata = {
  title: seoTitle.slice(0, 60),
  description: seoDescription.slice(0, 155),
  alternates: { canonical: url, languages: { "en-IN": absoluteUrl, "en": absoluteUrl, "x-default": absoluteUrl } },
  openGraph: { title: seoTitle, description: seoDescription, url: absoluteUrl, type: "website", images: [{ url: ogImage, width: 1200, height: 630, alt: seoTitle }] },
};

export default function ProvidersPage() {
  const types = Array.from(new Set(BUSINESS_LISTINGS.map((l) => l.providerType)));
  const leadForm = LEAD_FORMS.find((f) => f.service === "diet-consultation")!;
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <Breadcrumbs items={[{ label: "Home", href: "/health" }, { label: "Providers" }]} />
      <UniquePageSEO
        breadcrumbs={[{ name: "Home", item: "/health" }, { name: "Providers", item: "/health/providers" }]}
        faqs={[
          { q: "What is the providers directory?", a: "A list of dietitians, nutritionists, fitness coaches, yoga instructors and clinics you can contact directly. Featured listings are paid and clearly labelled." },
          { q: "How do I get listed?", a: "Fill in the form on the Partner with us page. We verify your credentials before listing you." },
        ]}
        howTo={{ name: "How to find a provider", steps: ["Browse by type: dietitian, nutritionist, fitness coach, yoga instructor or clinic", "Check their credentials and location", "Send an enquiry with the form", "The provider contacts you"] }}
      />
      <div className="mt-3 rounded-3xl bg-gradient-to-br from-violet-900 to-emerald-900 p-6 text-white md:p-8">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-violet-200">Business Directory — Free/Featured/Premium — Lead Gen</p>
        <h1 className="font-display mt-1 text-3xl font-black">Providers — Dietitians, Nutritionists, Fitness, Yoga, Clinics — India</h1>
        <p className="mt-2 max-w-2xl text-sm text-violet-100/90">Find qualified professionals — dietitians, nutritionists, fitness coaches, yoga instructors, clinics, diagnostic centers, wellness. Free/Featured/Premium tiers. Clearly separate Featured from Recommended based on clinical evidence. Do not fabricate credentials.</p>
        <div className="mt-3 flex flex-wrap gap-1.5">{types.map((t) => <span key={t} className="rounded-full bg-white/15 px-3 py-1 text-xs">{t}</span>)}</div>
      </div>
      <div className="mt-4"><AdBanner placement="homepage_top" page="/health/providers" /></div>
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 grid gap-4 sm:grid-cols-2">
          {BUSINESS_LISTINGS.filter((l) => l.active).map((l) => <ProviderCard key={l.id} listing={l} />)}
        </div>
        <div className="space-y-4">
          <PremiumCTA compact />
          <LeadForm config={leadForm} page="/health/providers" />
        </div>
      </div>
      <div className="mt-8 space-y-4"><AdSlot slot="Providers footer" /><DisclaimerBar compact /></div>
    </div>
  );
}
