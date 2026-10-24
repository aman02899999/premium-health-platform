import type { Metadata } from "next";
import { Breadcrumbs, AdSlot, DisclaimerBar, Newsletter } from "@/health/components/ui";
import { UniquePageSEO } from "@/health/components/seo/UniquePageSEO";
import { SITE } from "@/health/lib/site";
import { SPONSORS, getActiveSponsors } from "@/health/lib/monetization/config";
import { SponsoredCard } from "@/health/components/monetization/ProductCards";
import { AdBanner } from "@/health/components/monetization/AdComponents";
import { PremiumCTA } from "@/health/components/earning/PremiumCTA";
import { LatestArticles } from "@/health/components/blog/LatestArticles";

const seoTitle = "Free Weekly Health Newsletter | Indian Health Weekly";
const seoDescription = "Indian Health Weekly: one free, useful health email every Sunday on diabetes, thyroid, heart health, Ayurveda and nutrition. Unsubscribe any time.";
const url = "/health/newsletter";
const absoluteUrl = `${SITE.url}${url}`;
const ogImage = `${SITE.url}/health/api/og?title=${encodeURIComponent("Newsletter — Health Weekly")}&category=${encodeURIComponent("Newsletter")}&type=tool`;

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
      <Breadcrumbs items={[{ label: "Home", href: "/health" }, { label: "Newsletter" }]} />
      <UniquePageSEO
        breadcrumbs={[{ name: "Home", item: "/health" }, { name: "Newsletter", item: "/health/newsletter" }]}
        faqs={[
          { q: "What do I get?", a: "A free weekly email with practical health guides on diabetes, thyroid, nutrition, Ayurveda and fitness. You can unsubscribe at any time." },
          { q: "Do you share my email?", a: "Never. We don't sell or share subscriber details. Any sponsored slot in the newsletter is clearly labelled Sponsored." },
        ]}
        howTo={{ name: "How to subscribe", steps: ["Enter your email in the form", "Tick the consent box", "Confirm", "Get the newsletter every week — unsubscribe any time"] }}
      />
      <div className="mt-3 rounded-3xl bg-gradient-to-br from-emerald-900 to-teal-900 p-6 text-white md:p-8">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-amber-300">Free weekly newsletter</p>
        <h1 className="font-display mt-1 text-3xl font-black">Indian Health Weekly newsletter</h1>
        <p className="mt-2 max-w-2xl text-sm text-emerald-100/90">One useful health email every Sunday — diabetes, thyroid, heart, Ayurveda, nutrition. It is free. Any sponsored item is clearly marked Sponsored. Unsubscribe any time, and we never sell email addresses.</p>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Newsletter />
          <div className="rounded-3xl border border-amber-200 bg-amber-50 p-5 dark:border-amber-800 dark:bg-amber-950/30">
            <h3 className="text-sm font-bold">Newsletter sponsors</h3>
            <p className="mt-1 text-xs text-stone-600 dark:text-stone-300">Sponsored content must be clearly labeled Sponsored / Paid partnership. Editorial content remains independent. Do not allow sponsors to modify medical evidence. Auto-hide expired campaigns via getActiveSponsors().</p>
            <div className="mt-3 grid gap-3">
              {sponsors.map((s) => <SponsoredCard key={s.id} sponsor={s} page="/health/newsletter" />)}
              {sponsors.length === 0 && <p className="text-xs text-stone-500">No newsletter sponsors active.</p>}
              {allSponsors.slice(0, 2).map((s) => <SponsoredCard key={s.id} sponsor={s} page="/health/newsletter" />)}
            </div>
          </div>
          <AdBanner placement="newsletter_inline" page="/health/newsletter" />
        </div>
        <div className="space-y-4">
          <PremiumCTA compact />
          <LatestArticles limit={4} />
        </div>
      </div>

      <div className="mt-8 space-y-4"><AdSlot slot="Newsletter footer" /><DisclaimerBar compact /></div>
    </div>
  );
}
