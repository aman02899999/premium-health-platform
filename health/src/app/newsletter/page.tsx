import type { Metadata } from "next";
import { Breadcrumbs, AdSlot, DisclaimerBar, Newsletter } from "@/components/ui";
import { UniquePageSEO } from "@/components/seo/UniquePageSEO";
import { SITE } from "@/lib/site";
import { SPONSORS, getActiveSponsors } from "@/lib/monetization/config";
import { SponsoredCard } from "@/components/monetization/ProductCards";
import { AdBanner } from "@/components/monetization/AdComponents";
import { PremiumCTA } from "@/components/earning/PremiumCTA";
import { LatestArticles } from "@/components/blog/LatestArticles";

const seoTitle = "Newsletter — Free + Sponsored Slots | BHG";
const seoDescription = "Indian Health Weekly — free newsletter + sponsored slots, sponsor banner, recommendation — track subscribers, campaign, clicks, unsubscribe, sponsor CTR.";
const url = "/newsletter";
const absoluteUrl = `${SITE.url}${url}`;
const ogImage = `${SITE.url}/api/og?title=${encodeURIComponent("Newsletter — Health Weekly")}&category=${encodeURIComponent("Newsletter")}&type=tool`;

export const metadata: Metadata = {
  title: seoTitle.slice(0, 60),
  description: seoDescription.slice(0, 155),
  alternates: { canonical: url, languages: { "en-IN": absoluteUrl, "en": absoluteUrl, "x-default": absoluteUrl } },
  openGraph: { title: seoTitle, description: seoDescription, url: absoluteUrl, type: "website", images: [{ url: ogImage, width: 1200, height: 630, alt: seoTitle }] },
};

export default function NewsletterPage() {
  const sponsors = getActiveSponsors().filter((s) => s.placement === "newsletter");
  const allSponsors = getActiveSponsors();
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Newsletter" }]} />
      <UniquePageSEO
        breadcrumbs={[{ name: "Home", item: "/" }, { name: "Newsletter", item: "/newsletter" }]}
        faqs={[
          { q: "What is newsletter monetization?", a: "Free newsletter Indian Health Weekly every Sunday + sponsored slots: sponsor banner + sponsored recommendation. Track subscribers, campaign, clicks, unsubscribe, sponsor CTR via /api/newsletter + /api/monetization/analytics. Do not sell email addresses, do not expose subscriber info to sponsors." },
          { q: "How to sponsor newsletter?", a: "Create sponsor in SPONSORS config with placement newsletter, startDate, endDate, CTA, URL, active true. Auto-hide expired. Track via sponsor_clicked event. Example: Demo Wellness Labs campaign." },
        ]}
        howTo={{ name: "How to subscribe & sponsor", steps: ["Subscribe free via form — consent + privacy policy", "Receive weekly health guides — diabetes, thyroid, nutrition, Ayurveda", "Sponsored slots clearly labeled Sponsored + disclosure", "Track via /api/newsletter?limit=20 + /api/monetization/analytics?type=newsletter_signup"] }}
      />
      <div className="mt-3 rounded-3xl bg-gradient-to-br from-emerald-900 to-teal-900 p-6 text-white md:p-8">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-amber-300">Newsletter Monetization — Free + Sponsored — SEO Pro</p>
        <h1 className="font-display mt-1 text-3xl font-black">Newsletter — Indian Health Weekly — Free + Sponsored Slots</h1>
        <p className="mt-2 max-w-2xl text-sm text-emerald-100/90">One useful health email every Sunday — diabetes, thyroid, heart, Ayurveda, nutrition. Free + sponsored slots (banner + recommendation) clearly labeled Sponsored. Track subscribers, campaign, clicks, unsubscribe, sponsor CTR. Never sell email addresses.</p>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Newsletter />
          <div className="rounded-3xl border border-amber-200 bg-amber-50 p-5 dark:border-amber-800 dark:bg-amber-950/30">
            <h3 className="text-sm font-bold">Sponsored Newsletter Slots — Demo</h3>
            <p className="mt-1 text-xs text-stone-600 dark:text-stone-300">Sponsored content must be clearly labeled Sponsored / Paid partnership. Editorial content remains independent. Do not allow sponsors to modify medical evidence. Auto-hide expired campaigns via getActiveSponsors().</p>
            <div className="mt-3 grid gap-3">
              {sponsors.map((s) => <SponsoredCard key={s.id} sponsor={s} page="/newsletter" />)}
              {sponsors.length === 0 && <p className="text-xs text-stone-500">No newsletter sponsors active — demo shows homepage sponsors below.</p>}
              {allSponsors.slice(0, 2).map((s) => <SponsoredCard key={s.id} sponsor={s} page="/newsletter" />)}
            </div>
          </div>
          <AdBanner placement="newsletter_inline" page="/newsletter" />
        </div>
        <div className="space-y-4">
          <PremiumCTA compact />
          <LatestArticles limit={4} />
          <div className="rounded-3xl border border-stone-200 bg-white p-5 dark:border-stone-700 dark:bg-stone-900">
            <h3 className="text-sm font-bold">Newsletter Setup — Sponsorship</h3>
            <ol className="mt-2 list-decimal pl-5 text-xs text-stone-600 dark:text-stone-300">
              <li>Add sponsor to SPONSORS in src/lib/monetization/config.ts — placement newsletter, startDate, endDate, CTA, URL, disclosure</li>
              <li>Track: POST /api/newsletter with email + consent, GET /api/newsletter?limit=20 for subs, /api/monetization/analytics?type=newsletter_signup</li>
              <li>Sponsored slot: render SponsoredCard with Sponsored label + disclosure</li>
              <li>Do not sell subscriber emails — do not expose subscriber info to sponsors — privacy policy</li>
              <li>Auto-hide expired via getActiveSponsors() filtering startDate/endDate</li>
            </ol>
          </div>
        </div>
      </div>

      <div className="mt-8 space-y-4"><AdSlot slot="Newsletter footer" /><DisclaimerBar compact /></div>
    </div>
  );
}
