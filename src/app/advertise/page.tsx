import type { Metadata } from "next";
import { Breadcrumbs, AdSlot, DisclaimerBar } from "@/components/ui";
import { UniquePageSEO } from "@/components/seo/UniquePageSEO";
import { SITE } from "@/lib/site";
import { ADVERTISEMENTS, SPONSORS, getActiveSponsors } from "@/lib/monetization/config";
import { AdBanner, AdRectangle, AdSidebar } from "@/components/monetization/AdComponents";
import { SponsoredCard } from "@/components/monetization/ProductCards";
import { LeadForm } from "@/components/monetization/LeadForm";
import { LEAD_FORMS } from "@/lib/monetization/config";
import { PremiumCTA } from "@/components/earning/PremiumCTA";

const seoTitle = "Advertise — Ad Slots, Sponsored Content | BHG";
const seoDescription = "Advertise with BHG: ad slots homepage_top, disease_middle, article_bottom, products_sidebar, sponsored content, newsletter — clearly labeled Advertisement/Sponsored.";
const url = "/advertise";
const absoluteUrl = `${SITE.url}${url}`;
const ogImage = `${SITE.url}/api/og?title=${encodeURIComponent("Advertise With Us")}&category=${encodeURIComponent("Advertising")}&type=tool`;

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
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Advertise" }]} />
      <UniquePageSEO
        breadcrumbs={[{ name: "Home", item: "/" }, { name: "Advertise", item: "/advertise" }]}
        faqs={[
          { q: "What ad slots available?", a: "homepage_top, homepage_middle, disease_top, disease_middle, disease_bottom, article_top, article_middle, article_bottom, products_sidebar, footer, store_top, newsletter_inline, calculator_results — configurable via ADVERTISEMENTS config in src/lib/monetization/config.ts. Components: AdBanner, AdRectangle, AdInArticle, AdSidebar, SponsoredCard." },
          { q: "How sponsored content works?", a: "Sponsor system with fields sponsor, campaign, startDate, endDate, placement, CTA, URL, active, priority, disclosure. Every sponsored item clearly labeled Sponsored / Paid partnership. Editorial content remains independent, sponsors cannot modify medical evidence. Auto-hide expired via getActiveSponsors()." },
        ]}
        howTo={{ name: "How to advertise", steps: ["Review ad slots + sponsored placements — clearly labeled Advertisement/Sponsored", "Submit inquiry via lead form — minimal data, consent", "Admin creates sponsor in SPONSORS config + ad slot in ADVERTISEMENTS", "Track via /api/monetization/analytics — ad_impression, ad_click, sponsor_clicked + gtag"] }}
      />
      <div className="mt-3 rounded-3xl bg-gradient-to-br from-amber-900 to-stone-900 p-6 text-white md:p-8">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-amber-200">Advertising — Modular — Clearly Labeled — Editorial Independence</p>
        <h1 className="font-display mt-1 text-3xl font-black">Advertise — Ad Slots, Sponsored Content, Newsletter — BHG</h1>
        <p className="mt-2 max-w-2xl text-sm text-amber-100/90">Ad slots: homepage_top, disease_middle, article_bottom, products_sidebar, footer, store_top, newsletter_inline, calculator_results. Sponsored content: articles, product cards, banners, category placements, newsletter placements — clearly labeled Sponsored / Paid partnership. Editorial independence maintained.</p>
        <div className="mt-3 flex flex-wrap gap-1.5">{ADVERTISEMENTS.map((a) => <span key={a.id} className="rounded-full bg-white/15 px-3 py-1 text-xs">{a.placement}</span>)}</div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <AdBanner placement="homepage_top" page="/advertise" />
          <AdRectangle placement="article_bottom" page="/advertise" />
          <div className="grid gap-4 sm:grid-cols-2">
            {sponsors.map((s) => <SponsoredCard key={s.id} sponsor={s} page="/advertise" />)}
          </div>
          <div className="rounded-3xl border border-stone-200 bg-white p-6 dark:border-stone-700 dark:bg-stone-900">
            <h2 className="font-bold">Ad Setup Instructions</h2>
            <ol className="mt-2 list-decimal pl-5 text-xs text-stone-600 dark:text-stone-300">
              <li>Create ad slot in ADVERTISEMENTS config — id, slug, placement (homepage_top, disease_middle, etc.), adType banner/rectangle/in-article/sidebar/sponsored-card, active, priority</li>
              <li>Render via components: AdBanner, AdRectangle, AdInArticle, AdSidebar, SponsoredCard — each tracks ad_impression via analytics</li>
              <li>Initially use clearly marked placeholders — Advertisement label</li>
              <li>Later integrate Google AdSense: set NEXT_PUBLIC_ADSENSE_CLIENT_ID in .env, replace placeholder with AdSense component</li>
              <li>Do not create fake ads, do not auto-click, do not encourage clicks — AdSense policy</li>
              <li>Track ad_impression + ad_click via /api/monetization/analytics + gtag</li>
            </ol>
          </div>
          <div className="rounded-3xl border border-stone-200 bg-white p-6 dark:border-stone-700 dark:bg-stone-900">
            <h2 className="font-bold">Sponsored Campaign Setup</h2>
            <ol className="mt-2 list-decimal pl-5 text-xs text-stone-600 dark:text-stone-300">
              <li>Create sponsor in SPONSORS config — sponsorName, campaign, placement, CTA, URL, startDate, endDate, disclosure, active, priority</li>
              <li>Every sponsored item must be clearly labeled Sponsored / Paid partnership</li>
              <li>Editorial content must remain independent — sponsors cannot modify medical evidence</li>
              <li>Auto-hide expired via getActiveSponsors() filtering startDate/endDate</li>
              <li>Track sponsor_clicked via analytics + POST /api/monetization/analytics</li>
            </ol>
          </div>
          <LeadForm config={leadForm} page="/advertise" />
        </div>
        <div className="space-y-4">
          <AdSidebar placement="products_sidebar" page="/advertise" />
          <PremiumCTA compact />
        </div>
      </div>

      <div className="mt-8 space-y-4"><AdSlot slot="Advertise footer" /><DisclaimerBar compact /></div>
    </div>
  );
}
