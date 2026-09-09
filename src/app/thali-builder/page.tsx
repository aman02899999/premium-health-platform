import type { Metadata } from "next";
import { Breadcrumbs, AdSlot, DisclaimerBar } from "@/components/ui";
import { ThaliBuilder } from "@/components/health/thali-builder";
import { UniquePageSEO } from "@/components/seo/UniquePageSEO";
import { SITE } from "@/lib/site";
import { absoluteUrl, seoTitle, seoDescription } from "@/lib/seo";
import { LatestArticles } from "@/components/blog/LatestArticles";
import { PremiumCTA } from "@/components/earning/PremiumCTA";
import { AffiliateProducts } from "@/components/earning/AffiliateProducts";
import { WhatsAppOptIn, PushPrompt } from "@/components/marketing/WhatsAppOptIn";

export const metadata: Metadata = {
  title: seoTitle("Thali Builder — Balanced Indian Thali | Unique India | SEO Optimized"),
  description: seoDescription("Build balanced Indian thali: half veg, quarter millet grain, quarter dal/protein + curd — unique India-first feature. Salad first, protein second, grain last — lowers sugar spikes. SEO optimized with HowTo + FAQ."),
  alternates: { canonical: "/thali-builder", languages: { "en-IN": absoluteUrl("/thali-builder"), "en": absoluteUrl("/thali-builder"), "x-default": absoluteUrl("/thali-builder") } },
  openGraph: {
    title: "Thali Builder — Unique India | SEO Optimized",
    description: "Half veg, quarter millet grain, quarter dal/protein + curd — unique India-first thali builder.",
    type: "website",
    url: absoluteUrl("/thali-builder"),
    images: [{ url: "/api/og?title=Thali%20Builder%20-%20Balanced%20Indian%20Thali&category=Nutrition&type=Unique", width: 1200, height: 630, alt: "Thali Builder" }],
  },
  keywords: ["thali builder", "balanced Indian thali", "millet thali", "Indian diet plate", "diabetes thali", "nutrition India"],
};

export default function ThaliBuilderPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Thali Builder" }]} />
      <UniquePageSEO
        title="Thali Builder — Balanced Indian Thali"
        description="Build balanced Indian thali: half veg, quarter millet grain, quarter dal/protein + curd"
        path="/thali-builder"
        breadcrumbs={[{ name: "Home", path: "/" }, { name: "Thali Builder", path: "/thali-builder" }]}
        faqs={[
          { q: "What is balanced Indian thali?", a: "Half vegetables, quarter millet/whole grain, quarter dal/protein + curd — salad first, protein second, grain last lowers sugar spikes." },
          { q: "Why millets in thali?", a: "Millets have lower GI (foxtail 50-55, barnyard 42-45) vs white rice 70-80, more fibre + protein, diabetic friendly." },
        ]}
        howTo={{
          name: "How to Build Balanced Indian Thali",
          description: "Build balanced thali: half veg, quarter millet, quarter dal/protein + curd",
          steps: [
            { name: "Half plate vegetables", text: "Fill half plate with seasonal sabzi + salad — fibre + vitamins." },
            { name: "Quarter millet grain", text: "Quarter plate with millet roti or brown rice — low GI, more fibre." },
            { name: "Quarter dal/protein + curd", text: "Quarter plate dal + protein (paneer, sprouts, egg) + curd for probiotic + calcium." },
            { name: "Salad first, protein second, grain last", text: "Eat in order to blunt sugar spikes — educational, not prescription." },
          ],
        }}
      />
      <div className="mt-3 rounded-3xl bg-gradient-to-br from-emerald-800 to-amber-700 p-6 text-white md:p-8">
        <h1 className="font-display text-3xl font-black">Thali Builder — Unique India — SEO Pro</h1>
        <p className="mt-2 max-w-2xl text-sm text-emerald-100/90">Half veg, quarter millet grain, quarter dal/protein + curd. Salad first, protein second, grain last — lowers sugar spikes. Educational only. SEO: HowTo + FAQ JSON-LD, OG image, breadcrumbs, internal linking.</p>
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2"><ThaliBuilder /></div>
        <div className="space-y-4"><PremiumCTA compact /><WhatsAppOptIn compact /><PushPrompt compact /><AffiliateProducts limit={2} /><LatestArticles limit={3} /></div>
      </div>
      <div className="mt-8 space-y-4"><AdSlot slot="Thali footer" /><DisclaimerBar compact /></div>
    </div>
  );
}
