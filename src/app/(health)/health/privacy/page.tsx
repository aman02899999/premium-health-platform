import Link from "next/link";
import type { Metadata } from "next";
import { Breadcrumbs, AdSlot, DisclaimerBar } from "@/health/components/ui";
import { SITE } from "@/health/lib/site";
import { UniquePageSEO } from "@/health/components/seo/UniquePageSEO";

const seoTitle = "Privacy Policy | Premium Health";
const seoDescription = "Privacy policy: data collection, cookies, analytics, affiliate, newsletter, WhatsApp, push — GDPR + India DPDP compliant..";
const url = "/health/privacy";
const absoluteUrl = `${SITE.url}${url}`;
const ogImage = `${SITE.url}/health/api/og?title=${encodeURIComponent("Privacy — BHG")}&category=${encodeURIComponent("Privacy")}&type=tool`;

export const metadata: Metadata = {
  title: seoTitle.slice(0, 60),
  description: seoDescription.slice(0, 155),
  alternates: { canonical: url, languages: { "en-IN": absoluteUrl, "en": absoluteUrl, "x-default": absoluteUrl } },
  openGraph: { title: seoTitle, description: seoDescription, url: absoluteUrl, type: "website", images: [{ url: ogImage, width: 1200, height: 630, alt: seoTitle }] },
  twitter: { card: "summary_large_image", title: seoTitle, description: seoDescription, images: [ogImage] },
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <Breadcrumbs items={[{ label: "Home", href: "/health" }, { label: "Privacy" }]} />
      <UniquePageSEO
        breadcrumbs={[{ name: "Home", item: "/health" }, { name: "Privacy", item: "/health/privacy" }]}
        faqs={[
          { q: "What data does Premium Health Platform collect?", a: "Email for newsletter/premium, phone for WhatsApp opt-in, UTM + gtag analytics, affiliate clicks, push endpoint — no medical data sold. GDPR + DPDP compliant, minimal by design." },
          { q: "How to opt-out?", a: "Newsletter unsubscribe link, WhatsApp STOP, push unsubscribe in browser, cookies via banner, affiliate via disclosure. Use /health/contact for data deletion." },
        ]}
        howTo={{ name: "How Premium Health Platform protects privacy", steps: ["Collect minimal data: email, phone (consent), UTM, gtag, affiliate clicks", "Store securely, no selling, GDPR + DPDP compliant", "Allow opt-out: newsletter, WhatsApp, push, cookies", "Contact /contact for deletion + /privacy for full policy"] }}
      />
      <div className="mt-3 rounded-3xl bg-gradient-to-br from-stone-800 to-stone-700 p-6 text-white md:p-8">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-stone-200">Privacy</p>
        <h1 className="font-display mt-1 text-3xl font-black">Privacy Policy — Data Protection — GDPR + DPDP</h1>
        <p className="mt-2 max-w-2xl text-sm text-stone-100/90">Minimal by design. We do not require accounts to read. Newsletter, WhatsApp, push, affiliate, UTM — GDPR + India DPDP compliant, no health-data sale.</p>
        <p className="mt-1 text-xs text-stone-300">Last updated: August 2026</p>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="prose-health mt-2 space-y-4 rounded-3xl border border-stone-200 bg-white p-6 text-[14px] leading-relaxed text-stone-700 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200">
            <p><strong>Minimal by design.</strong> We do not require accounts to read. Newsletter signup collects only your email with consent; calculators and symptom tools run in your browser and are not stored on our servers. WhatsApp opt-in + push subscription also consent-based.</p>
            <p><strong>What we collect:</strong> newsletter email (if you subscribe), contact-form messages, WhatsApp phone (consent), push endpoint, UTM + gtag analytics, affiliate clicks, and aggregate, anonymised page-view counts for /admin/earning dashboard. We never sell personal data.</p>
            <p><strong>Health information:</strong> Do not send sensitive health records by email or forms. We do not store personal health information unless a clear privacy/security architecture with explicit consent exists. Calculators + symptom tools run client-side.</p>
            <p><strong>Cookies:</strong> Theme and motion preferences are stored in your browser. Signing in sets a session cookie. We count affiliate-link clicks, and newsletter, WhatsApp and push sign-ups are opt-in with one-step opt-out.</p>
            <p><strong>Advertising:</strong> We show ads served by Google AdSense. Google and its partners use cookies to show ads based on your visits to this and other websites. You can turn off personalised ads in <a href="https://adssettings.google.com" target="_blank" rel="noopener noreferrer" className="underline">Google Ads Settings</a>; see <a href="https://policies.google.com/technologies/ads" target="_blank" rel="noopener noreferrer" className="underline">how Google uses data from sites that use its services</a>.</p>
            <p><strong>Your rights:</strong> Use the <Link href="/health/contact" className="underline">contact page</Link> to access, correct or delete your newsletter data, or to unsubscribe (one click, no dark patterns). WhatsApp STOP, push unsubscribe in browser.</p>
            <p><strong>Earning disclosure:</strong> Affiliate 8% avg commission — Product JSON-LD + disclosure on every page + /affiliate-disclosure. Premium MRR via /api/premium/checkout + webhook /api/webhooks/razorpay.</p>
          </div>
        </div>
        <div className="space-y-4">
        </div>
      </div>

      <div className="mt-8 space-y-4"><AdSlot slot="Privacy footer" /><DisclaimerBar compact /></div>
    </div>
  );
}
