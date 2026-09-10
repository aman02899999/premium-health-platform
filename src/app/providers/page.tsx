import type { Metadata } from "next";
import { Breadcrumbs, AdSlot, DisclaimerBar } from "@/components/ui";
import { UniquePageSEO } from "@/components/seo/UniquePageSEO";
import { SITE } from "@/lib/site";
import { BUSINESS_LISTINGS } from "@/lib/monetization/config";
import { ProviderCard } from "@/components/monetization/ProviderCard";
import { AdBanner } from "@/components/monetization/AdComponents";
import { PremiumCTA } from "@/components/earning/PremiumCTA";
import { LeadForm } from "@/components/monetization/LeadForm";
import { LEAD_FORMS } from "@/lib/monetization/config";

const seoTitle = "Providers — Dietitians, Yoga, Clinics | BHG";
const seoDescription = "Business directory: Dietitians, Nutritionists, Fitness coaches, Yoga instructors, Clinics, Diagnostic centers, Wellness — Free/Featured/Premium listings, verified.";
const url = "/providers";
const absoluteUrl = `${SITE.url}${url}`;
const ogImage = `${SITE.url}/api/og?title=${encodeURIComponent("Providers Directory")}&category=${encodeURIComponent("Business Directory")}&type=tool`;

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
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Providers" }]} />
      <UniquePageSEO
        breadcrumbs={[{ name: "Home", item: "/" }, { name: "Providers", item: "/providers" }]}
        faqs={[
          { q: "What is providers directory?", a: "Business directory for Dietitians, Nutritionists, Fitness coaches, Yoga instructors, Clinics, Diagnostic centers, Wellness businesses — Free, Featured, Premium listings. Do not imply paid = medically superior. Clearly separate Featured from Recommended based on clinical evidence. Do not fabricate credentials." },
          { q: "How to get listed?", a: "Submit via /partner-with-us lead form — name, service, location, credentials (never fabricated), tier free/featured/premium. Admin approves via /admin/earning. Featured listings clearly labeled, not medical endorsement." },
        ]}
        howTo={{ name: "How to find provider", steps: ["Browse by type: Dietitian, Nutritionist, Fitness Coach, Yoga Instructor, Clinic", "Check tier: free, featured, premium — featured clearly labeled, not superior quality", "View profile + credentials (never fabricated) + location", "Inquire via lead form — minimal data, consent, rate limiting"] }}
      />
      <div className="mt-3 rounded-3xl bg-gradient-to-br from-violet-900 to-emerald-900 p-6 text-white md:p-8">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-violet-200">Business Directory — Free/Featured/Premium — SEO Pro — Lead Gen</p>
        <h1 className="font-display mt-1 text-3xl font-black">Providers — Dietitians, Nutritionists, Fitness, Yoga, Clinics — India</h1>
        <p className="mt-2 max-w-2xl text-sm text-violet-100/90">Find qualified professionals — dietitians, nutritionists, fitness coaches, yoga instructors, clinics, diagnostic centers, wellness. Free/Featured/Premium tiers. Clearly separate Featured from Recommended based on clinical evidence. Do not fabricate credentials.</p>
        <div className="mt-3 flex flex-wrap gap-1.5">{types.map((t) => <span key={t} className="rounded-full bg-white/15 px-3 py-1 text-xs">{t}</span>)}</div>
      </div>
      <div className="mt-4"><AdBanner placement="homepage_top" page="/providers" /></div>
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 grid gap-4 sm:grid-cols-2">
          {BUSINESS_LISTINGS.filter((l) => l.active).map((l) => <ProviderCard key={l.id} listing={l} />)}
        </div>
        <div className="space-y-4">
          <PremiumCTA compact />
          <LeadForm config={leadForm} page="/providers" />
          <div className="rounded-3xl border border-stone-200 bg-white p-5 dark:border-stone-700 dark:bg-stone-900">
            <h3 className="text-sm font-bold">How to Create Featured Listing</h3>
            <ol className="mt-2 list-decimal pl-5 text-xs text-stone-600 dark:text-stone-300">
              <li>Add to BUSINESS_LISTINGS in src/lib/monetization/config.ts — id, slug, title, providerType, tier free/featured/premium, location, credentials (never fabricated), verified false until admin verifies</li>
              <li>Set tier: free (basic), featured (highlighted), premium (top + badge)</li>
              <li>Clearly label Featured — not medical endorsement — disclaimer required</li>
              <li>Admin approves via /admin/earning + /api/monetization/providers?type=Dietitian</li>
            </ol>
          </div>
        </div>
      </div>
      <div className="mt-8 space-y-4"><AdSlot slot="Providers footer" /><DisclaimerBar compact /></div>
    </div>
  );
}
