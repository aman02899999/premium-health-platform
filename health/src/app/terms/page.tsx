import type { Metadata } from "next";
import { Breadcrumbs, AdSlot, DisclaimerBar } from "@/components/ui";
import { SITE } from "@/lib/site";
import { UniquePageSEO } from "@/components/seo/UniquePageSEO";

const seoTitle = "Terms of Service | Premium Health";
const seoDescription = "Terms: educational only, not medical advice, no personalised doses, disclaimer, liability, India jurisdiction..";
const url = "/terms";
const absoluteUrl = `${SITE.url}${url}`;
const ogImage = `${SITE.url}/api/og?title=${encodeURIComponent("Terms — BHG")}&category=${encodeURIComponent("Terms")}&type=tool`;

export const metadata: Metadata = {
  title: seoTitle.slice(0, 60),
  description: seoDescription.slice(0, 155),
  alternates: { canonical: url, languages: { "en-IN": absoluteUrl, "en": absoluteUrl, "x-default": absoluteUrl } },
  openGraph: { title: seoTitle, description: seoDescription, url: absoluteUrl, type: "website", images: [{ url: ogImage, width: 1200, height: 630, alt: seoTitle }] },
  twitter: { card: "summary_large_image", title: seoTitle, description: seoDescription, images: [ogImage] },
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Terms" }]} />
      <UniquePageSEO
        breadcrumbs={[{ name: "Home", item: "/" }, { name: "Terms", item: "/terms" }]}
        faqs={[
          { q: "Is Premium Health Platform medical advice?", a: "No — educational only. Never personalised doses, never stop-change advice, no emergency triage. Always consult doctor. See /disclaimer + /privacy." },
          { q: "What is liability?", a: "Premium Health Platform not liable for actions based on content — educational, not prescription. Use at own risk, consult healthcare professional. India jurisdiction, changes noted." },
        ]}
        howTo={{ name: "How to use Premium Health Platform responsibly", steps: ["Read content as education, not prescription", "Never stop-change medicines based on Premium Health Platform alone", "Consult doctor + pharmacist + Vaidya for personal advice", "For emergency, call 102/108, not BHG"] }}
      />
      <div className="mt-3 rounded-3xl bg-gradient-to-br from-stone-800 to-stone-700 p-6 text-white md:p-8">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-stone-200">Terms</p>
        <h1 className="font-display mt-1 text-3xl font-black">Terms of Use — Educational Only — India Jurisdiction</h1>
        <p className="mt-2 max-w-2xl text-sm text-stone-100/90">Educational only, not medical advice, no personalised doses, acceptable use, IP, liability, changes.</p>
        <p className="mt-1 text-xs text-stone-300">Last updated: August 2026</p>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="prose-health mt-2 space-y-4 rounded-3xl border border-stone-200 bg-white p-6 text-[14px] leading-relaxed text-stone-700 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200">
            <p><strong>Educational only.</strong> Content is general health information, not personal medical advice, diagnosis or treatment. Always consult a qualified professional; in emergencies call emergency services 102/108.</p>
            <p><strong>Acceptable use:</strong> Do not misuse calculators or symptom tools as diagnostic devices, scrape content en masse, or submit unlawful content via forms. Calculators + symptom tools run client-side, estimates only.</p>
            <p><strong>Intellectual property:</strong> Text, design and illustrations are owned by the publication unless attributed. You may share links freely; reproduction needs permission. Brand config in src/lib/site.ts.</p>
            <p><strong>Liability:</strong> To the maximum extent permitted by law, we are not liable for decisions made without professional advice. Nothing here creates a doctor-patient relationship. See /disclaimer.</p>
            <p><strong>Changes:</strong> We may update terms as features (sign-in, premium, ads, affiliates, lead gen, WhatsApp, push) launch; material changes will be noted here. Check /about for live data stack + earning platform.</p>
          </div>
        </div>
        <div className="space-y-4">
        </div>
      </div>

      <div className="mt-8 space-y-4"><AdSlot slot="Terms footer" /><DisclaimerBar compact /></div>
    </div>
  );
}
