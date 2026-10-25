import type { Metadata } from "next";
import { Breadcrumbs, AdSlot, DisclaimerBar } from "@/health/components/ui";
import { UniquePageSEO } from "@/health/components/seo/UniquePageSEO";
import { SITE } from "@/health/lib/site";
import { ADVERTISEMENTS, SPONSORS, getActiveSponsors } from "@/health/lib/monetization/config";
import { AdBanner, AdRectangle, AdSidebar } from "@/health/components/monetization/AdComponents";
import { SponsoredCard } from "@/health/components/monetization/ProductCards";
import { LeadForm } from "@/health/components/monetization/LeadForm";
import { LEAD_FORMS } from "@/health/lib/monetization/config";
import { PremiumCTA } from "@/health/components/earning/PremiumCTA";

const seoTitle = "Advertise — Ad Slots, Sponsored Content";
const seoDescription = "Advertise with us: ad slots homepage_top, disease_middle, article_bottom, products_sidebar, sponsored content, newsletter — clearly labeled Advertisement/Sponsored.";
const url = "/health/advertise";
const absoluteUrl = `${SITE.url}${url}`;
const ogImage = `${SITE.url}/health/api/og?title=${encodeURIComponent("Advertise With Us")}&category=${encodeURIComponent("Advertising")}&type=tool`;

export const metadata: Metadata = {
  title: seoTitle.slice(0, 60),
  description: seoDescription.slice(0, 155),
  alternates: { canonical: url, languages: { "en-IN": absoluteUrl, "en": absoluteUrl, "x-default": absoluteUrl } },
  openGraph: { title: seoTitle, description: seoDescription, url: absoluteUrl, type: "website", images: [{ url: ogImage, width: 1200, height: 630, alt: seoTitle }] },
};

export default function AdvertisePage() {
  const sponsors = getActiveSponsors();
  const leadForm = LEAD_FORMS.find((f) => f.service === "corporate-wellness")!;
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <Breadcrumbs items={[{ label: "Home", href: "/health" }, { label: "Advertise" }]} />
      <UniquePageSEO
        breadcrumbs={[{ name: "Home", item: "/health" }, { name: "Advertise", item: "/health/advertise" }]}
        faqs={[
          { q: "What advertising options do you offer?", a: "Clearly labelled banner placements on our health pages and sponsored spots in our weekly newsletter. Every paid placement is marked Advertisement or Sponsored." },
          { q: "Do you accept any advertiser?", a: "No. We only run ads for products and services that are legal, safe and relevant to our readers, and ads never change our health content." },
        ]}
        howTo={{ name: "How to advertise", steps: ["Tell us what you'd like to promote using the enquiry form", "We reply with available placements, dates and prices", "Approve the creative — every placement is labelled Advertisement or Sponsored", "Your campaign goes live for the agreed dates"] }}
      />
      <div className="mt-3 rounded-3xl bg-gradient-to-br from-amber-900 to-stone-900 p-6 text-white md:p-8">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-amber-200">Advertising — Clearly Labeled — Editorial Independence</p>
        <h1 className="font-display mt-1 text-3xl font-black">Advertise — Ad Slots, Sponsored Content, Newsletter</h1>
        <p className="mt-2 max-w-2xl text-sm text-amber-100/90">Ad slots: homepage_top, disease_middle, article_bottom, products_sidebar, footer, store_top, newsletter_inline, calculator_results. Sponsored content: articles, product cards, banners, category placements, newsletter placements — clearly labeled Sponsored / Paid partnership. Editorial independence maintained.</p>
        <div className="mt-3 flex flex-wrap gap-1.5">{ADVERTISEMENTS.map((a) => <span key={a.id} className="rounded-full bg-white/15 px-3 py-1 text-xs">{a.placement}</span>)}</div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <AdBanner placement="homepage_top" page="/health/advertise" />
          <AdRectangle placement="article_bottom" page="/health/advertise" />
          <div className="grid gap-4 sm:grid-cols-2">
            {sponsors.map((s) => <SponsoredCard key={s.id} sponsor={s} page="/health/advertise" />)}
          </div>
          <LeadForm config={leadForm} page="/health/advertise" />
        </div>
        <div className="space-y-4">
          <AdSidebar placement="products_sidebar" page="/health/advertise" />
          <PremiumCTA compact />
        </div>
      </div>

      <div className="mt-8 space-y-4"><AdSlot slot="Advertise footer" /><DisclaimerBar compact /></div>
    </div>
  );
}
