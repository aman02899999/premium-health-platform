import type { Metadata } from "next";
import { Breadcrumbs, AdSlot, DisclaimerBar } from "@/components/ui";
import { UniquePageSEO } from "@/components/seo/UniquePageSEO";
import { SITE } from "@/lib/site";
import { LeadForm } from "@/components/monetization/LeadForm";
import { LEAD_FORMS } from "@/lib/monetization/config";
import { PremiumCTA } from "@/components/earning/PremiumCTA";

const seoTitle = "Partner With Us — Clinics, Dietitians | BHG";
const seoDescription = "Partner with BHG: clinics, dietitians, nutritionists, fitness coaches, diagnostic centers, wellness businesses — lead gen, business directory, sponsorship.";
const url = "/partner-with-us";
const absoluteUrl = `${SITE.url}${url}`;
const ogImage = `${SITE.url}/api/og?title=${encodeURIComponent("Partner With Us")}&category=${encodeURIComponent("Partnership")}&type=tool`;

export const metadata: Metadata = {
  title: seoTitle.slice(0, 60),
  description: seoDescription.slice(0, 155),
  alternates: { canonical: url, languages: { "en-IN": absoluteUrl, "en": absoluteUrl, "x-default": absoluteUrl } },
  openGraph: { title: seoTitle, description: seoDescription, url: absoluteUrl, type: "website", images: [{ url: ogImage, width: 1200, height: 630, alt: seoTitle }] },
};

export default function PartnerPage() {
  const form = LEAD_FORMS.find((f) => f.service === "corporate-wellness")!;
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Partner With Us" }]} />
      <UniquePageSEO
        breadcrumbs={[{ name: "Home", item: "/" }, { name: "Partner With Us", item: "/partner-with-us" }]}
        faqs={[
          { q: "Who can partner?", a: "Dietitians, Nutritionists, Fitness coaches, Yoga instructors, Clinics, Diagnostic centers, Wellness businesses — Free/Featured/Premium listings in /providers. Clearly separate Featured from Recommended based on clinical evidence." },
          { q: "How partnership works?", a: "Submit via lead form — minimal data, consent. Admin reviews credentials (never fabricated) in /admin/earning + /api/monetization/providers. Featured listings clearly labeled, not medical endorsement. Sponsorship via SPONSORS config." },
        ]}
        howTo={{ name: "How to partner", steps: ["Fill partnership inquiry — name, email, phone, service, message, consent", "Admin reviews via /admin/earning + /api/monetization/providers", "Choose tier free/featured/premium — featured clearly labeled", "Get listed in /providers + lead gen + sponsorship opportunities"] }}
      />
      <div className="mt-3 rounded-3xl bg-gradient-to-br from-stone-900 to-emerald-900 p-6 text-white md:p-8">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-emerald-200">Partnership — Business Directory + Sponsorship + Lead Gen</p>
        <h1 className="font-display mt-1 text-3xl font-black">Partner With Us — Clinics, Dietitians, Wellness — India</h1>
        <p className="mt-2 max-w-2xl text-sm text-emerald-100/90">Join BHG's business directory — dietitians, nutritionists, fitness coaches, yoga instructors, clinics, diagnostic centers, wellness. Free/Featured/Premium. Do not imply paid = medically superior. Do not fabricate credentials.</p>
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <LeadForm config={form} page="/partner-with-us" />
          <div className="mt-6 rounded-3xl border border-stone-200 bg-white p-6 dark:border-stone-700 dark:bg-stone-900">
            <h2 className="font-bold">Partnership Benefits</h2>
            <ul className="mt-2 list-disc pl-5 text-sm text-stone-600 dark:text-stone-300">
              <li>Listing in /providers directory — Free/Featured/Premium tiers</li>
              <li>Lead generation via /consultation + /api/monetization/leads</li>
              <li>Sponsored content: articles, product cards, banners, category placements, newsletter — clearly labeled Sponsored</li>
              <li>Coupon/deal promotion in /deals — auto-expire handling</li>
              <li>Analytics: track via /api/monetization/analytics — leads, sponsor clicks, provider views</li>
            </ul>
          </div>
        </div>
        <div className="space-y-4">
          <PremiumCTA compact />
        </div>
      </div>
      <div className="mt-8 space-y-4"><AdSlot slot="Partner footer" /><DisclaimerBar compact /></div>
    </div>
  );
}
